import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
	try {
		const response = await axios.post(
			"https://api.novaposhta.ua/v2.0/json/",
			req.body,
			{
				headers: { "Content-Type": "application/json" },
			}
		);
		res.json(response.data);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Помилка при запиті до Нової Пошти" });
	}
});

export default router;
