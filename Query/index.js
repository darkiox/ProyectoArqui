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
const consumer = kafka.consumer({ groupId: 'query', partition: 0, fromBeginning: true });
consumer.connect();
consumer.subscribe({ topic: 'queries', partition: 0 });
const QueryHandler = async () => {
    consumer.run({
        eachMessage: async ({message}) => {
            if(message.value){
                console.log("Llego un mensaje a Queries: ", JSON.parse(message.value))
                var id = JSON.parse(message.value).id
                if(JSON.parse(message.value).query == "stock"){
                    var data = await getFromDB('SELECT * FROM products;')
                    toKafka = {
                        id: id,
                        data: data.rows
                    }
                    await producer.send({
                        topic: 'query',
                        messages: [{value: JSON.stringify(toKafka)}],
                        partition: 0
                    }).then(
                        console.log("Se respondió query Stock '"+ id +"' enviado a topic Query.")
                    )
                }
                if(JSON.parse(message.value).query == "addProduct"){
                    var productoAdd = JSON.parse(message.value).newProduct
                    console.log("Producto a añadir:" , productoAdd)
                    var detailsproductoAdd = "'"+ productoAdd.nombre + "', '" + productoAdd.categoria + "'," + productoAdd.preciocompra + ',' + productoAdd.precioventa + ',' + productoAdd.stock
                    var query = await getFromDB('INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('+detailsproductoAdd+');')
                }
                if(JSON.parse(message.value).query == "delProduct"){
                    var skuProductoDel = JSON.parse(message.value).delProduct.sku;
                    console.log("Producto con SKU: ", skuProductoDel, " eliminado correctamente.")
                    var query = await getFromDB('DELETE FROM products WHERE sku = '+skuProductoDel+';')
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
