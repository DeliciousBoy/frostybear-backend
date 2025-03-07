import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "FROSTYBEAR BACKEND",
    description: "Ice cream API",
  },
  host: "localhost:3000",
  schemes: ["http"],
};

const outputFile = "./service/swagger_output.json"; // กำหนด path ของ output
const endpointsFiles = ["./index.js"]; // ไฟล์หลักของ Express.js

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger JSON generated successfully!");
});