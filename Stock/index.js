const express = require("express");
const app = express();

const { Kafka } = require('kafkajs')
app.use(express.json());

const port = process.env.PORT;

const kafka = new Kafka({
    brokers: [process.env.kafkaHost]
});

var RenovarStock = [];
const stock = async () => {
    const consumer = kafka.consumer({ groupId: 'stock', fromBeginning: true });
    await consumer.connect();
    await consumer.subscribe({ topic: 'stock' });
    var msgArray = [];
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (message.value){
                var data = JSON.parse(message.value.toString());
                // Para leer patente: data.patente
                // Para leer stock: data.stock
                // console.log("Se recibió nueva venta - Patente: '"+data.patente+"' - Nuevo stock: '"+data.stock+"'")
                msgArray.push(data.patente+ ","+data.stock)
            }
            if (msgArray.length == 5){
                console.log("5 ventas recibidas.")
                for(let i in msgArray){
                    // console.log("message: ", msgArray[i])
                    var patente = msgArray[i].split(",")
                    var stock = patente[1]
                    patente = patente[0]
                    if(stock < 20){
                        if(!RenovarStock.find(element => element.includes(patente))){
                            RenovarStock.push("'"+patente+"'")
                            console.log("Debe renovar stock el carrito con patente: '"+patente+"'." )
                        }
                    }
                }
                msgArray = [];
            }
        },
    })
}
app.get("/Stock", async (req, res) => {
    res.status(200).json({"Carritos a renovar stock": RenovarStock});
});
 
app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`);
    stock()
    // setInterval(stock(),5000);
});