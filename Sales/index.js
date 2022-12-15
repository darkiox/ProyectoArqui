const express = require("express");
const app = express();

const { Kafka } = require('kafkajs')
const { Client } = require('pg')
const path = require('path');
const bodyParser = require('body-parser')

const client = new Client({
    database: 'tarea',
    host: 'db-tarea',
    user: 'postgres',
    password: 'postgres',
    port: 5432,
})
client.connect(function(err){
    if (err) console.log("Error al conectar a DB");
    console.log("Conectado a DB.")
})
const port = process.env.PORT;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const kafka = new Kafka({
    brokers: [process.env.kafkaHost]
});
const producer = kafka.producer();
producer.connect();
const consumer = kafka.consumer({ groupId: 'sales', partition: 0, fromBeginning: true });
consumer.connect();
consumer.subscribe({ topic: 'salequery', partition: 0 });
const QueryHandler = async () => {
    consumer.run({
        eachMessage: async ({message}) => {
            if(message.value){
                console.log("Llego un mensaje a Salequery")
                var id = JSON.parse(message.value).id
                if(JSON.parse(message.value).query == "sales"){
                    console.log("------------- QUERY ------------")
                    var query = `SELECT * FROM sales
                    WHERE fecha BETWEEN '`+JSON.parse(message.value).startdate+`'::date
                    AND '`+JSON.parse(message.value).finaldate+`'::date;`  
                    var data = await getFromDB(query)
                    console.log(query)
                    console.log("------------- QUERY ------------")
                    toKafka = {
                        id: JSON.parse(message.value).id,
                        data: data.rows
                    }
                    console.log("Datos a responder:", data.rows)
                    await producer.send({
                        topic: 'saleresponse',
                        messages: [{value: JSON.stringify(toKafka)}],
                        partition: 0
                    }).then(
                        console.log("Se respondió query de ventas por fecha '"+ id +"' enviado a topic sales.")
                    )
                }
                if(JSON.parse(message.value).query == "purchases"){
                    
                    var data = await getFromDB('SELECT * FROM purchases WHERE fecha <= DATEADD(DAY,'+JSON.parse(message.value).purchases.days+','+JSON.parse(message.value).purchases.date+') and DATEADD(DAY,-'+JSON.parse(message.value).purchases.days+','+JSON.parse(message.value).sales.date+' <= fecha;')
                    toKafka = {
                        id: id,
                        data: data.rows
                    }
                    await producer.send({
                        topic: 'query',
                        messages: [{value: JSON.stringify(toKafka)}],
                        partition: 0
                    }).then(
                        console.log("Se respondió query purchases '"+ id +"' enviado a topic Query.")
                    )
                }
                if(JSON.parse(message.value).query == "totalSales"){
                    var data = await getFromDB('SELECT SUM(valortotal) FROM sales WHERE fecha <= DATEADD(DAY,'+JSON.parse(message.value).sales.days+','+JSON.parse(message.value).sales.date+') and DATEADD(DAY,-'+JSON.parse(message.value).sales,days+','+JSON.parse(message.value).sales.date+' <= fecha;')
                    toKafka = {
                        id: id,
                        data: data.rows
                    }
                    await producer.send({
                        topic: 'query',
                        messages: [{value: JSON.stringify(toKafka)}],
                        partition: 0
                    }).then(
                        console.log("Se respondió query totalSales '"+ id +"' enviado a topic Query.")
                    )
                }
                if(JSON.parse(message.value).query == "totalPurchases"){
                    var data = await getFromDB('SELECT SUM(valortotal) FROM purchases WHERE fecha <= DATEADD(DAY,'+JSON.parse(message.value).purchases.days+','+JSON.parse(message.value).purchases.date+') and DATEADD(DAY,-'+JSON.parse(message.value).purchase.days+','+JSON.parse(message.value).sales.date+' <= fecha;')
                    toKafka = {
                        id: id,
                        data: data.rows
                    }
                    await producer.send({
                        topic: 'query',
                        messages: [{value: JSON.stringify(toKafka)}],
                        partition: 0
                    }).then(
                        console.log("Se respondió query totalPurchases '"+ id +"' enviado a topic Query.")
                    )
                }

            }
        }
    })
}
const getFromDB = async (query) => {
    return new Promise(function (resolve, reject) {
        client.query(query, function(err,res) {
            return resolve(res)
        })
    })
}
 
app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`);
    QueryHandler()
});
