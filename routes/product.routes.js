const express = require("express");
const {
	initializeDatabase,
	listTransactions,
	getStatistics,
	getBarChart,
	getPieChart,
	combinedData,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/initialize-database", initializeDatabase);

router.get("/transactions", listTransactions);

router.get("/statistics", getStatistics);

router.get("/barChart", getBarChart);

router.get("/pieChart", getPieChart);

router.get("/combinedData", combinedData);

module.exports = router;
