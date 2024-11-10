const moment = require("moment");
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
		const pageNumber = Number(page);
		const perPageNumber = Number(perPage);

		const filter = {};

		if (month) {
			const monthIndex = moment().month(month).month() + 1;

			// console.log(monthIndex, "mothIndex");

			filter.$expr = {
				$eq: [{ $month: "$dateOfSale" }, monthIndex],
			};
		}

		if (search) {
			filter.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];

			const searchAsNumber = parseFloat(search);
			if (!isNaN(searchAsNumber)) {
				filter.$or.push({
					price: {
						$gte: searchAsNumber,
						$lte: searchAsNumber,
					},
				});
			}
		}

		const transactions = await ProductModel.find(filter)
			.skip((pageNumber - 1) * perPageNumber)
			.limit(perPageNumber);

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

async function getMonthlyStatistics(month) {
	try {
		if (!month) {
			throw new Error("Month parameter is required.");
		}

		let monthIndex = moment().month(month).month() + 1;

		// if (!isNaN(month) && parseInt(month) >= 1 && parseInt(month) <= 12) {
		// 	monthIndex = parseInt(month) - 1;
		// } else {
		// 	const validMonths = moment.months();
		// 	monthIndex = validMonths.findIndex(
		// 		(validMonth) => validMonth.toLowerCase() === month.toLowerCase()
		// 	);

		// 	if (monthIndex === -1) {
		// 		throw new Error(
		// 			"Invalid month. Please provide a number (1-12) or a valid month name (e.g., 'January', 'February')."
		// 		);
		// 	}
		// }

		// const startOfMonth = moment().month(monthIndex).startOf("month").toDate();
		// const endOfMonth = moment().month(monthIndex).endOf("month").toDate();

		// console.log(startOfMonth, "start");
		// console.log(endOfMonth, "end");

		const statistics = await ProductModel.aggregate([
			{
				$facet: {
					totalSaleAmount: [
						{
							$match: {
								$expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
								sold: true,
							},
							// sold: true,
						},
						{
							$group: { _id: null, totalAmount: { $sum: "$price" } },
						},
						{
							$project: { _id: 0, totalAmount: 1 },
						},
					],

					totalSoldItems: [
						{
							$match: {
								$expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
								sold: true,
							},
							// sold: true,
						},
						{
							$count: "soldItems",
						},
					],

					totalNotSoldItems: [
						{
							$match: {
								$expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
								sold: false,
							},
						},
						{
							$count: "notSoldItems",
						},
					],
				},
			},
			{
				// Project the results to format the output
				$project: {
					totalSaleAmount: {
						$arrayElemAt: ["$totalSaleAmount.totalAmount", 0],
					},
					totalSoldItems: {
						$arrayElemAt: ["$totalSoldItems.soldItems", 0],
					},
					totalNotSoldItems: {
						$arrayElemAt: ["$totalNotSoldItems.notSoldItems", 0],
					},
				},
			},
		]);

		// Extract the results from the aggregation
		const result = statistics[0] || {};
		return {
			totalSaleAmount: result.totalSaleAmount || 0,
			totalSoldItems: result.totalSoldItems || 0,
			totalNotSoldItems: result.totalNotSoldItems || 0,
		};
	} catch (error) {
		throw new Error("Error fetching statistics: " + error.message);
	}
}

async function getBarChartData(month) {
	try {
		const monthIndex = moment().month(month).month() + 1;

		// Define the price ranges for the bar chart
		const priceRanges = [
			{ label: "0-100", min: 0, max: 100 },
			{ label: "101-200", min: 101, max: 200 },
			{ label: "201-300", min: 201, max: 300 },
			{ label: "301-400", min: 301, max: 400 },
			{ label: "401-500", min: 401, max: 500 },
			{ label: "501-600", min: 501, max: 600 },
			{ label: "601-700", min: 601, max: 700 },
			{ label: "701-800", min: 701, max: 800 },
			{ label: "801-900", min: 801, max: 900 },
			{ label: "901-above", min: 901, max: Infinity },
		];

		// Aggregate data by price range for the selected month
		const barChartData = await ProductModel.aggregate([
			{
				$match: {
					$expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
				},
			},
			{
				$bucket: {
					groupBy: "$price",
					boundaries: [
						0,
						101,
						201,
						301,
						401,
						501,
						601,
						701,
						801,
						901,
						Infinity,
					],
					default: "901-above",
					output: {
						count: { $sum: 1 },
					},
				},
			},
			{
				$addFields: {
					priceRange: {
						$switch: {
							branches: [
								{ case: { $lt: ["$_id", 101] }, then: "0-100" },
								{ case: { $lt: ["$_id", 201] }, then: "101-200" },
								{ case: { $lt: ["$_id", 301] }, then: "201-300" },
								{ case: { $lt: ["$_id", 401] }, then: "301-400" },
								{ case: { $lt: ["$_id", 501] }, then: "401-500" },
								{ case: { $lt: ["$_id", 601] }, then: "501-600" },
								{ case: { $lt: ["$_id", 701] }, then: "601-700" },
								{ case: { $lt: ["$_id", 801] }, then: "701-800" },
								{ case: { $lt: ["$_id", 901] }, then: "801-900" },
							],
							default: "901-above",
						},
					},
				},
			},
			{
				$project: {
					priceRange: 1,
					count: 1,
					_id: 0,
				},
			},
		]);

		// Format response to include all price ranges, even if they have zero count
		const formattedResponse = priceRanges.map((range) => {
			const data = barChartData.find((d) => d.priceRange === range.label) || {
				count: 0,
			};
			return {
				priceRange: range.label,
				count: data.count,
			};
		});

		return formattedResponse;
	} catch (error) {
		throw new Error("Error fetching bar chart data: " + error.message);
	}
}

async function getPieChartData(month) {
	try {
		const monthIndex = moment().month(month).month() + 1;

		const pieChartData = await ProductModel.aggregate([
			{
				$match: {
					$expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
				},
			},
			{
				$group: {
					_id: "$category",
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					category: "$_id",
					count: 1,
					_id: 0,
				},
			},
		]);

		return pieChartData;
	} catch (error) {
		throw new Error("Error fetching pie chart data: " + error.message);
	}
}

async function getCombinedData(req, res) {
	try {
		const { month } = req.query;

		if (!month || isNaN(month) || month < 1 || month > 12) {
			return res.status(400).json({
				error: "Invalid month parameter. Must be a number between 1 and 12.",
			});
		}

		const monthlyStatisticsData = await getMonthlyStatistics(month);
		const barChartData = await getBarChartData(month);
		const pieChartData = await getPieChartData(month);

		const combinedResponse = {
			monthlyStatisticsData,
			barChartData,
			pieChartData,
		};
		return res.status(200).json(combinedResponse);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}

module.exports = {
	fetchAndSeedDatabase,
	getTransactions,
	getMonthlyStatistics,
	getBarChartData,
	getPieChartData,
	getCombinedData,
};
