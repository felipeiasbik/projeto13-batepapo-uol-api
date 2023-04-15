import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

// SERVIDOR
const app = express();

// CONFIGURAÇÕES
app.use(express.json());
app.use(cors());
dotenv.config();

// CONEXÃO BANCO DE DADOS

const mongoClient = new MongoClient(process.env.DATABASE_URL);
try {
    await mongoClient.connect();
    console.log("MongoDB conectado!");
} catch {
    console.log(err.message);
}
const db = mongoClient.db();

// HORÁRIO

// ENDPOINTS
app.post("/participants", async (req,res) => {

    const userSchema = joi.object({
        name: joi.string().min(1).required(),
        lastStatus: joi.date().timestamp().required()
    });

    const { name } = req.body;
    let lastStatus = Date.now();
    const user = { name, lastStatus };
    const validation = userSchema.validate(user, { abortEarly: false })

    if (validation.error){
        const errors = validation.error.details.map(detail => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const userExists = await db.collection("participants").findOne( {name: name} );
        if (userExists) return res.sendStatus(409);
    
        const newParticipants = { name, lastStatus };
        const message = {
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs(lastStatus).format("HH:mm:ss")
        }

        await db.collection("participants").insertOne(newParticipants);
        await db.collection("messages").insertOne(message);
            res.sendStatus(201);

    } catch (err) {
        res.status(500).send(err.message)
    }

});

app.get("/participants", async (req, res) => {
    try {
        const participants = await db.collection("participants").find().toArray();
        res.send(participants);
    } catch (err) {
        console.log(err.message);
    }
});

app.post("/messages", async (req, res) => {
    
    const userSchema = joi.object({
        text: joi.string().min(1).required(),
        to: joi.string().min(1).required(),
        type: joi.string().valid("message", "private_message").required(),
    }).unknown(true);

    const {to, text, type} = req.body;
    const from = req.headers.user;

    const message = { from, to, text, type };
    const validation = userSchema.validate(message, { abortEarly: false })

    if (validation.error){
        const errors = validation.error.details.map(detail => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const userExists = await db.collection("messages").findOne( {from: from} );
        if (!userExists) return res.sendStatus(422);

        const messageWithTime = { from, to, text, type, time: dayjs(Date.now()).format("HH:mm:ss")}
        await db.collection("messages").insertOne(messageWithTime);
            res.sendStatus(201);
    } catch (err) {
        console.log(err.message);
    }

});

app.get("/messages", async (req, res) => {

    const limit = req.query.limit;

    const {user} = req.headers;

    const query ={
        $or: [
            {to: user},
            {from: user},
            {to: "Todos", type: "message"},
            {to: user, type: "private_message"},
            {from: user, type: "private_message"},
            {type: "status"}
        ]
    }

    try {
        const messagesList = await db.collection("messages").find(query).toArray();

        if (limit && (isNaN(limit) || limit < 1)) {
            return res.sendStatus(422);
        }

        if (limit) return res.send(messagesList.slice(-limit));

        res.send(messagesList);
    } catch (err) {
        console.log(err.message);
    }
    
});

app.post("/status", async (req, res) => {

    const {user} = req.headers;

    if(!req.headers) return res.sendStatus(404);

    try {

        const userExists = await db.collection("participants").findOne( {name: user} );
        if(!userExists) return res.sendStatus(404);

        if(userExists){
            const newStatus = { name: user, lastStatus: Date.now()};
            db.collection("participants").insertOne(newStatus);
        }

        res.sendStatus(200);

    } catch (err) {
        console.log(err.message);
    }

});

// INICIAR SERVIDOR
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));