const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

class BedrockService {
  constructor(config = {}) {
    const region = config.region || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
    const accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

    const clientConfig = { region };
    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim()
      };
    }

    this.client = new BedrockRuntimeClient(clientConfig);
    this.modelId = config.modelId || process.env.BEDROCK_MODEL_ID || 'apac.amazon.nova-lite-v1:0';
  }

  /**
   * Helper to clean and parse JSON returned from Bedrock model output.
   */
  _parseJsonResponse(rawText) {
    if (!rawText) return {};
    let text = rawText.trim();

    // Strip markdown code fences if present
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }

    // If there is leading or trailing non-JSON chatter, extract JSON substring
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON from Bedrock response:', rawText);
      throw new Error(`Invalid JSON format returned by AI: ${e.message}`);
    }
  }

  /**
   * Normalize question object so correctAnswer is always 'A', 'B', 'C', or 'D'.
   */
  _normalizeQuestion(q, idx) {
    const letters = ['A', 'B', 'C', 'D'];
    const options = Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [];

    let correctAnswer = 'A';
    const rawAnswer = String(q.correctAnswer || '').trim();

    // Case 1: Already 'A', 'B', 'C', or 'D' (case-insensitive)
    const upper = rawAnswer.toUpperCase();
    if (letters.includes(upper)) {
      correctAnswer = upper;
    } else if (/^[0-3]$/.test(rawAnswer)) {
      // Case 2: 0-indexed number
      correctAnswer = letters[parseInt(rawAnswer, 10)] || 'A';
    } else {
      // Case 3: Matches text of an option
      const matchingIdx = options.findIndex(
        opt => opt.toLowerCase() === rawAnswer.toLowerCase() ||
               opt.toLowerCase().includes(rawAnswer.toLowerCase()) ||
               rawAnswer.toLowerCase().includes(opt.toLowerCase())
      );
      if (matchingIdx >= 0 && matchingIdx < 4) {
        correctAnswer = letters[matchingIdx];
      } else if (/^Option\s*([A-D])/i.test(rawAnswer)) {
        correctAnswer = rawAnswer.match(/^Option\s*([A-D])/i)[1].toUpperCase();
      }
    }

    return {
      id: q.id || `q_${Date.now()}_${idx}`,
      question: q.question || 'Untitled Question',
      options: options.length >= 4 ? options.slice(0, 4) : [...options, 'Option A', 'Option B', 'Option C', 'Option D'].slice(0, 4),
      correctAnswer,
      explanation: q.explanation || ''
    };
  }

  async generateQuiz(request) {
    const prompt = `
Generate a ${request.difficulty} level quiz about "${request.topic}" with ${request.numberOfQuestions} multiple-choice questions.
Category: ${request.category}.

CRITICAL REQUIREMENTS:
1. Provide exactly 4 options per question.
2. The "correctAnswer" property MUST be strictly one letter: "A", "B", "C", or "D".
3. Return ONLY a single JSON object. Do not include markdown formatting or commentary.

JSON Schema:
{
  "title": "Quiz Title",
  "description": "Quiz Description",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": "A",
      "explanation": "Brief explanation why A is correct"
    }
  ]
}
`;

    try {
      const command = new ConverseCommand({
        modelId: this.modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }]
          }
        ],
        system: [
          { text: 'You are an expert educational quiz creator. Return strictly valid JSON adhering to the requested schema. Ensure correctAnswer is always one of "A", "B", "C", or "D".' }
        ],
        inferenceConfig: {
          temperature: 0.7,
          maxTokens: 3000
        }
      });

      const response = await this.client.send(command);
      const text = response.output?.message?.content?.[0]?.text || '';
      const parsedData = this._parseJsonResponse(text);

      const rawQuestions = Array.isArray(parsedData.questions)
        ? parsedData.questions
        : (Array.isArray(parsedData) ? parsedData : []);

      const normalizedQuestions = rawQuestions.map((q, idx) => this._normalizeQuestion(q, idx));

      return {
        title: parsedData.title || `Quiz on ${request.topic}`,
        description: parsedData.description || `A quiz about ${request.topic}`,
        questions: normalizedQuestions,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error generating quiz with AWS Bedrock Nova Lite:', error);
      throw new Error(`Failed to generate quiz with AWS Bedrock: ${error.message}`);
    }
  }

  async generateQuestions(topic, difficulty, count) {
    const prompt = `
Generate ${count} ${difficulty} level multiple-choice questions about "${topic}".

CRITICAL REQUIREMENTS:
1. Provide exactly 4 options per question.
2. The "correctAnswer" MUST be strictly one letter: "A", "B", "C", or "D".
3. Return ONLY a valid JSON object with a "questions" array.

JSON Schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "A",
      "explanation": "Why this answer is correct"
    }
  ]
}
`;

    try {
      const command = new ConverseCommand({
        modelId: this.modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }]
          }
        ],
        system: [
          { text: 'You are an expert quiz creator. Return strictly valid JSON with a "questions" array. Ensure correctAnswer is always one of "A", "B", "C", or "D".' }
        ],
        inferenceConfig: {
          temperature: 0.7,
          maxTokens: 3000
        }
      });

      const response = await this.client.send(command);
      const text = response.output?.message?.content?.[0]?.text || '';
      const parsedData = this._parseJsonResponse(text);

      const rawQuestions = Array.isArray(parsedData.questions)
        ? parsedData.questions
        : (Array.isArray(parsedData) ? parsedData : []);

      return rawQuestions.map((q, idx) => this._normalizeQuestion(q, idx));
    } catch (error) {
      console.error('Error generating questions with AWS Bedrock:', error);
      throw new Error(`Failed to generate questions with AWS Bedrock: ${error.message}`);
    }
  }
}

module.exports = { BedrockService };
