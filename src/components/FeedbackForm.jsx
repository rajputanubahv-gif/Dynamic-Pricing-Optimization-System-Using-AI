import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const FeedbackForm = ({ predictionId, predictedPrice, onComplete }) => {
  const [rating, setRating] = useState(0);
  const [actualPrice, setActualPrice] = useState(predictedPrice || '');
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('Pricing');
  const [sentiment, setSentiment] = useState('Satisfied');
  const [isAccurate, setIsAccurate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const categories = ['Pricing', 'Map Accuracy', 'Model Performance', 'App Logic'];
  const sentiments = [
    { label: 'Frustrated', icon: '😞' },
    { label: 'Neutral', icon: '😐' },
    { label: 'Satisfied', icon: '😊' },
    { label: 'Impressed', icon: '🔥' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await API.post('/feedback', {
        prediction_id: predictionId,
        actual_price: parseFloat(actualPrice) || 0,
        rating: rating || 0,
        category: category,
        sentiment: sentiment,
        is_accurate: isAccurate,
        comment: comment.trim()
      });
      setIsSubmitted(true);
      if (onComplete) setTimeout(onComplete, 2500);
    } catch (err) {
      console.error("Feedback error:", err);
      setError("Sync failed. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const panelStyle = {
    background: 'rgba(30, 41, 59, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '24px',
    marginTop: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    color: '#fff'
  };

  const labelStyle = { 
    fontSize: '10px', 
    fontWeight: '800', 
    color: 'rgba(255,255,255,0.4)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em',
    marginBottom: '8px',
    display: 'block'
  };

  if (isSubmitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={panelStyle}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'pulse 1s infinite' }}>✅</div>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--success)' }}>Feedback Synchronized</h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Nexus Engine has absorbed your verification data.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Verification & Review
        </h3>
        <div 
          onClick={() => setIsAccurate(!isAccurate)}
          style={{ 
            cursor: 'pointer',
            padding: '6px 12px', 
            borderRadius: '100px', 
            fontSize: '10px', 
            fontWeight: 800,
            background: isAccurate ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${isAccurate ? 'var(--success)' : 'var(--danger)'}`,
            color: isAccurate ? 'var(--success)' : 'var(--danger)',
            transition: '0.2s'
          }}
        >
          {isAccurate ? 'PRECISE' : 'VARIANCE DETECTED'}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Sentiment Row */}
        <div>
          <label style={labelStyle}>Engine Sentiment</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {sentiments.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSentiment(s.label)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: sentiment === s.label ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: `1px solid ${sentiment === s.label ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: '0.2s'
                }}
                title={s.label}
              >
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <label style={labelStyle}>Root Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  background: category === c ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '6px',
                  color: category === c ? '#000' : 'rgba(255,255,255,0.6)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing & Stars Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Actual Fair (₹)</label>
            <input 
              type="number" 
              value={actualPrice}
              onChange={e => setActualPrice(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Rating</label>
            <div style={{ display: 'flex', gap: '6px', height: '46px', alignItems: 'center' }}>
              {[1,2,3,4,5].map(star => (
                <span 
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ 
                    cursor: 'pointer', 
                    fontSize: '18px',
                    color: star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label style={labelStyle}>Observation Details</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="System notes for retraining..."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '12px',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '12px',
              minHeight: '80px',
              resize: 'none'
            }}
          />
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 700 }}>{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, var(--accent), #4f46e5)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
          }}
        >
          {isSubmitting ? 'ENGINE SYNCING...' : 'SYNC VERIFICATION DATA'}
        </button>
      </form>
    </motion.div>
  );
};

export default FeedbackForm;
