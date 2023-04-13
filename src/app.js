import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

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

// INICIAR SERVIDOR
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));