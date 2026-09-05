const axios = require('axios');

// Process API key once at the module level
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();

const analyzeTextWithAI = async (extractedText) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Extract certificate data as JSON. Rules:
- certificateTitle: ONLY the course/skill name (no "Certification in", "Certificate of" prefixes)
- Return ONLY valid JSON, no markdown.

Schema:
{
  "candidateName": "Full Name",
  "certificateTitle": "Clean Course Name",
  "organization": "Issuing Org",
  "category": "Domain (e.g. Web Development, Cloud, AI)",
  "skills": ["skill1", "skill2"],
  "date": "Month Year or YYYY-MM-DD",
  "certificateId": "ID if present",
  "aiSummary": "1-2 sentence professional summary of what this cert validates",
  "resumeBullets": ["Action-oriented bullet 1", "Action-oriented bullet 2"]
}`
          },
          {
            role: 'user',
            content: extractedText
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
        temperature: 0.1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        }
      }
    );

    const responseText = response.data.choices[0].message.content;
    console.log("--- AI RAW RESPONSE ---");
    console.log(responseText);
    console.log("-----------------------");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in the model's response");
    }
    
    let finalJsonString = jsonMatch[0];
    
    try {
       return JSON.parse(finalJsonString);
    } catch (e) {
       const lastStart = responseText.lastIndexOf('{');
       const lastEnd = responseText.lastIndexOf('}');
       if (lastStart !== -1 && lastEnd !== -1 && lastEnd > lastStart) {
          finalJsonString = responseText.substring(lastStart, lastEnd + 1);
          return JSON.parse(finalJsonString);
       }
       throw e;
    }
  } catch (error) {
    if (error.response) {
      console.error("Groq API Error Status:", error.response.status);
      console.error("Groq API Error Data:", error.response.data);
    } else {
      console.error("Groq API error:", error.message);
    }
    throw new Error("Failed to analyze text with AI");
  }
};

const getCareerAdviceFromAI = async (certificatesSummary) => {
  const model = "llama-3.3-70b-versatile";
  const systemPrompt = `You are a Career Advisor. Analyze certificates and return JSON:
{
  "suggestedRole": "Best-fit job title",
  "matchScore": 85,
  "summary": "2-sentence career overview",
  "domainAnalysis": [
    {"domain": "Web Dev", "score": 90, "neededCourses": ["Course 1", "Course 2"]}
  ],
  "currentStrengths": ["Skill 1", "Skill 2"],
  "criticalGaps": ["Gap 1", "Gap 2"],
  "roadmap": [{"step": "Milestone", "reason": "Why", "difficulty": "Easy|Medium|Hard"}]
}
Rules: Be realistic. Suggest 3 roadmap steps. Professional tone.`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here are my certificates: ${certificatesSummary}` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2048,
        temperature: 0.2
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("Career AI Error:", error.response?.data || error.message);
    throw new Error("Career analysis failed");
  }
};

const generateLinkedInPostFromAI = async (cert) => {
  const model = "llama-3.3-70b-versatile";
  const systemPrompt = `Create a professional LinkedIn post (3-5 sentences) celebrating a certification. Include 3-5 relevant hashtags and 2-3 emojis. Return ONLY the post text.`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Certificate: ${cert.title} by ${cert.issuer}. Skills: ${cert.skills.join(', ')}.` }
        ],
        max_tokens: 512,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("LinkedIn AI Error:", error.response?.data || error.message);
    throw new Error("Post generation failed");
  }
};

const analyzeImageWithAI = async (base64Image) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'qwen/qwen3.6-27b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: "Extract certificate data as JSON: candidateName, certificateTitle (clean name only, no prefixes), organization, category, skills, date, certificateId, aiSummary, resumeBullets. Return ONLY JSON."
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
        temperature: 0.1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("Vision AI error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { analyzeTextWithAI, analyzeImageWithAI, getCareerAdviceFromAI, generateLinkedInPostFromAI };
