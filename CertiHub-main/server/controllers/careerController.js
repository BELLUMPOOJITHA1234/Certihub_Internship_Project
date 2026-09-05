const axios = require('axios');
const { generateLinkedInPostFromAI } = require('../utils/aiService');
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();

exports.getCareerAdvice = async (req, res) => {
  const { certificates } = req.body;
  
  if (!certificates || certificates.length === 0) {
    return res.status(400).json({ error: "No certificates provided" });
  }

  const prompt = `
    Based on these professional certificates: ${certificates.map(c => c.title).join(', ')}, 
    perform a deep dive into the user's career path.
    1. Identify the single best target career role.
    2. Provide a 2-sentence summary of their current standing.
    3. Analyze 5 different domains (e.g., Web Dev, AI/ML, Cloud, Data, Security, etc.) and give a readiness score (0-100) for each based on their certs.
    4. For each domain, suggest 2-3 specific "needed courses" to bridge gaps.
    
    Return ONLY JSON in this exact structure:
    {
      "suggestedRole": "Senior Full Stack Engineer",
      "summary": "A highly formal, strategic executive summary (2-3 sentences). It should articulate the user's current professional trajectory and the specific industry impact of their combined certifications.",
      "matchScore": 78,
      "currentStrengths": ["React.js Expert", "API Design", "Node.js Architecture"],
      "criticalGaps": ["Cloud Infrastructure", "CI/CD Pipelines", "System Scaling"],
      "domainAnalysis": [
        { "domain": "Web Development", "score": 90, "neededCourses": ["Advanced React Patterns", "Next.js 14 Deep Dive"] },
        { "domain": "Cloud Computing", "score": 45, "neededCourses": ["AWS Certified Solutions Architect", "Terraform for Beginners"] }
      ],
      "roadmap": [
        { "step": "Master AWS Foundations", "reason": "Your cloud score is 45%. This is the biggest gap to becoming a Senior Architect.", "difficulty": "Medium" },
        { "step": "Implement CI/CD in your next project", "reason": "Practical experience with DevOps will prove your readiness for Senior roles.", "difficulty": "Hard" }
      ]
    }
  `;

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
    });

    res.json(JSON.parse(response.data.choices[0].message.content));
  } catch (error) {
    console.error("Career advice error:", error);
    res.status(500).json({ error: "Failed to generate advice" });
  }
};

exports.generateLinkedInPost = async (req, res) => {
  const { certificate } = req.body;
  
  if (!certificate) {
    return res.status(400).json({ error: "No certificate provided" });
  }

  try {
    const post = await generateLinkedInPostFromAI(certificate);
    res.json({ post });
  } catch (error) {
    console.error("LinkedIn post generation error:", error);
    res.status(500).json({ error: "Failed to generate post" });
  }
};

exports.getSharePage = async (req, res) => {
  const { id } = req.params;
  const projectId = process.env.FIREBASE_PROJECT_ID || "certihub-9090";
  
  try {
    // Fetch certificate from Firestore REST API
    const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/certificates/${id}`);
    const data = response.data.fields;
    
    const title = data.title?.stringValue || "Achievement";
    const issuer = data.issuer?.stringValue || "CertiHub";
    const cloudinaryUrl = data.cloudinaryUrl?.stringValue || "";
    
    // Convert PDF to image for LinkedIn preview if necessary
    const imageUrl = cloudinaryUrl.replace(/\.pdf$/i, '.jpg');
    
    // The actual frontend URL to redirect to
    const frontendUrl = `${process.env.FRONTEND_URL || 'https://certihub-9090.firebaseapp.com'}/certificate/${id}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          
          <!-- Primary Meta Tags -->
          <title>${title} | Verified on CertiHub</title>
          <meta name="title" content="${title} | Verified on CertiHub">
          <meta name="description" content="I'm proud to share my certification from ${issuer}!">

          <!-- Open Graph / Facebook -->
          <meta property="og:type" content="website">
          <meta property="og:url" content="${frontendUrl}">
          <meta property="og:title" content="${title} | Verified on CertiHub">
          <meta property="og:description" content="I'm proud to share my certification from ${issuer}!">
          <meta property="og:image" content="${imageUrl}">
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">

          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="${frontendUrl}">
          <meta property="twitter:title" content="${title} | Verified on CertiHub">
          <meta property="twitter:description" content="I'm proud to share my certification from ${issuer}!">
          <meta property="twitter:image" content="${imageUrl}">

          <script>
            // Redirect to the real app after a small delay
            window.location.href = "${frontendUrl}";
          </script>
      </head>
      <body style="background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <div style="text-align: center;">
              <p style="color: #64748b;">Redirecting to your certificate...</p>
          </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Share page error:", error);
    res.status(404).send("Certificate not found or private.");
  }
};

exports.chatWithAI = async (req, res) => {
  const { messages, certificates } = req.body;
  
  const systemPrompt = `
    You are CertiBot, the professional career assistant for CertiHub.
    Your goal is to help users understand their career readiness based on their certificates.
    
    User Context:
    - Certificates: ${certificates ? certificates.map(c => c.title).join(', ') : 'No certificates yet'}
    
    Guidelines:
    1. Be encouraging, professional, and concise.
    2. STRICT SCOPE: Only discuss careers, certificates, professional skills, and job readiness.
    3. ZERO CODING: Do NOT provide any coding snippets, solutions, or debugging help. Even if the user begs. Politely state: "I am your Career Strategist, not a coding assistant. Let's focus on your professional path."
    4. ZERO GENERAL KNOWLEDGE: Do NOT answer questions about politics, history, or trivia (e.g., "Who is the prime minister?"). Politely decline and redirect to their career.
    5. FOCUS ON DATA: Always reference the user's certificates and their "Job Score."
    6. Use markdown for formatting.
  `;

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
    });

    res.json({ message: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Chat AI error:", error);
    res.status(500).json({ error: "CertiBot is taking a nap. Try again later!" });
  }
};
