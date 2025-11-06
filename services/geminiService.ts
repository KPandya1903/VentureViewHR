import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis, MatchResult, InterviewAnalysisReport, InterviewAnswer } from "../types";

// The Gemini API key is now managed via the API_KEY environment variable.
// The GoogleGenAI instance is created within each function after ensuring the key exists.

export const generateCoverLetter = async (jobDescription: string, resumeText: string): Promise<string> => {
  // Fix: Use process.env.API_KEY, check for its existence, and instantiate the client here.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "Error: Gemini API key is not configured. Please set the API_KEY environment variable.";
  }
  const ai = new GoogleGenAI({ apiKey });

  const model = 'gemini-2.5-flash';
  
  const prompt = `
    You are an expert career coach and professional writer. Your task is to write a compelling and professional cover letter for a job application.

    **Instructions:**
    1.  Analyze the provided Job Description to understand the key requirements, responsibilities, and company culture.
    2.  Review the provided Resume Text to identify the candidate's most relevant skills, experiences, and achievements.
    3.  Write a cover letter that is tailored specifically to the job description, highlighting how the candidate's background from the resume makes them a perfect fit for the role.
    4.  The cover letter should be concise (around 3-4 paragraphs), professional in tone, and enthusiastic.
    5.  Do not make up any skills or experiences not mentioned in the resume.
    6.  Structure the letter with a clear introduction, body paragraphs connecting experience to the job, and a strong closing.
    7.  Start with a generic greeting like "Dear Hiring Manager," and end with "Sincerely," followed by a placeholder for the candidate's name.

    ---
    **Job Description:**
    ${jobDescription}
    ---
    **Resume Text:**
    ${resumeText}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating cover letter with Gemini:", error);
    return "An error occurred while generating the cover letter. Please check the console for details.";
  }
};

const resumeAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: 'Overall score from 0 to 100.' },
    summary: { type: Type.STRING, description: 'A brief summary of the analysis.' },
    scoreBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: 'Name of the scoring category (e.g., Clarity & Readability).' },
          score: { type: Type.NUMBER, description: 'The score for this category.' },
          maxScore: { type: Type.NUMBER, description: 'The maximum possible score for this category.' },
          feedback: { type: Type.STRING, description: 'Specific feedback for this category.' },
        },
        required: ['category', 'score', 'maxScore', 'feedback'],
      },
    },
    suggestionsForImprovement: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, description: 'The section of the resume this suggestion applies to.' },
          originalText: { type: Type.STRING, description: 'The original text from the resume.' },
          suggestion: { type: Type.STRING, description: 'The improved version of the text.' },
        },
        required: ['area', 'originalText', 'suggestion'],
      },
    },
    optimizedResume: { type: Type.STRING, description: 'The full, rewritten version of the resume text.' },
  },
  required: ['overallScore', 'summary', 'scoreBreakdown', 'suggestionsForImprovement', 'optimizedResume'],
};


export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  // Fix: Use process.env.API_KEY, check for its existence, and instantiate the client here.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const model = 'gemini-2.5-flash';
  const prompt = `
    You are an expert career coach and resume analyst for a platform called VentureView HR. Your task is to analyze a user's resume and provide actionable feedback in a structured JSON format.

    **Instructions:**
    1.  **Parse and Analyze:** Carefully read the entire resume text.
    2.  **Score the Resume:** Provide an overall score out of 100.
    3.  **Breakdown the Score:** Score the resume in four distinct categories:
        *   **Clarity & Readability (25 points):** Is the resume easy to read? Is the language clear and concise? Is formatting consistent?
        *   **Keyword Optimization (25 points):** Does the resume contain relevant keywords for common roles in its field? (Analyze without a specific job description).
        *   **Impact & Action Verbs (35 points):** Does the resume use strong action verbs? Does it quantify achievements with numbers and data?
        *   **Completeness (15 points):** Are standard sections like Experience, Education, and Skills present?
    4.  **Provide a Summary:** Write a brief, encouraging summary of the resume's strengths and key areas for improvement.
    5.  **Give Specific Suggestions:** Identify specific sentences or bullet points and provide a better, rewritten version. Focus on adding impact and quantification.
    6.  **Create an Optimized Version:** Provide a full, rewritten version of the resume that incorporates your feedback.

    **Output Format:**
    You MUST respond with a valid JSON object that matches the provided schema. Do not include any text outside of the JSON object.

    ---
    **Resume Text:**
    ${resumeText}
    ---
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: resumeAnalysisSchema,
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

const matchResultSchema = {
    type: Type.OBJECT,
    properties: {
        matchScore: { type: Type.NUMBER, description: 'A score from 0 to 100 representing how well the resume matches the job description.' },
        summary: { type: Type.STRING, description: 'A brief 2-3 sentence summary of the match, highlighting strengths and weaknesses.' },
        missingSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of 3-5 key skills or qualifications from the job description that are missing from the resume.'
        },
    },
    required: ['matchScore', 'summary', 'missingSkills'],
};

export const matchResumeToJob = async (resumeText: string, jobDescription: string): Promise<MatchResult> => {
    // Fix: Use process.env.API_KEY, check for its existence, and instantiate the client here.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const model = 'gemini-2.5-flash';
    const prompt = `
        You are an AI hiring assistant for VentureView HR. Your task is to analyze a candidate's resume against a specific job description and provide a match analysis in a structured JSON format.

        **Instructions:**
        1.  **Analyze Job Requirements:** Identify the key skills, technologies, experience level, and qualifications required by the job description.
        2.  **Analyze Candidate's Resume:** Identify the skills, experiences, and qualifications listed in the resume.
        3.  **Calculate Match Score:** Compare the two and calculate a match score from 0 to 100. The score should reflect the degree of overlap in key requirements. A perfect match is rare; be realistic. A strong candidate might be 80-90. A decent fit might be 60-75.
        4.  **Write a Brief Summary:** Provide a 2-3 sentence summary explaining the score. Mention a key strength and a primary area where the candidate is lacking.
        5.  **Identify Missing Skills:** List the most important 3 to 5 skills or qualifications mentioned in the job description that are NOT clearly present in the resume. This helps the candidate understand what to work on.

        **Output Format:**
        You MUST respond with a valid JSON object that matches the provided schema. Do not include any text outside of the JSON object.

        ---
        **Job Description:**
        ${jobDescription}
        ---
        **Resume Text:**
        ${resumeText}
        ---
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: matchResultSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateInterviewQuestions = async (resumeText: string): Promise<string[]> => {
    // Fix: Use process.env.API_KEY, check for its existence, and instantiate the client here.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const model = 'gemini-2.5-flash';
    const prompt = `
      Based on the provided resume text, generate exactly 5 relevant interview questions. The questions should cover a mix of behavioral, situational, and technical topics tailored to the experience shown in the resume.

      Return the questions as a JSON array of strings. Do not include any other text.
      Example format: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]

      ---
      **Resume Text:**
      ${resumeText}
      ---
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


const interviewAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: 'An overall performance score from 0 to 100.' },
    summary: { type: Type.STRING, description: 'A 2-4 sentence summary of the candidate\'s performance, highlighting strengths and areas for improvement.' },
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          transcript: { type: Type.STRING },
          evaluation: {
            type: Type.OBJECT,
            properties: {
              clarity: { type: Type.NUMBER, description: 'Score (0-100) for how clear and concise the answer was.' },
              confidence: { type: Type.NUMBER, description: 'Score (0-100) based on the language used, indicating confidence.' },
              relevance: { type: Type.NUMBER, description: 'Score (0-100) for how well the answer addresses the question.' },
              feedback: { type: Type.STRING, description: 'Specific, constructive feedback for this answer.' },
            },
            required: ['clarity', 'confidence', 'relevance', 'feedback']
          }
        },
        required: ['question', 'transcript', 'evaluation']
      }
    }
  },
  required: ['overallScore', 'summary', 'answers']
};


export const evaluateInterviewAnswers = async (answers: { question: string, transcript: string }[]): Promise<InterviewAnalysisReport> => {
    // Fix: Use process.env.API_KEY, check for its existence, and instantiate the client here.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const model = 'gemini-2.5-pro';
    const prompt = `
        You are an expert AI interview coach for VentureView HR. Your task is to analyze a candidate's performance in a mock interview based on the questions they were asked and the transcripts of their answers.

        **Instructions:**
        1.  **Holistic Review:** Read all questions and answers to get a complete picture of the candidate's performance.
        2.  **Evaluate Each Answer:** For each question/answer pair, provide:
            *   A **Clarity** score (0-100): How was the answer to understand? Was it well-structured?
            *   A **Confidence** score (0-100): Did the candidate sound confident? (Analyze from text - use of filler words, assertive language, etc.)
            *   A **Relevance** score (0-100): How well did the answer address the specific question asked?
            *   **Constructive Feedback**: Provide a few sentences of actionable feedback for each answer.
        3.  **Calculate Overall Score:** Based on the individual answer scores, calculate an overall performance score (0-100).
        4.  **Write a Summary:** Provide a concise, encouraging summary of the candidate's overall performance, highlighting key strengths and the most important areas for improvement.

        **Output Format:**
        You MUST respond with a valid JSON object that matches the provided schema. Do not include any text outside of the JSON object.

        ---
        **Interview Data:**
        ${JSON.stringify(answers, null, 2)}
        ---
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewAnalysisSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateCandidateFeedbackEmail = async (
    report: InterviewAnalysisReport, 
    candidateName: string, 
    role: string, 
    tone: string, 
    decision: string
): Promise<string> => {
    // Fix: Use process.env.API_KEY, check for its existence, and instantiate the client here.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an experienced HR Manager at a tech company called VentureView. Your task is to write a professional and constructive feedback email to a candidate after their interview.

      **Instructions:**
      1.  **Use the Provided Data:** Base the email ENTIRELY on the provided Interview Analysis Report. Do not invent details.
      2.  **Set the Tone:** The email's tone must be **${tone}**.
      3.  **Reflect the Decision:** The email's core message must reflect the hiring decision, which is: **${decision}**.
      4.  **Personalize the Feedback:** Reference specific strengths and areas for improvement mentioned in the report's summary and individual answer feedback.
      5.  **Structure the Email:**
          *   Start with a professional greeting (e.g., "Dear ${candidateName},").
          *   Thank them for their time and interest in the ${role} position.
          *   State the hiring decision clearly but compassionately.
          *   Provide 1-2 paragraphs of specific, constructive feedback based on the report.
          *   If the decision is 'Reject', end on an encouraging note, wishing them luck in their job search.
          *   If the decision is 'Offer' or 'Next Round', clearly state the next steps.
          *   End with a professional closing (e.g., "Sincerely," or "Best regards,").

      **Output Format:**
      Return only the text of the email. Do not include any other explanatory text or markdown.

      ---
      **Interview Analysis Report for ${candidateName}:**
      ${JSON.stringify(report, null, 2)}
      ---
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return response.text;
};
