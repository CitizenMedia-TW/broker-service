import 'dotenv/config';
import z from "zod";

const dotenvSchema = z.object({
  AUTH_SERVICE_URL: z.string().regex(/^[0-9]{1,3}(?:\.[0-9]{1,3}){3}(?:\:[0-9]{1,5})?$/)
});

// check env and return type-safe variables
// throw if error occurred
export const env = dotenvSchema.parse(process.env)