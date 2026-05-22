export const requireAuth = (context) => {
  if (!context.user) {
    throw new Error("Unauthorized: user not authenticated");
  }
};

export const requireAdmin = (context) => {
  if (!context.user) {
    throw new Error("Unauthorized: user not authenticated");
  }
  if (context.user.role !== "admin") {
    throw new Error("Forbidden: only admins can perform this action");
  }
};

export const requireOwnerOrAdmin = (context, userId) => {
  if (!context.user) {
    throw new Error("Unauthorized: user not authenticated");
  }
  const userIdStr = userId.toString();
  const contextUserIdStr = context.user.userId.toString();
  if (context.user.role !== "admin" && userIdStr !== contextUserIdStr) {
    throw new Error("Forbidden: can only modify your own resources");
  }
};
