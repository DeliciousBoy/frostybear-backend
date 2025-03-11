import express from "express";
// import database from "./service/database.js";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import productRoute from './routes/productRoute.js'
import memberRoute from './routes/memberRoute.js'
// import cartRoute from './routes/cartRoute.js'
import systemparamRoute from './routes/systemparamRoute.js'

// import ส่วนที่ติดตั้งเข้ามา
import swaggerUI from "swagger-ui-express"
import yaml from "yaml"
// ใช้ File
import fs from "fs"

import cors from "cors"

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.use(cors({
  origin:['http://localhost:5173','http://127.0.0.1:5173'], //Domain ของ Frontend
  methods:['GET','POST','PUT','DELETE'], //Method ที่อนุญาต
  credentials:true  //ให้ส่งข้อมูล Header ได้
}))

app.use(productRoute)
app.use(memberRoute)
app.use(systemparamRoute)
// app.use(cartRoute)

/* ใช้ swaggerAutogen แบบไม่ต้องเขียนใหม่แบบ Yaml แต่สร้าง API ไรใหม่ต้องคอยใช้คำสั่ง node config/swagger.js ใน Terminal */
const swaggerPath = "./service/swagger_output.json";

let swaggerDoc = {};
const swaggerfile = fs.readFileSync(swaggerPath, "utf8");
swaggerDoc = JSON.parse(swaggerfile);

/* swagger ผ่าน yaml แบบของอาจารย์ถ้าอยากใช้แบบของอาจารย์ก็เอากลับมาได้ */
// const swaggerfile = fs.readFileSync('service/swagger.yaml','utf-8')
// const swaggerDoc = yaml.parse(swaggerfile)

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDoc));


app.use("/img_pd", express.static("img_pd"))

// app.use("/img_mem", express.static("img_mem"))

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});