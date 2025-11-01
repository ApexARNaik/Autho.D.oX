import { query } from "./_generated/server";

export const getKeyStatus = query({
  args: {},
  handler: async (ctx) => {
    const key = process.env.PINATA_JWT;

    if (!key) {
      return "KEY IS MISSING! The PINATA_JWT environment variable is not set.";
    }

    if (key.length < 100) {
      return `KEY IS TOO SHORT! It is probably the API Key, not the JWT. Key starts with: ${key.substring(0, 5)}...`;
    }

    if (!key.startsWith("eyJ")) {
      return `KEY IS WRONG! A JWT must start with 'eyJ...'. Your key starts with: ${key.substring(0, 5)}...`;
    }

    return "SUCCESS! Your PINATA_JWT is set and looks like a valid JWT.";
  },
});