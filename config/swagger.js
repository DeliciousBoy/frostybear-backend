import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "FROSTYBEAR BACKEND",
    description: "Ice cream API",
  },
  host: "localhost:3000",
  schemes: ["http"],
  definitions: {
    product_types: {
      type: "object",
      properties: {
        product_type_id: { type: "string" },
        product_type_name: { type: "string" }
      }
    },
    users: {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        password: { type: "string" },
        role: { type: "string" },
        created_at: { type: "string", format: "date-time" }
      }
    },
    products: {
      type: "object",
      properties: {
        product_id: { type: "string" },
        product_name: { type: "string" },
        product_image: { type: "string" },
        product_detail: { type: "string" },
        product_price: { type: "number" },
        brand_id: { type: "string" },
        product_type: { type: "string" },
        create_date: { type: "string", format: "date-time" },
        update_date: { type: "string", format: "date-time" },
        create_by: { type: "string" },
        update_by: { type: "string" }
      }
    },
    brands: {
      type: "object",
      properties: {
        brand_id: { type: "string" },
        brand_name: { type: "string" }
      }
    },
    system_param: {
      type: "object",
      properties: {
        id: { type: "string" },
        byte_reference: { type: "string" },
        byte_type: { type: "string" },
        byte_name: { type: "string" },
        byte_code: { type: "string" }
      }
    },
    carts: {
      type: "object",
      properties: {
        cartId: { type: "string" },
        cusId: { type: "string" },
        cartDate: { type: "string", format: "date" },
        cartCf: { type: "boolean" }
      }
    },
    cartDtl: {
      type: "object",
      properties: {
        cartId: { type: "string" },
        pdId: { type: "string" },
        qty: { type: "number" },
        price: { type: "number" }
      }
    }
  },
  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "JWT authorization using the Bearer scheme. Example: 'Bearer {token}'"
    }
  }
};

const outputFile = "./service/swagger_output.json";
const endpointsFiles = ["./index.js"];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger documentation generated successfully!");
});