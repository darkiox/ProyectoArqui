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
                if(JSON.parse(message.value).query == "auth"){
                console.log("Usuario con id: ", JSON.parse(message.value).id)
                var Auth = await AuthLogin(JSON.parse(message.value).mail,JSON.parse(message.value).password)
                console.log("Tipo de usuario ingresando: ", Auth[1])
                if (Auth[0]){
                    // Logueo correcto
                    await producer.send({
                        topic: 'authresponse',
                        messages: [{value: JSON.stringify({id: JSON.parse(message.value).id, success: "Inicio de sesión correcto.", tipo: Auth[1]})}],
                        partition: 0
                    }).then(
                        console.log("Inicio de sesión correcto.")
                        )
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
            if(JSON.parse(message.value).query == "getUsers"){
                var data = await getFromDB('SELECT * FROM users;')
                toKafka = {
                    id: JSON.parse(message.value).id,
                    data: data.rows
                }
                await producer.send({
                    topic: 'authresponse',
                    messages: [{value: JSON.stringify(toKafka)}],
                    partition: 0
                }).then(
                    console.log("Se respondió query Users '"+ JSON.parse(message.value).id +"' enviado a topic Authresponse.")
                )
            }
                if(JSON.parse(message.value).query == "addUser"){
                    var userAdd = JSON.parse(message.value).newUser
                    console.log("Usuario a añadir:" , userAdd)
                    var detailsuserAdd = "'"+ userAdd.nombre + "', '" + userAdd.apellido + "','" + userAdd.mail + "','" + userAdd.password + "'," + userAdd.tipo
                    var query = await getFromDB('INSERT INTO users(nombre,apellido,mail,password,tipo) VALUES ('+detailsuserAdd+');')
                    await producer.send({
                        topic: 'authresponse',
                        messages: [{value: JSON.stringify({id: JSON.parse(message.value).id, error: "Usuario creado."})}],
                        partition: 0
                    }).then(
                        console.log("Creación de usuario ejecutada.")
                        )
                }
                if(JSON.parse(message.value).query == "delUser"){
                    var IDUsuarioDel = JSON.parse(message.value).delUser.id;
                    console.log("Usuario de id: ", IDUsuarioDel, " eliminado correctamente.")
                    var query = await getFromDB('DELETE FROM users WHERE id = '+IDUsuarioDel+';')
                }
                if(JSON.parse(message.value).query == "editUser"){
                    console.log("Editando usuario de id: ", JSON.parse(message.value).editUser.id)
                    var updateUser = `
                    UPDATE users
                    SET nombre = '`+JSON.parse(message.value).editUser.nombre+`',
                    apellido = '`+JSON.parse(message.value).editUser.apellido+`',
                    mail = '`+JSON.parse(message.value).editUser.mail+`',
                    password = '`+JSON.parse(message.value).editUser.password+`',
                    tipo = '`+JSON.parse(message.value).editUser.tipo+`'
                    WHERE id = `+JSON.parse(message.value).editUser.id+`
                    `
                    var query = await getFromDB(updateUser)
                }    

            }
        }
    })
}

const AuthLogin = async (mail,password) => {
    var query = `SELECT * FROM users WHERE mail ='`+mail+`'AND password ='`+password+`';`
    return new Promise(function (resolve, reject) {
        client.query(query, function(err,res) {
        if (err) {
            return resolve(false);
            } 
            else {
            if(!(res.rows.length == 0))
            {
                return resolve([true, res.rows[0].tipo]);
            }else{
                return resolve(false);
            }
        }
        })

    })
}

const UsersManagment = async () => {
    consumer.run({
        eachMessage: async ({message}) => {
            if(message.value){
                console.log("Llego una solicitud a Administracion de Usuarios.")
                var id = JSON.parse(message.value).id

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
    Authenticator()
});

