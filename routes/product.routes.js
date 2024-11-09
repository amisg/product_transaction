const express = require("express");
const {
	initializeDatabase,
	listTransactions,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/initialize-database", initializeDatabase);

router.get("/transactions", listTransactions);

module.exports = router;
