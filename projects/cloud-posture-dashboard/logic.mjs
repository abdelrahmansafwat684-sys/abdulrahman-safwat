import {snapshotDate, domains, severityOrder} from './data.mjs';
export const AS_OF = snapshotDate;
const baseRisk = { critical:70, high:50, medium:30, low:12 };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function dayDifference(a,b) {
  if(!ISO_DATE.test(a)||!ISO_DATE.test(b)||Number.isNaN(Date.parse(a))||Number.isNaN(Date.parse(b)))throw new Error('Invalid ISO dates');
  return Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000);
}
export function isOpenAt(f, at=AS_OF) { return f.discovered <= at && (!f.resolved || f.resolved > at); }
export function riskScore(f, at=AS_OF) {
  if(!isOpenAt(f,at))return 0;
  return Math.min(100, baseRisk[f.severity] + (f.internetExposed?12:0)+(f.paymentCritical?8:0)+
      (f.knownExploited?10:0)+(f.due<at?8:0));
}
export function overdue(f,at=AS_OF) { return isOpenAt(f,at) && f.status !== 'accepted_risk' && f.due<at; }
export function filteredFindings(all, filters={}) {
  const q=(filters.query||'').trim().toLocaleLowerCase();
  return all.filter(f => (filters.environment==='all'||!filters.environment||f.environment===filters.environment)
    && (filters.domain==='all'||!filters.domain||f.domain===filters.domain)
    && (filters.severity==='all'||!filters.severity||f.severity===filters.severity)
    && (!q||[f.id,f.title,f.asset,f.owner].some(v=>v.toLocaleLowerCase().includes(q))));
}
export function filteredControls(all, filters={}){
  return all.filter(c=>(filters.environment==='all'||!filters.environment||c.environment===filters.environment)
    && (filters.domain==='all'||!filters.domain||c.domain===filters.domain));
}
export function summarizeFindings(rows,at=AS_OF){
  const active=rows.filter(f=>isOpenAt(f,at));
  const bySeverity=Object.fromEntries(severityOrder.map(s=>[s,active.filter(f=>f.severity===s).length]));
  return {total:rows.length,active:active.length,critical:bySeverity.critical,
    overdue:active.filter(f=>overdue(f,at)).length,
    exposedAssets:new Set(active.filter(f=>f.internetExposed).map(f=>f.asset)).size,
    resolved:rows.filter(f=>f.resolved && f.resolved<=at).length, bySeverity};
}
export function controlCoverage(rows){
  const assessed=rows.filter(c=>c.status!=='not_assessed');
  const passed=assessed.filter(c=>c.status==='pass').length;
  return {assessed:assessed.length,passed,unassessed:rows.length-assessed.length,
    percentage:assessed.length?Math.round(passed/assessed.length*100):null};
}
export function riskByDomain(rows,at=AS_OF){
  return domains.map(d=>({...d,score:rows.filter(f=>f.domain===d.id).reduce((sum,f)=>sum+riskScore(f,at),0),
    open:rows.filter(f=>f.domain===d.id&&isOpenAt(f,at)).length}));
}
export function weeklyTrend(rows){
  const dates=['2026-09-27','2026-10-04','2026-10-11','2026-10-18','2026-10-25','2026-11-01',AS_OF];
  return dates.map(date=>({date,count:rows.filter(f=>isOpenAt(f,date)).length}));
}
export function actionQueue(rows,at=AS_OF){
  return rows.filter(f=>isOpenAt(f,at)).sort((a,b)=>riskScore(b,at)-riskScore(a,at)
    || (overdue(b,at)?1:0)-(overdue(a,at)?1:0) || a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
}
export function csvEscape(value){
  let text=String(value ?? '');
  if(/^[\s]*[=+@-]/.test(text)) text="'"+text;
  return /[",\r\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}
export function exportFindingsCsv(rows){
  const fields=['id','title','asset','environment','domain','severity','status','owner','discovered','due','priority','overdue'];
  return [fields.join(','),...rows.map(f=>fields.map(k=>csvEscape(k==='priority'?riskScore(f):k==='overdue'?(overdue(f)?'Yes':'No'):f[k])).join(','))].join('\r\n')+'\r\n';
}
export function statusLabel(status){return {open:'Open',in_progress:'In progress',mitigated:'Mitigated',accepted_risk:'Accepted risk',resolved:'Resolved'}[status]||status;}
export function dateLabel(iso){return new Date(iso+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});}
