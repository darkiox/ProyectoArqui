const express = require("express");
const app = express();

const { Kafka } = require('kafkajs')
const { Client } = require('pg')
const client = new Client({
  user: 'postgres',
  host: 'database',
  database: 'tarea',
  password: 'postgres',
  port: 5432,
})
client.connect(function(err){
    if (err) console.log("Error al conectar a DB");
    console.log("Conectado a DB.")
})
const port = process.env.PORT;
app.use(express.json());
const kafka = new Kafka({
    brokers: [process.env.kafkaHost]
});

const producer = kafka.producer();
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  
const registrarVenta = async (patente, cliente, cantidad, hora) => {
    try{
        var queryCreateTable =  `CREATE TABLE IF NOT EXISTS ventas (
            "patente" VARCHAR(50),
            "cliente" VARCHAR(100),
            "#Sopaipillas" int,
            "hora" VARCHAR(100)
            );`
        var queryVentas = `INSERT INTO ventas VALUES ('`+patente+`','`+cliente+`','`+cantidad+`','`+hora+`');`
        var ubicacion = getRandomInt(100).toString()
        var queryUpdate = `UPDATE carritos SET stock = stock -`+cantidad+`, ubicacion = '`+ ubicacion +`' WHERE patente ='`+patente+`';`
        await client.query(queryCreateTable);
        await client.query(queryVentas);
        await client.query(queryUpdate);
        await producer.send({
            topic: 'ubicacion',
            messages: [{value: JSON.stringify({"patente": patente, "ubicacion": ubicacion})}],
            partition: 0
        }).then(
            console.log(ubicacion + " => topic: 'ubicacion' | partition: '0'")
        )
        var queryStock = `SELECT stock FROM carritos WHERE patente = '`+patente+`';`;
        const stockCheck = await client.query(queryStock);
        if (stockCheck.rows[0]){
            console.log("Nuevo stock: "+ stockCheck.rows[0].stock);
            await producer.send({
                topic: 'stock',
                messages: [{value: JSON.stringify({"patente": patente, "stock": stockCheck.rows[0].stock})}]
            }).then(
                console.log(stockCheck.rows[0].stock + " => topic: 'stock'")
            )
        }
        return true;
    } catch (error) {
        console.log("Ha ocurrido un error en el ingreso a la base de datos.")
        return false;
    }
}
app.post("/ventas", async (req, res) => {
    timeNow = new Date().getTime();
    console.log(new Date(timeNow).toLocaleDateString("es-CL"), '|' , new Date(timeNow).toLocaleTimeString("es-CL"), '|','"'+req.body.cliente+'"'+" está registrando una venta.");
    await producer.connect();
    fechaHora = new Date(timeNow).toLocaleDateString("es-CL") + ',' + new Date(timeNow).toLocaleTimeString("es-CL");
    req.body.hora = fechaHora;
    await registrarVenta(req.body.patente ,req.body.cliente, req.body.cantidad, fechaHora).then(async result => {
        if (result){
            await producer.send({
                topic: 'ventas',
                messages: [{value: JSON.stringify(req.body)}]
            })
            producer.disconnect().then(
                res.status(200).json("Venta registrada"),
            )
            console.log("Venta registrada.")
        }else{
            producer.disconnect().then(
                res.status(500).json("Error.")
            )
            console.log("Error.")
        }
    
        console.log("-------")
    })
});

app.listen(port, () => {
    console.log(`Ventas | escuchando en puerto ${port}`);
});