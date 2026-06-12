#!/usr/bin/env node
// ============================================================================
// Healthx Story — portfolio data generator
// ----------------------------------------------------------------------------
// Regenerates data/generated.ts (the GEN object) from a data snapshot.
//
//   Live DB:   SUPABASE_DB_URL=postgres://... node scripts/refresh/generate.mjs
//   From file: node scripts/refresh/generate.mjs --from-snapshot
//
// The live path runs the modular queries in this file (same logic as
// scripts/refresh/refresh.sql) and needs `npm i pg`. The from-snapshot path
// reads scripts/refresh/snapshot.json — produced by running refresh.sql in the
// Supabase SQL editor — and needs no dependencies.
//
// It ONLY writes data/generated.ts. Editorial content (narrative, group hints,
// the 2026 actions, the diagnosis-group mapping, nlrMatured, networkNlr2025)
// lives in data/portfolio.ts and is never touched. After running, review the
// git diff of generated.ts and re-check the narrative in app/page.tsx if any
// headline number moved materially.
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const OUT = resolve(ROOT, "data/generated.ts");

// ---- modular queries (each fast; run separately to avoid statement timeouts) ----
const NORM_CTE = `
  tn AS (SELECT t.*, CASE
      WHEN g0 LIKE 'NYMCARD%' THEN 'NYMCARD' WHEN g0 LIKE 'CYBERSHELTER%' THEN 'CYBERSHELTER'
      WHEN g0 LIKE 'SUPERIORMED%' THEN 'SUPERIORMED' WHEN g0 LIKE 'VEESQUARE%' THEN 'VEESQUARE'
      WHEN g0 LIKE 'POLYGREEN%' THEN 'POLYGREEN' WHEN g0 LIKE 'PYYPL%' THEN 'PYYPL'
      WHEN g0 LIKE 'TENDERD%' THEN 'TENDERD' WHEN g0 LIKE 'SAVETO%' THEN 'SAVETO'
      WHEN g0 LIKE 'THE ZULU SHIPS%' THEN 'THE ZULU SHIPS'
      WHEN g0 LIKE 'YOUNG ENGINEERING CONSULTANCY SERVICES%' THEN 'YOUNG ENGINEERING CONSULTANCY SERVICES'
      ELSE g0 END AS g
    FROM (SELECT *, array_to_string(ARRAY(
      SELECT tok FROM unnest(string_to_array(regexp_replace(upper(client),'[^A-Z0-9]+',' ','g'),' ')) AS tok
      WHERE tok <> '' AND tok NOT IN ('LLC','L','C','FZ','FZE','FZC','FZCO','FZLLC','DMCC','DWC','LTD','LIMITED',
        'PJSC','EST','ESTABLISHMENT','SOLE','PROPRIETORSHIP','OPC','ONE','PERSON','NLSB','LSB','HSB','BRANCH',
        'AUH','DXB','ABU','DHABI','DUBAI','CO','COMPANY')), ' ') AS g0 FROM trr) t),
  netc(net_type,code) AS (VALUES ('General Network','GN'),('Restricted Network','RN'),('Comprehensive Network','CN'),
    ('Super-Restricted Network','SRN'),('Workers Network','WN'),('Value Network','VN'),
    ('Value Network - IP','VIP'),('VN & VNL Dental Network','VD')),
  cl AS (SELECT c.*, nc.code AS net, CASE
      WHEN provider_group LIKE 'Mediclinic%' THEN 'Mediclinic Group' WHEN provider_group LIKE 'NMC%' THEN 'NMC Group'
      WHEN trim(provider_group)='Medcare Hospitals & Medical Centres' THEN 'Medcare'
      WHEN provider_group='Al Zahra Hospital Group' THEN 'Al Zahra Group' WHEN provider_group='Burjeel Holding PLC' THEN 'Burjeel'
      WHEN provider_group='KCH Healthcare LLC' THEN 'KCH Healthcare' WHEN provider_group='Prime Healthcare Group' THEN 'Prime Healthcare'
      ELSE provider_group END AS pg FROM claims c LEFT JOIN netc nc ON c.network_type=nc.net_type)`;

const Q = {
  core: `WITH params AS (SELECT CURRENT_DATE rd), ${NORM_CTE},
    g24 AS (SELECT g, sum(gross_premium) gp, CASE WHEN sum(paid_claims)/NULLIF(sum(net_premium),0)>1 THEN 'bad' ELSE 'good' END cohort FROM tn WHERE uy='2024' GROUP BY g),
    s25 AS (SELECT DISTINCT g FROM tn WHERE uy='2025'), s24 AS (SELECT DISTINCT g FROM tn WHERE uy='2024')
    SELECT json_build_object(
      'totals',(SELECT json_build_object('claimsPaidM',round(sum(paid_claims)/1e6,1),'grossPremiumM',round(sum(gross_premium)/1e6,1),'snapshots',count(*),'claimLines',(SELECT count(*) FROM claims),
        'brokers',(SELECT count(DISTINCT CASE WHEN upper(broker) LIKE 'NASCO%' THEN 'NASCO' WHEN upper(broker) LIKE 'GARGASH%' THEN 'GARGASH' WHEN upper(broker) LIKE 'LOCKTON%' THEN 'LOCKTON' WHEN upper(broker) LIKE '%BENEPLE%' THEN 'BENEPLE' WHEN upper(broker) LIKE 'AL MANARA%' THEN 'AL MANARA' WHEN upper(broker) LIKE 'THE FIRM%' OR upper(broker)='THE BROKERAGE FIRM INSURANCE BROKERS' THEN 'THE FIRM' ELSE trim(regexp_replace(regexp_replace(upper(broker),'[^A-Z0-9]+',' ','g'),' (LLC|L L C|WLL|LTD|CO|LL|DMCC|DUBAI|ABU DHABI|AUH|SHARJAH)( |$)',' ','g')) END) FROM trr WHERE broker IS NOT NULL AND broker NOT IN ('QIC-Direct Sales','Individual Contracts'))) FROM trr),
      'y2024',(SELECT json_build_object('gp',round(sum(gross_premium)/1e6,1),'lives',round(sum(lives)),'groups',(SELECT count(*) FROM g24),'avgPremium',round(sum(gross_premium)/NULLIF(sum(lives),0))) FROM tn WHERE uy='2024'),
      'y2025',(SELECT json_build_object('gp',round(sum(gross_premium)/1e6,1),'np',round(sum(net_premium)/1e6,1),'lives',round(sum(lives)),'groups',(SELECT count(DISTINCT g) FROM tn WHERE uy='2025'),'avgPremium',round(sum(gross_premium)/NULLIF(sum(lives),0)),'takeRate',round(100*(1-sum(net_premium)/NULLIF(sum(gross_premium),0)),1)) FROM tn WHERE uy='2025'),
      'cohorts',(SELECT json_object_agg(cohort,j) FROM (SELECT cohort,json_build_object('groups',count(*),'renewedGroups',count(*) FILTER (WHERE g IN (SELECT g FROM s25)),'gpTotal',round(sum(gp)/1e6,1),'gpRenewed',round(sum(gp) FILTER (WHERE g IN (SELECT g FROM s25))/1e6,1),'gpLost',round(sum(gp) FILTER (WHERE g NOT IN (SELECT g FROM s25))/1e6,1)) j FROM g24 GROUP BY cohort) z),
      'monthly',json_build_object('gp2024',(SELECT json_agg(m ORDER BY mm) FROM (SELECT to_char(start_date,'MM') mm,round(sum(gross_premium)/1e6,2) m FROM tn WHERE uy='2024' GROUP BY 1) a),'renewal2025',(SELECT json_agg(m ORDER BY mm) FROM (SELECT to_char(start_date,'MM') mm,round(COALESCE(sum(gross_premium) FILTER (WHERE g IN (SELECT g FROM s24)),0)/1e6,2) m FROM tn WHERE uy='2025' GROUP BY 1) b),'new2025',(SELECT json_agg(m ORDER BY mm) FROM (SELECT to_char(start_date,'MM') mm,round(COALESCE(sum(gross_premium) FILTER (WHERE g NOT IN (SELECT g FROM s24)),0)/1e6,2) m FROM tn WHERE uy='2025' GROUP BY 1) c)),
      'q1Trend',(SELECT json_agg(json_build_object('label','Q1 '||uy,'gp',gpm) ORDER BY uy) FROM (SELECT uy,round(sum(gross_premium)/1e6,1) gpm FROM tn WHERE to_char(start_date,'MM') IN ('01','02','03') GROUP BY uy) q)
    ) snap`,

  projection: `WITH os AS (SELECT regexp_replace(upper(group_name),'[^A-Z0-9]','','g') gk, substring(policy_effective_month,1,4) uy, sum(payer_share) FILTER (WHERE claim_category LIKE 'Outstanding%' OR claim_category='To Be Paid') os_amt FROM claims GROUP BY 1,2),
    tk AS (SELECT *, regexp_replace(upper(client),'[^A-Z0-9]','','g') gk FROM trr),
    p25 AS (SELECT (expiry_date-start_date+1) td, GREATEST(LEAST(t.as_of,expiry_date)-start_date+1,1) ed, net_premium, gross_premium, paid_claims, COALESCE(o.os_amt,0) os FROM tk t LEFT JOIN os o ON t.gk=o.gk AND o.uy='2025' WHERE uy='2025'),
    p24 AS (SELECT net_premium, (CASE WHEN (expiry_date-start_date)<=1 THEN 1 ELSE (expiry_date-start_date+1)::numeric/GREATEST(LEAST(t.as_of,expiry_date)-start_date+1,1) END)*(paid_claims+0.85*COALESCE(o.os_amt,0)) ann FROM tk t LEFT JOIN os o ON t.gk=o.gk AND o.uy='2024' WHERE uy='2024')
    SELECT json_build_object('y2025_nlr',(SELECT round(100*sum((paid_claims+0.85*os)*CASE WHEN td<=1 THEN 1 ELSE td::numeric/ed END)/NULLIF(sum(net_premium),0),1) FROM p25),'y2025_glr',(SELECT round(100*sum((paid_claims+0.85*os)*CASE WHEN td<=1 THEN 1 ELSE td::numeric/ed END)/NULLIF(sum(gross_premium),0),1) FROM p25),'y2024_nlrProjected',(SELECT round(100*sum(ann)/NULLIF(sum(net_premium),0),1) FROM p24)) snap`,

  census: `WITH params AS (SELECT CURRENT_DATE rd), ${NORM_CTE},
    mb AS (SELECT member_id, gender, dependency,
      CASE WHEN age_band IN ('Age 56-60','Age 61-65') THEN '56–65' WHEN age_band IN ('Age 66-70','Age 71-75','Over 75') OR age_band LIKE '%65+%' THEN '65+' ELSE replace(replace(age_band,'Age ',''),'-','–') END age,
      CASE WHEN nationality IN ('India','Pakistan','Sri Lanka','Nepal','Bangladesh','Afghanistan','Bhutan') THEN 'Indian subcontinent'
        WHEN nationality IN ('Egypt','Syria','Jordan','Lebanon','Palestine','Sudan','Morocco','United Arab Emirates','Iraq','Tunisia','Algeria','Yemen','Saudi Arabia','Bahrain','Oman','Kuwait','Libya','Somalia','Comoros','Qatar','Mauritania','Djibouti') THEN 'Arab countries'
        WHEN nationality IN ('Philippines','Iran','China','Turkey','Myanmar','Indonesia','Uzbekistan','Kazakhstan','Kyrgyzstan','Armenia','Azerbaijan','Turkmenistan','Tajikistan','Singapore','Taiwan','Vietnam','Hong Kong','South Korea','Japan','Malaysia','Thailand','Georgia') THEN 'Rest of Asia'
        WHEN nationality IN ('United Kingdom','Russia','France','Germany','Ireland','Ukraine','Italy','Romania','Portugal','Netherlands','Poland','Serbia','Greece','Spain','Belgium','Lithuania','Sweden','Denmark','Switzerland','Belarus','Austria','Bulgaria','Hungary','Bosnia-Herzegovina','Moldova','Slovakia','Latvia','Finland','Croatia','Norway','Estonia','Slovenia','Albania','Malta','Former Yugoslav Republic of Macedonia','Cyprus','Czech Republic','Montenegro') THEN 'Europe'
        ELSE 'Rest of the world' END natgrp,
      (member_id IN (SELECT member_id FROM claims WHERE policy_effective_month >= to_char((SELECT rd FROM params)-interval '12 months','YYYY-MM'))) active
      FROM (SELECT DISTINCT ON (member_id) member_id,gender,dependency,age_band,nationality FROM claims WHERE member_id IS NOT NULL ORDER BY member_id) d),
    ao(age,ord) AS (VALUES ('0–17',1),('18–25',2),('26–35',3),('36–45',4),('46–55',5),('56–65',6),('65+',7))
    SELECT json_build_object(
      'all',(SELECT json_build_object('total',count(*),
        'gender',(SELECT json_agg(json_build_object('label',gender,'value',v) ORDER BY v DESC) FROM (SELECT gender,count(*) v FROM mb WHERE gender IS NOT NULL GROUP BY 1) a),
        'relation',(SELECT json_agg(json_build_object('label',dependency,'value',v) ORDER BY v DESC) FROM (SELECT dependency,count(*) v FROM mb WHERE dependency IS NOT NULL GROUP BY 1) a),
        'age',(SELECT json_agg(json_build_object('label',age,'value',v) ORDER BY ord) FROM (SELECT mb.age,count(*) v,ao.ord FROM mb JOIN ao ON mb.age=ao.age GROUP BY 1,3) a),
        'nat',(SELECT json_agg(json_build_object('label',natgrp,'value',v) ORDER BY v DESC) FROM (SELECT natgrp,count(*) v FROM mb GROUP BY 1) a)) FROM mb),
      'activeClaimants',(SELECT json_build_object('total',count(*),
        'gender',(SELECT json_agg(json_build_object('label',gender,'value',v) ORDER BY v DESC) FROM (SELECT gender,count(*) v FROM mb WHERE active AND gender IS NOT NULL GROUP BY 1) a),
        'relation',(SELECT json_agg(json_build_object('label',dependency,'value',v) ORDER BY v DESC) FROM (SELECT dependency,count(*) v FROM mb WHERE active AND dependency IS NOT NULL GROUP BY 1) a),
        'age',(SELECT json_agg(json_build_object('label',age,'value',v) ORDER BY ord) FROM (SELECT mb.age,count(*) v,ao.ord FROM mb JOIN ao ON mb.age=ao.age WHERE mb.active GROUP BY 1,3) a),
        'nat',(SELECT json_agg(json_build_object('label',natgrp,'value',v) ORDER BY v DESC) FROM (SELECT natgrp,count(*) v FROM mb WHERE active GROUP BY 1) a)) FROM mb WHERE active),
      'activeInForceLives',(SELECT round(sum(lives)) FROM tn,params WHERE expiry_date >= rd)
    ) snap`,

  claims: `WITH params AS (SELECT 1), ${NORM_CTE},
    fc(raw,label) AS (VALUES ('Out-Patient','Out-patient'),('In-Patient','In-patient'),('Maternity','Maternity'),('Dental','Dental'),('Optical','Optical'),('Psychiatry','Psychiatry'),('Alternative Treatment','Alternative'),('Wellness','Wellness'),('Assistance','Assistance'))
    SELECT json_build_object(
      'episodes',(SELECT count(DISTINCT visit_episode) FROM claims),
      'fobByNetwork',(SELECT json_agg(json_build_array(net,fob,aed)) FROM (SELECT cl.net,COALESCE(fc.label,cl.benefit_fob) fob,round(sum(payer_share)) aed FROM cl LEFT JOIN fc ON cl.benefit_fob=fc.raw WHERE cl.net IS NOT NULL GROUP BY 1,2 HAVING round(sum(payer_share))>0 ORDER BY cl.net,aed DESC) f),
      'relationByNetwork',(SELECT json_agg(json_build_array(net,rel,aed)) FROM (SELECT net,dependency rel,round(sum(payer_share)) aed FROM cl WHERE net IS NOT NULL GROUP BY 1,2 HAVING round(sum(payer_share))>0 ORDER BY net,aed DESC) r),
      'providersByNetwork',(SELECT json_agg(json_build_array(net,pg,aed,episodes)) FROM (SELECT cl.net,cl.pg,round(sum(payer_share)) aed,count(DISTINCT visit_episode) episodes FROM cl JOIN (SELECT pg FROM cl WHERE pg IS NOT NULL GROUP BY pg ORDER BY sum(payer_share) DESC LIMIT 10) top ON cl.pg=top.pg WHERE cl.net IS NOT NULL GROUP BY 1,2 HAVING round(sum(payer_share))>0 ORDER BY cl.pg,aed DESC) p)
    ) snap`,
};

async function fromDb(url) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const out = {};
  for (const [k, sql] of Object.entries(Q)) {
    process.stderr.write(`  · running ${k}…\n`);
    const r = await client.query(sql);
    out[k] = r.rows[0].snap;
  }
  await client.end();
  // shape into the snapshot the generator expects
  return {
    totals: out.core.totals,
    y2024: { ...out.core.y2024, nlrProjected: out.projection.y2024_nlrProjected },
    y2025: { ...out.core.y2025, nlrProjected: out.projection.y2025_nlr, glrProjected: out.projection.y2025_glr },
    cohorts: out.core.cohorts,
    monthly: out.core.monthly,
    q1Trend: out.core.q1Trend,
    censusAll: out.census.all,
    censusActiveClaimants: out.census.activeClaimants,
    activeInForceLives: out.census.activeInForceLives,
    claims: out.claims,
  };
}

// ---- derive + format ----
const sum = (a) => a.reduce((s, x) => s + x, 0);
const pct1 = (v, t) => Math.round((1000 * v) / t) / 10;

// scale a [{label,value}] distribution to `target`, preserving proportions,
// fixing rounding drift on the largest bucket so the parts sum exactly.
function scaleDist(rows, base, target) {
  const scaled = rows.map((r) => ({ label: r.label, value: Math.round((r.value * target) / base) }));
  const drift = target - sum(scaled.map((r) => r.value));
  if (drift !== 0) {
    const i = scaled.reduce((mi, r, idx, arr) => (r.value > arr[mi].value ? idx : mi), 0);
    scaled[i].value += drift;
  }
  return scaled.map((r) => ({ ...r, pct: pct1(r.value, target) }));
}
const withPct = (rows, total) => rows.map((r) => ({ label: r.label, value: r.value, pct: pct1(r.value, total) }));

function build(s) {
  const renewalGp = Math.round(sum(s.monthly.renewal2025) * 10) / 10;
  const newGp = Math.round(sum(s.monthly.new2025) * 10) / 10;
  const census = {
    all: {
      total: s.censusAll.total,
      gender: withPct(s.censusAll.gender, s.censusAll.total),
      relation: withPct(s.censusAll.relation, s.censusAll.total),
      age: withPct(s.censusAll.age, s.censusAll.total),
      nat: withPct(s.censusAll.nat, s.censusAll.total),
    },
    active: {
      total: s.activeInForceLives,
      claimantBase: s.censusActiveClaimants.total,
      gender: scaleDist(s.censusActiveClaimants.gender, s.censusActiveClaimants.total, s.activeInForceLives),
      relation: scaleDist(s.censusActiveClaimants.relation, s.censusActiveClaimants.total, s.activeInForceLives),
      age: scaleDist(s.censusActiveClaimants.age, s.censusActiveClaimants.total, s.activeInForceLives),
      nat: scaleDist(s.censusActiveClaimants.nat, s.censusActiveClaimants.total, s.activeInForceLives),
    },
  };
  return {
    totals: s.totals,
    y2024: { gp: s.y2024.gp, lives: s.y2024.lives, groups: s.y2024.groups, avgPremium: s.y2024.avgPremium, nlrProjected: s.y2024.nlrProjected },
    y2025: {
      gp: s.y2025.gp, np: s.y2025.np, lives: s.y2025.lives, groups: s.y2025.groups, avgPremium: s.y2025.avgPremium,
      takeRate: s.y2025.takeRate, nlrProjected: s.y2025.nlrProjected, glrProjected: s.y2025.glrProjected,
      renewalGp, newGp,
      gpGrowthPct: Math.round((s.y2025.gp / s.y2024.gp - 1) * 100),
      livesGrowthPct: Math.round((s.y2025.lives / s.y2024.lives - 1) * 100),
      avgPremiumGrowthPct: Math.round((s.y2025.avgPremium / s.y2024.avgPremium - 1) * 100),
    },
    cohorts: s.cohorts,
    monthlyGp2024: s.monthly.gp2024,
    monthlyGp2025Renewal: s.monthly.renewal2025,
    monthlyGp2025New: s.monthly.new2025,
    q1Trend: s.q1Trend,
    census,
    claims: s.claims,
  };
}

function emit(gen) {
  const j = (v) => JSON.stringify(v);
  return `// AUTO-GENERATED by scripts/refresh/generate.mjs — DO NOT EDIT BY HAND.
// Re-run the generator after a TRR / claims refresh. Editorial content and
// narrative live in data/portfolio.ts and are never touched by the generator.
/* eslint-disable */

export type LV = { label: string; value: number; pct: number };

export const GEN = {
  totals: ${j(gen.totals)},
  y2024: ${j(gen.y2024)},
  y2025: ${j(gen.y2025)},
  cohorts: ${j(gen.cohorts)},
  monthlyGp2024: ${j(gen.monthlyGp2024)},
  monthlyGp2025Renewal: ${j(gen.monthlyGp2025Renewal)},
  monthlyGp2025New: ${j(gen.monthlyGp2025New)},
  q1Trend: ${j(gen.q1Trend)} as { label: string; gp: number }[],
  census: ${j(gen.census)},
  claims: {
    episodes: ${gen.claims.episodes},
    fobByNetwork: ${j(gen.claims.fobByNetwork)} as [string, string, number][],
    relationByNetwork: ${j(gen.claims.relationByNetwork)} as [string, string, number][],
    providersByNetwork: ${j(gen.claims.providersByNetwork)} as [string, string, number, number][],
  },
};
`;
}

async function main() {
  const useSnap = process.argv.includes("--from-snapshot") || !process.env.SUPABASE_DB_URL;
  let snapshot;
  if (useSnap) {
    const p = resolve(__dirname, "snapshot.json");
    process.stderr.write(`Reading snapshot ${p}\n`);
    snapshot = JSON.parse(readFileSync(p, "utf8"));
  } else {
    process.stderr.write("Querying Supabase…\n");
    snapshot = await fromDb(process.env.SUPABASE_DB_URL);
  }
  const gen = build(snapshot);
  writeFileSync(OUT, emit(gen));
  process.stderr.write(`Wrote ${OUT}\n`);
  process.stderr.write(`  GWP ${gen.totals.grossPremiumM}M · UY25 NLR ${gen.y2025.nlrProjected}% · active ${gen.census.active.total} lives\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
