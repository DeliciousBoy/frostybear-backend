import database from "../service/database.js";

// แก้ไขไฟล์ backend
export async function chkCart(req,res) {
    console.log(`POST CART customer ${req.body.username} is requested`);
    if (req.body.username == null) {
      return res.status(400).json({ error: true, message: "username is required" });
    }
  
    const result = await database.query({
      text: `SELECT * FROM carts WHERE "cusId" = $1 AND "cartCf" != true`,
      values: [req.body.username],
    });
    
    // แก้ไขการตอบกลับให้ตรงกับที่ Frontend ต้องการ
    if (result.rows[0] != null) {
      return res.json({ 
        success: true,
        cartId: result.rows[0].cartId,
        cartExist: true 
      });
    } else {
      return res.json({ 
        success: true,
        cartId: null,
        cartExist: false 
      });
    }
  }

  export async function postCart(req, res) {
    console.log(`POST /CART is requested`);
    try {
      if (!req.body.cusId) {
        return res.status(400).json({ 
          success: false, 
          message: "Customer ID is required" 
        });
      }
  
      // สร้าง cartId ใหม่
      const now = new Date();
      const theId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  
      const result = await database.query({
        text: `INSERT INTO carts ("cartId", "cusId", "cartDate") VALUES ($1,$2,$3) RETURNING "cartId"`,
        values: [theId, req.body.cusId, now],
      });
  
      return res.json({ 
        success: true,
        cartId: theId,
        message: "Cart created successfully"
      });
    } catch (err) {
      console.error("Error creating cart:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create cart" 
      });
    }
  }

  export async function postCartDtl(req, res) {
    console.log("POST /CARTDETAIL request body:", req.body); // Debug log
    
    try {
      const { cartId, pdId, pdPrice, quantity = 1 } = req.body;
      
      // Validate required fields
      if (!cartId || !pdId || pdPrice === undefined || pdPrice === null) {
        console.error("Missing required fields");
        return res.status(400).json({
          success: false,
          message: "Cart ID, Product ID and Price are required",
          receivedData: req.body // สำหรับ debug
        });
      }
  
      // ตรวจสอบว่ามีสินค้านี้ในตะกร้าหรือไม่
      const existingItem = await database.query({
        text: `SELECT * FROM "cartDtl" WHERE "cartId" = $1 AND "pdId" = $2`,
        values: [cartId, pdId],
      });
  
      if (existingItem.rows.length > 0) {
        // อัปเดตจำนวนถ้ามีอยู่แล้ว
        await database.query({
          text: `UPDATE "cartDtl" SET "qty" = "qty" + $1 WHERE "cartId" = $2 AND "pdId" = $3`,
          values: [quantity, cartId, pdId],
        });
      } else {
        // เพิ่มใหม่ถ้ายังไม่มี
        await database.query({
          text: `INSERT INTO "cartDtl" ("cartId", "pdId", "qty", "price") VALUES ($1,$2,$3,$4)`,
          values: [cartId, pdId, quantity, pdPrice],
        });
      }
  
      return res.json({
        success: true,
        cartId,
        message: "Product added to cart successfully"
      });
    } catch (err) {
      console.error("Error in postCartDtl:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to add product to cart",
        error: err.message
      });
    }
  }

  export async function sumCart(req, res) {
    console.log(`GET SumCart ${req.params.id} is requested `)
    const result = await database.query({
        text: `  SELECT SUM(qty) AS qty,SUM(qty*price) AS money
                FROM "cartDtl" ctd
                WHERE ctd."cartId" = $1` ,
        values: [req.params.id] //ค่า Parameter ที่ส่งมา
    })
    console.log(result.rows[0])
    return res.json({
        id: req.params.id,
        qty: result.rows[0].qty,
        money: result.rows[0].money
    })
}

export async function getCart(req, res) {
    console.log(`GET Cart is Requested`)
    try {
        const result = await database.query({
            text:`  SELECT ct.*, SUM(ctd.qty) AS sqty,SUM(ctd.price*ctd.qty) AS sprice
                    FROM carts ct LEFT JOIN "cartDtl" ctd ON ct."cartId" = ctd."cartId"
                    WHERE ct."cartId"=$1
                    GROUP BY ct."cartId" ` ,
            values:[req.params.id]
        })
        console.log(`id=${req.params.id} \n`+result.rows[0])
        return res.json(result.rows)
    }
    catch (err) {
        return res.json({
            error: err.message
        })
    }
  }

  export async function getCartDtl(req, res) {
    console.log(`GET CartDtl is Requested`)
    try {
        const result = await database.query({
        text:`  SELECT  ROW_NUMBER() OVER (ORDER BY ctd."pdId") AS row_number,
                        ctd."pdId",pd.product_name,ctd.qty,ctd.price
                FROM    "cartDtl" ctd LEFT JOIN "products" pd ON ctd."pdId" = pd."product_id"  
                WHERE ctd."cartId" =$1
                ORDER BY ctd."pdId" ` ,
            values:[req.params.id]
        })
        console.log(`id=${req.params.id} \n`+result.rows[0])
        return res.json(result.rows)
    }
    catch (err) {
        return res.json({
            error: err.message
        })
    }
  }

  export async function getCartByCus(req, res) {
    console.log(`POST Cart By Customer is Requested`)
    try {
        const result = await database.query({
            text:`  SELECT ROW_NUMBER() OVER (ORDER BY ct."cartId" DESC) AS row_number,
                            ct.*, SUM(ctd.qty) AS sqty,SUM(ctd.price*ctd.qty) AS sprice
                    FROM carts ct LEFT JOIN "cartDtl" ctd ON ct."cartId" = ctd."cartId"
                    WHERE ct."cusId"=$1
                    GROUP BY ct."cartId"
                    ORDER BY ct."cartId" DESC` ,
            values:[req.body.id]
        })
        console.log(`id=${req.params.id} \n`+result.rows[0])
        return res.json(result.rows)
    }
    catch (err) {
        return res.json({
            error: err.message
        })
    }
  }

  export async function deleteCart(req, res) {
    console.log(`DELETE /cart/${req.params.id} is requested`);
    try {
        // เริ่ม Transaction
        await database.query('BEGIN');

        // ลบรายการสินค้าในตะกร้าก่อน
        await database.query({
            text: `DELETE FROM "cartDtl" WHERE "cartId" = $1`,
            values: [req.params.id]
        });

        // แล้วค่อยลบตะกร้าหลัก
        await database.query({
            text: `DELETE FROM "carts" WHERE "cartId" = $1`,
            values: [req.params.id]
        });

        // Commit Transaction
        await database.query('COMMIT');

        return res.json({
            success: true,
            message: "ลบตะกร้าสินค้าเรียบร้อยแล้ว"
        });
    } catch (err) {
        // Rollback ถ้าเกิดข้อผิดพลาด
        await database.query('ROLLBACK');
        console.error("Error deleting cart:", err);
        return res.status(500).json({
            success: false,
            message: "ไม่สามารถลบตะกร้าสินค้าได้"
        });
    }
}

export async function confirmCart(req, res) {
  console.log(`PUT /cart/confirm/${req.params.id} is requested`);
  try {
      // อัปเดตสถานะตะกร้าเป็นยืนยันสั่งซื้อ
      const result = await database.query({
          text: `UPDATE "carts" SET "cartCf" = true WHERE "cartId" = $1 RETURNING *`,
          values: [req.params.id]
      });

      if (result.rowCount === 0) {
          return res.status(404).json({
              success: false,
              message: "ไม่พบตะกร้าสินค้านี้"
          });
      }

      return res.json({
          success: true,
          message: "ยืนยันสั่งซื้อเรียบร้อยแล้ว",
          cart: result.rows[0]
      });
  } catch (err) {
      console.error("Error confirming cart:", err);
      return res.status(500).json({
          success: false,
          message: "ไม่สามารถยืนยันสั่งซื้อได้"
      });
  }
}