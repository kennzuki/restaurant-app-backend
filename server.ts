import express from "express";
import dotenv from "dotenv";
import cors from "cors";

const PORT = process.env.PORT || 8000;

const app = express();


app.use(cors());
app.use(express.json());
dotenv.config();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});