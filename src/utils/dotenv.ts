import 'dotenv/config';
import z from "zod";

const _grpcUrlValidator = z.custom<string>((val: unknown) => {
  return typeof val == "string" && /^grpc(s)?:\/\/[^\s]+$/.test(val);
}, {
  message: "Must be a gRPC address"
});

const dotenvSchema = z.object({
  auth_service_url: _grpcUrlValidator
});

// check env and return type-safe variables
// throw if error occurred
export const env = dotenvSchema.parse(process.env)