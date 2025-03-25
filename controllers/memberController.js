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
}

export async function loginMember(req, res) {
  console.log(`loginMember is requested`);
  try {
    if (req.body.username == null || req.body.password == null) {
      return res.json({
        loginStatus: false,
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
        loginStatus: false,
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
      return res.json({ loginStatus: false });
    } else {
      const theuser = {
        username: result.rows[0].username,
        password: result.rows[0].password,
        role: result.rows[0].role,
      };
      // console.log(theuser);
      const secret_key = process.env.SECRET_KEY;
      const token = jwt.sign(theuser, secret_key, { expiresIn: "1h" });

      res.cookie("token", token, {
        maxAge: 3600000,
        secure: true,
        sameSite: "none",
      });
      res.json({ loginStatus: true });
    }
  } catch (error) {
    return res.json({ message: error.message });
  }
}

export async function updateMember(req, res) {
  try {
    const { username, password } = req.body;

    if (!username && !password) {
      return res.json({
        update: false,
        message: "Please provide data to update",
      });
    }

    const token = req.cookies.token;
    if (!token) {
      return res.json({
        update: false,
        message: "Unauthorized",
      });
    }

    const secret_key = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secret_key);

    const updates = [];
    const values = [];
    let index = 1;

    if (username) {
      updates.push(`username = $${index++}`);
      values.push(username);
    }

    if (password) {
      const salt = 11;
      const passwordHash = await bcrypt.hash(password, salt);
      updates.push(`password = $${index++}`);
      values.push(passwordHash);
    }

    values.push(decoded.username);

    const query = {
      text: `UPDATE users SET ${updates.join(", ")} WHERE username = $${index} RETURNING *`,
      values: values,
    };

    const result = await database.query(query);

    if (result.rows.length === 0) {
      return res.json({
        update: false,
        message: "User not found",
      });
    }

    res.json({
      update: true,
      data: result.rows[0],
    });
  } catch (error) {
    return res.json({
      update: false,
      message: error.message,
    });
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
