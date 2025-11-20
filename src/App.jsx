import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Sparkles, Search, X, Upload } from 'lucide-react';
import { read, utils } from 'xlsx';
import './App.css';

function App() {
  const fileInputRef = React.useRef(null);
  const [words, setWords] = useState(() => {
    const saved = localStorage.getItem('japanese-words');
    return saved ? JSON.parse(saved) : [];
  });
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  const groups = ['All', ...new Set(words.map(w => w.group || 'Uncategorized'))].sort();

  useEffect(() => {
    localStorage.setItem('japanese-words', JSON.stringify(words));
  }, [words]);

  const addWord = (newWord) => {
    setWords([newWord, ...words]);
    setShowAddForm(false);
  };

  const deleteWord = (id) => {
    if (window.confirm('この単語を削除しますか？ (Delete this word?)')) {
      setWords(words.filter(w => w.id !== id));
    }
  };

  const filteredWords = words.filter(w => {
    const matchesSearch =
      w.kanji.includes(searchTerm) ||
      w.furigana.includes(searchTerm) ||
      w.meaning.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'All' || (w.group || 'Uncategorized') === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          const newWords = data.map(item => ({
            id: Date.now() + Math.random(),
            kanji: item.kanji || '',
            furigana: item.furigana || '',
            meaning: item.meaning || '',
            example: item.example || '',
            group: item.group || 'Imported',
            dateAdded: new Date().toISOString()
          })).filter(w => w.kanji && w.meaning);

          setWords(prev => [...newWords, ...prev]);
          alert(`${newWords.length} words imported successfully!`);
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);

        const newWords = jsonData.map(item => ({
          id: Date.now() + Math.random(),
          kanji: item.kanji || item.Kanji || item['漢字'] || '',
          furigana: item.furigana || item.Furigana || item['ふりがな'] || '',
          meaning: item.meaning || item.Meaning || item['意味'] || '',
          example: item.example || item.Example || item['例文'] || '',
          group: item.group || item.Group || item['グループ'] || 'Imported',
          dateAdded: new Date().toISOString()
        })).filter(w => w.kanji && w.meaning);

        setWords(prev => [...newWords, ...prev]);
        alert(`${newWords.length} words imported successfully!`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import file. Please check the format.');
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <div className="logo-icon"><Sparkles size={20} /></div>
          <h1>日本語の単語帳</h1>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="検索 (Search)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="group-select"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.xlsx,.xls"
            style={{ display: 'none' }}
          />
          <button className="mode-btn" onClick={handleImportClick}>
            <Upload size={18} />
            Import
          </button>
          <button
            className={`mode-btn ${isStudyMode ? 'active' : ''}`}
            onClick={() => setIsStudyMode(!isStudyMode)}
          >
            <BookOpen size={18} />
            {isStudyMode ? '学習中' : '学習モード'}
          </button>
          <button className="add-btn" onClick={() => setShowAddForm(true)}>
            <Plus size={20} /> 新しい単語
          </button>
        </div>
      </header>

      <main className="main-content">
        {words.length === 0 && !showAddForm ? (
          <div className="empty-state">
            <div className="empty-icon">🌸</div>
            <h2>単語を追加しましょう</h2>
            <p>Start your journey by adding your first Japanese word.</p>
            <button className="add-btn-large" onClick={() => setShowAddForm(true)}>
              Add First Word
            </button>
          </div>
        ) : (
          <div className="word-grid">
            {filteredWords.map(word => (
              <WordCard
                key={word.id}
                word={word}
                isStudyMode={isStudyMode}
                onDelete={deleteWord}
              />
            ))}
          </div>
        )}
      </main>

      {showAddForm && (
        <AddWordModal
          onClose={() => setShowAddForm(false)}
          onAdd={addWord}
        />
      )}
    </div>
  );
}

function WordCard({ word, isStudyMode, onDelete }) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset reveal state when study mode changes or word changes
  useEffect(() => {
    setIsRevealed(!isStudyMode);
  }, [isStudyMode, word]);

  const handleCardClick = () => {
    if (isStudyMode) {
      setIsRevealed(!isRevealed);
    }
  };

  return (
    <div
      className={`word-card ${isStudyMode ? 'study-mode' : ''} ${isRevealed ? 'revealed' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-content">
        <div className="kanji-section">
          <h3 className="kanji">{word.kanji}</h3>
        </div>

        <div className={`info-section ${isRevealed ? 'visible' : 'hidden'}`}>
          <p className="furigana">{word.furigana}</p>
          <div className="divider"></div>
          <p className="meaning">{word.meaning}</p>
          {word.example && (
            <div className="example-box">
              <p className="example">{word.example}</p>
            </div>
          )}
          {word.group && <span className="group-tag">{word.group}</span>}
        </div>

        {!isRevealed && isStudyMode && (
          <div className="reveal-hint">
            <span>Click to reveal</span>
          </div>
        )}
      </div>

      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(word.id);
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function AddWordModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    kanji: '',
    furigana: '',
    meaning: '',
    example: '',
    group: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kanji || !formData.meaning) return;

    onAdd({
      id: Date.now(),
      ...formData,
      dateAdded: new Date().toISOString()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新しい単語 (New Word)</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>漢字 (Kanji)</label>
            <input
              type="text"
              placeholder="e.g. 猫"
              value={formData.kanji}
              onChange={e => setFormData({ ...formData, kanji: e.target.value })}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>ふりがな (Reading)</label>
            <input
              type="text"
              placeholder="e.g. ねこ"
              value={formData.furigana}
              onChange={e => setFormData({ ...formData, furigana: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>意味 (Meaning)</label>
            <input
              type="text"
              placeholder="e.g. Cat"
              value={formData.meaning}
              onChange={e => setFormData({ ...formData, meaning: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>例文 (Example Sentence)</label>
            <textarea
              placeholder="e.g. 猫が好きです。"
              value={formData.example}
              onChange={e => setFormData({ ...formData, example: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>グループ (Group)</label>
            <input
              type="text"
              placeholder="e.g. Week 1"
              value={formData.group}
              onChange={e => setFormData({ ...formData, group: e.target.value })}
              list="group-suggestions"
            />
            <datalist id="group-suggestions">
              <option value="Week 1" />
              <option value="Week 2" />
              <option value="Verbs" />
              <option value="Nouns" />
            </datalist>
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>キャンセル</button>
            <button type="submit" className="submit-btn">追加する</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
