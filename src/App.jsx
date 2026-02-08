import { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

// ========================================
// Constants
// ========================================
const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
];

const INITIAL_JOBS = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'Jakarta, Indonesia',
    salary: '$80,000 - $120,000',
    status: 'interview',
    dateApplied: '2026-02-05',
    notes: 'Second round interview scheduled',
    logo: null,
  },
  {
    id: 2,
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$70,000 - $100,000',
    status: 'applied',
    dateApplied: '2026-02-07',
    notes: 'Applied through LinkedIn',
    logo: null,
  },
  {
    id: 3,
    title: 'React Developer',
    company: 'DigitalAgency',
    location: 'Bandung, Indonesia',
    salary: '$60,000 - $90,000',
    status: 'offer',
    dateApplied: '2026-01-28',
    notes: 'Received offer letter!',
    logo: null,
  },
];

const EMPTY_FORM = {
  title: '',
  company: '',
  location: '',
  salary: '',
  status: 'applied',
  dateApplied: new Date().toISOString().split('T')[0],
  notes: '',
  logo: null,
};

// ========================================
// Helper Functions
// ========================================
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getInitials = (name) => {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
};

// Parse extracted text to find job-related information
const parseJobData = (text) => {
  const lines = text.split('\n').filter(line => line.trim().length > 2);
  
  const data = {
    title: '',
    company: '',
    location: '',
    salary: '',
    notes: '',
  };

  // ========================================
  // 1. FIND COMPANY NAME FIRST
  // ========================================
  // Indonesian company patterns (PT., CV., etc.)
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Match PT. or PT followed by company name
    if (/^PT\.?\s+/i.test(trimmedLine) || /^CV\.?\s+/i.test(trimmedLine)) {
      data.company = trimmedLine;
      break;
    }
  }
  
  // International company patterns
  if (!data.company) {
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (/(?:Inc\.|Corp\.|Ltd\.|LLC|Co\.|Corporation|Company|Technologies|Solutions|Group|GmbH|S\.A\.)$/i.test(trimmedLine)) {
        data.company = trimmedLine;
        break;
      }
    }
  }

  // ========================================
  // 2. FIND JOB TITLE
  // ========================================
  const jobTitlePatterns = [
    // Specific job titles
    /\b(software\s+engineer|software\s+developer|web\s+developer|frontend\s+developer|backend\s+developer|full\s*stack\s+developer|mobile\s+developer|data\s+scientist|data\s+analyst|data\s+engineer|devops\s+engineer|qa\s+engineer|ui\/ux\s+designer|product\s+manager|project\s+manager|business\s+analyst|system\s+analyst|network\s+engineer|security\s+analyst|cloud\s+engineer|machine\s+learning\s+engineer)\b/i,
    // Generic patterns with common keywords
    /\b(senior|junior|lead|staff|principal|head\s+of)?\s*(programmer|developer|engineer|designer|analyst|architect|manager|administrator|specialist|coordinator|consultant|technician|officer)\b/i,
    // Indonesian job titles
    /\b(staff\s+it|it\s+support|admin\s+it|teknisi|operator|staf|karyawan)\b/i,
  ];

  for (const line of lines) {
    // Skip if this line is already the company
    if (line.trim() === data.company) continue;
    
    for (const pattern of jobTitlePatterns) {
      const match = line.match(pattern);
      if (match) {
        data.title = line.trim();
        break;
      }
    }
    if (data.title) break;
  }

  // Look for "Posisi:", "Position:", "Lowongan:", "Dibutuhkan:" labels
  if (!data.title) {
    for (const line of lines) {
      const match = line.match(/(?:posisi|position|lowongan|dibutuhkan|hiring|vacancy)[:\s]+(.+)/i);
      if (match && match[1]) {
        data.title = match[1].trim();
        break;
      }
    }
  }

  // ========================================
  // 3. FIND LOCATION
  // ========================================
  // Indonesian cities
  const indonesianCities = ['jakarta', 'surabaya', 'bandung', 'medan', 'semarang', 'makassar', 'palembang', 'tangerang', 'depok', 'bekasi', 'bogor', 'malang', 'yogyakarta', 'solo', 'denpasar', 'bali', 'batam'];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Check for location labels
    const locationMatch = line.match(/(?:lokasi|location|alamat|address|tempat|kantor|office)[:\s]+(.+)/i);
    if (locationMatch && locationMatch[1]) {
      data.location = locationMatch[1].trim();
      break;
    }
    
    // Check for Indonesian cities
    for (const city of indonesianCities) {
      if (lowerLine.includes(city) && !lowerLine.includes('pt.') && !lowerLine.includes('cv.')) {
        data.location = line.trim();
        break;
      }
    }
    if (data.location) break;
    
    // Check for remote/hybrid
    if (/\b(remote|hybrid|wfh|work\s+from\s+home|onsite|on-site)\b/i.test(line)) {
      data.location = line.trim();
      break;
    }
  }

  // ========================================
  // 4. FIND SALARY
  // ========================================
  const salaryPatterns = [
    // Indonesian Rupiah
    /(?:Rp\.?|IDR)\s*[\d.,]+(?:\s*[-–]\s*(?:Rp\.?|IDR)?\s*[\d.,]+)?(?:\s*(?:juta|jt|rb|ribu))?/i,
    // Gaji label
    /(?:gaji|salary|upah|penghasilan)[:\s]*(?:Rp\.?|IDR)?\s*[\d.,]+/i,
    // USD format
    /\$[\d,]+(?:\s*[-–]\s*\$?[\d,]+)?(?:\s*(?:\/|\s+per\s+)(?:year|month|bulan|tahun))?/i,
    // Range with currency
    /[\d.,]+\s*[-–]\s*[\d.,]+\s*(?:USD|IDR|juta|jt)/i,
  ];

  for (const line of lines) {
    for (const pattern of salaryPatterns) {
      const match = line.match(pattern);
      if (match) {
        data.salary = match[0].trim();
        break;
      }
    }
    if (data.salary) break;
  }

  // ========================================
  // 5. FALLBACK - Use first meaningful lines
  // ========================================
  // If no company found, look for first capitalized line that's not a common word
  if (!data.company) {
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip common phrases and short lines
      if (trimmed.length > 5 && 
          !/^(we are|hiring|lowongan|dibutuhkan|kualifikasi|persyaratan|requirements)/i.test(trimmed) &&
          /^[A-Z]/.test(trimmed)) {
        data.company = trimmed.slice(0, 50);
        break;
      }
    }
  }

  // If no title found, look for lines with "hiring", "looking for", "dibutuhkan"
  if (!data.title) {
    for (const line of lines) {
      if (/\b(hiring|looking\s+for|dibutuhkan|dicari|membutuhkan)\b/i.test(line)) {
        // Try to extract what comes after
        const match = line.match(/(?:hiring|looking\s+for|dibutuhkan|dicari|membutuhkan)[:\s]+(.+)/i);
        if (match && match[1]) {
          data.title = match[1].trim().slice(0, 50);
        } else {
          data.title = line.trim().slice(0, 50);
        }
        break;
      }
    }
  }

  // Last resort: use first line as company if still empty
  if (!data.company && lines.length > 0) {
    data.company = lines[0].trim().slice(0, 50);
  }
  
  // Use second line as title if still empty (and different from company)
  if (!data.title && lines.length > 1 && lines[1].trim() !== data.company) {
    data.title = lines[1].trim().slice(0, 50);
  }

  // ========================================
  // 6. STORE FULL TEXT IN NOTES
  // ========================================
  data.notes = `Extracted from image:\n${text.slice(0, 500)}${text.length > 500 ? '...' : ''}`;

  return data;
};

// ========================================
// Components
// ========================================

// Header Component
function Header({ stats }) {
  return (
    <header className="header">
      <div className="container">
        <div className="header__content">
          <div className="header__logo">
            <div className="header__icon">💼</div>
            <div>
              <div className="header__title">FedTech Toga</div>
              <div className="header__subtitle">Job Tracker</div>
            </div>
          </div>
          <div className="stats">
            <div className="stats__item">
              <div className="stats__value">{stats.total}</div>
              <div className="stats__label">Total</div>
            </div>
            <div className="stats__item">
              <div className="stats__value">{stats.interview}</div>
              <div className="stats__label">Interviews</div>
            </div>
            <div className="stats__item">
              <div className="stats__value">{stats.offer}</div>
              <div className="stats__label">Offers</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Job Form Component
function JobForm({ formData, onChange, onSubmit, onCancel, isEditing, isProcessing, processingProgress }) {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleRemoveLogo = () => {
    onChange({ ...formData, logo: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form__header">
        <h2 className="form__title">{isEditing ? '✏️ Edit Job' : '➕ Add New Job'}</h2>
        <p className="form__desc">Upload an image to extract data automatically or fill manually</p>
      </div>

      {/* Image Upload Section */}
      <div className="form__upload-section">
        <div className="upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  onChange({ ...formData, logo: reader.result });
                };
                reader.readAsDataURL(e.target.files[0]);
              }
            }}
            ref={fileInputRef}
            id="logo-upload"
            className="upload-input"
            disabled={isProcessing}
          />
          {formData.logo ? (
            <div className="upload-preview">
              <img src={formData.logo} alt="Uploaded" className="upload-preview__image" />
              <button 
                type="button" 
                className="upload-preview__remove" 
                onClick={handleRemoveLogo}
                disabled={isProcessing}
              >
                ✕
              </button>
            </div>
          ) : (
            <label htmlFor="logo-upload" className={`upload-label ${isProcessing ? 'upload-label--disabled' : ''}`}>
              <span className="upload-label__icon">📷</span>
              <span className="upload-label__text">Upload Job Image</span>
              <span className="upload-label__hint">Screenshot of job posting, etc.</span>
            </label>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="processing-indicator">
            <div className="processing-spinner"></div>
            <span className="processing-text">Extracting text... {Math.round(processingProgress)}%</span>
            <div className="processing-bar">
              <div className="processing-bar__fill" style={{ width: `${processingProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="form__grid">
        <div className="form-group">
          <label className="form-label">Job Title *</label>
          <input
            type="text"
            name="title"
            className="form-input"
            placeholder="e.g. Frontend Developer"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Company *</label>
          <input
            type="text"
            name="company"
            className="form-input"
            placeholder="e.g. Google"
            value={formData.company}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            type="text"
            name="location"
            className="form-input"
            placeholder="e.g. Remote, Jakarta"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Salary Range</label>
          <input
            type="text"
            name="salary"
            className="form-input"
            placeholder="e.g. $60,000 - $80,000"
            value={formData.salary}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            name="status"
            className="form-select"
            value={formData.status}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date Applied</label>
          <input
            type="date"
            name="dateApplied"
            className="form-input"
            value={formData.dateApplied}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          name="notes"
          className="form-textarea"
          placeholder="Add any notes..."
          value={formData.notes}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isProcessing}>
          {isEditing ? 'Update Job' : 'Add Job'}
        </button>
      </div>
    </form>
  );
}

// Job Card Component
function JobCard({ job, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="job-card animate-in">
      <div className="job-card__header">
        <div className="job-card__company">
          {job.logo ? (
            <img src={job.logo} alt={job.company} className="job-card__logo-img" />
          ) : (
            <div className="job-card__logo">{getInitials(job.company)}</div>
          )}
          <div className="job-card__info">
            <h3 className="job-card__title">{job.title}</h3>
            <span className="job-card__name">{job.company}</span>
          </div>
        </div>
        <div className="job-card__actions">
          <button className="job-card__btn" onClick={() => onEdit(job)} title="Edit">
            ✏️
          </button>
          <button
            className="job-card__btn job-card__btn--delete"
            onClick={() => onDelete(job.id)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="job-card__meta">
        {job.location && (
          <span className="job-card__meta-item">📍 {job.location}</span>
        )}
        {job.salary && (
          <span className="job-card__meta-item">💰 {job.salary}</span>
        )}
      </div>

      {job.notes && <p className="job-card__notes">"{job.notes}"</p>}

      <div className="job-card__footer">
        <span className="job-card__date">📅 {formatDate(job.dateApplied)}</span>
        <select
          className={`badge badge-${job.status} job-card__status`}
          value={job.status}
          onChange={(e) => onStatusChange(job.id, e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ filter, onAddClick }) {
  return (
    <div className="empty">
      <div className="empty__icon">📭</div>
      <h3 className="empty__title">No job applications found</h3>
      <p className="empty__text">
        {filter === 'all'
          ? 'Start tracking your job search by adding your first application!'
          : `No applications with "${filter}" status`}
      </p>
      {filter === 'all' && (
        <button className="btn btn-primary" onClick={onAddClick}>
          Add Your First Job
        </button>
      )}
    </div>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <div className="footer__divider"></div>
          <p className="footer__text">
            CREATED BY{' '}
            <a
              href="https://fedrotogatorop.fun/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__link"
            >
              FEDRO SAUT WIBISONO TOGATOROP
            </a>
          </p>
          <p className="footer__copyright">
            © {new Date().getFullYear()} FedTech Toga. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Toast Component
function Toast({ message, type }) {
  return (
    <div className="toast-container">
      <div className={`toast toast--${type}`}>
        <span>{type === 'success' ? '✅' : '❌'}</span>
        <span className="toast__message">{message}</span>
      </div>
    </div>
  );
}

// ========================================
// Main App Component
// ========================================
function App() {
  // State
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('fedtech-jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Effects
  useEffect(() => {
    localStorage.setItem('fedtech-jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Process image with OCR when logo changes
  useEffect(() => {
    // Use a flag to prevent re-processing
    let isCancelled = false;
    
    const processImage = async () => {
      // Only process if we have a new logo and not already processing
      if (!formData.logo || isProcessing || editingJob) {
        return;
      }
      
      setIsProcessing(true);
      setProcessingProgress(0);
      
      try {
        const result = await Tesseract.recognize(
          formData.logo,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text' && !isCancelled) {
                setProcessingProgress(m.progress * 100);
              }
            },
          }
        );

        if (isCancelled) return;

        const extractedText = result.data.text;
        
        if (extractedText.trim()) {
          const parsedData = parseJobData(extractedText);
          
          setFormData(prev => ({
            ...prev,
            title: parsedData.title || prev.title,
            company: parsedData.company || prev.company,
            location: parsedData.location || prev.location,
            salary: parsedData.salary || prev.salary,
            notes: parsedData.notes || prev.notes,
          }));
          
          showToast('Data extracted from image! ✨');
        } else {
          showToast('No text found in image', 'error');
        }
      } catch (error) {
        console.error('OCR Error:', error);
        if (!isCancelled) {
          showToast('Failed to extract text from image', 'error');
        }
      } finally {
        if (!isCancelled) {
          setIsProcessing(false);
          setProcessingProgress(0);
        }
      }
    };

    processImage();
    
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.logo]);

  // Computed Values
  const stats = {
    total: jobs.length,
    interview: jobs.filter((j) => j.status === 'interview').length,
    offer: jobs.filter((j) => j.status === 'offer').length,
  };

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter((job) => job.status === filter);

  // Handlers
  const showToast = (message, type = 'success') => setToast({ message, type });

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingJob(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    if (editingJob) {
      setJobs((prev) =>
        prev.map((job) => (job.id === editingJob.id ? { ...formData, id: editingJob.id } : job))
      );
      showToast('Job updated successfully! ✨');
    } else {
      setJobs((prev) => [{ ...formData, id: Date.now() }, ...prev]);
      showToast('Job added successfully! 🎉');
    }
    resetForm();
  };

  const handleEdit = (job) => {
    setFormData(job);
    setEditingJob(job);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      setJobs((prev) => prev.filter((job) => job.id !== id));
      showToast('Job deleted successfully');
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, status: newStatus } : job)));
    showToast('Status updated! ✅');
  };

  // Render
  return (
    <div className="app">
      <Header stats={stats} />

      <main className="main">
        <div className="container">
          {/* Add Job Section */}
          <section className="section">
            {!showForm ? (
              <button className="btn btn-primary btn-full" onClick={() => setShowForm(true)}>
                ➕ Add New Job Application
              </button>
            ) : (
              <JobForm
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                isEditing={!!editingJob}
                isProcessing={isProcessing}
                processingProgress={processingProgress}
              />
            )}
          </section>

          {/* Jobs List Section */}
          <section className="section">
            <div className="section__header">
              <h2 className="section__title">
                📋 Your Applications
                <span className="section__count">{filteredJobs.length}</span>
              </h2>
              <div className="filters">
                <button
                  className={`filters__btn ${filter === 'all' ? 'filters__btn--active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`filters__btn ${filter === opt.value ? 'filters__btn--active' : ''}`}
                    onClick={() => setFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <EmptyState filter={filter} onAddClick={() => setShowForm(true)} />
            ) : (
              <div className="jobs-grid">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
