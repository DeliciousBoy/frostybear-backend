import database from "../service/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";

// Create a new member
export const createMember = async (req, res) => {
  try {
    if (req.body.username == null || req.body.password == null) {
      return res.json({
        registration: false,
        message: "Please fill in all fields",
      });
    }

    const exitsUser = await database.query({
      text: "SELECT * FROM users WHERE username = $1",
      values: [req.body.username],
    });

    if (exitsUser.rows.length > 0) {
      return res.json({
        registration: false,
        message: "Username already exists",
      });
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
    bodyData.registration = true;
    bodyData.createDate = new Date();
    res.json(bodyData);
  } catch (error) {
    return res.json({
      registration: false,
      message: error.message,
    });
  }
};

export async function loginMember(req, res) {
  console.log(`loginMember is requested`);
  try {
    if (req.body.username == null || req.body.password == null) {
      return res.json({
        login: false,
        message: "Please fill in all fields",
      });
    }

    const exitsUser = await database.query({
      text: `SELECT EXISTS (SELECT * FROM users WHERE username = $1)`,
      values: [req.body.username],
    });
    // console.log("member exits", exitsUser.rows[0].exists);

    if (!exitsUser.rows[0].exists) {
      return res.json({
        login: false,
        message: "Username not exists",
      });
    }

    const result = await database.query({
      text: "SELECT * FROM users WHERE username = $1",
      values: [req.body.username],
    });
    // console.log("result", result.rows[0]);

    const validPassword = await bcrypt.compare(
      req.body.password,
      result.rows[0].password
    );
    // console.log("password is valid:", validPassword)

    if (!validPassword) {
      res.clearCookie("token", {
        secure: true,
        sameSite: "none",
      });
      return res.json({ login: false });
    } else {
      const theuser = {
        username: result.rows[0].username,
        password: result.rows[0].password,
      };
      // console.log(theuser);
      const secret_key = process.env.SECRET_KEY;
      const token = jwt.sign(theuser, secret_key, { expiresIn: "1h" });

      res.cookie("token", token, {
        maxAge: 3600000,
        secure: true,
        sameSite: "none",
      });
      res.json({ login: true });
    }
  } catch (error) {
    return res.json({ message: error.message });
  }
}

export async function logoutMember(req, res) {
  try {
    res.clearCookie("token", {
      secure: true,
      sameSite: "none",
    });
    res.json({ logout: true });
  } catch (error) {
    return res.json({ logout: false });
  }
}
