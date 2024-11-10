const {
	fetchAndSeedDatabase,
	getTransactions,
	getMonthlyStatistics,
	getBarChartData,
	getPieChartData,
	getCombinedData,
} = require("../services/product.service");

async function initializeDatabase(req, res) {
	try {
		const { status, message } = await fetchAndSeedDatabase();
		res.status(status).json({ message });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error initializing database: " + error.message });
	}
}

async function listTransactions(req, res) {
	try {
		const { page = 1, perPage = 10, search = "", month } = req.query;

		const result = await getTransactions({ page, perPage, search, month });

		// console.log(result);

		res.status(200).json(result);
	} catch (error) {
		res.status(500).json({
			message:
				"An error occurred while fetching transactions: " + error.message,
		});
	}
}

async function getStatistics(req, res) {
	const { month } = req.query;

	try {
		if (!month) {
			return res.status(400).json({ message: "Month parameter is required" });
		}

		const statistics = await getMonthlyStatistics(month);

		return res.status(200).json(statistics);
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Error fetching statistics: " + error.message });
	}
}

async function getBarChart(req, res) {
	try {
		const { month } = req.query;

		if (!month) {
			return res.status(400).json({ message: "Month parameter is required." });
		}

		const barChartData = await getBarChartData(month);
		res.status(200).json(barChartData);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching bar chart data: " + error.message });
	}
}

async function getPieChart(req, res) {
	try {
		const { month } = req.query;

		if (!month) {
			return res.status(400).json({ message: "Month parameter is required." });
		}

		const barChartData = await getPieChartData(month);
		res.status(200).json(barChartData);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching bar chart data: " + error.message });
	}
}

async function combinedData(req, res) {
	try {
		const combinedData = await getCombinedData(req, res);
		res.status(200).json(combinedData);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching bar chart data: " + error.message });
	}
}

module.exports = {
	initializeDatabase,
	listTransactions,
	getStatistics,
	getBarChart,
	getPieChart,
	combinedData,
};
