exports.sendSuccessRespose = (
  res,
  data = [],
  message = "Success",
  status = 200
) => {
  const response = { status, message, data };
  res.status(status).json({ success: true, ...response });
};

exports.sendErrorResponse = (
  res,
  message = "Internal Server Error",
  status = 500
) => {
  const response = { status, message };
  res.status(status).json({ success: false, ...response });
};
