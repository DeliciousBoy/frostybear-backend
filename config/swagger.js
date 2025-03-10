import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "FROSTYBEAR BACKEND",
    description: "Ice cream API",
  },
  host: "localhost:3000",
  schemes: ["http"],
  definitions: {
    cart_details: {
      type: "object",
      properties: {
        quantity: { type: "number" },
        price: { type: "number" },
        cart_id: { type: "string" },
        product_id: { type: "string" },
      },
    },
    carts: {
      type: "object",
      properties: {
        card_date: { type: "string", format: "date" },
        cart_id: { type: "string" },
        customer_id: { type: "string" },
      },
    },
    product_types: {
      type: "object",
      properties: {
        product_type_id: { type: "string" },
        product_type_name: { type: "string" },
      },
    },
    users: {
      type: "object",
      properties: {
        created_at: { type: "string", format: "date-time" },
        id: { type: "string" },
        username: { type: "string" },
        password: { type: "string" },
        role: { type: "string" },
      },
    },
    products: {
      type: "object",
      properties: {
        product_price: { type: "number" },
        product_name: { type: "string" },
        product_image: { type: "string" },
        product_id: { type: "string" },
        brand_id: { type: "string" },
        product_type: { type: "string" },
        product_detail: { type: "string" },
      },
    },
    brands: {
      type: "object",
      properties: {
        brand_id: { type: "string" },
        brand_name: { type: "string" },
      },
    },
  },
};

const outputFile = "./service/swagger_output.json"; // กำหนด path ของ output
const endpointsFiles = ["./index.js"]; // ไฟล์หลักของ Express.js

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger JSON generated successfully!");
});