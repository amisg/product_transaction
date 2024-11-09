const {
	fetchAndSeedDatabase,
	getTransactions,
} = require("../services/product.service");

// controller to add / seed the documents in database
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

// controller to list transactions
async function listTransactions(req, res) {
	try {
		// Extract query parameters
		const { page = 1, perPage = 10, search = "", month } = req.query;

		// Call the service to fetch the transactions
		const result = await getTransactions({ page, perPage, search, month });

		// Send response with transactions and pagination data
		res.status(200).json(result);
	} catch (error) {
		res.status(500).json({
			message:
				"An error occurred while fetching transactions: " + error.message,
		});
	}
}

module.exports = {
	initializeDatabase,
	listTransactions,
};
