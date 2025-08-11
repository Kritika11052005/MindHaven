import { Inngest } from "inngest";

// Initialize the Inngest client
export const inngest = new Inngest({
  id: "ai-therapy-agent",
  // You can add your Inngest signing key here if you have one
  eventKey:
    "",
});

// Export the functions array (this will be populated by the functions.ts file)
export const functions: any[] = [];