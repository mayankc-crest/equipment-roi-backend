/**
 * Utility functions for managing hierarchical category structure
 */

/**
 * Build parent_id_tree path for a category
 * @param {number} categoryId - The category ID
 * @param {number|null} parentId - The parent category ID
 * @param {Object} sequelize - Sequelize instance
 * @returns {Promise<string>} - The parent_id_tree path
 */
async function buildParentIdTree(categoryId, parentId, sequelize) {
  if (!parentId) {
    // Top-level category - parent_id_tree is just the category ID
    return categoryId.toString();
  }

  // Get parent's parent_id_tree
  const parent = await sequelize.models.categories.findByPk(parentId, {
    attributes: ["parent_id_tree"],
  });

  if (!parent) {
    throw new Error(`Parent category with ID ${parentId} not found`);
  }

  // Build the path: parent's path + current category ID
  const parentPath = parent.parent_id_tree || parentId.toString();
  return `${parentPath}:${categoryId}`;
}

/**
 * Get all ancestor IDs from a parent_id_tree path
 * @param {string} parentIdTree - The parent_id_tree string (e.g., "1:2:3:4")
 * @returns {number[]} - Array of ancestor IDs
 */
function getAncestorIds(parentIdTree) {
  if (!parentIdTree) return [];
  return parentIdTree.split(":").map((id) => parseInt(id, 10));
}

/**
 * Get direct parent ID from parent_id_tree path
 * @param {string} parentIdTree - The parent_id_tree string (e.g., "1:2:3:4")
 * @returns {number|null} - Direct parent ID or null if top-level
 */
function getDirectParentId(parentIdTree) {
  if (!parentIdTree) return null;
  const ids = parentIdTree.split(":");
  return ids.length > 1 ? parseInt(ids[ids.length - 2], 10) : null;
}

/**
 * Get depth level of a category from parent_id_tree path
 * @param {string} parentIdTree - The parent_id_tree string (e.g., "1:2:3:4")
 * @returns {number} - Depth level (0 for root, 1 for first level, etc.)
 */
function getCategoryDepth(parentIdTree) {
  if (!parentIdTree) return 0;
  return parentIdTree.split(":").length - 1;
}

/**
 * Check if category A is an ancestor of category B
 * @param {number} ancestorId - Potential ancestor category ID
 * @param {string} descendantParentIdTree - Descendant's parent_id_tree
 * @returns {boolean} - True if ancestorId is an ancestor of the descendant
 */
function isAncestor(ancestorId, descendantParentIdTree) {
  if (!descendantParentIdTree) return false;
  const ancestorIds = getAncestorIds(descendantParentIdTree);
  return ancestorIds.includes(ancestorId);
}

/**
 * Get all descendant categories of a given category
 * @param {number} categoryId - The category ID
 * @param {Object} sequelize - Sequelize instance
 * @returns {Promise<Array>} - Array of descendant categories
 */
async function getDescendants(categoryId, sequelize) {
  // Use a more efficient approach by finding direct children first
  // then recursively finding their children
  const descendants = [];
  const directChildren = await sequelize.models.categories.findAll({
    where: {
      parent_id: categoryId,
    },
  });

  for (const child of directChildren) {
    descendants.push(child);
    // Recursively get children of this child
    const childDescendants = await getDescendants(child.id, sequelize);
    descendants.push(...childDescendants);
  }

  return descendants;
}

/**
 * Get all descendant categories using parent_id_tree (alternative method)
 * This method uses LIKE queries on parent_id_tree which may be slower
 * but useful for complex filtering scenarios
 * @param {number} categoryId - The category ID
 * @param {Object} sequelize - Sequelize instance
 * @returns {Promise<Array>} - Array of descendant categories
 */
async function getDescendantsByTree(categoryId, sequelize) {
  const descendants = await sequelize.models.categories.findAll({
    where: {
      parent_id_tree: {
        [sequelize.Sequelize.Op.like]: `%:${categoryId}:%`,
      },
    },
    order: [["parent_id_tree", "ASC"]],
  });

  return descendants;
}

/**
 * Get all ancestor categories of a given category
 * @param {string} parentIdTree - The category's parent_id_tree
 * @param {Object} sequelize - Sequelize instance
 * @returns {Promise<Array>} - Array of ancestor categories
 */
async function getAncestors(parentIdTree, sequelize) {
  if (!parentIdTree) return [];

  const ancestorIds = getAncestorIds(parentIdTree);
  // Remove the last ID (current category) to get only ancestors
  ancestorIds.pop();

  if (ancestorIds.length === 0) return [];

  const ancestors = await sequelize.models.categories.findAll({
    where: {
      id: {
        [sequelize.Sequelize.Op.in]: ancestorIds,
      },
    },
    order: [["parent_id_tree", "ASC"]],
  });

  return ancestors;
}

/**
 * Validate category hierarchy constraints
 * @param {number} categoryId - The category ID
 * @param {number|null} newParentId - The new parent category ID
 * @param {Object} sequelize - Sequelize instance
 * @returns {Promise<Object>} - Validation result with isValid and message
 */
async function validateHierarchy(categoryId, newParentId, sequelize) {
  // Check if trying to set self as parent
  if (categoryId === newParentId) {
    return {
      isValid: false,
      message: "Category cannot be its own parent",
    };
  }

  // Check if trying to set a descendant as parent (circular reference)
  if (newParentId) {
    const potentialParent = await sequelize.models.categories.findByPk(
      newParentId,
      {
        attributes: ["parent_id_tree"],
      }
    );

    if (potentialParent && potentialParent.parent_id_tree) {
      const ancestorIds = getAncestorIds(potentialParent.parent_id_tree);
      if (ancestorIds.includes(categoryId)) {
        return {
          isValid: false,
          message:
            "Cannot set a descendant category as parent (circular reference)",
        };
      }
    }
  }

  // Check maximum depth (10 levels as specified)
  if (newParentId) {
    const potentialParent = await sequelize.models.categories.findByPk(
      newParentId,
      {
        attributes: ["parent_id_tree"],
      }
    );

    if (potentialParent) {
      const parentDepth = getCategoryDepth(potentialParent.parent_id_tree);
      if (parentDepth >= 9) {
        // 9 because we're adding one more level
        return {
          isValid: false,
          message: "Maximum hierarchy depth (10 levels) would be exceeded",
        };
      }
    }
  }

  return {
    isValid: true,
    message: "Valid hierarchy",
  };
}

module.exports = {
  buildParentIdTree,
  getAncestorIds,
  getDirectParentId,
  getCategoryDepth,
  isAncestor,
  getDescendants,
  getDescendantsByTree,
  getAncestors,
  validateHierarchy,
};
