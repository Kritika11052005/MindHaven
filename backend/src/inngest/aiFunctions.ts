import { logger } from "../utils/logger";
import { inngest } from "./index";
import { GoogleGenAI } from "@google/genai";
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
});

export const processChatMessage = inngest.createFunction(
    {
        id: "process-chat-message",

    },
    {
        event: "therapy/session.message"
    },
    async ({ event, step }) => {
        try {
            const {
                message,
                history,
                memory = {
                    userProfile: {
                        emotionalState: [],
                        riskLevel: 0,
                        preferences: {},
                    },
                    sessionContext: {
                        conversationTheme: [],
                        currentTechnique: [],

                    },
                },
                goals = [],
                systemPrompt,
            } = event.data;
            logger.info("Processing chat message:", {
                message,
                historyLength: history?.length,
            })

            const analysis = await step.run("analyze-message", async () => {
                try {
                    const prompt = `Analyze this therapy message and provide insights.Return ONLY a valid JSON object with no markdown formatting or additional text.
                    Message:${message}
                    Context:${JSON.stringify({ memory, goals })}
                    Required JSON structure:
                    {
                    "emotionalState":"string",
                    "themes:["string"],
                    "riskLevel":number,
                    "recommendationApproach":"string",
                    "progressIndicators":["string"]


                    }`
                    const response = genAI.models.generateContent({
                        model: "gemini-2.0-flash",
                        contents: "Explain how AI works in a few words",
                    });
                    const text = (await response).text;
                    logger.info("Received analysis from Gemini:", { text });
                    const cleanText = text?.replace(/```json\n|n```/g, "").trim();
                    const parsedAnalysis = JSON.parse(cleanText || "{}")
                    logger.info("Successfully parsed analysis:", parsedAnalysis);
                    return parsedAnalysis;


                } catch (error) {
                    logger.error("Error in message analysis", { error, message });
                    return {
                        emotionState: "neutral",
                        themes: [],
                        riskLevel: 0,
                        recommendationApproach: "supportive",
                        progressIndicators: [],
                    }
                }
            });

            const updateMemory = await step.run("update-memory", async () => {
                if (analysis.emotionalState) {
                    memory.userProfile.emotionalState.push(analysis.emotionalState)
                }
                if (analysis.themes) {
                    memory.sessionContext.conversationTheme.push(...analysis.themes);
                }
                if (analysis.riskLevel) {
                    memory.userProfile.riskLevel = analysis.riskLevel;
                }
                return memory;
            })

            if (analysis.riskLevel > 4) {
                await step.run('trigger-risk-alert', async () => {
                    logger.warn("High risk level detected in chat message", {
                        message,
                        riskLevel: analysis.riskLevel,
                    });
                });
            }
            const response = await step.run("generate-response", async () => {
                try {
                    const prompt = `${systemPrompt}
                    Based on the following context , generate a therapeutic response:
                    Message:${message}
                    Analysis:${JSON.stringify(analysis)}
                    Memory:${JSON.stringify(memory)}
                    Goals:${JSON.stringify(goals)}
                    Provide a response that:
                    1.Addresses the immediate emotional needs.
                    2. Uses appropriate therapeutic techniques.
                    3. Shows empathy and understanding.
                    4. Maintains professional boundaries.
                    5. Considers safety and well-being.
                    `;
                    const response = await genAI.models.generateContent({
                        model: "gemini-2.0-flash",
                        contents: prompt,

                    });
                    const result = response.text;
                    const responseText = result?.trim();
                    logger.info("Generated response:", { responseText });
                    return responseText;
                } catch (error) {
                    logger.error("Error generating response:", { error, message })
                    return "I'm here to support you.Could you tell me more about what's on your mind?";
                }


            })
            return {
                response,
                analysis,
                updateMemory
            };
        } catch (error) {
            logger.error("Error in chat message processing", {
                error,
                message: event.data.message,


            })
            return {
                response: "I'm here to support you. Could you tell me more about what's on your mind?",
                analysis: {
                    emotionalState: "neutral",
                    themes: [],
                    riskLevel: 0,
                    recommendedApproach: "supportive",
                    progressIndicators: [],
                },
                updateMemory: event.data.memory,
            };
        }
    }
)
export const analyzeTherapySession=inngest.createFunction(
    {
        id:"analyze-therapy-session",
    },
    {event:"therapy/session.created"},
    async({event,step})=>{
        try{
            const sessionContent=await step.run("get-session-content",async()=>{
                return event.data.notes || event.data.transcript;
            })
            const analysis=await step.run("analyze-with-gemini",async()=>{
                const prompt=`Analyze this therapy session and provide insights:
                Session Content:${sessionContent}
                Please provide:
                1.Key themes and topics discussed
                2.Emotional state analysis
                3.Potential areas of concern
                4.Recommendations for follow-up
                5.Progress indicators

                Format the response as a JSON object.
                `;
                const response=await genAI.models.generateContent({
                    model:"gemini-2.0-flash",
                    contents:prompt,
                });
                const results=response.text;
                const responseText=results?.trim();
                return JSON.parse(responseText||"{}");

            })
            await step.run("store-analysis",async ()=>{
                logger.info("Session analysis stored successfully");
                return analysis;
            });
            if(analysis.areasOfConcern?.length>0){
                await step.run('trigger-concern-alert',async()=>{
                    logger.warn("Concerning indicators detected in session analysis",{
                        sessionId:event.data.sessionId,
                        concerns:analysis.areasOfConcern,

                    })


                })
            }
            return{
                message:"Session analysis Completed",
                analysis,
            }
        }catch(error){
            logger.error("Error in therapy session analysis:",error);
            throw error;

        }
    }
)
export const generateActivityRecommendations=inngest.createFunction(
    {
        id:"generate-activity-recommendations",
    },
    {event:"mood/updated"},
    async({event,step})=>{

    }
)
export const functions=[
    processChatMessage,
    analyzeTherapySession
]

