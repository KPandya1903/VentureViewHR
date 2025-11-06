// server/index.js
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize SQLite database
const dbPath = path.join(__dirname, '../db/ventureview.db');
const db = new Database(dbPath);

// Initialize schema
const schemaPath = path.join(__dirname, '../db/schema_clean.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found at:', schemaPath);
  process.exit(1);
}
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log('✅ Database initialized');

// ============================================================================
// TEST ROUTE
// ============================================================================

app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'VentureView HR Backend API',
    endpoints: [
      'GET /api/companies',
      'GET /api/applications/hr',
      'POST /api/auth/login'
    ]
  });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// COMPANIES & JOB POSITIONS
// ============================================================================

app.get('/api/companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM companies ORDER BY name').all();
    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/companies/:id/positions', (req, res) => {
  try {
    const positions = db.prepare('SELECT * FROM job_positions WHERE company_id = ?').all(req.params.id);
    res.json(positions);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// APPLICATION ROUTES
// ============================================================================

// Submit new application
app.post('/api/applications', (req, res) => {
  try {
    const { candidate_id, job_position_id, company_id, resume_text } = req.body;
    
    const result = db.prepare(`
      INSERT INTO applications (candidate_id, job_position_id, company_id, resume_text, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(candidate_id, job_position_id, company_id, resume_text);
    
    res.json({ application_id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get candidate's applications
app.get('/api/applications/candidate/:candidateId', (req, res) => {
  try {
    const applications = db.prepare(`
      SELECT 
        a.*,
        c.name as company_name,
        c.logo_url as company_logo,
        jp.title as position_title
      FROM applications a
      JOIN companies c ON a.company_id = c.id
      JOIN job_positions jp ON a.job_position_id = jp.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `).all(req.params.candidateId);
    
    res.json(applications);
  } catch (error) {
    console.error('Get candidate applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all applications for HR (with filters)
app.get('/api/applications/hr', (req, res) => {
  try {
    const { status, company_id } = req.query;
    
    let query = `
      SELECT 
        a.*,
        u.full_name as candidate_name,
        u.email as candidate_email,
        c.name as company_name,
        jp.title as position_title
      FROM applications a
      JOIN users u ON a.candidate_id = u.id
      JOIN companies c ON a.company_id = c.id
      JOIN job_positions jp ON a.job_position_id = jp.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    
    if (company_id) {
      query += ' AND a.company_id = ?';
      params.push(company_id);
    }
    
    query += ' ORDER BY a.applied_at DESC';
    
    const applications = db.prepare(query).all(...params);
    res.json(applications);
  } catch (error) {
    console.error('Get HR applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single application with full details
app.get('/api/applications/:id', (req, res) => {
  try {
    const application = db.prepare(`
      SELECT 
        a.*,
        u.full_name as candidate_name,
        u.email as candidate_email,
        c.name as company_name,
        c.logo_url as company_logo,
        jp.title as position_title,
        jp.description as position_description
      FROM applications a
      JOIN users u ON a.candidate_id = u.id
      JOIN companies c ON a.company_id = c.id
      JOIN job_positions jp ON a.job_position_id = jp.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Get questions and answers
    const questions = db.prepare(`
      SELECT * FROM interview_questions 
      WHERE application_id = ? 
      ORDER BY question_order
    `).all(req.params.id);
    
    const answers = db.prepare(`
      SELECT * FROM interview_answers 
      WHERE application_id = ?
    `).all(req.params.id);
    
    res.json({ ...application, questions, answers });
  } catch (error) {
    console.error('Get application detail error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application status (HR action)
app.patch('/api/applications/:id/status', (req, res) => {
  try {
    const { status, hr_notes, reviewed_by } = req.body;
    
    db.prepare(`
      UPDATE applications 
      SET status = ?, hr_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, hr_notes, reviewed_by, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// INTERVIEW QUESTIONS
// ============================================================================

app.post('/api/applications/:id/questions', (req, res) => {
  try {
    const { questions } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO interview_questions (application_id, question_text, question_type, question_order)
      VALUES (?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((questionsArray) => {
      for (const q of questionsArray) {
        stmt.run(req.params.id, q.question_text, q.question_type, q.question_order);
      }
    });
    
    insertMany(questions);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Save questions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// INTERVIEW ANSWERS
// ============================================================================

app.post('/api/answers', (req, res) => {
  try {
    const {
      application_id,
      question_id,
      video_url,
      transcript,
      evaluation,
      emotion_analysis,
      behavioral_metrics
    } = req.body;
    
    const result = db.prepare(`
      INSERT INTO interview_answers (
        application_id,
        question_id,
        video_url,
        transcript,
        clarity_score,
        confidence_score,
        relevance_score,
        overall_answer_score,
        feedback,
        dominant_emotion,
        emotion_confidence,
        nervousness_score,
        enthusiasm_score,
        authenticity_score,
        emotion_timeline,
        filler_word_count,
        fluency_score,
        word_count,
        speaking_pace
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      application_id,
      question_id,
      video_url,
      transcript,
      evaluation?.clarity || 0,
      evaluation?.confidence || 0,
      evaluation?.relevance || 0,
      evaluation?.overall || 0,
      evaluation?.feedback || '',
      emotion_analysis?.dominantEmotion || 'Neutral',
      emotion_analysis?.confidence || 0,
      emotion_analysis?.nervousness || 0,
      emotion_analysis?.enthusiasm || 0,
      emotion_analysis?.authenticity || 0,
      JSON.stringify(emotion_analysis?.emotionTimeline || []),
      behavioral_metrics?.fillerWordCount || 0,
      behavioral_metrics?.fluencyScore || 0,
      behavioral_metrics?.wordCount || 0,
      behavioral_metrics?.speakingPace || 0
    );
    
    res.json({ answer_id: result.lastInsertRowid });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application overall score after all answers
app.patch('/api/applications/:id/score', (req, res) => {
  try {
    const { overall_score } = req.body;
    
    db.prepare('UPDATE applications SET overall_score = ?, status = ? WHERE id = ?')
      .run(overall_score, 'completed', req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

app.get('/api/stats/hr', (req, res) => {
  try {
    const stats = {
      total_applications: db.prepare('SELECT COUNT(*) as count FROM applications').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = "pending"').get().count,
      in_progress: db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = "in_progress"').get().count,
      completed: db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = "completed"').get().count,
      accepted: db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = "accepted"').get().count,
      rejected: db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = "rejected"').get().count,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 VentureView HR Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`\n✅ Test the API:`);
  console.log(`   Open browser: http://localhost:${PORT}`);
  console.log(`   Get companies: http://localhost:${PORT}/api/companies\n`);
});

export default app;