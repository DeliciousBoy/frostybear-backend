import fs from "fs";
import path from "path";
import database from "../service/database.js";

const imageFolder = path.join("public", "img");

export async function getAllProduct(req, res) {
  console.log(`GET /products request`);
  try {
    const result = await database.query(`
                                SELECT p.*,(
                                            SELECT row_to_json(brand_obj)
                                            FROM
                                            (
                                            SELECT brand_id, brand_name FROM brands
                                            WHERE brand_id = p.brand_id
                                                )brand_obj
                                            ) AS brand,
                                            (
                                            SELECT row_to_json(pdt_obj)
                                            FROM
                                            (
                                            SELECT product_type_id,product_type_name
                                            FROM product_types
                                            WHERE product_type_id = p.product_type
                                            )pdt_obj
                                            )AS pdt
                                FROM products p`);

    // const files = fs.readdirSync(imageFolder);

    // const images = files.map((file) => {
    //   const filePath = path.join(imageFolder, file);
    //   const fileData = fs.readFileSync(filePath);
    //   const base64Image = fileData.toString("base64");
    //   return {
    //     fileName: file,
    //     base64: base64Image,
    //   };
    // });

    return res.status(200).json({
      products: result.rows,
      // images: images,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}