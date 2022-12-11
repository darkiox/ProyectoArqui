const express = require("express");
const app = express();

const { Kafka } = require('kafkajs')

const path = require('path');
const bodyParser = require('body-parser')

const port = process.env.PORT;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const kafka = new Kafka({
    brokers: [process.env.kafkaHost]
});
const producer = kafka.producer();
const producerStock = kafka.producer({groupId: 'producerStock'});
const producernewProduct = kafka.producer({groupId: 'newProd'});
producernewProduct.connect();
producerStock.connect();
producer.connect();
const consumer = kafka.consumer({ groupId: 'authresponse', fromBeginning: true });
const consumerStock = kafka.consumer({groupId: 'consumerStock', fromBeginning: true })
consumerStock.subscribe({topic: 'query', partition: 0})
consumer.subscribe({ topic: 'authresponse', partition: 0 });

app.get("/", async (req,res) =>{
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
                errorresult = JSON.parse(message.value).error
                result = JSON.parse(message.value).success
                console.log('---- AuthResult: ', result)
                if(errorresult){
                    res.send(errorresult + '<br><a href="/">Volver atrás</a>')
                }else{
                    res.sendFile(path.join(__dirname, 'stock.html'))
                }
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

app.get('/stock', async function(request, response, next){
    var toKafka = {
        id: makeid(10),
        query: "stock"
    }
    await consumerStock.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("Se recibió respuesta de query id '" +id + "' : ", JSON.parse(message.value))
            if (JSON.parse(message.value).id == toKafka.id){
                var data = JSON.parse(message.value).data
                var output = {
                    'aaData': data
                }
                consumerStock.stop();
                response.json(output)
            }
        },
    })
    console.log("Se intenta enviar a queries: ", toKafka)
    await producerStock.send({
        topic: 'queries',
        messages: [{value: JSON.stringify(toKafka)}],
        partition: 0
    }).then(
        console.log("Query enviada para pedir Stock.")
    )

    
})
app.post("/delproduct", async(req,res) =>{
    const formData = req.body;
    var toKafka = {
        id: makeid(10),
        query: "delProduct",
        delProduct: req.body
    }
    console.log("Se intentará eliminar producto con SKU: ", req.body.sku)
    await producernewProduct.send({
        topic: 'queries',
        messages: [{value: JSON.stringify(toKafka)}],
        partition: 0
    }).then(
        console.log("Mensaje enviado a query.")
    )
    res.sendFile(path.join(__dirname, 'stock.html'))   
})
app.post("/addproduct", async (req, res) =>{
    const formData = req.body;
    id = makeid(10)
    var toKafka = {
        query: "addProduct",
        id: id,
        newProduct: formData
    }
    console.log("Se quiere agregar producto: ", toKafka)
    await producernewProduct.send({
        topic: 'queries',
        messages: [{value: JSON.stringify(toKafka)}],
        partition: 0
    }).then(
        console.log("Mensaje enviado a query.")
    )
    res.sendFile(path.join(__dirname, 'stock.html'))
})
app.post('/editproduct',async (req, res) => {
    const formData = req.body;
    id = makeid(10);
    var toKafka = {
        query: "editProduct",
        id: id,
        editProduct: formData
    }
    await producernewProduct.send({
        topic: 'queries',
        messages: [{value: JSON.stringify(toKafka)}],
        partition: 0
    }).then(
        console.log("Mensaje enviado a query.")
    )
    res.sendFile(path.join(__dirname, 'stock.html'))
});
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