-- ============================================================================
-- Healthx Story — data refresh snapshot  (MANUAL FALLBACK)
-- ----------------------------------------------------------------------------
-- PREFER the generator's live path:  npm i pg && SUPABASE_DB_URL=… node
--   scripts/refresh/generate.mjs   — it runs these same computations as several
--   fast modular queries and writes data/generated.ts directly.
--
-- Use THIS file only if you can't give the generator a DB connection. It is one
-- heavy query that returns a single JSON "snapshot" column. In the Supabase SQL
-- editor, run it, copy the JSON into  scripts/refresh/snapshot.json, then run:
--   node scripts/refresh/generate.mjs --from-snapshot
-- It is heavy enough to need a raised timeout — the SET below handles that.
--
-- All consolidation / projection logic lives here and in generate.mjs (kept in
-- sync). Editorial content — narrative, group hints, the 2026 actions, the
-- diagnosis-group mapping, nlrMatured, networkNlr2025 — is NOT produced here.
-- ============================================================================
SET statement_timeout = '300s';

WITH params AS (
  SELECT CURRENT_DATE AS report_date          -- "active / in-force" cutoff
),
-- TRR with a consolidated company key (strips legal forms, branch & benefit-band
-- suffixes, then merges known brand families) + short network code.
tn AS (
  SELECT t.*,
    CASE
      WHEN g0 LIKE 'NYMCARD%' THEN 'NYMCARD' WHEN g0 LIKE 'CYBERSHELTER%' THEN 'CYBERSHELTER'
      WHEN g0 LIKE 'SUPERIORMED%' THEN 'SUPERIORMED' WHEN g0 LIKE 'VEESQUARE%' THEN 'VEESQUARE'
      WHEN g0 LIKE 'POLYGREEN%' THEN 'POLYGREEN' WHEN g0 LIKE 'PYYPL%' THEN 'PYYPL'
      WHEN g0 LIKE 'TENDERD%' THEN 'TENDERD' WHEN g0 LIKE 'SAVETO%' THEN 'SAVETO'
      WHEN g0 LIKE 'THE ZULU SHIPS%' THEN 'THE ZULU SHIPS'
      WHEN g0 LIKE 'YOUNG ENGINEERING CONSULTANCY SERVICES%' THEN 'YOUNG ENGINEERING CONSULTANCY SERVICES'
      ELSE g0 END AS g
  FROM (
    SELECT *,
      array_to_string(ARRAY(
        SELECT tok FROM unnest(string_to_array(regexp_replace(upper(client), '[^A-Z0-9]+', ' ', 'g'), ' ')) AS tok
        WHERE tok <> '' AND tok NOT IN ('LLC','L','C','FZ','FZE','FZC','FZCO','FZLLC','DMCC','DWC','LTD',
          'LIMITED','PJSC','EST','ESTABLISHMENT','SOLE','PROPRIETORSHIP','OPC','ONE','PERSON','NLSB','LSB',
          'HSB','BRANCH','AUH','DXB','ABU','DHABI','DUBAI','CO','COMPANY')
      ), ' ') AS g0
    FROM trr
  ) t
),
net_code(net_type, code) AS (VALUES
  ('General Network','GN'),('Restricted Network','RN'),('Comprehensive Network','CN'),
  ('Super-Restricted Network','SRN'),('Workers Network','WN'),('Value Network','VN'),
  ('Value Network - IP','VIP'),('VN & VNL Dental Network','VD')
),
-- claims with short network code + consolidated provider group
cl AS (
  SELECT c.*, nc.code AS net,
    CASE
      WHEN provider_group LIKE 'Mediclinic%' THEN 'Mediclinic Group'
      WHEN provider_group LIKE 'NMC%' THEN 'NMC Group'
      WHEN trim(provider_group) = 'Medcare Hospitals & Medical Centres' THEN 'Medcare'
      WHEN provider_group = 'Al Zahra Hospital Group' THEN 'Al Zahra Group'
      WHEN provider_group = 'Burjeel Holding PLC' THEN 'Burjeel'
      WHEN provider_group = 'KCH Healthcare LLC' THEN 'KCH Healthcare'
      WHEN provider_group = 'Prime Healthcare Group' THEN 'Prime Healthcare'
      ELSE provider_group END AS pg
  FROM claims c LEFT JOIN net_code nc ON c.network_type = nc.net_type
),
-- per-group UY2024 cohort (performing vs loss-making) by paid NLR
g24 AS (
  SELECT g, sum(net_premium) np, sum(paid_claims) pc, sum(gross_premium) gp,
    CASE WHEN sum(paid_claims)/NULLIF(sum(net_premium),0) > 1 THEN 'bad' ELSE 'good' END AS cohort
  FROM tn WHERE uy='2024' GROUP BY g
),
set25 AS (SELECT DISTINCT g FROM tn WHERE uy='2025'),
set24 AS (SELECT DISTINCT g FROM tn WHERE uy='2024'),
-- outstanding (claims DB) per consolidated group, by UY
os AS (
  SELECT regexp_replace(upper(group_name),'[^A-Z0-9]','','g') AS gk,
         substring(policy_effective_month,1,4) AS uy,
         sum(payer_share) FILTER (WHERE claim_category LIKE 'Outstanding%' OR claim_category='To Be Paid') AS os_amt
  FROM cl GROUP BY 1,2
),
tn_key AS (SELECT *, regexp_replace(upper(client),'[^A-Z0-9]','','g') AS gk FROM tn),
-- UY2025 projection inputs per policy (paid + 85% OS, annualised by earned days)
proj25 AS (
  SELECT t.gk, t.net_premium, t.gross_premium, t.paid_claims,
    (t.expiry_date - t.start_date + 1) AS term_days,
    GREATEST(LEAST(t.as_of, t.expiry_date) - t.start_date + 1, 1) AS earned_days,
    COALESCE(o.os_amt,0) AS os_amt
  FROM tn_key t LEFT JOIN os o ON t.gk = o.gk AND o.uy='2025'
  WHERE t.uy='2025'
),
proj24 AS (
  SELECT t.net_premium,
    (CASE WHEN (t.expiry_date - t.start_date) <= 1 THEN 1
          ELSE (t.expiry_date - t.start_date + 1)::numeric / GREATEST(LEAST(t.as_of,t.expiry_date)-t.start_date+1,1) END)
      * (t.paid_claims + 0.85*COALESCE(o.os_amt,0)) AS ann_incurred,
    t.gross_premium
  FROM tn_key t LEFT JOIN os o ON t.gk=o.gk AND o.uy='2024' WHERE t.uy='2024'
),
-- one row per member with display-ready age band + nationality group + active flag
member_base AS (
  SELECT member_id, gender, dependency,
    CASE
      WHEN age_band IN ('Age 56-60','Age 61-65') THEN '56–65'
      WHEN age_band IN ('Age 66-70','Age 71-75','Over 75') OR age_band LIKE '%65+%' THEN '65+'
      ELSE replace(replace(age_band,'Age ',''),'-','–') END AS age,
    CASE
      WHEN nationality IN ('India','Pakistan','Sri Lanka','Nepal','Bangladesh','Afghanistan','Bhutan') THEN 'Indian subcontinent'
      WHEN nationality IN ('Egypt','Syria','Jordan','Lebanon','Palestine','Sudan','Morocco','United Arab Emirates',
        'Iraq','Tunisia','Algeria','Yemen','Saudi Arabia','Bahrain','Oman','Kuwait','Libya','Somalia','Comoros',
        'Qatar','Mauritania','Djibouti') THEN 'Arab countries'
      WHEN nationality IN ('Philippines','Iran','China','Turkey','Myanmar','Indonesia','Uzbekistan','Kazakhstan',
        'Kyrgyzstan','Armenia','Azerbaijan','Turkmenistan','Tajikistan','Singapore','Taiwan','Vietnam','Hong Kong',
        'South Korea','Japan','Malaysia','Thailand','Georgia') THEN 'Rest of Asia'
      WHEN nationality IN ('United Kingdom','Russia','France','Germany','Ireland','Ukraine','Italy','Romania','Portugal',
        'Netherlands','Poland','Serbia','Greece','Spain','Belgium','Lithuania','Sweden','Denmark','Switzerland','Belarus',
        'Austria','Bulgaria','Hungary','Bosnia-Herzegovina','Moldova','Slovakia','Latvia','Finland','Croatia','Norway',
        'Estonia','Slovenia','Albania','Malta','Former Yugoslav Republic of Macedonia','Cyprus','Czech Republic','Montenegro')
        THEN 'Europe'
      ELSE 'Rest of the world' END AS natgrp,
    (member_id IN (SELECT member_id FROM claims
       WHERE policy_effective_month >= to_char((SELECT report_date FROM params) - interval '12 months','YYYY-MM'))) AS active
  FROM (SELECT DISTINCT ON (member_id) member_id, gender, dependency, age_band, nationality
        FROM claims WHERE member_id IS NOT NULL ORDER BY member_id) d
),
age_ord(age, ord) AS (VALUES ('0–17',1),('18–25',2),('26–35',3),('36–45',4),('46–55',5),('56–65',6),('65+',7)),
-- clean benefit-of-business labels for display
fob_clean(raw, label) AS (VALUES
  ('Out-Patient','Out-patient'),('In-Patient','In-patient'),('Maternity','Maternity'),('Dental','Dental'),
  ('Optical','Optical'),('Psychiatry','Psychiatry'),('Alternative Treatment','Alternative'),
  ('Wellness','Wellness'),('Assistance','Assistance'))
SELECT json_build_object(
  'meta', json_build_object('report_date', (SELECT report_date FROM params), 'generated_basis', 'trr + claims'),

  'totals', (SELECT json_build_object(
     'claimsPaidM', round(sum(paid_claims)/1e6,1),
     'grossPremiumM', round(sum(gross_premium)/1e6,1),
     'snapshots', count(*),
     'claimLines', (SELECT count(*) FROM claims),
     'brokers', (SELECT count(DISTINCT CASE
        WHEN upper(broker) LIKE 'NASCO%' THEN 'NASCO' WHEN upper(broker) LIKE 'GARGASH%' THEN 'GARGASH'
        WHEN upper(broker) LIKE 'LOCKTON%' THEN 'LOCKTON' WHEN upper(broker) LIKE '%BENEPLE%' THEN 'BENEPLE'
        WHEN upper(broker) LIKE 'AL MANARA%' THEN 'AL MANARA'
        WHEN upper(broker) LIKE 'THE FIRM%' OR upper(broker)='THE BROKERAGE FIRM INSURANCE BROKERS' THEN 'THE FIRM'
        ELSE trim(regexp_replace(regexp_replace(upper(broker),'[^A-Z0-9]+',' ','g'),
             ' (LLC|L L C|WLL|LTD|CO|LL|DMCC|DUBAI|ABU DHABI|AUH|SHARJAH)( |$)',' ','g')) END)
       FROM trr WHERE broker IS NOT NULL AND broker NOT IN ('QIC-Direct Sales','Individual Contracts'))
   ) FROM trr),

  'y2024', (SELECT json_build_object(
     'gp', round(sum(gross_premium)/1e6,1), 'lives', round(sum(lives)),
     'groups', (SELECT count(*) FROM g24),
     'avgPremium', round(sum(gross_premium)/NULLIF(sum(lives),0)),
     'nlrMatured', (SELECT round(100*sum(paid_claims)/NULLIF(sum(net_premium),0),1)
        FROM tn, params WHERE expiry_date <= report_date - 90),
     'nlrProjected', (SELECT round(100*sum(ann_incurred)/NULLIF(sum(net_premium),0),1) FROM proj24)
   ) FROM tn WHERE uy='2024'),

  'y2025', (SELECT json_build_object(
     'gp', round(sum(gross_premium)/1e6,1), 'np', round(sum(net_premium)/1e6,1),
     'lives', round(sum(lives)), 'groups', (SELECT count(DISTINCT g) FROM tn WHERE uy='2025'),
     'avgPremium', round(sum(gross_premium)/NULLIF(sum(lives),0)),
     'takeRate', round(100*(1 - sum(net_premium)/NULLIF(sum(gross_premium),0)),1),
     'nlrProjected', (SELECT round(100*sum((paid_claims+0.85*os_amt) * CASE WHEN term_days<=1 THEN 1 ELSE term_days::numeric/earned_days END)/NULLIF(sum(net_premium),0),1) FROM proj25),
     'glrProjected', (SELECT round(100*sum((paid_claims+0.85*os_amt) * CASE WHEN term_days<=1 THEN 1 ELSE term_days::numeric/earned_days END)/NULLIF(sum(gross_premium),0),1) FROM proj25)
   ) FROM tn WHERE uy='2025'),

  'cohorts', (SELECT json_object_agg(cohort, j) FROM (
     SELECT cohort, json_build_object(
       'groups', count(*),
       'renewedGroups', count(*) FILTER (WHERE g IN (SELECT g FROM set25)),
       'gpTotal', round(sum(gp)/1e6,1),
       'gpRenewed', round(sum(gp) FILTER (WHERE g IN (SELECT g FROM set25))/1e6,1),
       'gpLost', round(sum(gp) FILTER (WHERE g NOT IN (SELECT g FROM set25))/1e6,1)
     ) AS j FROM g24 GROUP BY cohort) z),

  'monthly', (SELECT json_build_object(
     'gp2024', (SELECT json_agg(m ORDER BY mm) FROM (SELECT to_char(start_date,'MM') mm, round(sum(gross_premium)/1e6,2) m FROM tn WHERE uy='2024' GROUP BY 1) a),
     'renewal2025', (SELECT json_agg(m ORDER BY mm) FROM (SELECT to_char(start_date,'MM') mm, round(COALESCE(sum(gross_premium) FILTER (WHERE g IN (SELECT g FROM set24)),0)/1e6,2) m FROM tn WHERE uy='2025' GROUP BY 1) b),
     'new2025', (SELECT json_agg(m ORDER BY mm) FROM (SELECT to_char(start_date,'MM') mm, round(COALESCE(sum(gross_premium) FILTER (WHERE g NOT IN (SELECT g FROM set24)),0)/1e6,2) m FROM tn WHERE uy='2025' GROUP BY 1) c)
   )),

  'q1Trend', (SELECT json_agg(json_build_object('label','Q1 '||uy,'gp',gpm) ORDER BY uy)
     FROM (SELECT uy, round(sum(gross_premium)/1e6,1) gpm FROM tn WHERE to_char(start_date,'MM') IN ('01','02','03') GROUP BY uy) q),

  'networkNlr2025', (SELECT json_agg(j) FROM (
     SELECT json_build_object('code', net, 'nlr', nlr, 'npM', npm) j, ord FROM (
       SELECT b.net,
         round(sum(np_alloc)/1e6,1) npm,
         round(100*sum(ann_inc)/NULLIF(sum(np_alloc),0),1) nlr,
         CASE b.net WHEN 'GN' THEN 1 WHEN 'RN' THEN 2 WHEN 'CN' THEN 3 ELSE 9 END ord
       FROM (
         SELECT regexp_replace(upper(group_name),'[^A-Z0-9]','','g') gk,
           CASE WHEN network_type IN ('Value Network','Value Network - IP','VN & VNL Dental Network') THEN 'VN'
                WHEN network_type='General Network' THEN 'GN' WHEN network_type='Restricted Network' THEN 'RN'
                WHEN network_type='Comprehensive Network' THEN 'CN' WHEN network_type='Super-Restricted Network' THEN 'SRN'
                WHEN network_type='Workers Network' THEN 'WN' END net,
           count(DISTINCT member_id) members,
           COALESCE(sum(payer_share) FILTER (WHERE claim_category='Paid'),0) paid,
           COALESCE(sum(payer_share) FILTER (WHERE claim_category LIKE 'Outstanding%' OR claim_category='To Be Paid'),0) os
         FROM cl WHERE substring(policy_effective_month,1,4)='2025' GROUP BY 1,2
       ) bn
       JOIN (  -- premium-per-member rate per network, from single-network groups
         SELECT net, sum(np)/NULLIF(sum(members),0) ppm FROM (
           SELECT bn2.net, bn2.members, tk.np FROM (
             SELECT regexp_replace(upper(group_name),'[^A-Z0-9]','','g') gk,
               CASE WHEN network_type IN ('Value Network','Value Network - IP','VN & VNL Dental Network') THEN 'VN'
                    WHEN network_type='General Network' THEN 'GN' WHEN network_type='Restricted Network' THEN 'RN'
                    WHEN network_type='Comprehensive Network' THEN 'CN' WHEN network_type='Super-Restricted Network' THEN 'SRN'
                    WHEN network_type='Workers Network' THEN 'WN' END net,
               count(DISTINCT member_id) members
             FROM cl WHERE substring(policy_effective_month,1,4)='2025' GROUP BY 1,2
           ) bn2
           JOIN (SELECT gk FROM (SELECT regexp_replace(upper(group_name),'[^A-Z0-9]','','g') gk FROM cl WHERE substring(policy_effective_month,1,4)='2025' GROUP BY 1) x
                 WHERE gk IN (SELECT regexp_replace(upper(group_name),'[^A-Z0-9]','','g') FROM cl WHERE substring(policy_effective_month,1,4)='2025'
                              GROUP BY 1 HAVING count(DISTINCT CASE WHEN network_type IN ('Value Network','Value Network - IP','VN & VNL Dental Network') THEN 'VN' ELSE network_type END)=1)) sg ON bn2.gk=sg.gk
           JOIN (SELECT regexp_replace(upper(client),'[^A-Z0-9]','','g') gk, sum(net_premium) np FROM trr WHERE uy='2025' GROUP BY 1) tk ON bn2.gk=tk.gk
         ) r GROUP BY net
       ) rate ON bn.net=rate.net
       JOIN (SELECT regexp_replace(upper(client),'[^A-Z0-9]','','g') gk, sum(net_premium) np, sum(gross_premium) gp,
                    max(expiry_date - start_date + 1) term_days,
                    max(GREATEST(LEAST(as_of,expiry_date)-start_date+1,1)) earned_days
             FROM trr WHERE uy='2025' GROUP BY 1) t ON bn.gk=t.gk
       CROSS JOIN LATERAL (
         SELECT t.np * (bn.members*rate.ppm) / NULLIF(sum(bn.members*rate.ppm) OVER (PARTITION BY bn.gk),0) AS np_alloc,
                (bn.paid + 0.85*bn.os) * CASE WHEN t.term_days<=1 THEN 1 ELSE t.term_days::numeric/t.earned_days END AS ann_inc
       ) a
       WHERE bn.net IN ('GN','RN','CN')
       GROUP BY b.net
     ) nn ORDER BY ord)),

  'censusAll', (SELECT json_build_object(
      'total', count(*),
      'gender', (SELECT json_agg(json_build_object('label',gender,'value',v) ORDER BY v DESC) FROM (SELECT gender, count(*) v FROM member_base WHERE gender IS NOT NULL GROUP BY 1) a),
      'relation', (SELECT json_agg(json_build_object('label',dependency,'value',v) ORDER BY v DESC) FROM (SELECT dependency, count(*) v FROM member_base WHERE dependency IS NOT NULL GROUP BY 1) a),
      'age', (SELECT json_agg(json_build_object('label',age,'value',v) ORDER BY ord) FROM (SELECT mb.age, count(*) v, ao.ord FROM member_base mb JOIN age_ord ao ON mb.age=ao.age GROUP BY 1,3) a),
      'nat', (SELECT json_agg(json_build_object('label',natgrp,'value',v) ORDER BY v DESC) FROM (SELECT natgrp, count(*) v FROM member_base GROUP BY 1) a)
    ) FROM member_base),

  'censusActiveClaimants', (SELECT json_build_object(
      'total', count(*),
      'gender', (SELECT json_agg(json_build_object('label',gender,'value',v) ORDER BY v DESC) FROM (SELECT gender, count(*) v FROM member_base WHERE active AND gender IS NOT NULL GROUP BY 1) a),
      'relation', (SELECT json_agg(json_build_object('label',dependency,'value',v) ORDER BY v DESC) FROM (SELECT dependency, count(*) v FROM member_base WHERE active AND dependency IS NOT NULL GROUP BY 1) a),
      'age', (SELECT json_agg(json_build_object('label',age,'value',v) ORDER BY ord) FROM (SELECT mb.age, count(*) v, ao.ord FROM member_base mb JOIN age_ord ao ON mb.age=ao.age WHERE mb.active GROUP BY 1,3) a),
      'nat', (SELECT json_agg(json_build_object('label',natgrp,'value',v) ORDER BY v DESC) FROM (SELECT natgrp, count(*) v FROM member_base WHERE active GROUP BY 1) a)
    ) FROM member_base WHERE active),

  'activeInForceLives', (SELECT round(sum(lives)) FROM tn, params WHERE expiry_date >= report_date),

  'claims', json_build_object(
    'episodes', (SELECT count(DISTINCT visit_episode) FROM claims),
    'fobByNetwork', (SELECT json_agg(json_build_array(net, fob, aed)) FROM (
        SELECT cl.net, COALESCE(fc.label, cl.benefit_fob) fob, round(sum(payer_share)) aed
        FROM cl LEFT JOIN fob_clean fc ON cl.benefit_fob = fc.raw
        WHERE cl.net IS NOT NULL GROUP BY 1,2 HAVING round(sum(payer_share))>0 ORDER BY cl.net, aed DESC) f),
    'relationByNetwork', (SELECT json_agg(json_build_array(net, rel, aed)) FROM (
        SELECT net, dependency rel, round(sum(payer_share)) aed FROM cl WHERE net IS NOT NULL GROUP BY 1,2 HAVING round(sum(payer_share))>0 ORDER BY net, aed DESC) r),
    'providersByNetwork', (SELECT json_agg(json_build_array(net, pg, aed, episodes)) FROM (
        SELECT cl.net, cl.pg, round(sum(payer_share)) aed, count(DISTINCT visit_episode) episodes
        FROM cl JOIN (SELECT pg FROM cl WHERE pg IS NOT NULL GROUP BY pg ORDER BY sum(payer_share) DESC LIMIT 10) top ON cl.pg=top.pg
        WHERE cl.net IS NOT NULL GROUP BY 1,2 HAVING round(sum(payer_share))>0 ORDER BY cl.pg, aed DESC) p)
  )
) AS snapshot;
