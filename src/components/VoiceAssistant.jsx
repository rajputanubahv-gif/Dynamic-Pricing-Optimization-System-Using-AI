import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function VoiceAssistant({ summaryEn, summaryHi }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [lang, setLang] = useState('en'); // 'en' or 'hi'
  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);

  const handleSpeak = () => {
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    const text = lang === 'en' ? summaryEn : summaryHi;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = synth.getVoices();
    let preferred;
    
    if (lang === 'hi') {
      preferred = voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.name.includes('India'));
    } else {
      preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    }
    
    if (preferred) utterance.voice = preferred;
    utterance.pitch = 1.0;
    utterance.rate = 0.95; 
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  useEffect(() => {
    return () => synth.cancel();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      <div style={{ 
        display: 'flex', 
        background: 'rgba(0,0,0,0.2)', 
        padding: '2px', 
        borderRadius: '6px', 
        border: '1px solid var(--border-color)' 
      }}>
        {['en', 'hi'].map(l => (
          <button
            key={l}
            onClick={() => {
              setLang(l);
              if (isPlaying) synth.cancel();
            }}
            style={{
              padding: '2px 8px',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: lang === l ? 'var(--accent)' : 'transparent',
              color: lang === l ? '#fff' : 'var(--text-tertiary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {l === 'hi' ? 'Hindi' : 'English'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSpeak}
          style={{
            background: isPlaying ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isPlaying ? 'var(--accent)' : 'var(--border-color)'}`,
            color: isPlaying ? '#fff' : 'var(--text-secondary)',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            boxShadow: isPlaying ? '0 0 15px var(--accent-alpha)' : 'none'
          }}
        >
          <span style={{ fontSize: '14px' }}>{isPlaying ? '⏹️' : '🎙️'}</span>
          {isPlaying ? 'Stop Briefing' : (lang === 'hi' ? 'Poora Logic Suniye' : 'Full AI Briefing')}
          
          {isPlaying && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '8px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 12, 4] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  style={{ width: '2px', background: '#fff', borderRadius: '1px' }}
                />
              ))}
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default VoiceAssistant;
