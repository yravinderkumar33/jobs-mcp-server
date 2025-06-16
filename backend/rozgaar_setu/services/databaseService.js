/**
 * Generalized Database Service
 * Provides common database operations for any model
 */

class DatabaseService {
  constructor(model) {
    this.model = model;
  }

  /**
   * Search with filters and options
   * @param {Object} filters - MongoDB query filters
   * @param {Object} options - Query options (limit, skip, sort, etc.)
   * @returns {Promise<Array>} Array of documents
   */
  async search(filters = {}, options = {}) {
    try {
      return await this.model.find(filters, null, options).lean();
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Find one document by filters
   * @param {Object} filters - MongoDB query filters
   * @returns {Promise<Object|null>} Document or null
   */
  async findOne(filters = {}) {
    try {
      return await this.model.findOne(filters).lean();
    } catch (error) {
      throw new Error(`Find one failed: ${error.message}`);
    }
  }

  /**
   * Find by ID
   * @param {String} id - Document ID
   * @returns {Promise<Object|null>} Document or null
   */
  async findById(id) {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      throw new Error(`Find by ID failed: ${error.message}`);
    }
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Create failed: ${error.message}`);
    }
  }

  /**
   * Update one document
   * @param {Object} filters - MongoDB query filters
   * @param {Object} updateData - Data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>} Updated document or null
   */
  async updateOne(filters, updateData, options = { new: true }) {
    try {
      return await this.model.findOneAndUpdate(filters, updateData, options);
    } catch (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
  }

  /**
   * Update by ID
   * @param {String} id - Document ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>} Updated document or null
   */
  async updateById(id, updateData, options = { new: true }) {
    try {
      return await this.model.findByIdAndUpdate(id, updateData, options);
    } catch (error) {
      throw new Error(`Update by ID failed: ${error.message}`);
    }
  }

  /**
   * Delete one document
   * @param {Object} filters - MongoDB query filters
   * @returns {Promise<Object|null>} Deleted document or null
   */
  async deleteOne(filters) {
    try {
      return await this.model.findOneAndDelete(filters);
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete by ID
   * @param {String} id - Document ID
   * @returns {Promise<Object|null>} Deleted document or null
   */
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Delete by ID failed: ${error.message}`);
    }
  }

  /**
   * Count documents
   * @param {Object} filters - MongoDB query filters
   * @returns {Promise<Number>} Count of matching documents
   */
  async count(filters = {}) {
    try {
      return await this.model.countDocuments(filters);
    } catch (error) {
      throw new Error(`Count failed: ${error.message}`);
    }
  }

  /**
   * Check if document exists
   * @param {Object} filters - MongoDB query filters
   * @returns {Promise<Boolean>} True if exists, false otherwise
   */
  async exists(filters) {
    try {
      const doc = await this.model.findOne(filters).select('_id').lean();
      return !!doc;
    } catch (error) {
      throw new Error(`Exists check failed: ${error.message}`);
    }
  }

  /**
   * Aggregate data
   * @param {Array} pipeline - MongoDB aggregation pipeline
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Aggregation failed: ${error.message}`);
    }
  }
}

module.exports = DatabaseService; 