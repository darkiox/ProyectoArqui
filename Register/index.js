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

const ingresarUsuario = async (nombre, apellido, rut, correodueno, patente, premium, stock, ubicacion) => {
    try{
        var query1 =  `CREATE TABLE IF NOT EXISTS carritos(
            nombre VARCHAR(50), 
            apellido VARCHAR(50), 
            rut VARCHAR(50), 
            correodueno VARCHAR(200), 
            patente VARCHAR(10), 
            premium INT, 
            stock INT, 
            ubicacion VARCHAR(10),
            profugo INT
            );`
        var query2 = `INSERT INTO carritos VALUES ('`+nombre+`','`+apellido+`','`+rut+`','`+correodueno+`','`+patente+`','`+premium+`','`+stock+`','`+ubicacion+`','`+0+`');`
        await client.query(query1);
        await client.query(query2);
        return true;
    } catch (error) {
        console.log("Ha ocurrido un error en el ingreso a la base de datos.")
        return false;
    }
}

const usuarioRepetido = async (rut) =>{
    try {
        var query1 =  `CREATE TABLE IF NOT EXISTS carritos(
            nombre VARCHAR(50), 
            apellido VARCHAR(50), 
            rut VARCHAR(50), 
            correodueno VARCHAR(200), 
            patente VARCHAR(10), 
            premium INT, 
            stock INT, 
            ubicacion VARCHAR(10),
            profugo INT
            );`
        await client.query(query1)
        var querySelect = `SELECT rut FROM carritos WHERE "rut" = '`+rut+`';`
        const res = await client.query(querySelect)
        if (res.rows[0]){
            // Usuario repetido
            return true
        }else{
            // Usuario no existe en BD
            return false
        }
    } catch (err) {
        return false;
    }
}
app.post("/register", async (req, res) => {
    req.body.time = new Date().getTime();

    console.log(new Date(req.body.time).toLocaleDateString("es-CL"), '|' , new Date(req.body.time).toLocaleTimeString("es-CL"), '|','"'+req.body.nombre+'"'+"está registrandose.");
    await producer.connect();
    await usuarioRepetido(req.body.rut).then(async result =>{
        if(result){
            producer.disconnect().then(
                res.status(403).json("El maestro sopaipillero ya existe."),
                )
                console.log("El maestro sopaipillero '"+req.body.nombre+"' ya existe.")
        }else{
            await ingresarUsuario(  req.body.nombre, 
                                    req.body.apellido,
                                    req.body.rut,
                                    req.body.correodueno,
                                    req.body.patente,
                                    req.body.premium,
                                    req.body.stock,
                                    req.body.ubicacion).then(async result => {
                if(result){
                    if (req.body.premium == 1){
                        await producer.send({
                            topic: 'register',
                            messages: [{value: JSON.stringify(req.body)}],
                            partition: 1
                        })
                        await producer.send({
                            topic: 'ubicacion',
                            messages: [{value: JSON.stringify({"patente": patente, "ubicacion": ubicacion})}],
                            partition: 0
                        }).then(
                            console.log(ubicacion + " => topic: 'ubicacion'")
                        )
                        producer.disconnect().then(
                            res.status(200).json("Maestro sopaipillero PREMIUM registrado.")
                            )
                        console.log("Maestro sopaipillero premium "+req.body.nombre+" registrado correctamente.")
                    }else{
                        await producer.send({
                            topic: 'register',
                            messages: [{value: JSON.stringify(req.body)}],
                            partition: 0
                        })
                        producer.disconnect().then(
                            res.status(200).json("Maestro sopaipillero registrado.")
                            )
                            console.log("Maestro sopaipillero "+req.body.nombre+" registrado correctamente.")
                        }
                }else{
                    producer.disconnect().then(
                        res.status(500).json("Error 500.")
                    )
                }
            })
        }
        console.log('-------')
    })
});
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