import database from "../service/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";

// Create a new member
export const createMember = async (req, res) => {
  try {
    if (req.body.username == null || req.body.password == null) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const exitsUser = await database.query({
      text: "SELECT * FROM users WHERE username = $1",
      values: [req.body.username],
    });

    if (exitsUser.rows.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const username = req.body.username;
    const pwd = req.body.password;
    const salt = 11;
    const passwordHash = await bcrypt.hash(pwd, salt);

    const result = await database.query({
        text: "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
        values: [username, passwordHash],
    });

    const bodyData = result.rows[0];
    bodyData.regist = true;
    bodyData.createDate = new Date();
    res.json(bodyData);
  } catch (error) {
    console.log(error);
  }
};