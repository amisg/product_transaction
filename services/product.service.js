const ProductModel = require("../database/model/Product.model");

async function fetchAndSeedDatabase() {
	try {
		const response = await fetch(
			"https://s3.amazonaws.com/roxiler.com/product_transaction.json"
		);
		const products = await response.json();

		await ProductModel.deleteMany();

		await ProductModel.insertMany(products);

		return { status: 201, message: "Database initialized with seed data" };
	} catch (error) {
		throw new Error("Error initializing database: " + error.message);
	}
}

async function getTransactions({ page = 1, perPage = 10, search = "", month }) {
	try {
		// Convert page and perPage to integers
		const pageNumber = parseInt(page);
		const perPageNumber = parseInt(perPage);

		// Define filter object
		const filter = {};

		// Filter by month if provided
		if (month) {
			// Convert month name to month index (0 = January, 11 = December)
			const monthIndex = new Date(`${month} 1, 2000`).getMonth();
			filter.dateOfSale = {
				$expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] },
			};
		}

		// Filter by search text if provided
		if (search) {
			filter.$or = [
				{ title: { $regex: search, $options: "i" } }, // Case-insensitive match
				{ description: { $regex: search, $options: "i" } },
				{ price: { $regex: search, $options: "i" } },
			];
		}

		// Fetch transactions with pagination and search filters
		const transactions = await ProductModel.find(filter)
			.skip((pageNumber - 1) * perPageNumber)
			.limit(perPageNumber);

		// Count total transactions for pagination metadata
		const totalTransactions = await ProductModel.countDocuments(filter);

		return {
			transactions,
			totalPages: Math.ceil(totalTransactions / perPageNumber),
			currentPage: pageNumber,
			totalItems: totalTransactions,
		};
	} catch (error) {
		throw new Error("Error fetching transactions: " + error.message);
	}
}

module.exports = {
	fetchAndSeedDatabase,
	getTransactions,
};
