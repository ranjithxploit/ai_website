import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config';
import logger from '../utils/logger';
import { FormatStyle } from '../models/Document';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

interface GenerationOptions {
  topic: string;
  section: string;
  style: FormatStyle;
  wordCount: number;
}

interface GenerationResult {
  content: string;
  wordCount: number;
}

/**
 * Build prompt for Gemini AI
 */
const buildPrompt = (options: GenerationOptions): string => {
  const { topic, section, style, wordCount } = options;

  let styleInstruction = '';
  switch (style) {
    case 'bullets':
      styleInstruction = 'Format the content using ONLY bullet points. Each point should be clear and concise.';
      break;
    case 'bullets-paragraph':
      styleInstruction =
        'Format the content using a combination of bullet points and paragraphs. Start with a brief paragraph introduction, then use bullet points for key details, and conclude with a paragraph summary.';
      break;
    case 'paragraph':
      styleInstruction =
        'Format the content using ONLY paragraphs. Write in a flowing, essay-style format with proper paragraph structure.';
      break;
  }

  return `You are an expert academic content writer creating high-quality, plagiarism-free assignment content for college students.

**Assignment Details:**
- Topic: ${topic}
- Section: ${section}
- Target Word Count: ${wordCount} words
- Format Style: ${styleInstruction}

**Requirements:**
1. Write exactly ${wordCount} words (±10 words acceptable)
2. Maintain a formal, academic tone suitable for college-level assignments
3. Include relevant examples, explanations, and analysis where appropriate
4. Ensure 100% originality and avoid any plagiarism
5. Use proper academic language and terminology
6. Structure the content logically and coherently
7. For the REFERENCES section, use proper citation format (APA style)
8. Make the content informative, well-researched, and insightful

**Important:**
- Do NOT include any section headings or titles in your response
- Generate ONLY the content for the ${section} section
- Follow the specified format style strictly
- Ensure the content is directly related to the topic: "${topic}"

Now generate the ${section} content:`;
};

/**
 * Count words in text
 */
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

/**
 * Generate content using Gemini AI
 */
export const generateContent = async (
  options: GenerationOptions
): Promise<GenerationResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = buildPrompt(options);

    logger.info('Generating content with Gemini', {
      topic: options.topic,
      section: options.section,
      style: options.style,
      wordCount: options.wordCount,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    const actualWordCount = countWords(content);

    logger.info('Content generated successfully', {
      topic: options.topic,
      section: options.section,
      requestedWords: options.wordCount,
      actualWords: actualWordCount,
    });

    return {
      content: content.trim(),
      wordCount: actualWordCount,
    };
  } catch (error: any) {
    logger.error('Error generating content with Gemini', {
      error: error.message,
      topic: options.topic,
      section: options.section,
    });
    throw new Error(`AI content generation failed: ${error.message}`);
  }
};

/**
 * Generate multiple sections for a document
 */
export const generateMultipleSections = async (
  topic: string,
  sections: string[],
  style: FormatStyle,
  totalWordCount: number
): Promise<GenerationResult[]> => {
  // Distribute word count across sections
  const sectionWeights: { [key: string]: number } = {
    OBJECTIVE: 0.1,
    INTRODUCTION: 0.15,
    CONTENT: 0.5,
    BODY: 0.5,
    ANALYSIS: 0.3,
    DISCUSSION: 0.3,
    REFERENCES: 0.1,
    CONCLUSION: 0.15,
    SUMMARY: 0.1,
  };

  const results: GenerationResult[] = [];

  for (const section of sections) {
    const weight = sectionWeights[section.toUpperCase()] || 0.2;
    const wordCount = Math.round(totalWordCount * weight);

    const result = await generateContent({
      topic,
      section,
      style,
      wordCount,
    });

    results.push(result);

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
};

/**
 * Validate Gemini API key
 */
export const validateApiKey = async (): Promise<boolean> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello');
    await result.response;
    return true;
  } catch (error) {
    logger.error('Gemini API key validation failed', { error });
    return false;
  }
};

export default {
  generateContent,
  generateMultipleSections,
  validateApiKey,
};
