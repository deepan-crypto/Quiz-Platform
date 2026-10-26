const OpenAI = require('openai');

class OpenAIService {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateQuiz(request) {
    const prompt = `
      Generate a ${request.difficulty} level quiz about "${request.topic}" with ${request.numberOfQuestions} multiple-choice questions.
      The quiz should be in the category: ${request.category}.
      
      For each question, provide:
      1. A unique short id (e.g. "q1", "q2")
      2. The question text
      3. Exactly 4 options (A, B, C, D)
      4. The correct answer (A, B, C, or D)
      5. A brief explanation
      
      Format the response as a JSON object with this exact structure:
      {
        "title": "Quiz Title",
        "description": "Quiz Description",
        "questions": [
          {
            "id": "q1",
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "explanation": "Brief explanation"
          }
        ]
      }
    `;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert quiz creator. Always return a valid JSON object matching the requested schema. Do not include markdown fences.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const text = response.choices[0].message.content;
      
      // Clean and parse JSON response
      let jsonText = text ? text.trim() : '{}';
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      }

      const quizData = JSON.parse(jsonText);

      // Ensure every question has an id
      const questionsWithIds = (quizData.questions || []).map((q, idx) => ({
        id: q.id || `q_${Date.now()}_${idx}`,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || ''
      }));

      return {
        title: quizData.title || `Quiz on ${request.topic}`,
        description: quizData.description || `A quiz about ${request.topic}`,
        questions: questionsWithIds,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating quiz with OpenAI:', error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  async generateQuestions(topic, difficulty, count) {
    const prompt = `
      Generate ${count} ${difficulty} level multiple-choice questions about "${topic}".
      For each question, provide:
      - id
      - The question text
      - 4 options (A, B, C, D)
      - The correct answer (A, B, C, or D)
      - A brief explanation
      
      Return as a JSON object with a "questions" array:
      {
        "questions": [
          {
            "id": "q1",
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "explanation": "Brief explanation"
          }
        ]
      }
    `;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert quiz creator. Always return a valid JSON object with a "questions" array.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const text = response.choices[0].message.content;
      let jsonText = text ? text.trim() : '{}';
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      }

      const parsed = JSON.parse(jsonText);
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      return questions.map((q, idx) => ({
        id: q.id || `q_${Date.now()}_${idx}`,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || ''
      }));
    } catch (error) {
      console.error('Error generating questions with OpenAI:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }
}

module.exports = { OpenAIService };
