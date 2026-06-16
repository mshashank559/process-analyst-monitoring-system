require('dotenv').config();
const dns = require('dns');
// Force Google DNS — bypasses system resolver that blocks MongoDB SRV records
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Connect to MongoDB with retry ───────────────────────────────
let isMongoConnected = false;

function connectMongo(attempt = 1) {
  const MAX = 5;
  console.log(`🔄 MongoDB connection attempt ${attempt}/${MAX}...`);
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 30000,
    family: 4,        // Force IPv4 — fixes DNS SRV on many Windows setups
    tls: true,
    tlsAllowInvalidCertificates: false,
  })
  .then(() => {
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error(`❌ MongoDB attempt ${attempt} failed:`, err.message);
    if (attempt < MAX) {
      console.log(`⏳ Retrying in ${attempt * 3}s...`);
      setTimeout(() => connectMongo(attempt + 1), attempt * 3000);
    } else {
      console.log('⚠️  Running in OFFLINE mode — API will return mock data');
    }
  });
}

connectMongo();

// ─── Schemas ───────────────────────────────────────────────────────
const recruiterSchema = new mongoose.Schema({
  name: String,
  teamLead: String,
  candidate: String,
  target: Number,
  actual: Number,
  longApps: Number,
  shortApps: Number,
  status: { type: String, enum: ['achieved', 'below_target', 'missed'] },
  gchatConnected: { type: Boolean, default: false },
  gchatName: String,
  monthlyTarget: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const candidateSchema = new mongoose.Schema({
  name: String,
  recruiter: String,
  interviewCount: Number,
  feedbackStatus: String,
  warningStatus: Boolean,
  warningNote: String,
  linkedIn: String,
  // ─── New tracking fields ───────────────────────────────────
  gchatConnected: { type: Boolean, default: false },
  gchatName: String,                       // name as on GChat
  interviewRound: String,                  // e.g. "Round 1", "Round 2", "HR", "Final"
  monthlyTarget: { type: Number, default: 0 },   // profile monthly target
  monthlyApps: { type: Number, default: 0 },     // applications submitted this month
  mtTlVerified: { type: Boolean, default: false }, // MT/TL legitimacy verified
  mtTlVerifiedBy: String,                  // who verified
  mtTlVerifiedNote: String,                // verification note
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  priority: { type: String, enum: ['high', 'medium', 'low'] },
  status: { type: String, enum: ['pending', 'inprogress', 'completed', 'onhold'], default: 'pending' },
  dueDate: Date,
  createdBy: String,
  remarks: String,
}, { timestamps: true });

const issueSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, enum: ['open', 'under_review', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
  assignee: String,
  reporter: String,
  resolvedAt: Date,
}, { timestamps: true });

const reportSchema = new mongoose.Schema({
  title: String,
  type: String,
  recruiter: String,
  teamLead: String,
  status: { type: String, enum: ['pending', 'submitted', 'reviewed', 'approved'] },
  date: { type: Date, default: Date.now },
  notes: String,
}, { timestamps: true });

const auditSchema = new mongoose.Schema({
  action: String,
  user: String,
  target: String,
  details: String,
  ipAddress: String,
}, { timestamps: true });

const updateSchema = new mongoose.Schema({
  author: String,
  content: String,
  type: { type: String, enum: ['positive', 'warning', 'info'], default: 'info' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

// ─── Process Analyst Monitoring Schema ─────────────────────────────
const processMonitoringSchema = new mongoose.Schema({
  monitoringDate: { type: Date, default: Date.now },
  recruiterName:  String,
  teamLead:       String,
  candidateName:  String,
  candidateStatus:String,
  // Application tracking
  longApplications:  { type: Number, default: 0 },
  shortApplications: { type: Number, default: 0 },
  totalApplications: { type: Number, default: 0 },
  longTargetStatus:  { type: String, enum: ['achieved','missed'], default: 'missed' },
  shortTargetStatus: { type: String, enum: ['achieved','missed'], default: 'missed' },
  overallStatus:     { type: String, enum: ['achieved','below_target','missed'], default: 'missed' },
  // Feedback
  feedbackFormAvailable: { type: Boolean, default: true },
  // Follow-Up
  followUp1Done:             { type: Boolean, default: false },
  followUp2Done:             { type: Boolean, default: false },
  customerRelationCallDone:  { type: Boolean, default: false },
  comments: String,
  notes:    String,
  // Interview
  interviewScheduled:       { type: Boolean, default: false },
  interviewCompleted:       { type: Boolean, default: false },
  interviewFeedbackReceived:{ type: Boolean, default: false },
  interviewOutcome: String,
  interviewCount:   { type: Number, default: 0 },
  feedbackStatus:   { type: String, enum: ['Excellent','Good','Average','Poor','Pending',''], default: '' },
  warningStatus:    { type: String, enum: ['none','recommended','sent'], default: 'none' },
  // Targeted Profile
  isTargetedProfile: { type: Boolean, default: false },
  profileStatus:     { type: String, enum: ['Active','Hold','Interview Scheduled','Placed','Rejected',''], default: 'Active' },

  // --- NEW MODULE SCHEMAS AND EXTRA FIELDS ---
  seniorRecruiter:          String,
  statusComment:            String,
  connectedTwiceToday:      { type: String, enum: ['yes','no'], default: 'yes' },
  connectionReason:         String,
  call1Timestamp:           Date,
  call2Timestamp:           Date,
  communicationMode:        { type: String, default: 'Call' },
  communicatedInEnglish:    { type: String, enum: ['yes','no'], default: 'yes' },
  englishComplianceReason:  String,
  interviewStatus:          { type: String, enum: ['Scheduled','Completed','Rejected','Feedback Pending','Selected',''], default: '' },
  interviewLegitimacy:      { type: String, enum: ['Legit','Not Legit','Pending Verification'], default: 'Pending Verification' },
  legitimacyComment:        String,
  tlVerificationComment:    String,
  dailyObservation:         String,
  dailyChallenge:           String,
  processAnalystRemarks:    String,
  
  // Targeted Profile Extended
  targetedLongApps:         { type: Number, default: 0 },
  targetedShortApps:        { type: Number, default: 0 },
  targetedInterviewCount:   { type: Number, default: 0 },
  targetedConnectedTwice:   { type: String, enum: ['yes','no'], default: 'yes' },
  targetedConnectionReason: String,

  complianceScore:          { type: Number, default: 0 },
}, { timestamps: true });

// Weekly Snapshot Schema (Frozen report)
const weeklySnapshotSchema = new mongoose.Schema({
  frozenAt:     { type: Date, default: Date.now },
  startDate:    Date,
  endDate:      Date,
  generatedBy:  { type: String, default: 'Process Analyst' },
  summary:      [mongoose.Schema.Types.Mixed],
  totalEntries: Number,
}, { timestamps: true });

// Monthly Snapshot Schema (Frozen report)
const monthlySnapshotSchema = new mongoose.Schema({
  frozenAt:     { type: Date, default: Date.now },
  startDate:    Date,
  endDate:      Date,
  generatedBy:  { type: String, default: 'Process Analyst' },
  summary:      [mongoose.Schema.Types.Mixed],
  totalEntries: Number,
}, { timestamps: true });

// Status Audit Trail Schema
const statusAuditSchema = new mongoose.Schema({
  candidateName:  String,
  recruiterName:  String,
  oldStatus:      String,
  newStatus:      String,
  changedBy:      { type: String, default: 'Process Analyst' },
  changedDate:    { type: Date, default: Date.now },
  reason:         String,
}, { timestamps: true });

// Escalation Flag Schema
const escalationFlagSchema = new mongoose.Schema({
  flagType: {
    type: String,
    enum: ['below_target','missing_followup','english_violation',
           'missing_legitimacy','missing_status_comment','backout'],
  },
  severity:      { type: String, enum: ['critical','high','medium'], default: 'high' },
  recruiterName: String,
  candidateName: String,
  teamLead:      String,
  monitoringDate:Date,
  description:   String,
  resolved:      { type: Boolean, default: false },
  resolvedAt:    Date,
  resolvedNote:  String,
}, { timestamps: true });

// ─── Models ────────────────────────────────────────────────────────
const Recruiter       = mongoose.model('Recruiter', recruiterSchema);
const Candidate       = mongoose.model('Candidate', candidateSchema);
const Task            = mongoose.model('Task', taskSchema);
const Issue           = mongoose.model('Issue', issueSchema);
const Report          = mongoose.model('Report', reportSchema);
const Audit           = mongoose.model('Audit', auditSchema);
const Update          = mongoose.model('Update', updateSchema);
const ProcessMonitor  = mongoose.model('ProcessMonitor', processMonitoringSchema);
const WeeklySnapshot  = mongoose.model('WeeklySnapshot', weeklySnapshotSchema);
const MonthlySnapshot = mongoose.model('MonthlySnapshot', monthlySnapshotSchema);
const StatusAudit     = mongoose.model('StatusAudit', statusAuditSchema);
const EscalationFlag  = mongoose.model('EscalationFlag', escalationFlagSchema);


// ─── API Routes ────────────────────────────────────────────────────

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [tasks, recruiters, candidates, reports, issues] = await Promise.all([
      Task.find(),
      Recruiter.find(),
      Candidate.find(),
      Report.find(),
      Issue.find(),
    ]);
    res.json({
      todaysTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      recruitersMonitored: recruiters.length,
      candidatesMonitored: candidates.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      openIssues: issues.filter(i => i.status === 'open' || i.status === 'under_review').length,
      warningCandidates: candidates.filter(c => c.warningStatus).length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Recruiters
app.get('/api/recruiters', async (req, res) => {
  try {
    const { search, teamLead, status } = req.query;
    let query = {};
    if (search) query.$or = [{ name: /search/i }, { candidate: /search/i }];
    if (teamLead) query.teamLead = teamLead;
    if (status) query.status = status;
    const data = await Recruiter.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/recruiters', async (req, res) => {
  try { const doc = await Recruiter.create(req.body); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/api/recruiters/:id', async (req, res) => {
  try { const doc = await Recruiter.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Candidates
app.get('/api/candidates', async (req, res) => {
  try { const data = await Candidate.find().sort({ createdAt: -1 }); res.json(data); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/candidates', async (req, res) => {
  try { const doc = await Candidate.create(req.body); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/api/candidates/:id', async (req, res) => {
  try { const doc = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  try { const data = await Task.find().sort({ createdAt: -1 }); res.json(data); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/tasks', async (req, res) => {
  try { const doc = await Task.create(req.body); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/api/tasks/:id', async (req, res) => {
  try { const doc = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Issues
app.get('/api/issues', async (req, res) => {
  try { const data = await Issue.find().sort({ createdAt: -1 }); res.json(data); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/issues', async (req, res) => {
  try { const doc = await Issue.create(req.body); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/api/issues/:id', async (req, res) => {
  try { const doc = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Reports
app.get('/api/reports', async (req, res) => {
  try { const data = await Report.find().sort({ createdAt: -1 }); res.json(data); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Historical
app.get('/api/historical', async (req, res) => {
  try {
    const [recruiters, candidates, tasks, issues] = await Promise.all([
      Recruiter.find().sort({ createdAt: -1 }),
      Candidate.find().sort({ createdAt: -1 }),
      Task.find().sort({ createdAt: -1 }),
      Issue.find().sort({ createdAt: -1 }),
    ]);
    res.json({ recruiters, candidates, tasks, issues });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Audit logs
app.get('/api/audit', async (req, res) => {
  try { const data = await Audit.find().sort({ createdAt: -1 }); res.json(data); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/audit', async (req, res) => {
  try { const doc = await Audit.create(req.body); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily Updates
app.get('/api/updates', async (req, res) => {
  try { const data = await Update.find().sort({ createdAt: -1 }); res.json(data); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/updates', async (req, res) => {
  try { const doc = await Update.create(req.body); res.json(doc); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const recruiters = await Recruiter.find();
    const performance = recruiters.map(r => ({
      name: r.name.split(' ')[0],
      target: r.target,
      actual: r.actual,
      longApps: r.longApps,
      shortApps: r.shortApps,
    }));
    res.json({ performance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Process Analyst Monitoring Routes ────────────────────────────

// Compliance Score calculation helper
function calculateComplianceScore(body) {
  let score = 0;
  // 1. Application Target Achievement (30% weight)
  const long = Number(body.longApplications) || 0;
  const short = Number(body.shortApplications) || 0;
  if (long >= 60 && short >= 40) {
    score += 30;
  } else if (long > 0 || short > 0) {
    score += 15;
  }
  // 2. Follow-Up Compliance (25% weight)
  if (body.connectedTwiceToday === 'yes') {
    score += 25;
  }
  // 3. English Communication (20% weight)
  if (body.communicatedInEnglish === 'yes') {
    score += 20;
  }
  // 4. Interview Update Compliance (15% weight)
  if (body.interviewStatus && body.interviewStatus !== '') {
    score += 15;
  }
  // 5. Interview Legitimacy Compliance (10% weight)
  if (body.interviewLegitimacy === 'Legit') {
    score += 10;
  }
  return score;
}

// Escalation Flag Generator helper
async function generateEscalationFlags(doc) {
  const flags = [];
  const dateVal = doc.monitoringDate || new Date();
  
  // A. Below Target
  const long = Number(doc.longApplications) || 0;
  const short = Number(doc.shortApplications) || 0;
  if (long < 60 || short < 40) {
    flags.push({
      flagType: 'below_target',
      severity: 'medium',
      recruiterName: doc.recruiterName,
      candidateName: doc.candidateName,
      teamLead: doc.teamLead,
      monitoringDate: dateVal,
      description: `Applications below target. Long: ${long}/60, Short: ${short}/40.`,
    });
  }
  
  // B. Missing Follow-up
  if (doc.connectedTwiceToday === 'no') {
    flags.push({
      flagType: 'missing_followup',
      severity: 'high',
      recruiterName: doc.recruiterName,
      candidateName: doc.candidateName,
      teamLead: doc.teamLead,
      monitoringDate: dateVal,
      description: `Recruiter did not connect twice today. Reason: ${doc.connectionReason || 'No reason provided'}.`,
    });
  }
  
  // C. English Violation
  if (doc.communicatedInEnglish === 'no') {
    flags.push({
      flagType: 'english_violation',
      severity: 'high',
      recruiterName: doc.recruiterName,
      candidateName: doc.candidateName,
      teamLead: doc.teamLead,
      monitoringDate: dateVal,
      description: `Recruiter did not communicate in English. Reason: ${doc.englishComplianceReason || 'No reason provided'}.`,
    });
  }
  
  // D. Missing legitimacy verification
  if (doc.interviewCount > 0 && doc.interviewLegitimacy === 'Pending Verification') {
    flags.push({
      flagType: 'missing_legitimacy',
      severity: 'medium',
      recruiterName: doc.recruiterName,
      candidateName: doc.candidateName,
      teamLead: doc.teamLead,
      monitoringDate: dateVal,
      description: `Legitimacy verification pending. Analyst comment: ${doc.legitimacyComment || 'None'}.`,
    });
  }
  
  // E. Missing status comment
  if (!doc.statusComment || doc.statusComment.trim() === '') {
    flags.push({
      flagType: 'missing_status_comment',
      severity: 'high',
      recruiterName: doc.recruiterName,
      candidateName: doc.candidateName,
      teamLead: doc.teamLead,
      monitoringDate: dateVal,
      description: `Candidate status comment missing for status: ${doc.candidateStatus || 'Active'}.`,
    });
  }
  
  // F. Backout profile
  if (doc.candidateStatus === 'Backout') {
    flags.push({
      flagType: 'backout',
      severity: 'critical',
      recruiterName: doc.recruiterName,
      candidateName: doc.candidateName,
      teamLead: doc.teamLead,
      monitoringDate: dateVal,
      description: `Candidate backed out. Status Comment: ${doc.statusComment || 'None'}.`,
    });
  }
  
  if (flags.length > 0) {
    await EscalationFlag.insertMany(flags);
  }
}

// Global Aggregator for Weekly / Monthly reports
function aggregateEntries(entries) {
  const map = {};
  entries.forEach(e => {
    const k = e.recruiterName || 'Unknown';
    if (!map[k]) map[k] = { recruiterName: k, teamLead: e.teamLead, entries: [] };
    map[k].entries.push(e);
  });

  return Object.values(map).map(rec => {
    const { entries } = rec;
    const days = new Set(entries.map(e => e.monitoringDate?.toISOString().split('T')[0])).size || 1;
    const totalLong  = entries.reduce((s,e) => s + (e.longApplications||0), 0);
    const totalShort = entries.reduce((s,e) => s + (e.shortApplications||0), 0);
    const totalApps  = entries.reduce((s,e) => s + (e.totalApplications||0), 0);
    const totalInterviews = entries.reduce((s,e) => s + (e.interviewCount||0), 0);
    const achieved   = entries.filter(e => e.overallStatus === 'achieved').length;
    
    // Status counts
    const active = entries.filter(e => e.candidateStatus === 'Active').length;
    const hold = entries.filter(e => e.candidateStatus === 'Hold').length;
    const backout = entries.filter(e => e.candidateStatus === 'Backout').length;
    const placed = entries.filter(e => e.candidateStatus === 'Placed').length;

    // compliance violations
    const belowTarget = entries.filter(e => (Number(e.longApplications)||0) < 60 || (Number(e.shortApplications)||0) < 40).length;
    const missingFollowUps = entries.filter(e => e.connectedTwiceToday === 'no').length;
    const englishViolations = entries.filter(e => e.communicatedInEnglish === 'no').length;
    const legitimacyPending = entries.filter(e => e.interviewCount > 0 && e.interviewLegitimacy === 'Pending Verification').length;

    // average compliance score
    const avgScore = Math.round(entries.reduce((s,e) => s + (e.complianceScore||0), 0) / entries.length);

    return {
      recruiterName:        rec.recruiterName,
      teamLead:             rec.teamLead,
      totalCandidates:      entries.length,
      totalLongApps:        totalLong,
      totalShortApps:       totalShort,
      totalApplications:    totalApps,
      avgAppsPerDay:        Math.round(totalApps / days),
      targetAchievedDays:   achieved,
      belowTargetDays:      entries.length - achieved,
      missingFeedback:      entries.filter(e => !e.feedbackFormAvailable).length,
      followUp1Missed:      entries.filter(e => !e.followUp1Done).length,
      followUp2Missed:      entries.filter(e => !e.followUp2Done).length,
      crCallMissed:         entries.filter(e => !e.customerRelationCallDone).length,
      warningCandidates:    entries.filter(e => e.warningStatus !== 'none').length,
      achievementPct:       entries.length ? Math.round((achieved / entries.length) * 100) : 0,

      // New performance stats
      totalInterviews,
      activeCandidates:     active,
      holdCandidates:       hold,
      backoutCandidates:    backout,
      placedCandidates:     placed,
      belowTargetProfiles:  belowTarget,
      missingFollowUpsCount:missingFollowUps,
      englishViolations,
      legitimacyPending,
      avgComplianceScore:   avgScore || 0,
    };
  });
}

// GET with optional query filters: ?recruiter=&candidate=&teamLead=&seniorRecruiter=&startDate=&endDate=&status=&interviewLegitimacy=
app.get('/api/monitoring', async (req, res) => {
  try {
    const { recruiter, candidate, teamLead, seniorRecruiter, startDate, endDate, status, interviewLegitimacy } = req.query;
    const filter = {};
    if (recruiter)  filter.recruiterName = { $regex: recruiter, $options: 'i' };
    if (candidate)  filter.candidateName = { $regex: candidate, $options: 'i' };
    if (teamLead)   filter.teamLead      = { $regex: teamLead,  $options: 'i' };
    if (seniorRecruiter) filter.seniorRecruiter = { $regex: seniorRecruiter, $options: 'i' };
    if (status)     filter.candidateStatus = status;
    if (interviewLegitimacy) filter.interviewLegitimacy = interviewLegitimacy;
    if (startDate || endDate) {
      filter.monitoringDate = {};
      if (startDate) filter.monitoringDate.$gte = new Date(startDate);
      if (endDate)   filter.monitoringDate.$lte = new Date(new Date(endDate).setHours(23,59,59,999));
    }
    const data = await ProcessMonitor.find(filter).sort({ monitoringDate: -1, createdAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST: Create a record. ENFORCE IMMUTABILITY. No updates, only appends.
app.post('/api/monitoring', async (req, res) => {
  try {
    const body = req.body;
    
    // Server-side validation check of mandatory fields
    if (body.candidateStatus && body.candidateStatus !== 'Active' && (!body.statusComment || body.statusComment.trim() === '')) {
      return res.status(400).json({ error: "Comment is mandatory for candidate status changes." });
    }
    if (body.connectedTwiceToday === 'no' && (!body.connectionReason || body.connectionReason.trim() === '')) {
      return res.status(400).json({ error: "Reason is mandatory if recruiter did not connect twice today." });
    }
    if (body.communicatedInEnglish === 'no' && (!body.englishComplianceReason || body.englishComplianceReason.trim() === '')) {
      return res.status(400).json({ error: "Reason is mandatory if recruiter did not communicate in English." });
    }
    if (body.interviewLegitimacy !== 'Pending Verification' && (!body.tlVerificationComment || body.tlVerificationComment.trim() === '')) {
      return res.status(400).json({ error: "Team Lead verification comment is mandatory when legitimacy is verified." });
    }

    // Auto-calculate totals and status
    const long  = Number(body.longApplications)  || 0;
    const short = Number(body.shortApplications) || 0;
    body.totalApplications = long + short;
    body.longTargetStatus  = long  >= 60 ? 'achieved' : 'missed';
    body.shortTargetStatus = short >= 40 ? 'achieved' : 'missed';
    body.overallStatus     = (long >= 60 && short >= 40) ? 'achieved' : (long === 0 && short === 0) ? 'missed' : 'below_target';
    
    // Live compute Compliance Score
    body.complianceScore = calculateComplianceScore(body);

    // Dynamic user field for status audit trail - do not hardcode Shashank
    const changedByUser = body.changedBy || 'Process Analyst';

    // Status Audit check: Find previous candidate entry to check for status changes
    const previousEntry = await ProcessMonitor.findOne({ candidateName: body.candidateName })
      .sort({ monitoringDate: -1, createdAt: -1 });

    const oldStatus = previousEntry ? previousEntry.candidateStatus : 'None';
    const newStatus = body.candidateStatus || 'Active';

    const doc = await ProcessMonitor.create(body);

    if (oldStatus !== newStatus) {
      await StatusAudit.create({
        candidateName: body.candidateName,
        recruiterName: body.recruiterName,
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedBy: changedByUser,
        changedDate: new Date(),
        reason: body.statusComment || 'Status updated',
      });
    }

    // Generate flags
    await generateEscalationFlags(doc);

    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DISABLE EDITING AND DELETING — Entries are immutable.
app.patch('/api/monitoring/:id', async (req, res) => {
  res.status(403).json({ error: "Daily monitoring records are immutable. Editing is not permitted for compliance." });
});

app.delete('/api/monitoring/:id', async (req, res) => {
  res.status(403).json({ error: "Daily monitoring records are immutable. Deletion is not permitted for compliance." });
});

// GET Executive Summary Dashboard KPIs
app.get('/api/monitoring/executive-summary', async (req, res) => {
  try {
    const entries = await ProcessMonitor.find();
    
    // Aggregated stats
    const totalRecruiters = new Set(entries.map(e => e.recruiterName)).size;
    const totalCandidates = new Set(entries.map(e => e.candidateName)).size;
    
    const achievedCount = entries.filter(e => e.overallStatus === 'achieved').length;
    const overallAchievement = entries.length ? Math.round((achievedCount / entries.length) * 100) : 0;
    
    const englishCount = entries.filter(e => e.communicatedInEnglish === 'yes').length;
    const englishCompliance = entries.length ? Math.round((englishCount / entries.length) * 100) : 0;
    
    const interviewEntries = entries.filter(e => e.interviewCount > 0);
    const legitCount = interviewEntries.filter(e => e.interviewLegitimacy === 'Legit').length;
    const legitimacyPct = interviewEntries.length ? Math.round((legitCount / interviewEntries.length) * 100) : 100;
    
    const openFlags = await EscalationFlag.countDocuments({ resolved: false });
    
    // Profiles at risk: Candidates with open flags
    const atRiskFlags = await EscalationFlag.find({ resolved: false }).sort({ createdAt: -1 });

    res.json({
      totalRecruiters,
      totalCandidates,
      overallAchievement,
      englishCompliance,
      legitimacyPct,
      openFlags,
      atRiskFlags
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Team Lead Legitimacy verification summary
app.get('/api/monitoring/team-lead-summary', async (req, res) => {
  try {
    const entries = await ProcessMonitor.find({ interviewCount: { $gt: 0 } });
    const tlMap = {};
    
    entries.forEach(e => {
      const tl = e.teamLead || 'Unknown';
      if (!tlMap[tl]) {
        tlMap[tl] = { teamLead: tl, totalInterviews: 0, legit: 0, notLegit: 0, pending: 0 };
      }
      tlMap[tl].totalInterviews += e.interviewCount || 0;
      if (e.interviewLegitimacy === 'Legit') tlMap[tl].legit++;
      else if (e.interviewLegitimacy === 'Not Legit') tlMap[tl].notLegit++;
      else tlMap[tl].pending++;
    });
    
    res.json(Object.values(tlMap));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Candidate timeline logs
app.get('/api/monitoring/candidate-timeline', async (req, res) => {
  try {
    const { candidateName } = req.query;
    if (!candidateName) return res.status(400).json({ error: "candidateName is required." });
    
    // Find all entries and status changes
    const [entries, statusAudits] = await Promise.all([
      ProcessMonitor.find({ candidateName: { $regex: candidateName, $options: 'i' } }).sort({ monitoringDate: 1 }),
      StatusAudit.find({ candidateName: { $regex: candidateName, $options: 'i' } }).sort({ changedDate: 1 })
    ]);
    
    // Compile timeline events
    const timeline = [];
    
    entries.forEach(e => {
      timeline.push({
        type: 'monitoring_entry',
        date: e.monitoringDate,
        title: 'Daily Monitoring Recorded',
        description: `Long: ${e.longApplications}, Short: ${e.shortApplications}. Total: ${e.totalApplications}. Status: ${e.overallStatus}. Follow-Up Connected: ${e.connectedTwiceToday}. English: ${e.communicatedInEnglish}.`,
        details: {
          dailyObservation: e.dailyObservation,
          dailyChallenge: e.dailyChallenge,
          remarks: e.processAnalystRemarks,
          legitimacy: e.interviewLegitimacy,
          score: e.complianceScore
        }
      });
      
      if (e.interviewCount > 0) {
        timeline.push({
          type: 'interview_update',
          date: e.monitoringDate,
          title: `Interviews Tracked (${e.interviewCount})`,
          description: `Status: ${e.interviewStatus || 'No status'}. Legitimacy: ${e.interviewLegitimacy}. Verification comment: ${e.tlVerificationComment || 'None'}.`,
        });
      }

      timeline.push({
        type: 'follow_up',
        date: e.monitoringDate,
        title: 'Recruiter Follow-Up Activity',
        description: `Connected Twice: ${e.connectedTwiceToday === 'yes' ? 'Yes' : 'No'}. Call 1: ${e.call1Timestamp || 'N/A'}. Call 2: ${e.call2Timestamp || 'N/A'}.${e.connectedTwiceToday === 'no' ? ` Reason for missed: ${e.connectionReason}` : ''}`
      });
    });

    statusAudits.forEach(sa => {
      timeline.push({
        type: 'status_change',
        date: sa.changedDate,
        title: 'Candidate Status Changed',
        description: `Status changed from ${sa.oldStatus} to ${sa.newStatus} by ${sa.changedBy}. Reason: ${sa.reason || 'None provided'}`
      });
    });

    timeline.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json(timeline);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Escalation Flags
app.get('/api/monitoring/escalation-flags', async (req, res) => {
  try {
    const { resolved, recruiter, candidate } = req.query;
    const filter = {};
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (recruiter) filter.recruiterName = { $regex: recruiter, $options: 'i' };
    if (candidate) filter.candidateName = { $regex: candidate, $options: 'i' };
    
    const data = await EscalationFlag.find(filter).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH Resolve Escalation Flag
app.patch('/api/monitoring/escalation-flags/:id/resolve', async (req, res) => {
  try {
    const { resolvedNote } = req.body;
    const doc = await EscalationFlag.findByIdAndUpdate(req.params.id, {
      resolved: true,
      resolvedAt: new Date(),
      resolvedNote: resolvedNote || 'Resolved manually'
    }, { new: true });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Trend Analysis WoW and MoM
app.get('/api/monitoring/trend-analysis', async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    const days = period === 'monthly' ? 30 : 7;
    const currentStart = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const prevStart = new Date(now.getTime() - 2 * days * 24 * 3600 * 1000);

    const [currentEntries, prevEntries] = await Promise.all([
      ProcessMonitor.find({ monitoringDate: { $gte: currentStart } }),
      ProcessMonitor.find({ monitoringDate: { $gte: prevStart, $lt: currentStart } })
    ]);

    const recruiterScores = {};

    currentEntries.forEach(e => {
      const r = e.recruiterName || 'Unknown';
      if (!recruiterScores[r]) recruiterScores[r] = { currentSum: 0, currentCount: 0, prevSum: 0, prevCount: 0 };
      recruiterScores[r].currentSum += e.complianceScore || 0;
      recruiterScores[r].currentCount++;
    });

    prevEntries.forEach(e => {
      const r = e.recruiterName || 'Unknown';
      if (!recruiterScores[r]) recruiterScores[r] = { currentSum: 0, currentCount: 0, prevSum: 0, prevCount: 0 };
      recruiterScores[r].prevSum += e.complianceScore || 0;
      recruiterScores[r].prevCount++;
    });

    const trend = Object.entries(recruiterScores).map(([name, stats]) => {
      const currentAvg = stats.currentCount ? Math.round(stats.currentSum / stats.currentCount) : 0;
      const prevAvg = stats.prevCount ? Math.round(stats.prevSum / stats.prevCount) : 0;
      const improvement = prevAvg ? Math.round(((currentAvg - prevAvg) / prevAvg) * 100) : (currentAvg ? 100 : 0);
      return { recruiterName: name, currentAvg, prevAvg, improvement };
    });

    res.json(trend);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET status audit logs
app.get('/api/status-audit', async (req, res) => {
  try {
    const { candidateName } = req.query;
    const filter = {};
    if (candidateName) filter.candidateName = { $regex: candidateName, $options: 'i' };
    const data = await StatusAudit.find(filter).sort({ changedDate: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Weekly report aggregation
app.get('/api/monitoring/weekly', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.monitoringDate = {};
      if (startDate) filter.monitoringDate.$gte = new Date(startDate);
      if (endDate)   filter.monitoringDate.$lte = new Date(new Date(endDate).setHours(23,59,59,999));
    }
    const entries = await ProcessMonitor.find(filter);
    const summary = aggregateEntries(entries);
    res.json({ summary, total: entries.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Monthly report aggregation (Final Enhancement #3)
app.get('/api/monitoring/monthly', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.monitoringDate = {};
      if (startDate) filter.monitoringDate.$gte = new Date(startDate);
      if (endDate)   filter.monitoringDate.$lte = new Date(new Date(endDate).setHours(23,59,59,999));
    }
    const entries = await ProcessMonitor.find(filter);
    const summary = aggregateEntries(entries);
    res.json({ summary, total: entries.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Freezing snapshots
app.post('/api/monitoring/freeze-weekly', async (req, res) => {
  try {
    const { startDate, endDate, summary, totalEntries } = req.body;
    const doc = await WeeklySnapshot.create({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      summary,
      totalEntries
    });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/monitoring/weekly-snapshots', async (req, res) => {
  try {
    const data = await WeeklySnapshot.find().sort({ frozenAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/monitoring/freeze-monthly', async (req, res) => {
  try {
    const { startDate, endDate, summary, totalEntries } = req.body;
    const doc = await MonthlySnapshot.create({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      summary,
      totalEntries
    });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/monitoring/monthly-snapshots', async (req, res) => {
  try {
    const data = await MonthlySnapshot.find().sort({ frozenAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
