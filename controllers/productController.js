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

export async function putProduct(req, res) {
  console.log(`PUT /productsById id=${req.params.id} is Requested`);

  try {
    const result = await database.query({
      text: `
                    UPDATE products SET
                                 "product_id"=$1,
                                 "product_image"=$2,
                                 "product_name"=$3,
                                 "product_detail"=$4,
                                 "product_price"=$5,
                                 "brand_id"=$6,
                                 "product_type"=$7

                    WHERE "product_id"=$8
                    `,
      values: [
        req.body.product_id,
        req.body.product_image,
        req.body.product_name,
        req.body.product_detail,
        req.body.product_price,
        req.body.brand_id,
        req.body.product_type,
        req.params.id,
      ],
    });

    if (result.rowCount == 0) {
      return res.status(404).json({ error: `id ${req.params.id} not found` });
    }

    const bodyData = req.body;

    return res.status(201).json(bodyData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function postProduct(req, res) {
  console.log(`POST /products is requested`);
  try {
    if (!req.body.product_name) {
      return res.status(422).json({ error: "Product name is required" });

    }
    const existResult = await database.query({
      text: `SELECT EXISTS (SELECT * FROM products WHERE "product_name" = $1)`,
      values: [req.body.product_name],
    });

    if (existResult.rows[0].exists) {
      return res
        .status(409)
        .json({ error: `Product ${req.body.product_name} already exists` });
    }

    // ดึงค่า product_id อัตโนมัติจาก SEQUENCE
    const idResult = await database.query({
      text: `SELECT LPAD(nextval('product_id_seq')::TEXT, 3, '0') AS new_id;`
    });
    const productId = idResult.rows[0].new_id; // ได้ค่า product_id ใหม่ เช่น '022'

    // บันทึกข้อมูลสินค้า
    await database.query({
      text: `INSERT INTO products ("product_id", "product_image", "product_name", "product_detail", "product_price", "brand_id", "product_type")
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      values: [
        productId,
        req.body.product_image || null,
        req.body.product_name,
        req.body.product_detail || null,
        req.body.product_price || null,
        req.body.brand_id || null,
        req.body.product_type || null,
      ],
    });

    res.status(201).json({ product_id: productId, ...req.body });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteProduct(req, res) {
  console.log(`DELETE /products id=${req.params.id} is Requested`);

  try {
    const result = await database.query({
      text: `
                    DELETE FROM "products"
                    WHERE "product_id"=$1
                    `,
      values: [req.params.id],
    });

    if (result.rowCount == 0) {
      return res.status(404).json({ error: `id ${req.params.id} not found` });
    }

    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function getProductById(req, res) {
  console.log(`GET /products/${req.params.id} request`);
  try {
    const query = `
   SELECT p.*, 
                (
                    SELECT row_to_json(brand_obj)
                    FROM (
                        SELECT brand_id, brand_name FROM brands
                        WHERE brand_id = p.brand_id
                    ) brand_obj
                ) AS brand,
                (
                    SELECT row_to_json(pdt_obj)
                    FROM (
                        SELECT product_type_id, product_type_name
                        FROM product_types
                        WHERE product_type_id = p.product_type
                    ) pdt_obj
                ) AS pdt
            FROM products p
            WHERE p.product_id = $1
        `;

    const result = await database.query(query, [req.params.id]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `pdId ${req.params.id} does not exist` });
    }

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}