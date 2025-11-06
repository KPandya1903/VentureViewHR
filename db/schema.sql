// db/schema.sql
-- SQLite Database Schema for VentureView HR

-- Users table (simple authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('candidate', 'hr')),
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Job Positions table
CREATE TABLE IF NOT EXISTS job_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    job_position_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    resume_text TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'accepted', 'rejected', 'next_round')),
    overall_score INTEGER,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    reviewed_by INTEGER,
    hr_notes TEXT,
    FOREIGN KEY (candidate_id) REFERENCES users(id),
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Interview Questions table
CREATE TABLE IF NOT EXISTS interview_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('technical', 'hr', 'behavioral')),
    question_order INTEGER NOT NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Interview Answers table
CREATE TABLE IF NOT EXISTS interview_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    video_url TEXT NOT NULL,
    transcript TEXT,
    
    -- AI Evaluation scores
    clarity_score INTEGER,
    confidence_score INTEGER,
    relevance_score INTEGER,
    overall_answer_score INTEGER,
    feedback TEXT,
    
    -- Emotion Analysis (from Hume AI)
    dominant_emotion TEXT,
    emotion_confidence INTEGER,
    nervousness_score INTEGER,
    enthusiasm_score INTEGER,
    authenticity_score INTEGER,
    emotion_timeline JSON,
    
    -- Behavioral Metrics
    filler_word_count INTEGER,
    fluency_score INTEGER,
    word_count INTEGER,
    speaking_pace INTEGER,
    
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (question_id) REFERENCES interview_questions(id)
);

-- Insert default users
INSERT OR IGNORE INTO users (email, password, role, full_name) VALUES 
('student@ventureview.com', 'student123', 'candidate', 'John Doe'),
('hr@ventureview.com', 'hr123', 'hr', 'Sarah HR Manager');

-- Insert sample companies
INSERT OR IGNORE INTO companies (id, name, logo_url, description) VALUES 
(1, 'TechCorp', 'https://placehold.co/100x100/3b82f6/ffffff?text=TC', 'Leading technology company specializing in AI and cloud solutions'),
(2, 'DataSystems Inc', 'https://placehold.co/100x100/8b5cf6/ffffff?text=DS', 'Data analytics and business intelligence platform'),
(3, 'InnovateLabs', 'https://placehold.co/100x100/10b981/ffffff?text=IL', 'Startup accelerator and innovation hub');

-- Insert sample job positions
INSERT OR IGNORE INTO job_positions (company_id, title, description, requirements) VALUES 
(1, 'Full Stack Developer', 'Build scalable web applications using React and Node.js', 'React, Node.js, TypeScript, AWS, 2+ years experience'),
(1, 'Machine Learning Engineer', 'Develop and deploy ML models for production systems', 'Python, TensorFlow, PyTorch, MLOps, 3+ years experience'),
(2, 'Data Analyst', 'Analyze business data and create actionable insights', 'SQL, Python, Tableau, Statistics, 1+ years experience'),
(3, 'Product Manager', 'Lead product strategy and roadmap for B2B SaaS', 'Product strategy, Agile, Stakeholder management, 3+ years experience');