function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(404).json({ error: "not authenticated" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ error: "You are not allowed to use this page..." });
      }

      next();
    } catch (error) {
        console.error(error);
    }
  };
}


module.exports = roleMiddleware;