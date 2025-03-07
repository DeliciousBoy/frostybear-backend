import database from "../service/database.js";

export async function getTenProduct(req, res){
  console.log(`GET /ten products is Requested`)
  try{
    const result = await database.query(`
                                        SELECT p.*, (
                                        SELECT row_to_json(brand_obj)
                                        FROM (
                                        SELECT * FROM brands WHERE "brandId" = p."brandId"
                                        )
                                        brand_obj
                                        ) AS brand,
                                         
                                        (
                                        SELECT row_to_json(pdt_obj)
                                        FROM (
                                        SELECT * FROM "pdTypes" WHERE "pdTypeId" = p."pdTypeId"
                                        )pdt_obj
                                        ) AS pdt
                                         FROM products p LIMIT 3`
                                        )
                                        return res.status(200).json(result.rows)
  }
  catch(err){
    console.log("Error!", err);
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
                        SELECT "brandId", "brandName" FROM brands
                        WHERE "brandId" = p."brandId"
                    ) brand_obj
                ) AS brand,
                (
                    SELECT row_to_json(pdt_obj)
                    FROM (
                        SELECT "pdTypeId", "pdTypeName"
                        FROM "pdTypes"
                        WHERE "pdTypeId" = p."pdTypeId"
                    ) pdt_obj
                ) AS pdt
            FROM products p
            WHERE p."pdId" = $1
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

// export async function getSearchProduct(req, res) {
//   console.log(`GET /searchProduct id=${req.params.id} is Requested`);
//   try {
//     const result = await database.query({
//       text: `SELECT p.*, 
//           (
//               SELECT row_to_json(brand_obj)
//               FROM (
//                   SELECT "brandId", "brandName" FROM brands
//                   WHERE "brandId" = p."brandId"
//               ) brand_obj
//           ) AS brand,
//           (
//               SELECT row_to_json(pdt_obj)
//               FROM (
//                   SELECT "pdTypeId", "pdTypeName"
//                   FROM "pdTypes"
//                   WHERE "pdTypeId" = p."pdTypeId"
//               ) pdt_obj
//           ) AS pdt
//       FROM products p
//       WHERE (
//         p."pdId" ILIKE $1
//         OR p."pdName" ILIKE $1
//         OR p."pdRemark" ILIKE $1
//       )
//     `,
//     values: [`%${req.params.id}%`]
//   })
//   return res.status(200).json(result.rows)
// }
// catch(err){
//   console.log(err)
//   }
// }

export async function getSearchProduct(req, res) {
  console.log(`GET /searchProduct id=${req.params.id} is Requested`);
  try {
    const searchQuery = req.params.id ? `%${req.params.id}%` : null;
    
    const result = await database.query({
      text: `
        SELECT p.*, 
          (
              SELECT row_to_json(brand_obj)
              FROM (
                  SELECT "brandId", "brandName" FROM brands
                  WHERE "brandId" = p."brandId"
              ) brand_obj
          ) AS brand,
          (
              SELECT row_to_json(pdt_obj)
              FROM (
                  SELECT "pdTypeId", "pdTypeName"
                  FROM "pdTypes"
                  WHERE "pdTypeId" = p."pdTypeId"
              ) pdt_obj
          ) AS pdt
        FROM products p
        ${searchQuery ? `WHERE (
          p."pdId" ILIKE $1
          OR p."pdName" ILIKE $1
          OR p."pdRemark" ILIKE $1
        )` : ``}
      `,
      values: searchQuery ? [searchQuery] : []
    });

    return res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

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
                                            SELECT "brandId", "brandName" FROM brands
                                            WHERE "brandId" = p."brandId"
                                                )brand_obj
                                            ) AS brand,
                                            (
                                            SELECT row_to_json(pdt_obj)
                                            FROM
                                            (
                                            SELECT "pdTypeId","pdTypeName"
                                            FROM "pdTypes"
                                            WHERE "pdTypeId" = p."pdTypeId"
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

export async function postProduct(req, res) {
  console.log(`POST /products is requested`);
  const bodyData = req.body;
  let message = "";
  let flg = false;

  try {
    if (req.body.pdId == null) {
      message += " pdId is null";
      flg = true;
    }
    if (req.body.pdName == null) {
      message += " pdName is null";
      flg = true;
    }
    if (flg) {
      return res.status(422).json({ error: message });
    }

    const existsResult = await database.query({
      text: `SELECT EXISTS (SELECT * FROM products WHERE "pdId" = $1)`,
      values: [req.body.pdId],
    });

    if (existsResult.rows[0].exists) {
      return res.status(400).json({ error: `pdId ${req.body.pdId} is exists` });
    }

    const result = await database.query({
      text: `INSERT INTO products ("pdId", "pdName", "pdPrice", "pdTypeId","pdRemark","brandId")
                     VALUES($1, $2, $3, $4, $5, $6)`,
      values: [
        req.body.pdId,
        req.body.pdName,
        req.body.pdPrice,
        req.body.pdTypeId,
        req.body.pdRemark,
        req.body.brandId,
      ],
    });

    const datetime = new Date();
    bodyData.createDate = datetime;
    res.status(201).json(bodyData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function putProduct(req, res) {
  console.log(`PUT /products ${req.params.id} is requested!!`);
  try {
    const result = await database.query({
      text: `
                UPDATE "products"
                SET "pdName" = $1,
                    "pdPrice" = $2,
                    "pdRemark" = $3,
                    "pdTypeId" = $4,
                    "brandId" = $5
                WHERE "pdId" = $6;
                    `,
      values: [
        req.body.pdName,
        req.body.pdPrice,
        req.body.pdRemark,
        req.body.pdTypeId,
        req.body.brandId,
        req.params.id,
      ],
    });
    if (result.rowCount == 0)
      return res.status(404).json({ error: "id not found" });

    const bodyData = req.body;
    const datetime = new Date();
    bodyData.updateDate = datetime;
    res.status(201).json(bodyData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteProduct(req, res) {
  console.log(`DELETE /products ${req.params.id} is requested!!`);
  try {
    const result = await database.query({
      text: `
            DELETE FROM "products"
            WHERE "pdId" = $1;
            `,
      values: [req.params.id],
    });
    if (result.rowCount == 0)
      return res.status(404).json({ error: "id not found" });
    res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getProductByBrandId(req, res){
  try
  {

    const brandIdValidate = await database.query({
      text: 
      `
          SELECT 1 AS BrandId_Length FROM brands WHERE "brandId" ILIKE $1
      `,
      values:[req.params.id],
    });

    if(brandIdValidate.rowCount === 0){
      return res.status(404).json({error: "brandId does not exist"});
    }

    const result = await database.query({
      text: `
            SELECT p.* ,
            (
                SELECT row_to_json(pdt_obj)
                FROM (
                      SELECT * FROM "pdTypes" WHERE "pdTypeId" = p."pdTypeId"
                ) pdt_obj
            ) AS pdt
            FROM products p
            WHERE p."brandId" ILIKE $1
      `,
      values: [req.params.id]
    })
    
    if(result.rowCount==0){
      return res.status(404).json({error: "Product not found"})
    }
    return res.status(200).json(result.rows)
  }
  catch(err){
    return res.status(500).json({error: err.message})
  }
}