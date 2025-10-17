import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { send } from "../utils/helper";

const db = new MySQL({
  host: "192.168.10.10",
  user: "oamsun",
  password: "Oams@UN",
  database: "oams-un",
});

export const UnisController = {
  async getAvailableSites(req: Request, res: Response) {
    const rows =
      await db.query(`SELECT structure, site, category, product, client, address, date_from, CASE WHEN addendum_type = 5 OR special_instruction LIKE "%preterm%" OR special_instruction LIKE "%pre-term%" THEN effectivity_date ELSE end_date END as end_date, net_contract_amount, payment_term_id, 
CASE
	WHEN addendum_type = 5 OR special_instruction LIKE "%preterm%" OR special_instruction LIKE "%pre-term%" THEN ABS(DATEDIFF(DATE(NOW()), DATE(effectivity_date)))
	WHEN DATE(end_date) < DATE(NOW()) THEN ABS(DATEDIFF(DATE(NOW()), DATE(end_date)))
                        ELSE NULL
                END AS days_vacant,
                CASE
                	WHEN addendum_type = 5 OR special_instruction LIKE "%preterm%" OR special_instruction LIKE "%pre-term%" THEN NULL
                        WHEN DATEDIFF(DATE(end_date), DATE(NOW())) >= 0 THEN DATEDIFF(DATE(end_date), DATE(NOW()))
                        ELSE NULL
                END AS remaining_days
                        FROM (SELECT A.*, B.lease_contract_code, B.net_contract_amount, B.payment_term_id, B.date_from as lease_date_from, B.date_to as lease_date_to
                        FROM (SELECT A.*, MAX(B.lease_contract_id) as lease_contract_id
                        FROM (SELECT A.*, B.structure_id, B.segment_id, C.division_id,E.contract_id, C.structure_code as structure, 
                        CONCAT(C.structure_code, "-", D.facing_no, D.transformation, LPAD(D.segment,2,"0")) AS site, 
                        F.category, E.contract_no, B.product, G.customer_name as "client", C.address, B.date_from, B.date_to as end_date, C.date_created, B.addendum_type, E.special_instruction, B.effectivity_date
                        FROM(
                        SELECT MAX(A.contract_structure_id) as contract_structure_id
                        FROM hd_contract_structure A
                        JOIN hd_contract B ON A.contract_id = B.contract_id
                        JOIN hd_structure C ON A.structure_id = C.structure_id 
                        JOIN hd_structure_segment D ON A.segment_id = D.segment_id
                        WHERE A.void = 0 
                        AND A.material_availability IS NOT NULL
                        AND C.status_id = 1
                        AND C.deleted = 0
                        AND D.status_id = 1
                        AND D.deleted = 0
                        AND D.transformed = 0
                        AND C.product_division_id IN (1,49)
                        AND B.contract_status_id NOT IN (5,6)
                        AND B.renewal_contract_id = 0
                        GROUP BY A.segment_id
                        ORDER BY A.structure_id ASC, A.segment_id ASC) A
                        JOIN hd_contract_structure B ON A.contract_structure_id = B.contract_structure_id
                        JOIN hd_structure C ON B.structure_id = C.structure_id
                        JOIN hd_structure_segment D ON B.segment_id = D.segment_id
                        JOIN hd_contract E ON B.contract_id = E.contract_id
                        JOIN hd_structure_category F ON C.category_id = F.category_id
                        JOIN hd_customer G ON E.customer_id = G.customer_id) A
                        LEFT JOIN (SELECT A.lease_contract_id, A.lease_contract_code, B.structure_id, A.net_contract_amount, A.date_from, A.date_to as end_date
                        FROM hd_lease_contract A
                        JOIN hd_structure B ON A.structure_id = B.structure_id
                        WHERE B.product_division_id IN (1,49) AND B.status_id = 1 AND B.deleted = 0) B ON A.structure_id = B.structure_id  
                        GROUP BY segment_id) A
                        LEFT JOIN hd_lease_contract B ON A.lease_contract_id = B.lease_contract_id
                        UNION ALL 
                        SELECT NULL as contract_structure_id, B.structure_id, C.segment_id, B.division_id, NULL as contract_id, B.structure_code as structure, 
                        CONCAT(B.structure_code,"-",C.facing_no, C.transformation, LPAD(C.segment,2,"0")) as site,
                        D.category, NULL as contract_no, NULL as product, NULL as "client", B.address, NULL as date_to, NULL as date_from, B.date_created, F.addendum_type, NULL as special_instruction,
                        E.lease_contract_id, E.lease_contract_code, E.net_contract_amount, E.payment_term_id, E.date_from as lease_date_from, E.date_to as lease_date_to, NULL as effectivity_date
                        FROM (
                        SELECT A.structure_id, MAX(B.lease_contract_id) as lease_contract_id
                        FROM hd_structure A 
                        LEFT JOIN hd_lease_contract B ON A.structure_id = B.structure_id 
                        GROUP BY structure_id) A
                        JOIN hd_structure B ON A.structure_id = B.structure_id
                        JOIN hd_structure_segment C ON A.structure_id = C.structure_id
                        JOIN hd_structure_category D ON B.category_id = D.category_id
                        LEFT JOIN hd_lease_contract E ON A.lease_contract_id = E.lease_contract_id
                        LEFT JOIN hd_contract_structure F ON B.structure_id = F.structure_id AND C.segment_id = F.segment_id
                        WHERE F.contract_structure_id IS NULL
                        AND B.status_id = 1 AND C.status_id = 1 AND B.deleted = 0 AND C.deleted = 0 AND B.product_division_id IN (1,49) AND C.transformed = 0
                        GROUP BY C.segment_id
                        ) sites
                        
                        ORDER BY division_id ASC, structure ASC, site ASC`);
    send(res).ok(rows);
  },
};
