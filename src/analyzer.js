/**
 * Quill — Prose Analysis Engine
 * All 9 diagnostic modules for fiction manuscript analysis
 */

// ─── BUILT-IN WORD LISTS ───────────────────────────────────────────────────
import { scanAIPatterns, scanManuscriptAIPatterns } from './aiPatternScanner'

const ROMANTASY_MICRO_PHRASES = [
  'his jaw tightened','her jaw tightened','jaw tightens','jaw tightened',
  'my breath catches','breath caught','breath catches',
  'the air shifts','air shifted','air shifts',
  'i freeze','she freezes','he freezes','i froze',
  'silence stretches','silence stretched',
  'eyes darken','eyes darkened','his eyes darken','her eyes darken',
  'step closer','stepped closer','steps closer',
  'pulse jumps','pulse jumped','pulse quickens',
  'wings flare','wings flared',
  'something in my chest','something in her chest','something in his chest',
  'tether pulses','tether pulls','bond pulses',
  'my heart stutters','heart stutters','heart stutter',
  'heat floods','warmth floods','heat pooled',
  'stomach drops','stomach dropped','stomach lurches',
  'throat tightens','throat constricts',
  'chest aches','chest tightens','something ached',
  'i swallow','she swallowed','he swallowed',
  'the world narrows','world narrows','world narrowed',
  'time slows','time seemed to slow',
  'i can\'t breathe','couldn\'t breathe','can\'t look away',
  'skin prickles','skin prickled','skin tingled',
  'the ground shifts','ground shifted',
  'shadows curl','shadows shifted','darkness curled',
];

const AI_TELL_FILLERS = [
  'somehow','in that moment','at that moment','something in me',
  'the truth','a realization','suddenly realized','i realized',
  'it dawned on','it struck me','hit me like',
  'i couldn\'t help but','couldn\'t help but notice',
  'for a moment','for a brief moment','for just a moment',
  'in the silence','in the stillness','in the quiet',
  'my mind raced','thoughts raced','mind went blank',
  'words failed me','words escaped me',
  'the weight of','the gravity of','the magnitude of',
  'a part of me','a piece of me','deep down',
];

const OVERUSED_WORDS_ROMANTASY = [
  'fracture','fractured','fracturing','fractures',
  'surge','surged','surging','surges',
  'shatter','shattered','shattering',
  'pressure','core','hunger','hungry',
  'power','ancient','shadows','darkness',
  'blood','magic','eyes','chest',
  'breath','heart','hands','voice',
  'pull','push','need','want',
  'fire','ice','cold','heat',
];

const DIALOGUE_TAGS_FLAGGED = [
  'murmured','snarled','whispered','hissed','growled',
  'breathed','purred','snapped','barked','spat',
  'choked','gasped','croaked','drawled','intoned',
];

const ABSTRACT_FILLER = [
  'somehow','something','somehow managed','in some way',
  'sort of','kind of','a bit','slightly','rather',
  'quite','very','really','just','actually','literally',
  'basically','essentially','certainly','definitely',
];

const FLOW_FILLER_OPENERS = [
  'there was','there were','there is','there are',
  'it was','it is','it had been','it seemed',
  'she was','he was','i was','they were',
];

// ─── HELPERS ──────────────────────────────────────────────────────────────

function getSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g) || [];
}

function getWords(text) {
  return text.toLowerCase().match(/\b[a-z']+\b/g) || [];
}

function getSentenceStarter(sentence) {
  const trimmed = sentence.trim();
  const words = trimmed.split(/\s+/);
  return words.slice(0, 2).join(' ').replace(/[^a-zA-Z\s']/g, '').toLowerCase();
}

function wordFrequency(words) {
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return freq;
}

function phraseFrequency(text, phrases) {
  const lower = text.toLowerCase();
  const results = {};
  phrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 1) results[phrase] = matches.length;
  });
  return results;
}

function avgSentenceLength(sentences) {
  if (!sentences.length) return 0;
  const total = sentences.reduce((sum, s) => sum + getWords(s).length, 0);
  return total / sentences.length;
}

function getNearbyContext(sentences, index, window = 2) {
  const start = Math.max(0, index - window);
  const end = Math.min(sentences.length - 1, index + window);
  return sentences.slice(start, end + 1).join(' ');
}

// ─── MANUSCRIPT PARSER ────────────────────────────────────────────────────

export function parseManuscript(rawText) {
  const lines = rawText.split('\n');
  const chapters = [];
  let currentChapter = null;
  let currentScene = null;
  let chapterIndex = 0;

  const chapterPattern = /^(chapter\s+\d+|#\s*chapter\s*\d+|\*{0,3}chapter\s+\w+)/i;
  const sceneBreakPattern = /^(\*\s*\*\s*\*|---+|#{3,}|~+)$/;
  const povPattern = /^\*{1,2}([A-Z][a-z]+)\*{1,2}$|^POV:\s*([A-Z][a-z]+)/;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (chapterPattern.test(trimmed)) {
      chapterIndex++;
      currentChapter = {
        index: chapterIndex,
        title: trimmed.replace(/^#+\s*/, '').trim() || `Chapter ${chapterIndex}`,
        pov: null,
        scenes: [],
        rawText: '',
      };
      currentScene = { text: '', sentences: [] };
      currentChapter.scenes.push(currentScene);
      chapters.push(currentChapter);
      return;
    }

    if (!currentChapter) {
      currentChapter = {
        index: 0,
        title: 'Prologue / Pre-Chapter',
        pov: null,
        scenes: [],
        rawText: '',
      };
      currentScene = { text: '', sentences: [] };
      currentChapter.scenes.push(currentScene);
      chapters.push(currentChapter);
    }

    if (sceneBreakPattern.test(trimmed)) {
      currentScene = { text: '', sentences: [] };
      currentChapter.scenes.push(currentScene);
      return;
    }

    const povMatch = trimmed.match(povPattern);
    if (povMatch) {
      currentChapter.pov = povMatch[1] || povMatch[2];
      return;
    }

    if (trimmed) {
      currentScene.text += ' ' + trimmed;
      currentChapter.rawText += ' ' + trimmed;
    }
  });

  // Parse sentences for each scene
  chapters.forEach(ch => {
    ch.scenes.forEach(sc => {
      sc.sentences = getSentences(sc.text);
    });
    ch.allSentences = ch.scenes.flatMap(sc => sc.sentences);
  });

  return chapters;
}

// ─── MODULE 1: REPETITIVE SENTENCE STARTERS ──────────────────────────────

export function analyzeSentenceStarters(chapters, sensitivity = 3) {
  const issues = [];
  const threshold = Math.max(2, 5 - sensitivity);

  chapters.forEach(chapter => {
    const sentences = chapter.allSentences;
    const starterCounts = {};
    const starterPositions = {};

    sentences.forEach((s, i) => {
      const starter = getSentenceStarter(s);
      if (!starter || starter.length < 2) return;
      starterCounts[starter] = (starterCounts[starter] || 0) + 1;
      if (!starterPositions[starter]) starterPositions[starter] = [];
      starterPositions[starter].push(i);
    });

    Object.entries(starterCounts).forEach(([starter, count]) => {
      if (count < threshold) return;

      // Check for clustering (flags if repeats within 10 sentences)
      const positions = starterPositions[starter];
      const clusters = [];
      for (let i = 1; i < positions.length; i++) {
        if (positions[i] - positions[i - 1] <= 10) clusters.push(positions[i]);
      }

      const severity = count >= 8 ? 'high' : count >= 5 ? 'medium' : 'low';

      issues.push({
        type: 'sentence-starters',
        label: 'Repetitive Sentence Starter',
        severity,
        chapter: chapter.title,
        chapterIndex: chapter.index,
        phrase: starter,
        count,
        clusters: clusters.length,
        passage: sentences[positions[0]] || '',
        context: getNearbyContext(sentences, positions[0]),
        explanation: `The opener "${starter}" appears ${count} times in this chapter${clusters.length ? `, with ${clusters.length} close clusters` : ''}. Varied sentence openings keep prose rhythmically alive.`,
        alternatives: generateStarterAlternatives(starter, sentences[positions[0]]),
      });
    });
  });

  return issues;
}

function generateStarterAlternatives(starter, sentence) {
  const s = sentence?.trim() || '';
  if (!s) return [];
  const body = s.replace(/^[A-Z][a-z]+\s+/, '');
  return [
    `Consider inverting: "${body.charAt(0).toUpperCase() + body.slice(1)}"`,
    'Try starting with a setting detail, sensory beat, or action to vary the rhythm.',
    'An em-dash fragment before the main clause can break monotony without disrupting voice.',
  ];
}

// ─── MODULE 2: OUT-OF-PLACE PROSE ────────────────────────────────────────

export function analyzeOutOfPlaceProse(chapters) {
  const issues = [];

  const genericPhrases = [
    /\bshe smiled\b/gi, /\bhe nodded\b/gi, /\bshe nodded\b/gi,
    /\bhe smiled\b/gi, /\bshe laughed\b/gi, /\bhe laughed\b/gi,
    /\bit was clear that\b/gi, /\bit was obvious\b/gi,
    /\bshe was beautiful\b/gi, /\bhe was handsome\b/gi,
    /\bthe atmosphere was\b/gi, /\bthe mood was\b/gi,
    /\bfeelings? (of|of the|washed over)\b/gi,
  ];

  const modernSlip = [
    /\b(okay|ok|yep|nope|gonna|wanna|gotta|kinda|sorta|totally|literally|like,)\b/gi,
  ];

  chapters.forEach(chapter => {
    const sentences = chapter.allSentences;

    sentences.forEach((sentence, i) => {
      const lo = sentence.toLowerCase();

      genericPhrases.forEach(pattern => {
        if (pattern.test(lo)) {
          issues.push({
            type: 'out-of-place',
            label: 'Generic / Flat Prose',
            severity: 'low',
            chapter: chapter.title,
            chapterIndex: chapter.index,
            passage: sentence.trim(),
            context: getNearbyContext(sentences, i),
            explanation: 'This line reads as a generic stock description. In lyrical fantasy, even simple actions benefit from a fresh, voice-specific detail.',
            alternatives: [
              'Replace with a sensory or physical observation filtered through POV.',
              'What does this action reveal about character emotion rather than just noting the action?',
            ],
          });
        }
      });

      modernSlip.forEach(pattern => {
        if (pattern.test(lo)) {
          issues.push({
            type: 'out-of-place',
            label: 'Modern Register Slip',
            severity: 'medium',
            chapter: chapter.title,
            chapterIndex: chapter.index,
            passage: sentence.trim(),
            context: getNearbyContext(sentences, i),
            explanation: 'This sentence contains colloquial modern language that may break the lyrical fantasy register.',
            alternatives: [
              'Check if this is intentional voice characterization or an editorial slip.',
              'In dialogue, it may be fine; in narration, consider if it serves the POV\u2019s authentic voice.',
            ],
          });
        }
      });
    });
  });

  return issues;
}

// ─── MODULE 3: REPETITIVE MICRO-PHRASES ──────────────────────────────────

export function analyzeMicroPhrases(chapters, customPhrases = [], sensitivity = 3) {
  const issues = [];
  const allPhrases = [...ROMANTASY_MICRO_PHRASES, ...customPhrases];
  const threshold = Math.max(2, 4 - sensitivity);

  chapters.forEach(chapter => {
    const text = chapter.rawText.toLowerCase();
    allPhrases.forEach(phrase => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = [...text.matchAll(regex)];
      if (matches.length >= threshold) {
        const severity = matches.length >= 6 ? 'high' : matches.length >= 4 ? 'medium' : 'low';
        const sentenceIdx = chapter.allSentences.findIndex(s => s.toLowerCase().includes(phrase));
        issues.push({
          type: 'micro-phrases',
          label: 'Repeated Micro-Phrase',
          severity,
          chapter: chapter.title,
          chapterIndex: chapter.index,
          phrase,
          count: matches.length,
          passage: sentenceIdx >= 0 ? chapter.allSentences[sentenceIdx].trim() : `"${phrase}"`,
          context: sentenceIdx >= 0 ? getNearbyContext(chapter.allSentences, sentenceIdx) : '',
          explanation: `"${phrase}" appears ${matches.length} times. Emotional shorthand like this loses power through repetition — each use should feel earned.`,
          alternatives: [
            'Reserve this phrase for one high-impact moment; cut or vary the others.',
            'Show the physical sensation from a fresh angle each time — no two moments of fear feel identical.',
          ],
        });
      }
    });
  });

  return issues;
}

// ─── MODULE 4: DIALOGUE TAGS ──────────────────────────────────────────────

export function analyzeDialogueTags(chapters, sensitivity = 3) {
  const issues = [];
  const threshold = Math.max(3, 6 - sensitivity);

  chapters.forEach(chapter => {
    const tagCounts = {};
    const text = chapter.rawText;

    DIALOGUE_TAGS_FLAGGED.forEach(tag => {
      const regex = new RegExp(`\\b${tag}\\b`, 'gi');
      const matches = text.match(regex) || [];
      if (matches.length >= threshold) {
        tagCounts[tag] = matches.length;
      }
    });

    // Also check stacked action beats: ". + tag" within same sentence
    const sentences = chapter.allSentences;
    sentences.forEach((sentence, i) => {
      const hasTag = DIALOGUE_TAGS_FLAGGED.some(t => new RegExp(`\\b${t}\\b`, 'i').test(sentence));
      const hasBeat = /[.!?]"?\s+[A-Z]/.test(sentence) && sentence.includes('"');

      if (hasTag && hasBeat && sentence.split('"').length > 2) {
        issues.push({
          type: 'dialogue',
          label: 'Stacked Tag + Beat',
          severity: 'low',
          chapter: chapter.title,
          chapterIndex: chapter.index,
          passage: sentence.trim(),
          context: getNearbyContext(sentences, i),
          explanation: 'This line stacks an action beat and a dialogue tag together, which can feel redundant and slow the exchange.',
          alternatives: [
            'Use either the action beat OR the tag — rarely both.',
            '"Said" is invisible; most other tags call attention to themselves.',
          ],
        });
      }
    });

    Object.entries(tagCounts).forEach(([tag, count]) => {
      const severity = count >= 10 ? 'high' : count >= 6 ? 'medium' : 'low';
      const idx = sentences.findIndex(s => new RegExp(`\\b${tag}\\b`,'i').test(s));
      issues.push({
        type: 'dialogue',
        label: 'Overused Dialogue Tag',
        severity,
        chapter: chapter.title,
        chapterIndex: chapter.index,
        phrase: tag,
        count,
        passage: idx >= 0 ? sentences[idx].trim() : `"${tag}" overused`,
        context: idx >= 0 ? getNearbyContext(sentences, idx) : '',
        explanation: `"${tag}" appears ${count} times in this chapter. Distinctive tags become noticeable when repeated and can undercut tension.`,
        alternatives: [
          `Replace several uses of "${tag}" with action beats that reveal the same emotion.`,
          '"Said" and "asked" carry dialogue without drawing attention.',
        ],
      });
    });
  });

  return issues;
}

// ─── MODULE 5: AI-TELL PATTERNS ──────────────────────────────────────────

export function analyzeAITell(chapters, sensitivity = 3, strictMode = false) {
  const issues = [];
  const threshold = strictMode ? 1 : Math.max(2, 4 - sensitivity);

  // Symmetrical sentence detector
  const symmetryPattern = /^(.{15,40}),\s+(?:and|but|while|as)\s+(.{15,40})[.!?]$/i;

  // Explanatory restatement: a sentence that basically restates the one before
  chapters.forEach(chapter => {
    const sentences = chapter.allSentences;
    const text = chapter.rawText;

    // Filler word overuse
    ABSTRACT_FILLER.forEach(filler => {
      const regex = new RegExp(`\\b${filler.replace(/\s+/g,'\\s+')}\\b`, 'gi');
      const matches = text.match(regex) || [];
      if (matches.length >= threshold + 1) {
        const idx = sentences.findIndex(s => new RegExp(`\\b${filler}\\b`,'i').test(s));
        issues.push({
          type: 'ai-tell',
          label: 'Abstract Filler Word',
          severity: matches.length >= 8 ? 'medium' : 'low',
          chapter: chapter.title,
          chapterIndex: chapter.index,
          phrase: filler,
          count: matches.length,
          passage: idx >= 0 ? sentences[idx].trim() : `"${filler}" used ${matches.length}×`,
          context: idx >= 0 ? getNearbyContext(sentences, idx) : '',
          explanation: `"${filler}" appears ${matches.length} times. Abstract hedges can make prose feel vague and mechanically generated rather than immediate and specific.`,
          alternatives: [
            'Replace with a concrete physical or sensory detail.',
            'If the vagueness is intentional for the POV, anchor it in a specific object or action.',
          ],
        });
      }
    });

    // Symmetrical sentence structures
    sentences.forEach((sentence, i) => {
      if (symmetryPattern.test(sentence.trim())) {
        issues.push({
          type: 'ai-tell',
          label: 'Symmetrical Sentence',
          severity: 'low',
          chapter: chapter.title,
          chapterIndex: chapter.index,
          passage: sentence.trim(),
          context: getNearbyContext(sentences, i),
          explanation: 'Perfectly balanced compound sentences ("X happened, and Y happened") can feel mechanically constructed when they recur. Human prose tends toward asymmetry.',
          alternatives: [
            'Break into two shorter sentences with different lengths.',
            'Let one clause dominate — fragment the secondary observation.',
          ],
        });
      }
    });

    // Emotional over-explaining
    const overExplainPattern = /\b(i felt|i knew|i understood|i realized|i thought|she felt|he felt|she knew|he knew)\b/gi;
    const overMatches = text.match(overExplainPattern) || [];
    if (overMatches.length >= threshold + 1) {
      const idx = sentences.findIndex(s => overExplainPattern.test(s));
      overExplainPattern.lastIndex = 0;
      issues.push({
        type: 'ai-tell',
        label: 'Emotional Over-Explaining',
        severity: overMatches.length >= 10 ? 'medium' : 'low',
        chapter: chapter.title,
        chapterIndex: chapter.index,
        count: overMatches.length,
        passage: idx >= 0 ? sentences[idx].trim() : 'Multiple instances in chapter',
        context: idx >= 0 ? getNearbyContext(sentences, idx) : '',
        explanation: `"I felt / I knew / I realized" constructions appear ${overMatches.length} times. Show the physical or behavioral manifestation instead of naming the emotion.`,
        alternatives: [
          'Replace "I felt terror" with what terror does to the body.',
          '"I knew" is often unnecessary — if the narrator knows it, just state it.',
        ],
      });
    }
  });

  return issues;
}

// ─── MODULE 6: POV CONSISTENCY ───────────────────────────────────────────

export function analyzePOVConsistency(chapters) {
  const issues = [];

  // Gather POV character names from all chapters
  const povNames = new Set(chapters.map(c => c.pov).filter(Boolean));

  if (povNames.size < 2) return issues; // single POV — skip

  // Build per-POV vocabulary fingerprints
  const povVocab = {};
  chapters.forEach(chapter => {
    if (!chapter.pov) return;
    const words = getWords(chapter.rawText);
    const freq = wordFrequency(words);
    if (!povVocab[chapter.pov]) {
      povVocab[chapter.pov] = { freq: {}, total: 0 };
    }
    Object.entries(freq).forEach(([w, c]) => {
      povVocab[chapter.pov].freq[w] = (povVocab[chapter.pov].freq[w] || 0) + c;
      povVocab[chapter.pov].total += c;
    });
  });

  // Per-POV avg sentence length
  const povAvgLen = {};
  chapters.forEach(chapter => {
    if (!chapter.pov) return;
    if (!povAvgLen[chapter.pov]) povAvgLen[chapter.pov] = [];
    povAvgLen[chapter.pov].push(avgSentenceLength(chapter.allSentences));
  });

  const povMeans = {};
  Object.entries(povAvgLen).forEach(([pov, lens]) => {
    povMeans[pov] = lens.reduce((a,b)=>a+b,0)/lens.length;
  });

  // Flag chapters where sentence length deviates significantly from POV mean
  const names = [...povNames];
  if (names.length >= 2) {
    chapters.forEach(chapter => {
      if (!chapter.pov) return;
      const mean = povMeans[chapter.pov];
      const thisAvg = avgSentenceLength(chapter.allSentences);
      if (Math.abs(thisAvg - mean) > mean * 0.35) {
        issues.push({
          type: 'pov',
          label: 'POV Voice Drift',
          severity: 'medium',
          chapter: chapter.title,
          chapterIndex: chapter.index,
          passage: `${chapter.pov} — avg sentence length ${thisAvg.toFixed(1)} vs. typical ${mean.toFixed(1)} words`,
          context: chapter.allSentences.slice(0, 3).join(' '),
          explanation: `${chapter.pov}'s sentences in this chapter average ${thisAvg.toFixed(1)} words vs. their usual ${mean.toFixed(1)}. A significant rhythm shift may signal voice drift or inconsistent editing.`,
          alternatives: [
            'Compare this chapter\u2019s opening paragraph to an established chapter for the same POV.',
            'Check whether a different character\u2019s voice bleeds into the narration here.',
          ],
        });
      }
    });
  }

  return issues;
}

// ─── MODULE 7: WORD OVERUSE ───────────────────────────────────────────────

export function analyzeWordOveruse(chapters, customWords = [], sensitivity = 3) {
  const issues = [];
  const allWords = [...OVERUSED_WORDS_ROMANTASY, ...customWords];
  const totalWords = chapters.reduce((sum, c) => sum + getWords(c.rawText).length, 0);
  const baseThreshold = Math.max(8, Math.round(totalWords / 800));
  const chapterThreshold = Math.max(3, 5 - sensitivity);

  // Full manuscript frequency
  const fullText = chapters.map(c => c.rawText).join(' ');
  const fullWords = getWords(fullText);
  const fullFreq = wordFrequency(fullWords);

  allWords.forEach(word => {
    const count = fullFreq[word] || 0;
    if (count >= baseThreshold) {
      const severity = count >= baseThreshold * 3 ? 'high' : count >= baseThreshold * 1.5 ? 'medium' : 'low';
      // Find first chapter containing it
      const ch = chapters.find(c => c.rawText.toLowerCase().includes(word));
      const idx = ch ? ch.allSentences.findIndex(s => s.toLowerCase().includes(word)) : -1;
      issues.push({
        type: 'overuse',
        label: 'Word Overuse',
        severity,
        chapter: 'Full Manuscript',
        chapterIndex: -1,
        phrase: word,
        count,
        passage: ch && idx >= 0 ? ch.allSentences[idx].trim() : `"${word}" — ${count} uses`,
        context: ch && idx >= 0 ? getNearbyContext(ch.allSentences, idx) : '',
        explanation: `"${word}" appears ${count} times across the manuscript (~1 per ${Math.round(totalWords/count)} words). High-frequency words lose their weight and register as verbal tics.`,
        alternatives: [
          `Do a Find & Replace audit for "${word}" and cut at least half the instances.`,
          'Vary with specific synonyms that carry the same emotional register without repetition.',
        ],
      });
    }
  });

  return issues;
}

// ─── MODULE 8: FLOW & CADENCE ─────────────────────────────────────────────

export function analyzeFlowAndCadence(chapters, sensitivity = 3) {
  const issues = [];
  const runThreshold = Math.max(4, 6 - sensitivity);

  chapters.forEach(chapter => {
    const sentences = chapter.allSentences;
    if (sentences.length < 5) return;

    let shortRun = 0, longRun = 0, shortStart = 0, longStart = 0;

    sentences.forEach((s, i) => {
      const wc = getWords(s).length;
      if (wc <= 6) {
        shortRun++;
        longRun = 0;
        if (shortRun === 1) shortStart = i;
        if (shortRun === runThreshold) {
          issues.push({
            type: 'cadence',
            label: 'Staccato Run',
            severity: 'low',
            chapter: chapter.title,
            chapterIndex: chapter.index,
            passage: sentences.slice(shortStart, i + 1).join(' '),
            context: getNearbyContext(sentences, i),
            explanation: `${shortRun}+ very short sentences in a row. Clipped prose creates urgency but can feel choppy if sustained; mix in a longer sentence to breathe.`,
            alternatives: [
              'Combine two adjacent short sentences with a comma or semicolon.',
              'Expand one short sentence with a sensory or emotional clause.',
            ],
          });
        }
      } else if (wc >= 30) {
        longRun++;
        shortRun = 0;
        if (longRun === 1) longStart = i;
        if (longRun >= 3) {
          issues.push({
            type: 'cadence',
            label: 'Extended Run-On Stretch',
            severity: 'low',
            chapter: chapter.title,
            chapterIndex: chapter.index,
            passage: sentences.slice(longStart, i + 1).join(' '),
            context: getNearbyContext(sentences, i),
            explanation: `${longRun}+ long sentences in a row without a short break. Readers need rhythmic variation — a fragment or short sentence resets the pace.`,
            alternatives: [
              'Insert a short declarative sentence or fragment after the second long sentence.',
              'Look for a clause that earns its own line as a standalone beat.',
            ],
          });
          longRun = 0; // reset to avoid duplicate flags
        }
      } else {
        shortRun = 0;
        longRun = 0;
      }
    });

    // Filler sentence openers (there was / it was)
    const fillerCount = sentences.filter(s =>
      FLOW_FILLER_OPENERS.some(f => s.trim().toLowerCase().startsWith(f))
    ).length;
    if (fillerCount >= runThreshold) {
      issues.push({
        type: 'cadence',
        label: 'Weak Sentence Openers',
        severity: 'low',
        chapter: chapter.title,
        chapterIndex: chapter.index,
        count: fillerCount,
        passage: `${fillerCount} sentences begin with "there was/were" or "it was"`,
        context: sentences.slice(0, 3).join(' '),
        explanation: `"There was / It was / She was" openings are empty scaffolding. Starting with the active noun or verb is almost always stronger.`,
        alternatives: [
          '"There was a crack of thunder" → "Thunder cracked."',
          '"It was cold" → "Cold pressed through the stone walls."',
        ],
      });
    }
  });

  return issues;
}

// ─── MODULE 9: GENRE VOICE ALIGNMENT ─────────────────────────────────────

export function analyzeGenreVoice(chapters, genre = 'romantasy') {
  const issues = [];

  if (genre !== 'romantasy' && genre !== 'fantasy') return issues;

  // Romantasy: watch for prose that's too clinical or instructional
  const clinicalPatterns = [
    /\bin order to\b/gi,
    /\bdue to the fact\b/gi,
    /\bas a result of\b/gi,
    /\bit is important to\b/gi,
    /\bthe purpose of\b/gi,
    /\bthis is because\b/gi,
    /\bwhich means that\b/gi,
    /\bspecifically\b/gi,
  ];

  chapters.forEach(chapter => {
    const sentences = chapter.allSentences;

    clinicalPatterns.forEach(pattern => {
      sentences.forEach((sentence, i) => {
        if (pattern.test(sentence)) {
          issues.push({
            type: 'genre-voice',
            label: 'Non-Lyrical Register',
            severity: 'low',
            chapter: chapter.title,
            chapterIndex: chapter.index,
            passage: sentence.trim(),
            context: getNearbyContext(sentences, i),
            explanation: 'This phrasing reads as expository or clinical — more fitting for non-fiction or technical writing. Dark fantasy / romantasy thrives on sensory immediacy, not logical scaffolding.',
            alternatives: [
              'Recast this as an observation or felt experience rather than an explanation.',
              'Let the narrative show cause-and-effect through action, not connective logic.',
            ],
          });
        }
      });
    });
  });

  return issues;
}

// ─── MASTER ANALYZER ─────────────────────────────────────────────────────

export function analyzeManuscript(chapters, settings = {}) {
  const {
    sensitivity = 3,
    genre = 'romantasy',
    customPhrases = [],
    customBannedWords = [],
    strictAIMode = false,
  } = settings;

  let allIssues = [
    ...analyzeSentenceStarters(chapters, sensitivity),
    ...analyzeOutOfPlaceProse(chapters),
    ...analyzeMicroPhrases(chapters, customPhrases, sensitivity),
    ...analyzeDialogueTags(chapters, sensitivity),
    ...analyzeAITell(chapters, sensitivity, strictAIMode),
    ...analyzePOVConsistency(chapters),
    ...analyzeWordOveruse(chapters, customBannedWords, sensitivity),
    ...analyzeFlowAndCadence(chapters, sensitivity),
    ...analyzeGenreVoice(chapters, genre),
  ];

  // Run AI Pattern Scanner
  const aiIssues = [];
  chapters.forEach(chapter => {
    const flags = scanAIPatterns(chapter);
    flags.forEach(f => {
      aiIssues.push({
        type: 'ai-pattern',
        label: f.ruleId,
        severity: f.confidence === 'High' ? 'high' : f.confidence === 'Moderate' ? 'medium' : 'low',
        chapter: chapter.title,
        chapterIndex: chapter.index,
        passage: f.text,
        context: f.context || f.text,
        explanation: `${f.explanation} This structural pattern is commonly associated with AI-generated prose.`,
        alternatives: ['Review this passage for over-structuring to ensure the prose remains sharp.'],
      });
    });
  });

  const globalFlags = scanManuscriptAIPatterns(chapters);
  globalFlags.forEach(f => {
    aiIssues.push({
        type: 'ai-pattern',
        label: f.ruleId,
        severity: f.confidence === 'High' ? 'high' : f.confidence === 'Moderate' ? 'medium' : 'low',
        chapter: 'Manuscript-Level',
        chapterIndex: -1,
        passage: f.text,
        context: f.context || f.text,
        explanation: `${f.explanation} This structural pattern is commonly associated with AI-generated prose.`,
        alternatives: ['Review this concept or pattern across multiple chapters.'],
    });
  });

  allIssues = [...allIssues, ...aiIssues];

  // Deduplicate very similar passages in the same chapter
  const seen = new Set();
  const deduplicated = allIssues.filter(issue => {
    const key = `${issue.chapterIndex}|${issue.type}|${issue.phrase || issue.passage?.slice(0,40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduplicated.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2, note: 3 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });
}

// ─── STATS SUMMARY ────────────────────────────────────────────────────────

export function buildStats(chapters, issues) {
  const totalWords = chapters.reduce((sum, c) => sum + getWords(c.rawText).length, 0);
  const byType = {};
  const bySeverity = { high: 0, medium: 0, low: 0, note: 0 };
  const byChapter = {};

  issues.forEach(issue => {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
    const k = issue.chapterIndex;
    if (!byChapter[k]) byChapter[k] = 0;
    byChapter[k]++;
  });

  // Top repeated phrases
  const fullText = chapters.map(c => c.rawText).join(' ');
  const phraseFreq = phraseFrequency(fullText, ROMANTASY_MICRO_PHRASES);
  const topPhrases = Object.entries(phraseFreq)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10);

  // Top sentence starters
  const allSentences = chapters.flatMap(c => c.allSentences);
  const starterFreq = {};
  allSentences.forEach(s => {
    const st = getSentenceStarter(s);
    if (st && st.length > 1) starterFreq[st] = (starterFreq[st] || 0) + 1;
  });
  const topStarters = Object.entries(starterFreq)
    .filter(([,c]) => c >= 3)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10);

  return {
    totalWords,
    totalSentences: allSentences.length,
    totalChapters: chapters.length,
    totalIssues: issues.length,
    byType,
    bySeverity,
    byChapter,
    topPhrases,
    topStarters,
    povCharacters: [...new Set(chapters.map(c=>c.pov).filter(Boolean))],
  };
}
