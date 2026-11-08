// Entirely fictional sample data. No production data, credentials or real targets.
export const snapshotDate = '2026-11-08';
export const environments = [
  { id: 'production', label: 'Production', short: 'PRD' },
  { id: 'staging', label: 'Staging', short: 'STG' },
  { id: 'shared', label: 'Shared services', short: 'SHR' },
];
export const domains = [
  { id: 'identity', label: 'Identity & access', short: 'IAM' },
  { id: 'network', label: 'Network exposure', short: 'NET' },
  { id: 'data', label: 'Data protection', short: 'DATA' },
  { id: 'workload', label: 'Workload security', short: 'VM' },
  { id: 'monitoring', label: 'Monitoring', short: 'LOG' },
  { id: 'application', label: 'Application security', short: 'APP' },
];
const F = (id, title, asset, environment, domain, severity, status, discovered, due, owner, extras={}) => ({
  id, title, asset, environment, domain, severity, status, discovered, due, owner, internetExposed:false,
  paymentCritical:false, knownExploited:false, resolved:null, ...extras,
});
export const findings = [
  F('SIM-101','Broad service account privileges','batch-worker.demo.invalid','production','identity','critical','open','2026-09-12','2026-09-30','Platform',{paymentCritical:true}),
  F('SIM-102','Public administrative service route','admin-gw.demo.invalid','production','network','critical','in_progress','2026-10-01','2026-10-11','Platform',{internetExposed:true,paymentCritical:true}),
  F('SIM-103','Unrestricted sample database ingress','db-edge.demo.invalid','production','data','critical','open','2026-10-08','2026-10-20','Database',{internetExposed:true}),
  F('SIM-104','Legacy TLS setting on sample gateway','gateway.demo.invalid','production','network','high','in_progress','2026-09-20','2026-10-17','Platform',{internetExposed:true,paymentCritical:true}),
  F('SIM-105','Patch age exceeds internal target','worker-02.demo.invalid','production','workload','high','open','2026-09-25','2026-10-25','Platform'),
  F('SIM-106','Audit-log coverage gap','events.demo.invalid','production','monitoring','high','open','2026-10-03','2026-11-02','Security',{paymentCritical:true}),
  F('SIM-107','Excessive API rate limit','api.demo.invalid','production','application','high','mitigated','2026-10-10','2026-11-10','App Eng',{internetExposed:true}),
  F('SIM-108','Unreviewed key rotation window','vault.demo.invalid','production','data','medium','accepted_risk','2026-09-22','2026-11-18','Security'),
  F('SIM-109','Security header policy review','web.demo.invalid','production','application','medium','open','2026-10-25','2026-11-22','App Eng',{internetExposed:true}),
  F('SIM-110','Overly broad view-only access','reporter.demo.invalid','production','identity','low','open','2026-11-01','2026-12-01','Security'),
  F('SIM-111','Previously observed egress exception','processor.demo.invalid','production','network','medium','resolved','2026-09-15','2026-10-15','Platform',{resolved:'2026-10-07'}),
  F('SIM-112','Previously observed token lifecycle gap','auth.demo.invalid','production','application','high','resolved','2026-09-28','2026-10-20','App Eng',{resolved:'2026-10-18'}),
  F('SIM-113','Overpermissive staging developer role','dev-vm.demo.invalid','staging','identity','high','open','2026-09-19','2026-10-19','Platform'),
  F('SIM-114','Test dashboard exposed to internet','preview.demo.invalid','staging','network','high','in_progress','2026-10-11','2026-10-29','Platform',{internetExposed:true}),
  F('SIM-115','Legacy workload image','runner.demo.invalid','staging','workload','medium','open','2026-10-03','2026-11-02','Platform'),
  F('SIM-116','Synthetic secret in test configuration','sandbox.demo.invalid','staging','data','medium','mitigated','2026-10-09','2026-11-09','App Eng'),
  F('SIM-117','Staging log alert missing','logs-st.demo.invalid','staging','monitoring','low','open','2026-10-26','2026-11-24','Security'),
  F('SIM-118','Historical staging network exception','old-st.demo.invalid','staging','network','high','resolved','2026-09-10','2026-10-01','Platform',{resolved:'2026-09-28'}),
  F('SIM-119','Shared service role review pending','cicd.demo.invalid','shared','identity','high','open','2026-09-24','2026-10-31','Platform'),
  F('SIM-120','Centralized logging retention gap','audit.demo.invalid','shared','monitoring','medium','open','2026-10-05','2026-11-07','Security'),
  F('SIM-121','Shared artifact policy requires review','artifact.demo.invalid','shared','workload','medium','accepted_risk','2026-10-10','2026-11-12','Platform'),
  F('SIM-122','Shared build token scope too broad','build.demo.invalid','shared','identity','critical','in_progress','2026-10-14','2026-10-25','Platform',{paymentCritical:true}),
  F('SIM-123','Unrestricted sample service binding','relay.demo.invalid','shared','network','low','open','2026-11-01','2026-12-02','Platform'),
  F('SIM-124','Previously observed shared alert defect','notify.demo.invalid','shared','monitoring','low','resolved','2026-09-18','2026-10-10','Security',{resolved:'2026-10-05'}),
];
const C = (id, title, environment, domain, status, owner, observation) => ({id,title,environment,domain,status,owner,observation});
export const controls = [
  C('CTRL-01','Least-privilege review cadence','production','identity','fail','Security','Periodic service-account reviews need remediation.'),
  C('CTRL-02','Privileged access MFA','production','identity','pass','Security','Simulated MFA control verified in demonstration.'),
  C('CTRL-03','Public ingress restrictions','production','network','fail','Platform','Review unexpected external entry points.'),
  C('CTRL-04','Approved load balancer routing','production','network','partial','Platform','One exception still requires follow-up.'),
  C('CTRL-05','Database encryption in transit','production','data','pass','Database','Demo transport policy passes sample checks.'),
  C('CTRL-06','Backup recovery exercise','production','data','partial','Database','Restore documentation requires review.'),
  C('CTRL-07','Workload patch management','production','workload','partial','Platform','Patch backlog present in synthetic snapshot.'),
  C('CTRL-08','Central audit logging','production','monitoring','fail','Security','One illustrative collection gap.'),
  C('CTRL-09','API authentication review','production','application','pass','App Eng','Sample authentication checks have passed.'),
  C('CTRL-10','Secure response headers','production','application','partial','App Eng','Browser policy needs manual review.'),
  C('CTRL-11','Developer role boundaries','staging','identity','fail','Platform','Overprivileged sample role.'),
  C('CTRL-12','Preview service access controls','staging','network','fail','Platform','Test service exposure needs resolution.'),
  C('CTRL-13','Encryption for test secrets','staging','data','partial','App Eng','Configuration cleanup underway.'),
  C('CTRL-14','Staging workload updates','staging','workload','partial','Platform','Some synthetic images are old.'),
  C('CTRL-15','Staging alerting','staging','monitoring','pass','Security','Sample alert routing passes.'),
  C('CTRL-16','API authentication in test','staging','application','pass','App Eng','Example checks pass.'),
  C('CTRL-17','Pipeline service identities','shared','identity','fail','Platform','Build-account scope is too broad.'),
  C('CTRL-18','Shared network segmentation','shared','network','pass','Platform','Demonstration boundaries pass.'),
  C('CTRL-19','Artifact integrity checks','shared','workload','not_assessed','Platform','Needs an assessment; exclude from pass-rate denominator.'),
  C('CTRL-20','Security event retention','shared','monitoring','partial','Security','Retention exception being addressed.'),
];
export const statusNames = {open:'Open',in_progress:'In progress',mitigated:'Mitigated',accepted_risk:'Accepted risk',resolved:'Resolved'};
export const severityOrder = ['critical','high','medium','low'];
