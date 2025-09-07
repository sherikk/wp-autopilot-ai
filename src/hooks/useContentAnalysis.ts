import { useState } from 'react';

export interface ContentAnalysis {
  readability: {
    fleschKincaid: number;
    gradeLevel: string;
    readingTime: number;
  };
  seo: {
    keywordDensity: { [keyword: string]: number };
    titleOptimization: number;
    metaOptimization: number;
    headingStructure: number;
  };
  quality: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    citationCount: number;
    overallScore: number;
  };
  suggestions: string[];
}

export const useContentAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeContent = async (
    content: string,
    targetKeyword: string,
    seoTitle?: string,
    metaDescription?: string
  ): Promise<ContentAnalysis> => {
    setAnalyzing(true);

    try {
      // Calculate readability using Flesch-Kincaid formula
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = content.split(/\s+/).filter(w => w.length > 0);
      const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

      const avgWordsPerSentence = words.length / sentences.length;
      const avgSyllablesPerWord = syllables / words.length;
      
      const fleschKincaid = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
      const gradeLevel = getGradeLevel(fleschKincaid);
      const readingTime = Math.ceil(words.length / 200); // Average reading speed

      // SEO Analysis
      const keywordDensity = calculateKeywordDensity(content, targetKeyword);
      const titleOptimization = analyzeTitleSEO(seoTitle || '', targetKeyword);
      const metaOptimization = analyzeMetaSEO(metaDescription || '', targetKeyword);
      const headingStructure = analyzeHeadingStructure(content);

      // Quality metrics
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const citations = (content.match(/\[\d+\]/g) || []).length;
      
      const overallScore = calculateOverallScore({
        readability: fleschKincaid,
        wordCount: words.length,
        citations,
        keywordDensity: keywordDensity[targetKeyword.toLowerCase()] || 0,
        titleSEO: titleOptimization,
        metaSEO: metaOptimization
      });

      const suggestions = generateSuggestions({
        fleschKincaid,
        wordCount: words.length,
        citations,
        keywordDensity: keywordDensity[targetKeyword.toLowerCase()] || 0,
        titleSEO: titleOptimization,
        metaSEO: metaOptimization,
        headingStructure
      });

      return {
        readability: {
          fleschKincaid: Math.round(fleschKincaid * 100) / 100,
          gradeLevel,
          readingTime
        },
        seo: {
          keywordDensity,
          titleOptimization,
          metaOptimization,
          headingStructure
        },
        quality: {
          wordCount: words.length,
          sentenceCount: sentences.length,
          paragraphCount: paragraphs.length,
          citationCount: citations,
          overallScore
        },
        suggestions
      };
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    analyzeContent,
    analyzing
  };
};

// Helper functions
function countSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  const vowels = cleanWord.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 0;
  
  if (cleanWord.endsWith('e')) count--;
  if (count === 0) count = 1;
  
  return count;
}

function getGradeLevel(score: number): string {
  if (score >= 90) return 'Grade 5-6';
  if (score >= 80) return 'Grade 6-7';
  if (score >= 70) return 'Grade 7-8';
  if (score >= 60) return 'Grade 8-9';
  if (score >= 50) return 'Grade 10-12';
  if (score >= 30) return 'College Level';
  return 'Graduate Level';
}

function calculateKeywordDensity(content: string, targetKeyword: string): { [keyword: string]: number } {
  const words = content.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  const keywordCount = words.filter(word => 
    word.includes(targetKeyword.toLowerCase())
  ).length;

  return {
    [targetKeyword.toLowerCase()]: Math.round((keywordCount / totalWords) * 10000) / 100
  };
}

function analyzeTitleSEO(title: string, targetKeyword: string): number {
  let score = 0;
  
  if (title.length >= 30 && title.length <= 60) score += 30;
  if (title.toLowerCase().includes(targetKeyword.toLowerCase())) score += 40;
  if (title.length > 0) score += 30;
  
  return score;
}

function analyzeMetaSEO(meta: string, targetKeyword: string): number {
  let score = 0;
  
  if (meta.length >= 120 && meta.length <= 160) score += 30;
  if (meta.toLowerCase().includes(targetKeyword.toLowerCase())) score += 40;
  if (meta.length > 0) score += 30;
  
  return score;
}

function analyzeHeadingStructure(content: string): number {
  const headings = content.match(/#{1,6}\s+.+/g) || [];
  const h1Count = (content.match(/^#\s+.+/gm) || []).length;
  
  let score = 0;
  if (h1Count === 1) score += 40; // Exactly one H1
  if (headings.length >= 3) score += 30; // Multiple headings
  if (headings.length > 0) score += 30; // Has headings
  
  return score;
}

function calculateOverallScore(metrics: {
  readability: number;
  wordCount: number;
  citations: number;
  keywordDensity: number;
  titleSEO: number;
  metaSEO: number;
}): number {
  let score = 0;
  
  // Readability (0-30 points)
  if (metrics.readability >= 60 && metrics.readability <= 80) score += 30;
  else if (metrics.readability >= 50) score += 20;
  else score += 10;
  
  // Word count (0-20 points)
  if (metrics.wordCount >= 800 && metrics.wordCount <= 2000) score += 20;
  else if (metrics.wordCount >= 500) score += 15;
  else score += 5;
  
  // Citations (0-15 points)
  if (metrics.citations >= 3) score += 15;
  else if (metrics.citations >= 1) score += 10;
  
  // Keyword density (0-15 points)
  if (metrics.keywordDensity >= 1 && metrics.keywordDensity <= 3) score += 15;
  else if (metrics.keywordDensity > 0) score += 10;
  
  // SEO (0-20 points)
  score += (metrics.titleSEO + metrics.metaSEO) / 10;
  
  return Math.min(100, score);
}

function generateSuggestions(metrics: {
  fleschKincaid: number;
  wordCount: number;
  citations: number;
  keywordDensity: number;
  titleSEO: number;
  metaSEO: number;
  headingStructure: number;
}): string[] {
  const suggestions: string[] = [];
  
  if (metrics.fleschKincaid < 50) {
    suggestions.push('Content readability is quite complex. Consider using shorter sentences and simpler words.');
  } else if (metrics.fleschKincaid > 80) {
    suggestions.push('Content might be too simple. Consider adding more detailed explanations.');
  }
  
  if (metrics.wordCount < 500) {
    suggestions.push('Content is quite short. Consider expanding with more detailed information.');
  } else if (metrics.wordCount > 2500) {
    suggestions.push('Content is very long. Consider breaking it into multiple sections or posts.');
  }
  
  if (metrics.citations < 2) {
    suggestions.push('Add more citations to increase content credibility and authority.');
  }
  
  if (metrics.keywordDensity < 0.5) {
    suggestions.push('Target keyword density is low. Consider including the keyword more naturally.');
  } else if (metrics.keywordDensity > 4) {
    suggestions.push('Target keyword density is high. Avoid keyword stuffing.');
  }
  
  if (metrics.titleSEO < 70) {
    suggestions.push('Optimize the SEO title - include target keyword and keep it 30-60 characters.');
  }
  
  if (metrics.metaSEO < 70) {
    suggestions.push('Optimize the meta description - include target keyword and keep it 120-160 characters.');
  }
  
  if (metrics.headingStructure < 60) {
    suggestions.push('Improve heading structure - use exactly one H1 and add more subheadings.');
  }
  
  return suggestions;
}