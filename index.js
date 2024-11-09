const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const server = express();
const port = 8084;

const productRoutes = require("./routes/product.routes");

dotenv.config();

server.use(express.json());

server.use("/api/products", productRoutes);

const connectionString = process.env.MONGO_CONNECTION;
const database = "ProductTransaction";

mongoose
	.connect(connectionString + database)
	.then(() => {
		console.log("db connected");
	})
	.catch(() => {
		console.log("db not connected");
	});

server.listen(port, () => console.log(`server listening on port ${port}!`));
