/**
 * bot.js – Client-side Q&A engine for the Rich Dad Poor Dad bot.
 *
 * Algorithm:
 *  1. Load the book text file.
 *  2. Split into paragraph chunks.
 *  3. Build an inverted index (word → [chunk ids]).
 *  4. For each user query, extract keywords, score chunks by TF-IDF-style
 *     overlap, and return the best-matching passage as the answer.
 */

'use strict';

class RichDadBot {
  constructor() {
    this.chunks      = [];   // Array of paragraph strings
    this.index       = {};   // word → Set of chunk indices
    this.idf         = {};   // word → idf score
    this.ready       = false;
    this.STOP_WORDS  = new Set([
      'a','an','the','is','it','in','on','at','to','for','of','and','or',
      'but','not','with','this','that','are','was','were','be','been',
      'have','has','had','do','does','did','will','would','could','should',
      'may','might','shall','can','i','you','he','she','we','they','me',
      'him','her','us','them','my','your','his','its','our','their',
      'what','how','when','where','who','which','why','if','about',
      'from','by','as','up','so','then','than','also','more','just',
      'like','very','all','any','some','no','out','into','over','after',
    ]);
  }

  /* ---------- Public API ---------- */

  /** Load and index the book text. Returns a Promise. */
  async load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load content: ${response.status}`);
    const text = await response.text();
    this._buildIndex(text);
    this.ready = true;
  }

  /**
   * Answer a question.
   * @param {string} question
   * @returns {{ answer: string, confidence: number }}
   */
  answer(question) {
    if (!this.ready) return { answer: 'I am still loading the book content. Please wait a moment.', confidence: 0 };

    const keywords = this._extractKeywords(question);
    if (keywords.length === 0) {
      return { answer: "I didn't understand your question. Please try rephrasing it with more specific terms about the book.", confidence: 0 };
    }

    const scored = this._scoreChunks(keywords, question);
    if (scored.length === 0 || scored[0].score === 0) {
      return {
        answer: "I couldn't find relevant information about that topic in the book. Try asking about: assets, liabilities, financial freedom, investing, cash flow, or the rich dad vs poor dad mindset.",
        confidence: 0
      };
    }

    // Build the answer from top-scoring chunks
    const topChunks = scored.slice(0, 2).map(s => s.text);
    const answer    = topChunks.join('\n\n');
    const confidence = Math.min(scored[0].score / (keywords.length * 2), 1);

    return { answer, confidence };
  }

  /* ---------- Private Methods ---------- */

  /** Split text into paragraph chunks and build inverted index. */
  _buildIndex(text) {
    // Split on blank lines (paragraph breaks) and filter short lines
    const raw = text.split(/\n\s*\n/).map(p => p.replace(/\n/g, ' ').trim());
    this.chunks = raw.filter(p => p.length > 60);

    // Build index and compute TF for IDF calculation
    const df = {}; // document frequency per word

    this.chunks.forEach((chunk, idx) => {
      const words = this._tokenize(chunk);
      const seen  = new Set();
      words.forEach(word => {
        if (!this.index[word]) this.index[word] = new Set();
        this.index[word].add(idx);
        if (!seen.has(word)) {
          df[word] = (df[word] || 0) + 1;
          seen.add(word);
        }
      });
    });

    // Pre-compute IDF scores
    const N = this.chunks.length;
    Object.keys(df).forEach(word => {
      this.idf[word] = Math.log((N + 1) / (df[word] + 1)) + 1;
    });

    // Build sorted vocabulary array for efficient prefix lookups
    this._vocab = Object.keys(this.index).sort();
  }

  /** Score each chunk against the query keywords. */
  _scoreChunks(keywords, originalQuery) {
    const scores = new Map();
    const queryWords = this._tokenize(originalQuery);

    keywords.forEach(kw => {
      // Exact keyword match
      if (this.index[kw]) {
        this.index[kw].forEach(idx => {
          const w = this.idf[kw] || 1;
          scores.set(idx, (scores.get(idx) || 0) + w);
        });
      }
      // Partial / stemmed match – use binary search on sorted vocab to find
      // words that share a prefix with the keyword, avoiding a full O(m) scan.
      const partialWeight = 0.5;
      const prefix = kw.length >= 4 ? kw.slice(0, Math.ceil(kw.length * 0.7)) : kw;
      const start = this._lowerBound(this._vocab, prefix);
      for (let vi = start; vi < this._vocab.length; vi++) {
        const indexWord = this._vocab[vi];
        if (!indexWord.startsWith(prefix)) break;
        if (indexWord === kw) continue; // already handled above
        this.index[indexWord].forEach(idx => {
          scores.set(idx, (scores.get(idx) || 0) + partialWeight);
        });
      }
    });

    // Bonus: exact phrase presence
    const queryLower = originalQuery.toLowerCase();
    this.chunks.forEach((chunk, idx) => {
      // Boost chunks that contain longer query phrases
      queryWords.forEach(qw => {
        if (chunk.toLowerCase().includes(qw)) {
          scores.set(idx, (scores.get(idx) || 0) + 0.3);
        }
      });
    });

    // Convert to array and sort by score descending
    return Array.from(scores.entries())
      .map(([idx, score]) => ({ idx, score, text: this.chunks[idx] }))
      .sort((a, b) => b.score - a.score);
  }

  /** Extract meaningful keywords from a question string. */
  _extractKeywords(question) {
    return this._tokenize(question).filter(w => !this.STOP_WORDS.has(w) && w.length > 2);
  }

  /** Lowercase, strip punctuation, split into words. */
  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /**
   * Binary search: returns the first index in sorted array `arr` where
   * arr[i] >= `target` (lower bound / leftmost insertion point).
   */
  _lowerBound(arr, target) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}

// Export for use in app.js (module-style or global)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RichDadBot;
} else {
  window.RichDadBot = RichDadBot;
}
