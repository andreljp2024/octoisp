const requirePermission = (permission) => (req, res, next) => {
  const permissions = req.permissions || req.user?.permissions || [];
  const isAdmin = req.user?.isAdmin;

  if (isAdmin || permissions.includes(permission)) {
    return next();
  }

  return res.status(403).json({
    error: 'Permissão negada.',
    permission
  });
};

module.exports = { requirePermission };
