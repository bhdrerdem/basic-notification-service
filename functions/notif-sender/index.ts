import axios from "axios";

type CustomEvent = {
  segment: string;
  templateId: string;
};

export const handler = async (event: CustomEvent): Promise<void> => {
  try {
    const { segment, templateId } = event;

    if (!templateId || !segment) {
      throw new Error("Missing fields templateId or segment");
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error("Missing API_URL environment variable");
    }

    await axios.post(`${apiUrl}/push/send/bulk`, {
      segment,
      templateId,
    });
  } catch (error) {
    console.error("Failed to process notification event", error);
    throw error;
  }
};
