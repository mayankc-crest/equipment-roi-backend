/**
 * Utility functions for date parsing and formatting
 */

/**
 * Parse a date string in various formats
 * @param {string} dateString - The date string to parse
 * @returns {Date|null} - Parsed date or null for empty input
 * @throws {Error} - If date format is invalid
 */
const parseDate = (dateString) => {
  if (!dateString || dateString === "null" || dateString === "undefined") {
    return null;
  }

  // Check if it's in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("-");
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  // Check if it's in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }

  // Check if it's in MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [month, day, year] = dateString.split("/");
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  // Try default parsing
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) {
    throw new Error(
      `Invalid date format: ${dateString}. Expected DD-MM-YYYY, YYYY-MM-DD, or MM/DD/YYYY`
    );
  }
  return parsed;
};

/**
 * Parse date range for database queries
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {Object} - Object with startDate and endDate (with time set to end of day)
 * @throws {Error} - If date format is invalid
 */
const parseDateRange = (startDate, endDate) => {
  const parsedStartDate = parseDate(startDate);
  const parsedEndDate = parseDate(endDate);

  // Add time to end date to include the entire day
  if (parsedEndDate) {
    parsedEndDate.setHours(23, 59, 59, 999);
  }

  return {
    startDate: parsedStartDate,
    endDate: parsedEndDate,
  };
};

/**
 * Format date for display
 * @param {Date} date - Date object
 * @param {string} format - Format string (default: 'DD-MM-YYYY')
 * @returns {string} - Formatted date string
 */
const formatDate = (date, format = "DD-MM-YYYY") => {
  if (!date || !(date instanceof Date)) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  switch (format) {
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    default:
      return date.toISOString();
  }
};

/**
 * Get date range for a specific year
 * @param {number} year - Year
 * @returns {Object} - Object with startDate and endDate for the year
 */
const getYearDateRange = (year) => {
  const startDate = new Date(year, 0, 1); // January 1st
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st

  return { startDate, endDate };
};

/**
 * Get date range for a specific month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} - Object with startDate and endDate for the month
 */
const getMonthDateRange = (year, month) => {
  const startDate = new Date(year, month - 1, 1); // First day of month
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

  return { startDate, endDate };
};

module.exports = {
  parseDate,
  parseDateRange,
  formatDate,
  getYearDateRange,
  getMonthDateRange,
};
