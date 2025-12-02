import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { send } from "../utils/helper";
import { ResultSetHeader } from "mysql2";
import axios from "axios";

const db = new MySQL({
  host: "192.168.10.10",
  user: "oamsun",
  password: "Oams@UN",
  database: "oams-un",
});

interface SiteImages extends ResultSetHeader {
  image: string;
}


export const UnisController = {
  async getAvailableSites(_: Request, res: Response) {
    const rows = await db.query(`SELECT 
*,
    CASE
        WHEN
            addendum_type = 5
                OR special_instruction LIKE '%preterm%'
                OR special_instruction LIKE '%pre-term%'
        THEN
            effectivity_date
        ELSE end_date
    END AS end_date,
    net_contract_amount,
    payment_term_id,
    CASE
        WHEN
            addendum_type = 5
                OR special_instruction LIKE '%preterm%'
                OR special_instruction LIKE '%pre-term%'
        THEN
            ABS(DATEDIFF(DATE(NOW()), DATE(effectivity_date)))
        WHEN DATE(end_date) < DATE(NOW()) THEN ABS(DATEDIFF(DATE(NOW()), DATE(end_date)))
        ELSE NULL
    END AS days_vacant,
    CASE
        WHEN
            addendum_type = 5
                OR special_instruction LIKE '%preterm%'
                OR special_instruction LIKE '%pre-term%'
        THEN
            NULL
        WHEN DATEDIFF(DATE(end_date), DATE(NOW())) >= 0 THEN DATEDIFF(DATE(end_date), DATE(NOW()))
        ELSE NULL
    END AS remaining_days
FROM
    (SELECT 
        A.*,
            COALESCE(C.contract_amount, B.net_contract_amount) AS net_contract_amount,
            B.payment_term_id,
            C.date_from AS lease_date_from,
            C.date_to AS lease_date_to
    FROM
        (SELECT 
        A.*, MAX(B.lease_contract_id) AS lease_contract_id
    FROM
        (SELECT 
        A.*,
            B.structure_id,
            B.segment_id,
            C.division_id,
            E.contract_id,
            C.structure_code AS structure,
            CONCAT(C.structure_code, '-', D.facing_no, D.transformation, LPAD(D.segment, 2, '0')) AS site,
            F.category,
            E.contract_no,
            B.product,
            G.customer_name AS 'client',
            C.address,
            B.date_from,
            B.date_to AS end_date,
            C.date_created,
            B.addendum_type,
            E.special_instruction,
            B.effectivity_date
    FROM
        (SELECT 
        MAX(A.contract_structure_id) AS contract_structure_id
    FROM
        hd_contract_structure A
    JOIN hd_contract B ON A.contract_id = B.contract_id
    JOIN hd_structure C ON A.structure_id = C.structure_id
    JOIN hd_structure_segment D ON A.segment_id = D.segment_id
    WHERE
        A.void = 0
            AND A.material_availability IS NOT NULL
            AND A.addendum_type NOT IN (1,5)
            AND C.status_id = 1
            AND C.deleted = 0
            AND D.status_id = 1
            AND D.deleted = 0
            AND D.transformed = 0
            AND C.product_division_id IN (1 , 49)
            AND B.contract_status_id NOT IN (5 , 6)
            AND B.renewal_contract_id = 0
    GROUP BY A.segment_id
    ORDER BY A.structure_id ASC , A.segment_id ASC) A
    JOIN hd_contract_structure B ON A.contract_structure_id = B.contract_structure_id
    JOIN hd_structure C ON B.structure_id = C.structure_id
    JOIN hd_structure_segment D ON B.segment_id = D.segment_id
    JOIN hd_contract E ON B.contract_id = E.contract_id
    JOIN hd_structure_category F ON C.category_id = F.category_id
    JOIN hd_customer G ON E.customer_id = G.customer_id) A
    LEFT JOIN (SELECT 
        MAX(A.lease_contract_id) AS lease_contract_id,
            A.lease_contract_code,
            MAX(B.structure_id) AS structure_id,
            C.contract_amount AS net_contract_amount,
            C.date_from,
            C.date_to AS end_date
    FROM
        hd_lease_contract A
    JOIN hd_structure B ON A.structure_id = B.structure_id
    LEFT JOIN hd_lease_payment_detail C ON A.lease_contract_id = C.lease_contract_id
    WHERE
        B.product_division_id IN (1 , 49)
            AND B.status_id = 1
            AND B.deleted = 0
    GROUP BY B.structure_id) B ON A.structure_id = B.structure_id
    GROUP BY segment_id) A
    LEFT JOIN hd_lease_contract B ON A.lease_contract_id = B.lease_contract_id
	LEFT JOIN hd_lease_payment_detail C
		ON A.lease_contract_id = C.lease_contract_id
		AND CURDATE() BETWEEN C.date_from AND C.date_to
		AND NOT EXISTS (
			SELECT 1
			FROM hd_lease_payment_detail X
			WHERE X.replace_id = C.payment_detail_id
		)
UNION ALL SELECT 
        NULL AS contract_structure_id,
            B.structure_id,
            C.segment_id,
            B.division_id,
            NULL AS contract_id,
            B.structure_code AS structure,
            CONCAT(B.structure_code, '-', C.facing_no, C.transformation, LPAD(C.segment, 2, '0')) AS site,
            D.category,
            NULL AS contract_no,
            NULL AS product,
            NULL AS 'client',
            B.address,
            NULL AS date_to,
            NULL AS date_from,
            B.date_created,
            F.addendum_type,
            NULL AS special_instruction,
            E.lease_contract_id,
            E.net_contract_amount,
            E.payment_term_id,
            E.date_from AS lease_date_from,
            E.date_to AS lease_date_to,
            NULL AS effectivity_date
    FROM
        (SELECT 
        A.structure_id,
            MAX(B.lease_contract_id) AS lease_contract_id
    FROM
        hd_structure A
    LEFT JOIN hd_lease_contract B ON A.structure_id = B.structure_id
    GROUP BY structure_id) A
    JOIN hd_structure B ON A.structure_id = B.structure_id
    JOIN hd_structure_segment C ON A.structure_id = C.structure_id
    JOIN hd_structure_category D ON B.category_id = D.category_id
    LEFT JOIN hd_lease_contract E ON A.lease_contract_id = E.lease_contract_id
    LEFT JOIN hd_contract_structure F ON B.structure_id = F.structure_id
        AND C.segment_id = F.segment_id
    WHERE
        F.contract_structure_id IS NULL
            AND B.status_id = 1
            AND C.status_id = 1
            AND B.deleted = 0
            AND C.deleted = 0
            AND B.product_division_id IN (1 , 49)
            AND C.transformed = 0
    GROUP BY C.segment_id) sites
ORDER BY division_id ASC , structure ASC , site ASC`);
    send(res).ok(rows);
  },

  async getLatestSites(req: Request, res: Response) {
    const date = req.query.date;

    const response = await db.query(
      `SELECT s.structure_id, s.structure_code, COALESCE(CONCAT(s.structure_code, '-', ss.facing_no, ss.transformation, LPAD(ss.segment,2,'0')),CONCAT(s.structure_code,'-','XXXXX')) as site_code, ac.city_name as city, ad.division_name as region, s.address, ss.latitude, ss.longitude, sc.category as site_owner, CONCAT(s.structure_height," x ", s.structure_width) as size, s.vicinity_population, s.traffic_count,ss.facing as board_facing, s.traffic as bound, COALESCE(COALESCE(ss.date_modified, ss.date_created), s.date_created) as date_created FROM hd_structure s 
LEFT JOIN hd_structure_segment ss ON s.structure_id = ss.structure_id 
LEFT JOIN hd_structure_status st ON s.status_id = st.status_id 
JOIN hd_ad_city ac ON s.city_id = ac.city_id
JOIN hd_ad_division ad ON s.division_id = ad.division_id
JOIN hd_structure_category sc ON s.category_id = sc.category_id
WHERE s.date_created > ? AND s.product_division_id = 1 AND st.status_id IN (1) ORDER BY s.structure_id DESC;`,
      [date]
    );

    send(res).ok(response);
  },

  async getSiteImages(req: Request, res: Response) {
    const site = req.params.site;

    if (!site) send(res).error("No site code found.");

    let [structure, segment]: string[] = site!.split("-");

    if (!structure || !segment) send(res).error("No site code found.");

    segment = structure === "3D" ? undefined : segment;

    let query =
      "SELECT s.structure_id, s.structure_code,CONCAT(ss.facing_no, ss.transformation, LPAD(ss.segment,2,'0')) as segment_code, ss.image FROM hd_structure s JOIN hd_structure_segment ss ON ss.structure_id = s.structure_id WHERE s.structure_code";

    if (structure === "3D") {
      query = query + " LIKE ?";
    } else {
      query = query + " = ?";
    }
    query = `SELECT image FROM (${query}) A `;
    const params: string[] = [structure!];
    if (segment) {
      query = query + " WHERE segment_code = ?";
      params.push(segment);
    }

    const [imageIDs] = await db.query<SiteImages>(query, params);
    if (imageIDs) {
      if (!imageIDs.image) {
        send(res).error("No images found for " + site, 204);
        return;
      }

      const IDs = imageIDs.image
        .split(",")
        .map((img: string) => img.trim())
        .filter(Boolean); // remove empty values

      if (IDs.length === 0) {
        send(res).error("No valid image IDs found for " + site, 204);
        return;
      }

      // Generate placeholders safely (e.g., ?, ?, ?)
      const placeholders = IDs.map(() => "?").join(",");
      const query = `
    SELECT * 
    FROM hd_file_upload 
    WHERE upload_id IN (${placeholders})
      AND upload_path NOT LIKE ?
    ORDER BY date_uploaded;
  `;

      const params = [...IDs, `${structure}%`];
      const imageLinks = await db.query(query, params);
      send(res).ok(imageLinks);
    } else {
      send(res).ok("No images found for " + site);
    }
  },

  async getImageThumbnail(req: Request, res: Response) {
    const id = req.params.id;

    if (!id) send(res).error("No id found.");

    const [image] = await db.query(
      "SELECT * FROM hd_file_upload WHERE upload_id = ?",
      [id]
    );

    if (image) {
      const path = image.upload_path;

      const filePath = `https://unis.unitedneon.com/unis/${path}`;

      try {
        const response = await axios.get(filePath, {
          responseType: "arraybuffer",
        });
        res.setHeader("Content-Type", response.headers["content-type"]);
        res.send(response.data);
      } catch (e) {
        console.log(e);
        res.status(404).send("Image not found");
      }
    } else {
      send(res).error("No image found.");
    }
  },
  async getImageFile(req: Request, res: Response) {
    const path = req.query.path;

    const filePath = `https://unis.unitedneon.com/unis/${path}`;

    try {
      const response = await axios.get(filePath, {
        responseType: "arraybuffer",
      });
      res.setHeader("Content-Type", response.headers["content-type"]);
      res.send(response.data);
    } catch (e) {
      console.log(e);
      res.status(404).send("Image not found");
    }
  },

  async getAreas(_: Request, res: Response) {
    const response = await db.query(
      "SELECT city_id, city_code, city_name FROM hd_ad_city ORDER BY city_name ASC;"
    );

    send(res).ok(response);
  },
};
