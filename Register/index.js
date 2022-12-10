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
const consumer = kafka.consumer({ groupId: 'authresponse', fromBeginning: true });
consumer.subscribe({ topic: 'authresponse', partition: 0 });

app.get("/test", async (req,res) =>{
    res.sendFile(path.join(__dirname, '/accounts.html'))
})
app.post("/login", async (req, res) =>{
    const formData = req.body;
    id = makeid(10)
    formData.id = id;
    await producer.connect();
    var result;

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (JSON.parse(message.value).id == formData.id){
                result = JSON.parse(message.value).error
                console.log('---- AuthResult: ', result)
                res.send(result)
                consumer.stop();
            }
        },
    })
    await producer.send({
        topic: 'auth',
        messages: [{value: JSON.stringify(formData)}],
        partition: 0
    }).then(
        // console.log("Autentificando usuario con id: ", formData.id)
        )


})
app.listen(port, () => {
    console.log(`Escuchando en puerto ${port}`);
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}