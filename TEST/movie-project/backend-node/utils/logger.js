export const logInfo = (msg, data = {}) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data);
};

export const logWarn = (msg, data = {}) => {
  console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data);
};

export const logError = (msg, data = {}) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, data);
};

export const logAuth = (action, userId, status) => {
  logInfo(`Auth: ${action}`, { userId, status, timestamp: new Date() });
};

export const logMutation = (mutation, userId, resourceId) => {
  logInfo(`Mutation: ${mutation}`, { userId, resourceId, timestamp: new Date() });
};
