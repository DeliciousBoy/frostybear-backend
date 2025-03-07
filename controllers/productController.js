import database from "../service/database.js";

export async function getAllProduct(req, res) {
  console.log(`GET /products request`);
  try {
    //   const strQry = 'SELECT * FROM products ORDER BY "pdId" DESC';
    //   const result = await database.query(strQry);

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

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}