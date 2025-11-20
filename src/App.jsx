import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Sparkles, Search, X, Upload, Library, Book, Layers } from 'lucide-react';
import { read, utils } from 'xlsx';
import './App.css';

function App() {
  const fileInputRef = React.useRef(null);
  const [words, setWords] = useState(() => {
    const saved = localStorage.getItem('japanese-words');
    return saved ? JSON.parse(saved) : [];
  });

  // Ensure all existing words have a collection
  useEffect(() => {
    const hasUndefinedCollection = words.some(w => !w.collection);
    if (hasUndefinedCollection) {
      const updatedWords = words.map(w => ({
        ...w,
        collection: w.collection || 'My Vocabulary'
      }));
      setWords(updatedWords);
    }
  }, []);

  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [selectedGroup, setSelectedGroup] = useState('All');

  // Get unique collections
  const collections = ['All', ...new Set(words.map(w => w.collection || 'My Vocabulary'))].sort();

  // Filter words by collection first to get available groups
  const wordsInCollection = selectedCollection === 'All'
    ? words
    : words.filter(w => (w.collection || 'My Vocabulary') === selectedCollection);

  // Get groups available in the current collection
  const groups = ['All', ...new Set(wordsInCollection.map(w => w.group || 'Uncategorized'))].sort();

  useEffect(() => {
    localStorage.setItem('japanese-words', JSON.stringify(words));
  }, [words]);

  // Reset group when collection changes
  useEffect(() => {
    setSelectedGroup('All');
  }, [selectedCollection]);

  const addWord = (newWord) => {
    setWords([newWord, ...words]);
    setShowAddForm(false);
  };

  const deleteWord = (id) => {
    if (window.confirm('この単語を削除しますか？ (Delete this word?)')) {
      setWords(words.filter(w => w.id !== id));
    }
  };

  const filteredWords = wordsInCollection.filter(w => {
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
        let newWords = [];
        let collectionName = data.title || file.name.replace('.json', '');

        // Format 1: Simple array format (original)
        if (Array.isArray(data)) {
          newWords = data.map(item => ({
            id: Date.now() + Math.random(),
            kanji: item.kanji || item.word || '',
            furigana: item.furigana || item.reading || '',
            meaning: item.meaning || item['中文'] || '',
            example: item.example || item['例文'] || '',
            group: item.group || 'Imported',
            collection: collectionName,
            dateAdded: new Date().toISOString()
          })).filter(w => w.kanji && w.meaning);
        }
        // Format 2: N3 Vocabulary format with categories
        else if (data.categories && Array.isArray(data.categories)) {
          const allWords = [];
          data.categories.forEach(category => {
            if (category.words && Array.isArray(category.words)) {
              category.words.forEach(item => {
                allWords.push({
                  id: Date.now() + Math.random(),
                  kanji: item.word || item.kanji || item['普通形'] || '',
                  furigana: item.reading || item.furigana || '',
                  meaning: item.meaning || item['中文'] || '',
                  example: item.example || item['例文'] || '',
                  group: category.category || data.title || 'Imported',
                  collection: collectionName,
                  dateAdded: new Date().toISOString()
                });
              });
            }
            // Handle keigo format with verbs
            if (category.verbs && Array.isArray(category.verbs)) {
              category.verbs.forEach(item => {
                // For 尊敬語 (Keigo)
                if (item['尊敬語']) {
                  allWords.push({
                    id: Date.now() + Math.random(),
                    kanji: `${item['普通形']} → ${item['尊敬語']}`,
                    furigana: item.reading_keigo || item.reading || '',
                    meaning: `${item['中文']} (尊敬語)`,
                    example: item['例文'] || '',
                    group: category.category || '尊敬語',
                    collection: collectionName,
                    dateAdded: new Date().toISOString()
                  });
                }
                // For 謙譲語 (Kenjougo)
                if (item['謙譲語']) {
                  allWords.push({
                    id: Date.now() + Math.random(),
                    kanji: `${item['普通形']} → ${item['謙譲語']}`,
                    furigana: item.reading_kenjou || item.reading || '',
                    meaning: `${item['中文']} (謙譲語)`,
                    example: item['例文'] || '',
                    group: category.category || '謙譲語',
                    collection: collectionName,
                    dateAdded: new Date().toISOString()
                  });
                }
              });
            }
            // Handle business keigo situations
            if (category.situations && Array.isArray(category.situations)) {
              category.situations.forEach(situation => {
                if (situation.phrases && Array.isArray(situation.phrases)) {
                  situation.phrases.forEach(phrase => {
                    allWords.push({
                      id: Date.now() + Math.random(),
                      kanji: phrase['日本語'] || '',
                      furigana: phrase['用途'] || '',
                      meaning: phrase['中文'] || '',
                      example: `場面: ${situation.situation}`,
                      group: category.category || 'ビジネス敬語',
                      collection: collectionName,
                      dateAdded: new Date().toISOString()
                    });
                  });
                }
              });
            }
            // Handle patterns
            if (category.patterns && Array.isArray(category.patterns)) {
              category.patterns.forEach(pattern => {
                if (pattern['例'] && Array.isArray(pattern['例'])) {
                  pattern['例'].forEach(example => {
                    allWords.push({
                      id: Date.now() + Math.random(),
                      kanji: pattern.pattern || '',
                      furigana: pattern['説明'] || '',
                      meaning: example,
                      example: '',
                      group: category.category || 'パターン',
                      collection: collectionName,
                      dateAdded: new Date().toISOString()
                    });
                  });
                }
              });
            }
          });
          newWords = allWords.filter(w => w.kanji && w.meaning);
        }
        // Format 3: Object with direct words array
        else if (data.words && Array.isArray(data.words)) {
          newWords = data.words.map(item => ({
            id: Date.now() + Math.random(),
            kanji: item.word || item.kanji || '',
            furigana: item.reading || item.furigana || '',
            meaning: item.meaning || '',
            example: item.example || '',
            group: data.title || 'Imported',
            collection: collectionName,
            dateAdded: new Date().toISOString()
          })).filter(w => w.kanji && w.meaning);
        }

        if (newWords.length > 0) {
          setWords(prev => [...newWords, ...prev]);
          setSelectedCollection(collectionName); // Switch to new collection
          alert(`✅ ${newWords.length} words imported to "${collectionName}"!`);
        } else {
          alert('⚠️ No valid words found in the file. Please check the format.');
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);
        const collectionName = file.name.replace(/\.xlsx?$/, '');

        const newWords = jsonData.map(item => ({
          id: Date.now() + Math.random(),
          kanji: item.kanji || item.Kanji || item['漢字'] || '',
          furigana: item.furigana || item.Furigana || item['ふりがな'] || '',
          meaning: item.meaning || item.Meaning || item['意味'] || '',
          example: item.example || item.Example || item['例文'] || '',
          group: item.group || item.Group || item['グループ'] || 'Imported',
          collection: collectionName,
          dateAdded: new Date().toISOString()
        })).filter(w => w.kanji && w.meaning);

        setWords(prev => [...newWords, ...prev]);
        setSelectedCollection(collectionName);
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
              <option key={g} value={g}>{g === 'All' ? 'All Groups' : g}</option>
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

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-title">Collections (词库)</div>
          <div className="collection-list">
            {collections.map(c => {
              const count = c === 'All'
                ? words.length
                : words.filter(w => (w.collection || 'My Vocabulary') === c).length;

              return (
                <button
                  key={c}
                  className={`collection-item ${selectedCollection === c ? 'active' : ''}`}
                  onClick={() => setSelectedCollection(c)}
                >
                  <div className="collection-icon">
                    {c === 'All' ? <Layers size={18} /> : <Book size={18} />}
                  </div>
                  <span>{c}</span>
                  <span className="collection-count">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

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
              {filteredWords.length === 0 && (
                <div className="no-results">
                  <p>No words found in this collection/group.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showAddForm && (
        <AddWordModal
          onClose={() => setShowAddForm(false)}
          onAdd={addWord}
          currentCollection={selectedCollection === 'All' ? 'My Vocabulary' : selectedCollection}
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
          <div className="tags">
            {word.group && <span className="group-tag">{word.group}</span>}
            {word.collection && word.collection !== 'My Vocabulary' && (
              <span className="collection-tag">{word.collection}</span>
            )}
          </div>
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

function AddWordModal({ onClose, onAdd, currentCollection }) {
  const [formData, setFormData] = useState({
    kanji: '',
    furigana: '',
    meaning: '',
    example: '',
    group: '',
    collection: currentCollection
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
          <div className="form-row">
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
            <div className="form-group">
              <label>词库 (Collection)</label>
              <input
                type="text"
                value={formData.collection}
                onChange={e => setFormData({ ...formData, collection: e.target.value })}
              />
            </div>
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
