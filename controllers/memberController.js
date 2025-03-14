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

export async function loginMember(req, res) {
  console.log(`loginMember is requested`);
  try {
    if (req.body.username == null || req.body.password == null) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const exitsUser = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [req.body.username],
    });

    if (exitsUser.rows.length === 0) {
      return res.status(400).json({ message: "Username not exists" });
    }

    const user = exitsUser.rows[0];
    const validPassword = await bcrypt.compare(req.body.password, user.password);

    if (!validPassword) {
      res.clearCookie("token", {
        secure: true,
        sameSite: "none",
      });
      return res.json({ login: false });
    } else {
      const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        maxAge: 3600000,
        secure: true,
        sameSite: "none",
      });

      res.json({ login: true });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
