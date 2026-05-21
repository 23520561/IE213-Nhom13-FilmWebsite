export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/test/integration/**/*.test.js"],
  collectCoverageFrom: [
    "graphql/**/*.js",
    "utils/**/*.js",
    "models/**/*.js",
    "!**/*.test.js",
    "!**/node_modules/**",
  ],
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  maxWorkers: 1,
  verbose: true,
};
