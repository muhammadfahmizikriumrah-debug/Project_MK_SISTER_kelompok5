const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.message && err.message.includes('Search service unavailable')) {
    return res.status(503).json({
      success: false,
      message: 'Search service temporarily unavailable'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = { errorHandler };
