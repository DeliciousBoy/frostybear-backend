import database from "../service/database.js";

export async function getSystemParam(req, res){
    console.log(`POST /systemparam request`);
    try{

        const { byte_reference } = req.query; 

        if (!byte_reference) {
            return res.status(400).json(
                { 
                    error: "byte_reference is null." 
                });
        }

        const result = await database.query(`
                                            SELECT byte_type, byte_name FROM system_param
                                            WHERE byte_reference = $1
                                            `,[byte_reference]
                                        );
                                        res.json(result.rows);
    }catch(error){
        console.log(error);
        res.status(500).json({error: "Internal Server Error"});
    }
}