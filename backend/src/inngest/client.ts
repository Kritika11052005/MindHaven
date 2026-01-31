import { Inngest } from "inngest";

// Initialize the Inngest client
export const inngest = new Inngest({
  id: "ai-therapy-agent",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Export the functions array with proper typing
export const functions: Array<ReturnType<typeof inngest.createFunction>> = [];