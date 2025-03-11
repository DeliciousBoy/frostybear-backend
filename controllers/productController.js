import fs from "fs";
import path from "path";
import database from "../service/database.js";

const imageFolder = path.join("public", "img");

export async function getTrendProduct(req, res) {
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
                                FROM products p
								                LIMIT 4;`);

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

export async function getAllProduct(req, res) {
  console.log(`GET /products request`);
  const { product_type_name, brand_name } = req.query; // รับพารามิเตอร์จาก query string

  try {
    let query = `
      SELECT 
        p.*,
        brand.brand_obj AS brand,
        pdt.pdt_obj AS pdt
      FROM products p
      LEFT JOIN LATERAL (
        SELECT row_to_json(brand_obj) AS brand_obj
        FROM (
          SELECT brand_id, brand_name 
          FROM brands 
          WHERE brand_id = p.brand_id
        ) brand_obj
      ) brand ON true
      LEFT JOIN LATERAL (
        SELECT row_to_json(pdt_obj) AS pdt_obj
        FROM (
          SELECT product_type_id, product_type_name 
          FROM product_types 
          WHERE product_type_id = p.product_type
        ) pdt_obj
      ) pdt ON true
    `;

    // เพิ่มเงื่อนไข WHERE ตามพารามิเตอร์ที่ส่งมา
    const conditions = [];
    const params = [];

    if (product_type_name) {
      // ถ้า product_type_name เป็น array
      if (Array.isArray(product_type_name)) {
        conditions.push(`(pdt.pdt_obj->>'product_type_name') IN (${product_type_name.map((_, i) => `$${params.length + i + 1}`).join(', ')})`);
        params.push(...product_type_name);
      } else {
        // ถ้า product_type_name เป็น string เดียว
        conditions.push(`(pdt.pdt_obj->>'product_type_name') = $${params.length + 1}`);
        params.push(product_type_name);
      }
    }

    if (brand_name) {
      conditions.push(`(brand.brand_obj->>'brand_name') = $${params.length + 1}`);
      params.push(brand_name);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await database.query(query, params);

    return res.status(200).json({
      products: result.rows,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}