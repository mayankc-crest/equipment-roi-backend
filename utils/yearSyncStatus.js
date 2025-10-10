const fs = require("fs");
const path = require("path");

/**
 * Year Sync Status Manager
 * Handles reading and updating year sync status from JSON file
 */
class YearSyncStatusManager {
  constructor() {
    this.filePath = path.join(__dirname, "..", "data", "year-sync-status.json");
    this.ensureDataDirectory();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    const dataDir = path.dirname(this.filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Read year sync status from JSON file
   * @returns {Object} Year sync status object
   */
  readYearSyncStatus() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf8");
        return JSON.parse(data);
      } else {
        console.log("Year sync status file not found, creating default...");
        return this.createDefaultStatus();
      }
    } catch (error) {
      console.error("Error reading year sync status:", error);
      return this.createDefaultStatus();
    }
  }

  /**
   * Write year sync status to JSON file
   * @param {Object} statusData - Year sync status object
   */
  writeYearSyncStatus(statusData) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(statusData, null, 2));
      console.log("Year sync status updated successfully");
    } catch (error) {
      console.error("Error writing year sync status:", error);
      throw error;
    }
  }

  /**
   * Create default year sync status
   * @returns {Object} Default year sync status
   */
  createDefaultStatus() {
    const defaultStatus = {};
    for (let year = 2010; year <= 2025; year++) {
      defaultStatus[year] = {
        year: year,
        year_status: "pending",
        last_sync: null,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
      };
    }
    this.writeYearSyncStatus(defaultStatus);
    return defaultStatus;
  }

  /**
   * Get sync status for a specific year
   * @param {number} year - Year to get status for
   * @returns {Object} Year sync status
   */
  getYearStatus(year) {
    const statusData = this.readYearSyncStatus();
    return statusData[year] || null;
  }

  /**
   * Update sync status for a specific year
   * @param {number} year - Year to update
   * @param {string} status - New status ('pending' or 'completed')
   * @param {string} lastSync - Last sync timestamp (optional)
   */
  updateYearStatus(year, status, lastSync = null) {
    const statusData = this.readYearSyncStatus();

    if (!statusData[year]) {
      statusData[year] = {
        year: year,
        year_status: "pending",
        last_sync: null,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
      };
    }

    statusData[year].year_status = status;
    if (lastSync) {
      statusData[year].last_sync = lastSync;
    }

    this.writeYearSyncStatus(statusData);
    console.log(`Year ${year} sync status updated to: ${status}`);
  }

  /**
   * Mark year sync as completed
   * @param {number} year - Year to mark as completed
   */
  markYearCompleted(year) {
    const timestamp = new Date().toISOString();
    this.updateYearStatus(year, "completed", timestamp);
  }

  /**
   * Mark year sync as pending
   * @param {number} year - Year to mark as pending
   */
  markYearPending(year) {
    this.updateYearStatus(year, "pending");
  }

  /**
   * Get all years with their sync status
   * @returns {Object} All years sync status
   */
  getAllYearsStatus() {
    return this.readYearSyncStatus();
  }

  /**
   * Get years by status
   * @param {string} status - Status to filter by ('pending' or 'completed')
   * @returns {Array} Array of years with the specified status
   */
  getYearsByStatus(status) {
    const statusData = this.readYearSyncStatus();
    return Object.keys(statusData).filter(
      (year) => statusData[year].year_status === status
    );
  }

  /**
   * Reset all years to pending status
   */
  resetAllYears() {
    const statusData = this.readYearSyncStatus();
    Object.keys(statusData).forEach((year) => {
      statusData[year].year_status = "pending";
      statusData[year].last_sync = null;
    });
    this.writeYearSyncStatus(statusData);
    console.log("All years reset to pending status");
  }
}

// Create singleton instance
const yearSyncStatusManager = new YearSyncStatusManager();

module.exports = yearSyncStatusManager;
