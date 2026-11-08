import test from 'node:test';
import assert from 'node:assert/strict';
import {findings,controls,domains,snapshotDate} from '../data.mjs';
import {dayDifference,isOpenAt,riskScore,overdue,filteredFindings,filteredControls,
    summarizeFindings,controlCoverage,riskByDomain,weeklyTrend,actionQueue,csvEscape,exportFindingsCsv} from '../logic.mjs';

test('synthetic dataset contains no production hostnames',()=>{
  assert.equal(findings.length,24);
  assert.equal(controls.length,20);
  assert.ok(findings.every(f=>f.asset.endsWith('.demo.invalid')));
});
test('dates are deterministic',()=>{
  assert.equal(snapshotDate,'2026-11-08');
  assert.equal(dayDifference('2026-11-08','2026-11-01'),7);
  assert.throws(()=>dayDifference('wrong','2026-11-01'));
});
test('active status accounts for resolution date',()=>{
  const resolved=findings.find(f=>f.id==='SIM-111');
  assert.equal(isOpenAt(resolved,'2026-09-27'),true);
  assert.equal(isOpenAt(resolved,'2026-10-11'),false);
  assert.equal(isOpenAt(resolved),false);
});
test('priority scoring is bounded and resolved rows score zero',()=>{
  const scores=findings.map(f=>riskScore(f));
  assert.ok(scores.every(x=>x>=0&&x<=100&&Number.isInteger(x)));
  assert.equal(riskScore(findings.find(f=>f.id==='SIM-111')),0);
});
test('overdue excludes accepted-risk and resolved findings',()=>{
  assert.equal(overdue(findings.find(f=>f.id==='SIM-101')),true);
  assert.equal(overdue(findings.find(f=>f.id==='SIM-108')),false);
  assert.equal(overdue(findings.find(f=>f.id==='SIM-111')),false);
});
test('environment filter only includes requested project',()=>{
  const f=filteredFindings(findings,{environment:'staging'});
  assert.ok(f.length>0&&f.every(x=>x.environment==='staging'));
});
test('domain filter is shared by findings and controls',()=>{
  const filters={environment:'production',domain:'network'};
  const f=filteredFindings(findings,filters);
  const c=filteredControls(controls,filters);
  assert.ok(f.length>0&&c.length>0);
  assert.ok([...f,...c].every(x=>x.environment==='production'&&x.domain==='network'));
});
test('search matches asset, title, id and owner',()=>{
  assert.deepEqual(filteredFindings(findings,{query:'SIM-101'}).map(x=>x.id),['SIM-101']);
  const matches=filteredFindings(findings,{query:'security'});
  assert.ok(matches.some(x=>x.owner==='Security'));
  assert.ok(matches.every(x=>[x.id,x.title,x.asset,x.owner].some(v=>v.toLowerCase().includes('security'))));
});
test('severity filter preserves only critical',()=>{
  const f=filteredFindings(findings,{severity:'critical'});
  assert.ok(f.every(x=>x.severity==='critical'));
});
test('summary reconciles total and active and resolved',()=>{
  const s=summarizeFindings(findings);
  assert.equal(s.total,s.active+s.resolved);
  assert.equal(s.active,Object.values(s.bySeverity).reduce((a,b)=>a+b,0));
});
test('exposure is counted by distinct asset',()=>{
  const dup={...findings.find(f=>f.id==='SIM-102'),id:'SIM-DUP'};
  const rows=[...findings,dup];
  assert.equal(summarizeFindings(rows).exposedAssets,summarizeFindings(findings).exposedAssets);
});
test('pass rate excludes unassessed controls',()=>{
  const c=controlCoverage(controls);
  assert.equal(c.assessed+c.unassessed,controls.length);
  assert.equal(c.percentage,Math.round(100*c.passed/c.assessed));
  assert.equal(controlCoverage([]).percentage,null);
});
test('domain weighted points reconcile to sum of all finding scores',()=>{
  const grouped=riskByDomain(findings);
  assert.equal(grouped.length,domains.length);
  assert.equal(grouped.reduce((s,d)=>s+d.score,0),findings.reduce((s,f)=>s+riskScore(f),0));
});
test('weekly trend includes final live snapshot derived from rows',()=>{
  const trend=weeklyTrend(findings);
  assert.equal(trend.length,7);
  assert.equal(trend.at(-1).count,summarizeFindings(findings).active);
});
test('action queue is descending by risk and only open',()=>{
  const q=actionQueue([...findings]);
  assert.ok(q.every(f=>isOpenAt(f)));
  for(let i=1;i<q.length;i++)assert.ok(riskScore(q[i-1])>=riskScore(q[i]));
});
test('CSV escaping prevents spreadsheet formula execution',()=>{
  assert.equal(csvEscape('=CMD(1)'),"'=CMD(1)");
  assert.equal(csvEscape('@cmd'),"'@cmd");
  assert.equal(csvEscape('hello, "user"'),'"hello, ""user"""');
});
test('exported CSV lines match filtered records',()=>{
  const f=filteredFindings(findings,{environment:'shared'});
  const csv=exportFindingsCsv(f);
  assert.equal(csv.trim().split('\r\n').length,f.length+1);
  assert.ok(csv.includes('id,title,asset'));
});
test('zero-result filter yields empty snapshot and zero totals',()=>{
  const f=filteredFindings(findings,{query:'no-such-record-xyz'});
  assert.equal(f.length,0);
  assert.equal(summarizeFindings(f).critical,0);
  assert.equal(weeklyTrend(f).at(-1).count,0);
});
