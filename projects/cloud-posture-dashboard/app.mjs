import {findings, controls, environments, domains, severityOrder, snapshotDate, statusNames} from './data.mjs';
import {filteredFindings,filteredControls,summarizeFindings,controlCoverage,riskByDomain,weeklyTrend,
  actionQueue,riskScore,overdue,isOpenAt,exportFindingsCsv,dateLabel,statusLabel} from './logic.mjs';

const $ = sel => document.querySelector(sel);
const escapeHTML = text => String(text ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const envName = id => environments.find(x=>x.id===id)?.label ?? id;
const domainName = id => domains.find(x=>x.id===id)?.label ?? id;
const sevColors = {critical:'#fb7776',high:'#f7bf65',medium:'#7098f6',low:'#60dbc2'};
const controlNames = {pass:'Pass',partial:'Partial',fail:'Fail',not_assessed:'Not assessed'};
const headings = {
  overview:['OVERVIEW','Cloud security posture','A decision-ready view of cloud exposure, security controls, and remediation priorities.'],
  findings:['FINDINGS EXPLORER','Findings explorer','Investigate the complete simulated findings register and export the filtered inventory.'],
  controls:['CONTROL COVERAGE','Security controls','Examine a synthetic assessment catalog by environment, domain, and control outcome.'],
};
let filters = {environment:'all',domain:'all',severity:'all',query:''};
let activeView = 'overview';
let previousFocus = null;

function label(text){return escapeHTML(text);}
function num(v){return Number(v).toLocaleString('en-US');}
function safeBadge(value,text=value){return `<span class="badge ${escapeHTML(value)}">${escapeHTML(text)}</span>`;}

function renderKPIs(rows,controlRows){
  const s=summarizeFindings(rows), c=controlCoverage(controlRows);
  const cards=[
    {label:'Open findings',value:num(s.active),detail:`${num(s.resolved)} resolved in filtered inventory`,color:'#68e5d2'},
    {label:'Critical exposure',value:num(s.critical),detail:'Open critical-severity findings',color:'#fb7776'},
    {label:'Overdue actions',value:num(s.overdue),detail:'Accepted risk excluded from overdue',color:'#f7bf65'},
    {label:'Exposed assets',value:num(s.exposedAssets),detail:'Distinct internet-exposed assets',color:'#5f8bf9'},
    {label:'Control pass rate',value:c.percentage===null?'—':c.percentage+'%',detail:`${c.passed} / ${c.assessed} assessed controls · severity ignored`,color:'#ae91f0'},
  ];
  $('#kpi-grid').innerHTML=cards.map(x=>`<article class="kpi" style="--kpi-accent:${x.color}"><div class="kpi-label">${label(x.label)}</div><div class="kpi-value">${label(x.value)}</div><div class="kpi-footer">${label(x.detail)}</div></article>`).join('');
  $('#summary-scope').textContent=filters.environment==='all'?'All environments':envName(filters.environment);
}
function renderDonut(rows){
  const stats=summarizeFindings(rows), total=stats.active;
  const legend=severityOrder.map(s=>({id:s,n:stats.bySeverity[s],color:sevColors[s]}));
  let running=0;
  const stops=legend.map(x=>{
    const from=running;running+=total?x.n/total*100:0;
    return `${x.color} ${from.toFixed(2)}% ${running.toFixed(2)}%`;
  });
  const d=$('#severity-donut');
  d.style.setProperty('--segments',total?stops.join(', '):'#223243 0% 100%');
  d.setAttribute('aria-label',`Open findings: ${legend.map(x=>`${x.id} ${x.n}`).join(', ')}`);
  $('#donut-total').textContent=total;
  $('#severity-legend').innerHTML=legend.map(x=>`<div class="legend-row"><i class="legend-dot" style="background:${x.color}"></i><span>${label(x.id[0].toUpperCase()+x.id.slice(1))}</span><strong>${x.n}</strong></div>`).join('');
}
function renderDomains(rows){
  const scores=riskByDomain(rows).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
  const max=Math.max(1,...scores.map(x=>x.score));
  $('#domain-bars').innerHTML=scores.map(x=>`<div class="bar-item"><div class="bar-header"><strong>${label(x.label)}</strong><span>${num(x.score)} pts · ${x.open} open</span></div><div class="bar-track"><div class="bar-fill" style="width:${(x.score/max*100).toFixed(1)}%"></div></div></div>`).join('');
}
function renderTrend(rows){
  const trend=weeklyTrend(rows);const width=650,height=222,left=28,right=21,top=20,bottom=28;
  const plotWidth=width-left-right,plotHeight=height-top-bottom;
  const max=Math.max(4,...trend.map(d=>d.count));
  const ceil=Math.max(4,Math.ceil(max/4)*4);
  const pts=trend.map((t,i)=>({x:left+plotWidth*i/(trend.length-1),y:top+plotHeight*(1-t.count/ceil),...t}));
  const path=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const bottomY=height-bottom;
  const area=`${path} L${pts[pts.length-1].x} ${bottomY} L${pts[0].x} ${bottomY} Z`;
  const grids=[0,.25,.5,.75,1].map(t=>{const y=top+(1-t)*plotHeight;return `<line x1="${left}" y1="${y}" x2="${width-right}" y2="${y}" stroke="#263849" stroke-width="1" stroke-dasharray="4 7"/><text x="1" y="${y+4}" fill="#758c9e" font-size="11">${Math.round(t*ceil)}</text>`}).join('');
  $('#trend-chart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Weekly synthetic open finding counts: ${trend.map(x=>x.count).join(', ')}"><defs><linearGradient id="trend-area" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#53dfc8" stop-opacity=".24"/><stop offset="1" stop-color="#53dfc8" stop-opacity="0"/></linearGradient></defs>${grids}<path d="${area}" fill="url(#trend-area)"/><path d="${path}" fill="none" stroke="#6fe8d3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#0e1824" stroke="#79f7dc" stroke-width="2"><title>${p.date}: ${p.count} open findings</title></circle>`).join('')}${pts.map(p=>`<text x="${p.x}" y="${height-6}" text-anchor="middle" fill="#738a9c" font-size="10">${dateLabel(p.date)}</text>`).join('')}</svg>`;
}
function renderCoverage(rows){
  const c=controlCoverage(rows),n=rows.length;
  $('#coverage-number').textContent=c.percentage===null?'—':`${c.percentage}%`;
  $('#coverage-progress').style.width=(c.percentage??0)+'%';
  const counts=Object.fromEntries(['pass','partial','fail','not_assessed'].map(s=>[s,rows.filter(r=>r.status===s).length]));
  const parts=[['Pass',counts.pass],['Partial',counts.partial],['Fail',counts.fail],['Not assessed',counts.not_assessed]];
  $('#coverage-breakdown').innerHTML=parts.map(([l,v])=>`<div class="coverage-cell"><span>${label(l)}</span><strong>${v}</strong></div>`).join('');
  $('#controls-scope').textContent=filters.environment==='all'?'All environments':envName(filters.environment);
  $('#control-summary').innerHTML=[{label:'Assessed controls',value:c.assessed},{label:'Passing',value:c.passed},{label:'Open gaps',value:counts.fail+counts.partial},{label:'Not assessed',value:c.unassessed}].map(x=>`<div class="control-stat"><strong>${x.value}</strong><span>${label(x.label)}</span></div>`).join('');
}
function findingRow(f,compact=false){
  const score=riskScore(f);const dueTag=overdue(f)?`<span class="overdue">OVERDUE</span>`:'';
  return `<tr><td><span class="finding-title" title="${label(f.title)}">${label(f.title)}</span><span class="finding-meta">${label(f.id)} · ${label(f.asset)}</span></td><td>${safeBadge(f.severity,f.severity.toUpperCase())}</td><td>${label(envName(f.environment))}</td>${compact?'':`<td>${safeBadge(f.status,statusLabel(f.status))}</td>`}<td><div class="priority-cell"><span class="priority-track"><b style="width:${score}%"></b></span><strong>${score}</strong></div></td><td>${label(f.owner)}</td><td>${label(dateLabel(f.due))}${dueTag}</td><td><button type="button" class="row-button" data-finding-id="${label(f.id)}" aria-label="View details for ${label(f.id)}">Details ↗</button></td></tr>`;
}
function renderTables(rows){
  const queue=actionQueue([...rows]);
  $('#overview-table-count').textContent=`Top ${Math.min(5,queue.length)} of ${queue.length} active`;
  $('#overview-table').innerHTML=queue.length?queue.slice(0,5).map(f=>findingRow(f,true)).join(''):`<tr><td colspan="7"><div class="empty-state">No active findings match your filters.</div></td></tr>`;
  const all=[...rows].sort((a,b)=>riskScore(b)-riskScore(a)||a.id.localeCompare(b.id));
  $('#findings-total').textContent=`${all.length} records · ${queue.length} active`;
  $('#findings-table-count').textContent=`${all.length} records`;
  $('#findings-table').innerHTML=all.length?all.map(f=>findingRow(f,false)).join(''):`<tr><td colspan="8"><div class="empty-state">No findings match these filters. Try Reset filters.</div></td></tr>`;
}
function renderControlTable(rows){
  $('#controls-table-count').textContent=`${rows.length} controls`;
  $('#controls-table').innerHTML=rows.length?rows.map(c=>`<tr><td><span class="finding-title">${label(c.title)}</span><span class="finding-meta">${label(c.id)}</span></td><td>${label(domainName(c.domain))}</td><td>${label(envName(c.environment))}</td><td>${safeBadge(c.status,controlNames[c.status])}</td><td>${label(c.owner)}</td><td class="observation">${label(c.observation)}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty-state">No controls in this environment / domain selection.</div></td></tr>`;
}
function render(){
  const rows=filteredFindings(findings,filters);const controlRows=filteredControls(controls,filters);
  renderKPIs(rows,controlRows);renderDonut(rows);renderDomains(rows);renderTrend(rows);renderCoverage(controlRows);renderTables(rows);renderControlTable(controlRows);
}
function setView(view,updateHash=true){
  if(!headings[view])view='overview';activeView=view;
  for(const tab of document.querySelectorAll('[data-view]')){
    if(!tab.classList.contains('nav-item'))continue;
    tab.classList.toggle('active',tab.dataset.view===view);
    if(tab.dataset.view===view)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
  }
  for(const section of document.querySelectorAll('.view'))section.classList.toggle('hidden',section.id!==`view-${view}`);
  const [crumb,title,description]=headings[view];
  $('#view-crumb').textContent=crumb;$('#page-title').innerHTML=label(title)+'<span class="period">.</span>';
  $('#page-description').textContent=description;
  if(updateHash&&location.hash.slice(1)!==view)history.replaceState(null,'',`#${view}`);
  window.scrollTo({top:0,behavior:'instant'});
}
function syncFilters(){
  filters={environment:$('#environment-filter').value,domain:$('#domain-filter').value,
    severity:$('#severity-filter').value,query:$('#search-filter').value};
  render();
}
function openDetails(id){
  const f=findings.find(x=>x.id===id);if(!f)return;
  previousFocus=document.activeElement;
  $('#drawer-title').textContent=f.title;
  const score=riskScore(f);
  const fields=[['Finding ID',f.id],['Asset (fictional)',f.asset],['Environment',envName(f.environment)],
    ['Control domain',domainName(f.domain)],['Severity',f.severity.toUpperCase()],['Status',statusLabel(f.status)],
    ['Owner (fictional)',f.owner],['Discovered',f.discovered],['Internal due date',f.due],
    ['Internet exposed',f.internetExposed?'Yes':'No'],['Payment-critical flag',f.paymentCritical?'Yes':'No'],
    ['Known exploitation flag',f.knownExploited?'Yes (synthetic)':'No'],['Overdue',overdue(f)?'Yes':'No'],
    ['Resolved',f.resolved||'Not resolved']];
  $('#drawer-content').innerHTML=`<div class="drawer-score"><div><strong>${score}</strong><small>ILLUSTRATIVE PRIORITY SCORE / 100</small></div>${safeBadge(f.severity,f.severity.toUpperCase())}</div>
    <section class="drawer-section"><h3>CONTEXT</h3><dl class="drawer-list">${fields.map(([k,v])=>`<div><dt>${label(k)}</dt><dd>${label(v)}</dd></div>`).join('')}</dl></section>
    <section class="drawer-section"><h3>REVIEW GUIDANCE</h3><p class="drawer-note">Validate the evidence and business impact before assigning a remediation deadline. The flags, asset and score in this example are entirely fictional. Risk scoring is not CVSS or an official compliance method.</p></section>`;
  $('#drawer-backdrop').classList.remove('hidden');$('#detail-drawer').classList.remove('hidden');
  document.body.style.overflow='hidden';$('#close-drawer').focus();
}
function closeDrawer(){
  $('#drawer-backdrop').classList.add('hidden');$('#detail-drawer').classList.add('hidden');
  document.body.style.overflow='';
  if(previousFocus?.isConnected)previousFocus.focus();
}
function downloadCsv(){
  const rows=filteredFindings(findings,filters);
  const csv=exportFindingsCsv(rows);const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='cloudguard-synthetic-findings-2026-11-08.csv';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function init(){
  for(const id of ['environment','domain','severity'])$(`#${id}-filter`).addEventListener('change',syncFilters);
  $('#search-filter').addEventListener('input',syncFilters);
  $('#reset-filters').addEventListener('click',()=>{
    for(const id of ['environment','domain','severity'])$(`#${id}-filter`).value='all';
    $('#search-filter').value='';syncFilters();
  });
  $('#download-csv').addEventListener('click',downloadCsv);
  document.addEventListener('click',evt=>{
    const nav=evt.target.closest('[data-view]');if(nav){setView(nav.dataset.view);return;}
    const detail=evt.target.closest('[data-finding-id]');if(detail)openDetails(detail.dataset.findingId);
  });
  $('#close-drawer').addEventListener('click',closeDrawer);
  $('#drawer-backdrop').addEventListener('click',closeDrawer);
  document.addEventListener('keydown',evt=>{
    if(evt.key==='Escape'&&!$('#detail-drawer').classList.contains('hidden'))closeDrawer();
    if(evt.key==='Tab'&&!$('#detail-drawer').classList.contains('hidden')){
      // Single focusable control in drawer: keep keyboard focus inside the dialog.
      evt.preventDefault();$('#close-drawer').focus();
    }
  });
  window.addEventListener('hashchange',()=>setView(location.hash.slice(1),false));
  render();setView(location.hash.slice(1)||'overview',false);
}
init();
