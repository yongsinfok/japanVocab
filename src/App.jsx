import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, BookOpen, Sparkles, Search, X, Upload, Library, Book, Layers, ChevronRight, Settings, MoreHorizontal, Filter } from 'lucide-react';
import { read, utils } from 'xlsx';
import './App.css';

function App() {
  const fileInputRef = useRef(null);
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

  const [activeTab, setActiveTab] = useState('words'); // 'words', 'collections', 'menu'
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [showSearch, setShowSearch] = useState(false);

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
          setActiveTab('words');
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
        setActiveTab('words');
        alert(`${newWords.length} words imported successfully!`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import file. Please check the format.');
    }

    // Reset input
    e.target.value = '';
  };

  const handleCollectionSelect = (c) => {
    setSelectedCollection(c);
    setActiveTab('words');
  };

  return (
    <div className="ios-app">
      {/* Top Navigation Bar */}
      <header className="ios-navbar">
        <div className="ios-navbar-content">
          {activeTab === 'words' && (
            <>
              <div className="ios-navbar-left">
                {selectedCollection !== 'All' && (
                  <button className="ios-back-btn" onClick={() => setSelectedCollection('All')}>
                    <Layers size={20} />
                  </button>
                )}
              </div>
              <div className="ios-navbar-title">
                <h1>{selectedCollection === 'All' ? 'All Words' : selectedCollection}</h1>
              </div>
              <div className="ios-navbar-right">
                <button className="ios-icon-btn" onClick={() => setShowSearch(!showSearch)}>
                  <Search size={22} />
                </button>
                <button className="ios-icon-btn" onClick={() => setShowAddForm(true)}>
                  <Plus size={24} />
                </button>
              </div>
            </>
          )}
          {activeTab === 'collections' && (
            <div className="ios-navbar-title">
              <h1>Collections</h1>
            </div>
          )}
          {activeTab === 'menu' && (
            <div className="ios-navbar-title">
              <h1>Menu</h1>
            </div>
          )}
        </div>

        {/* Search Bar (Expandable) */}
        {activeTab === 'words' && showSearch && (
          <div className="ios-search-container">
            <div className="ios-search-bar">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <button className="clear-search" onClick={() => { setSearchTerm(''); setShowSearch(false); }}>
                Cancel
              </button>
            </div>
            {groups.length > 1 && (
              <div className="ios-filter-scroll">
                {groups.map(g => (
                  <button 
                    key={g} 
                    className={`filter-chip ${selectedGroup === g ? 'active' : ''}`}
                    onClick={() => setSelectedGroup(g)}
                  >
                    {g === 'All' ? 'All' : g}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="ios-content">
        {activeTab === 'words' && (
          <div className="words-view">
            {words.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🌸</div>
                <h2>No words yet</h2>
                <p>Tap + to add your first word</p>
              </div>
            ) : (
              <div className="word-list">
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
                    <p>No matches found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="collections-view">
            <div className="ios-list">
              {collections.map(c => {
                const count = c === 'All'
                  ? words.length
                  : words.filter(w => (w.collection || 'My Vocabulary') === c).length;
                
                return (
                  <button
                    key={c}
                    className={`ios-list-item ${selectedCollection === c ? 'active' : ''}`}
                    onClick={() => handleCollectionSelect(c)}
                  >
                    <div className="ios-list-icon">
                      {c === 'All' ? <Layers size={20} /> : <Book size={20} />}
                    </div>
                    <div className="ios-list-content">
                      <span className="ios-list-title">{c}</span>
                      <span className="ios-list-subtitle">{count} words</span>
                    </div>
                    <ChevronRight size={16} className="ios-chevron" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="menu-view">
            <div className="ios-section-title">Study</div>
            <div className="ios-list">
              <div className="ios-list-item toggle-item" onClick={() => setIsStudyMode(!isStudyMode)}>
                <div className="ios-list-icon"><BookOpen size={20} /></div>
                <div className="ios-list-content">
                  <span className="ios-list-title">Study Mode</span>
                  <span className="ios-list-subtitle">Hide meanings</span>
                </div>
                <div className={`ios-toggle ${isStudyMode ? 'on' : ''}`}>
                  <div className="ios-toggle-knob"></div>
                </div>
              </div>
            </div>

            <div className="ios-section-title">Data</div>
            <div className="ios-list">
              <button className="ios-list-item" onClick={handleImportClick}>
                <div className="ios-list-icon"><Upload size={20} /></div>
                <div className="ios-list-content">
                  <span className="ios-list-title">Import File</span>
                  <span className="ios-list-subtitle">JSON or Excel</span>
                </div>
                <ChevronRight size={16} className="ios-chevron" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,.xlsx,.xls"
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="app-info">
              <Sparkles size={24} className="app-logo-icon" />
              <p>Japanese Vocab v1.0</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="ios-tabbar">
        <button 
          className={`tab-item ${activeTab === 'words' ? 'active' : ''}`}
          onClick={() => setActiveTab('words')}
        >
          <Library size={24} />
          <span>Words</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          <Layers size={24} />
          <span>Collections</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          <MoreHorizontal size={24} />
          <span>Menu</span>
        </button>
      </nav>

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
      <div className="card-main">
        <div className="kanji-row">
          <h3 className="kanji">{word.kanji}</h3>
          {word.group && <span className="group-badge">{word.group}</span>}
        </div>
        
        <div className={`details-container ${isRevealed ? 'visible' : 'hidden'}`}>
          <p className="furigana">{word.furigana}</p>
          <p className="meaning">{word.meaning}</p>
          {word.example && <p className="example">{word.example}</p>}
        </div>
        
        {!isRevealed && isStudyMode && (
          <div className="tap-hint">Tap to reveal</div>
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
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <h2>New Word</h2>
          <button className="save-btn" onClick={handleSubmit}>Save</button>
        </div>
        <div className="modal-body">
          <div className="ios-form-group">
            <input
              type="text"
              placeholder="Kanji (e.g. 猫)"
              value={formData.kanji}
              onChange={e => setFormData({ ...formData, kanji: e.target.value })}
              autoFocus
            />
            <div className="divider"></div>
            <input
              type="text"
              placeholder="Reading (e.g. ねこ)"
              value={formData.furigana}
              onChange={e => setFormData({ ...formData, furigana: e.target.value })}
            />
            <div className="divider"></div>
            <input
              type="text"
              placeholder="Meaning (e.g. Cat)"
              value={formData.meaning}
              onChange={e => setFormData({ ...formData, meaning: e.target.value })}
            />
          </div>

          <div className="ios-form-group">
            <textarea
              placeholder="Example Sentence"
              value={formData.example}
              onChange={e => setFormData({ ...formData, example: e.target.value })}
              rows={3}
            />
          </div>

          <div className="ios-form-group">
            <input
              type="text"
              placeholder="Group (e.g. Week 1)"
              value={formData.group}
              onChange={e => setFormData({ ...formData, group: e.target.value })}
              list="group-suggestions"
            />
            <div className="divider"></div>
            <input
              type="text"
              placeholder="Collection"
              value={formData.collection}
              onChange={e => setFormData({ ...formData, collection: e.target.value })}
            />
          </div>
          
          <datalist id="group-suggestions">
            <option value="Week 1" />
            <option value="Week 2" />
            <option value="Verbs" />
            <option value="Nouns" />
          </datalist>
        </div>
      </div>
    </div>
  );
}

export default App;
