import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

// SERVIDOR
const app = express();

// CONFIGURAÇÕES
app.use(express.json());
app.use(cors());
dotenv.config();

// CONEXÃO BANCO DE DADOS
let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))

// HORÁRIO

// ENDPOINTS
app.post("/participants", (req,res) => {

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

    const newParticipants = { name, lastStatus };
    db.collection("participants").insertOne(newParticipants)
        .then(() => res.sendStatus(201))
        .catch((err) => res.status(500).send(err.message))
});

// INICIAR SERVIDOR
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));