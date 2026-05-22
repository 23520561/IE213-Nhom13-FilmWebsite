import { logError } from "../utils/logger.js";

export const handleGraphQLError = (error, context) => {
  logError("GraphQL error", {
    message: error.message,
    userId: context.user?.userId,
    timestamp: new Date(),
  });

  // Don't expose internal error details to client
  if (error.message.includes("MongooseError") || error.message.includes("MongoDB")) {
    return {
      message: "Database error",
      extensions: { code: "INTERNAL_ERROR" },
    };
  }

  return {
    message: error.message,
    extensions: { code: error.extensions?.code || "INTERNAL_ERROR" },
  };
};

export const formatErrors = (errors) => {
  return errors.map((error) => ({
    message: error.message,
    extensions: error.extensions,
  }));
};
