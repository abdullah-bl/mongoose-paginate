'use strict';

/**
 * @package mongoose-paginate
 * @param {Object} [query={}]
 * @param {Object} [options={}]
 * @param {Object|String} [options.select]
 * @param {Object|String} [options.sort]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean} [options.lean=false]
 * @param {Boolean} [options.leanWithId=true]
 * @param {Number} [options.offset=0] - Use offset or page to set skip position
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=10]
 * @param {Function} [callback]
 * @returns {Promise}
 */

async function paginate(query, options, callback) {
  query = query || {};
  options = Object.assign({}, paginate.options, options);
  let select = options.select;
  let sort = options.sort;
  let populate = options.populate;
  let lean = options.lean || false;
  let leanWithId = options.leanWithId ? options.leanWithId : true;
  let limit = options.limit ? options.limit : 10;
  let page, offset, skip, data;
  if (options.offset) {
    offset = options.offset;
    skip = offset;
  } else if (options.page) {
    page = options.page;
    skip = (page - 1) * limit;
  } else {
    page = 1;
    offset = 0;
    skip = offset;
  }
  if (limit) {
    let docsQuery = this.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(lean);
    if (populate) {
      [].concat(populate).forEach((item) => {
        docsQuery.populate(item);
      });
    }
    data = {
      docs: await docsQuery.exec(),
      count: await this.count(query).exec()
    };
    if (lean) {
      if (leanWithId) {
        data.docs = data.docs.map(doc => { 
          doc.id = String(doc._id) 
          return doc
        })
      } else if (leanWithId === false) {
        let _docs = data.docs.map(doc => { 
          delete doc.id
          return doc
        })
        data.docs = _docs
      } else {
        data.docs
      }
    }

  let result = {
    docs: data.docs,
    total: data.count,
    limit: limit
  }
  if (offset !== undefined) {
    result.offset = offset;
  }
  if (page !== undefined) {
    result.page = page;
    result.pages = Math.ceil(data.count / limit) || 1;
  }
  if (typeof callback === 'function') {
    return callback(null, result);
  }
    return result
  }
}

/**
 * @param {Schema} schema
 */

module.exports = function(schema) {
  schema.statics.paginate = paginate;
};

module.exports.paginate = paginate;
