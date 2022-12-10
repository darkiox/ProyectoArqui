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
                Auth = AuthLogin(JSON.parse(message.value).mail,JSON.parse(message.value).password)
                if (Auth){
                    // Logeo correcto
                }
                else{
                    await producer.send({
                        topic: 'authresponse',
                        messages: [{value: JSON.stringify({id: JSON.parse(message.value).id, error: "Contraseña o correo incorrecto."})}],
                        partition: 0
                    }).then(
                        console.log("Inicio de sesion incorrecto.")
                        )
                }
                
            }
        }
    })
}

const AuthLogin = async (mail,password) => {
    try{
        var query = `IF EXISTS ( SELECT * FROM users WHERE mail ='`+mail+`'and password ='`+password+`');`
        client.query(query, (err, res) => {
        if (err) {
            return true;
          } else {
            return false;
          }
        })
    } catch (error) {
        console.log("Ha ocurrido un error en el ingreso a la base de datos.")
        return false;
    }
}

 
app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`);
    Authenticator()
});
