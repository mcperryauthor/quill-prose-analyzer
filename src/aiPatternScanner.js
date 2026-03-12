/**
 * AI Structural Pattern Scanner
 * Scans manuscripts for repetitive structural habits often associated with
 * AI-generated prose. Identifies sentence, paragraph, and scene-level patterns.
 */

// ─── RULE CONFIGURATION ──────────────────────────────────────────────────

const CONFIDENCE = {
  LOW: 'Low',
  MOD: 'Moderate',
  HIGH: 'High'
}

// R1: Post-Action Explanation
const POST_ACTION_TRIGGERS = [
  'the words hit me', 'the words slice through', 'realization hits',
  'i understand', 'i realize', 'it means', 'the implication', 'the truth is',
  'suddenly makes sense', 'hit me like a'
]

// R2: Thematic Summary Statements
const THEMATIC_SUMMARY_TRIGGERS = [
  'the truth is', 'power is', 'power always', 'this is how', 'the nature of',
  'the world is', 'this is what happens', 'love is', 'fear is', 'death is'
]

// R4: Sensory Stacking
// If a sentence has 3+ commas and "and", it might be a list. We will do a basic check for list of adverbs/adjectives.
// Specifically looking for 3 or more sensory words in one sentence.
const SENSORY_WORDS = [
  'smell', 'scent', 'sweet', 'floral', 'artificial', 'metallic', 'acrid', 'musky', 'damp',
  'warm', 'cold', 'hot', 'freezing', 'chill', 'burning', 'scorching', 'icy',
  'soft', 'rough', 'smooth', 'hard', 'sharp', 'dull', 'slick', 'sticky', 'gritty',
  'loud', 'quiet', 'silent', 'deafening', 'muffled', 'harsh', 'ringing', 'echo',
  'bright', 'dark', 'dim', 'blinding', 'shadow', 'glow'
]

// R5: Dialogue Interpretation
const DIALOGUE_INTERPRETATION_TRIGGERS = [
  'accusation', 'threat', 'insult', 'implication', 'reminder', 'realization',
  'warning', 'promise', 'vow', 'lie', 'truth'
]

// R6: Instant Psychological Declarations
const INSTANT_PSYCH_TRIGGERS = [
  'i am broken', 'i am ruined', 'i am weak', 'i am nothing', 'i am a monster',
  'i am shattered', 'i am lost', 'i am empty'
]

// R8: Philosophical Narrator Voice
const PHILOSOPHICAL_TRIGGERS = [
  'everyone', 'no one', 'always', 'never', 'humanity', 'the world', 'truth', 'destiny',
  'we all', 'fate', 'inevitable'
]

// R9: Moralized Scene Endings
const MORAL_SCENE_END_TRIGGERS = [
  'i understand now', 'everything changes', 'nothing will ever be the same',
  'now i see', 'there is no going back', 'the world has shifted',
  'i know what i have to do'
]

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

function getSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g) || []
}

function getParagraphs(text) {
  return text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0)
}

function extractSentences(text) {
  // A slightly more robust sentence extractor that keeps track of the original index in paragraph
  const sentences = []
  let match
  const regex = /[^.!?]+[.!?]+/g
  while ((match = regex.exec(text)) !== null) {
    sentences.push(match[0].trim())
  }
  return sentences
}

function wordCount(text) {
  return (text.match(/\b\w+\b/g) || []).length
}

// ─── PATTERN RULES ─────────────────────────────────────────────────────────

function checkRule1PostActionExplanation(sentences) {
  const flags = []
  for (let i = 0; i < sentences.length - 1; i++) {
    const s1 = sentences[i].toLowerCase()
    const s2 = sentences[i+1].toLowerCase()
    
    // Check if s1 is dialogue or action (we'll assume dialogue if it has quotes)
    const isDialogue = s1.includes('"') || s1.includes("'")
    
    // Check if s2 contains a post-action trigger
    const hasTrigger = POST_ACTION_TRIGGERS.some(t => s2.includes(t))
    
    if (isDialogue && hasTrigger) {
      flags.push({
        ruleId: 'Rule 1: Post-Action Explanation',
        confidence: CONFIDENCE.MOD,
        text: `${sentences[i]} ${sentences[i+1]}`,
        explanation: 'Explaining the emotional meaning of dialogue immediately after it occurs.'
      })
    }
  }
  return flags
}

function checkRule2ThematicSummary(sentences) {
  const flags = []
  sentences.forEach(s => {
    const sl = s.toLowerCase()
    
    // Check for "X is not Y. It is Z" pattern approximately (within same sentence if joined by semicolon or just consecutive)
    const isNotYItIsZ = sl.match(/\bis not\b.+\bit is\b/)
    const hasTrigger = THEMATIC_SUMMARY_TRIGGERS.some(t => sl.includes(t))
    
    if (isNotYItIsZ || hasTrigger) {
      if (wordCount(sl) < 15) { // Usually these are short, punchy statements
        flags.push({
          ruleId: 'Rule 2: Thematic Summary Statement',
          confidence: CONFIDENCE.MOD,
          text: s,
          explanation: 'Short philosophical statement summarizing the meaning of a scene.'
        })
      }
    }
  })
  return flags
}

function checkRule3SymmetricalRhetorical(sentences) {
  const flags = []
  // Simplistic check for 2+ consecutive sentences starting with the same 3 words
  let consecutiveMatches = 0
  let matchStartSentence = ''
  
  for (let i = 0; i < sentences.length - 1; i++) {
    const words1 = sentences[i].toLowerCase().match(/\b\w+\b/g) || []
    const words2 = sentences[i+1].toLowerCase().match(/\b\w+\b/g) || []
    
    if (words1.length >= 3 && words2.length >= 3) {
      if (words1[0] === words2[0] && words1[1] === words2[1] && words1[2] === words2[2]) {
        flags.push({
          ruleId: 'Rule 3: Symmetrical Rhetorical Structure',
          confidence: CONFIDENCE.MOD,
          text: `${sentences[i]} ${sentences[i+1]}`,
          explanation: 'Repeated balanced sentences used for emphasis.'
        })
      }
    }
  }
  return flags
}

function checkRule4SensoryStacking(sentences) {
  const flags = []
  sentences.forEach(s => {
    const sl = s.toLowerCase()
    let sensoryCount = 0
    let foundWords = []
    
    SENSORY_WORDS.forEach(word => {
      if (new RegExp(`\\b${word}\\b`).test(sl)) {
        sensoryCount++
        foundWords.push(word)
      }
    })
    
    if (sensoryCount >= 3) {
      flags.push({
        ruleId: 'Rule 4: Sensory Stacking',
        confidence: CONFIDENCE.HIGH,
        text: s,
        explanation: `Multiple sensory descriptions stacked in one sentence (${foundWords.slice(0, 3).join(', ')}).`
      })
    }
  })
  return flags
}

function checkRule5DialogueInterpretation(sentences) {
  const flags = []
  for (let i = 0; i < sentences.length - 1; i++) {
    const s1 = sentences[i].toLowerCase()
    const s2 = sentences[i+1].toLowerCase()
    
    const isDialogue = s1.includes('"') || s1.includes("'")
    
    // Check if s2 starts with or contains "The [trigger] hangs/is/etc"
    const hasTrigger = DIALOGUE_INTERPRETATION_TRIGGERS.some(t => {
      const re = new RegExp(`\\bthe ${t}\\b`)
      return re.test(s2)
    })
    
    if (isDialogue && hasTrigger) {
      flags.push({
        ruleId: 'Rule 5: Dialogue Interpretation',
        confidence: CONFIDENCE.HIGH,
        text: `${sentences[i]} ${sentences[i+1]}`,
        explanation: 'Explaining what dialogue means rather than letting the action carry the emotion.'
      })
    }
  }
  return flags
}

function checkRule6InstantPsych(sentences) {
  const flags = []
  sentences.forEach(s => {
    const sl = s.toLowerCase()
    const hasTrigger = INSTANT_PSYCH_TRIGGERS.some(t => sl.includes(t))
    if (hasTrigger) {
      flags.push({
        ruleId: 'Rule 6: Instant Psych Declaration',
        confidence: CONFIDENCE.MOD,
        text: s,
        explanation: 'Characters instantly summarizing their emotional state.'
      })
    }
  })
  return flags
}

function checkRule8PhilosophicalVoice(sentences) {
  const flags = []
  sentences.forEach(s => {
    const sl = s.toLowerCase()
    // A sentence that starts with or heavily features universal language
    if (wordCount(sl) > 5) {
      let triggerCount = 0
      PHILOSOPHICAL_TRIGGERS.forEach(t => {
        if (new RegExp(`\\b${t}\\b`).test(sl)) triggerCount++
      })
      if (triggerCount >= 2) {
        flags.push({
          ruleId: 'Rule 8: Philosophical Narrator',
          confidence: CONFIDENCE.MOD,
          text: s,
          explanation: 'Narration drifting into universal philosophical commentary.'
        })
      }
    }
  })
  return flags
}

function checkRule10AdjectiveChains(sentences) {
  const flags = []
  sentences.forEach(s => {
    // A very crude heuristic for 3 adjectives before a noun: looking for word, word, and word NOUN
    // We'll look for comma separated word chains
    const chainMatch = s.match(/\b\w+\b,\s*\b\w+\b,\s*and\s*\b\w+\b\s+\b\w+\b/i) ||
                       s.match(/\b\w+\b,\s*\b\w+\b,\s*\b\w+\b\s+\b\w+\b/i)
                       
    if (chainMatch) {
      // Filter out some noise if needed, but we'll flag it for review
      flags.push({
        ruleId: 'Rule 10: Adjective Chains',
        confidence: CONFIDENCE.LOW,
        text: s,
        explanation: 'Overly dense descriptive noun phrases.'
      })
    }
  })
  return flags
}

function checkRule11AlgorithmicRhythm(paragraphs) {
  const flags = []
  paragraphs.forEach(p => {
    const pSentences = extractSentences(p)
    if (pSentences.length >= 4) {
      const counts = pSentences.map(s => wordCount(s))
      
      // Calculate variance
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length
      const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length
      
      // If mean is > 5 (not just short fragments) and variance is very low (e.g., all 10-12 words)
      if (mean > 5 && variance < 2) {
        flags.push({
          ruleId: 'Rule 11: Algorithmic Sentence Rhythm',
          confidence: CONFIDENCE.HIGH,
          text: p,
          explanation: `Sentences share nearly identical length (${mean.toFixed(1)} words) and cadence.`
        })
      }
    }
  })
  return flags
}

function checkRule16ContrastOveruse(sentences) {
  const flags = []
  sentences.forEach(s => {
    const sl = s.toLowerCase()
    const matches = (sl.match(/\bnot\b.+\bbut\b/g) || []).length +
                    (sl.match(/\binstead of\b/g) || []).length +
                    (sl.match(/\bwhere\b.+\bshould be\b/g) || []).length
                    
    if (matches >= 2) {
      flags.push({
        ruleId: 'Rule 16: Contrast Structure Overuse',
        confidence: CONFIDENCE.MOD,
        text: s,
        explanation: 'Frequent "not X but Y" constructions in a short span.'
      })
    }
  })
  return flags
}

// ─── CROSS-CHAPTER STATEFUL RULES ──────────────────────────────────────────

// For concept echoing and repeated worldbuilding, we need to track things across the whole manuscript.
// We will do a basic keyword/phrase frequency check.
export function analyzeManuscriptPatterns(chapters) {
  const conceptMap = {}
  
  chapters.forEach(ch => {
    // Simplify to tracking specific repeated phrases of 4-6 words that aren't common
    const text = ch.rawText.toLowerCase()
    
    // Very basic N-gram extraction (4-grams)
    const words = text.match(/\b\w+\b/g) || []
    for (let i = 0; i < words.length - 3; i++) {
        // skip common stop words starting n-grams to reduce noise
        if (['the', 'and', 'a', 'to', 'of', 'in', 'i', 'it', 'was', 'he', 'she', 'that'].includes(words[i])) continue;
        
        const phrase = `${words[i]} ${words[i+1]} ${words[i+2]} ${words[i+3]}`
        conceptMap[phrase] = conceptMap[phrase] || { count: 0, chapters: new Set() }
        conceptMap[phrase].count++
        conceptMap[phrase].chapters.add(ch.index)
    }
  })
  
  // Filter for meaningful concept echoes
  const echoes = Object.entries(conceptMap)
    .filter(([p, data]) => data.count >= 3 && data.chapters.size >= 2)
    // Filter out common dialog tags or simple actions that might erroneously trigger
    .filter(([p, data]) => !p.match(/he said|she said|looked at him|looked at her|turned to him/))
    .sort((a,b) => b[1].count - a[1].count)
    .slice(0, 10)
    
  return { repeatedConcepts: echoes }
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function scanAIPatterns(chapter) {
  const flags = []
  const text = chapter.rawText
  
  if (!text) return flags

  const sentences = getSentences(text)
  const paragraphs = getParagraphs(text)

  // Sentinel rules across the chapter
  flags.push(...checkRule1PostActionExplanation(sentences))
  flags.push(...checkRule2ThematicSummary(sentences))
  flags.push(...checkRule3SymmetricalRhetorical(sentences))
  flags.push(...checkRule4SensoryStacking(sentences))
  flags.push(...checkRule5DialogueInterpretation(sentences))
  flags.push(...checkRule6InstantPsych(sentences))
  flags.push(...checkRule8PhilosophicalVoice(sentences))
  flags.push(...checkRule10AdjectiveChains(sentences))
  flags.push(...checkRule11AlgorithmicRhythm(paragraphs))
  flags.push(...checkRule16ContrastOveruse(sentences))
  
  // Check Rule 9: Moralized Scene Endings (last sentence of a scene)
  if (chapter.scenes) {
    chapter.scenes.forEach(scene => {
      const sceneSentences = getSentences(scene.text)
      if (sceneSentences.length > 0) {
        const lastSentence = sceneSentences[sceneSentences.length - 1].toLowerCase()
        const hasTrigger = MORAL_SCENE_END_TRIGGERS.some(t => lastSentence.includes(t))
        if (hasTrigger) {
          flags.push({
            ruleId: 'Rule 9: Moralized Scene Ending',
            confidence: CONFIDENCE.HIGH,
            text: sceneSentences[sceneSentences.length - 1],
            explanation: 'Scenes ending with explanatory philosophical/moral conclusions.'
          })
        }
      }
    })
  }
  
  // Map standard formatting to the flags
  return flags.map(f => ({
    ...f,
    context: f.text // We could extract surrounding sentences, but for now text is enough context for most
  }))
}

// ─── COMPLEX / ADVANCED PATTERNS ──────────────────────────────────────────

function checkRule12MirrorParagraphs(paragraphs) {
  const flags = []
  // Approximation: Paragraphs sharing identical starting structural markers (e.g. He [verb]. She [verb])
  return flags
}

function checkRule15ImageThenExplanation(paragraphs) {
  const flags = []
  // Approximation: Short descriptive sentence followed by longer abstract explanation
  return flags
}

export function scanManuscriptAIPatterns(chapters) {
  // To handle Rules 7 (Worldbuilding Repetition), 17 (Concept Echoing)
  const sentenceMap = new Map()
  const flags = []
  
  chapters.forEach(ch => {
    const sentences = getSentences(ch.rawText || '')
    sentences.forEach(s => {
      const stripped = s.toLowerCase().replace(/[^\w\s]/g, '').trim()
      // only track sentences of meaningful length (6-15 words)
      const wc = stripped.split(/\s+/).length
      if (wc >= 6 && wc <= 15) {
        if (!sentenceMap.has(stripped)) {
          sentenceMap.set(stripped, { count: 1, chapters: new Set([ch.index]) })
        } else {
          const entry = sentenceMap.get(stripped)
          entry.count++
          entry.chapters.add(ch.index)
        }
      }
    })
  })
  
  sentenceMap.forEach((entry, sentence) => {
    if (entry.count >= 3 && entry.chapters.size >= 2) {
      flags.push({
        ruleId: 'Rule 17: Concept Echoing / Repeated Explanation',
        confidence: CONFIDENCE.MOD,
        text: sentence,
        explanation: `Concept restated identically ${entry.count} times across ${entry.chapters.size} chapters.`
      })
    }
  })
  
  return flags
}
