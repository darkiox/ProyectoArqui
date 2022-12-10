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
const consumer = kafka.consumer({ groupId: 'auth', partition: 0, fromBeginning: true });
consumer.connect();
consumer.subscribe({ topic: 'auth', partition: 0 });
const Authenticator = async () => {
    consumer.run({
        eachMessage: async ({message}) => {
            if(message.value){
                console.log("Usuario con id: ", JSON.parse(message.value).id)
                await producer.send({
                    topic: 'authresponse',
                    messages: [{value: JSON.stringify({id: JSON.parse(message.value).id, error: "Contraseña incorrecta"})}],
                    partition: 0
                }).then(
                    console.log("Usuario ha intentado ingresar con contraseña incorrecta.")
                    )
            }
        }
    })
}
 
app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`);
    Authenticator()
});
function Auth(){
    // //password falsa
    var result = {
        error: 'Password incorrecta'
    }
    producer.send({
        topic: 'authresponse',
        messages: [{value: JSON.stringify(result)}],
        partition: 0
    }).then(
        console.log("Usuario ha intentado ingresar con contraseña incorrecta.")
        )
}