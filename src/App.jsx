import { useState, useEffect } from 'react';
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
function JobForm({ formData, onChange, onSubmit, onCancel, isEditing }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form__header">
        <h2 className="form__title">{isEditing ? '✏️ Edit Job' : '➕ Add New Job'}</h2>
        <p className="form__desc">Fill in the details of your job application</p>
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
        />
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
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
          <div className="job-card__logo">{getInitials(job.company)}</div>
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
