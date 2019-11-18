const Directory = require('../models/directory.js');

module.exports = class PFEDir extends Directory {
    constructor(uri, reimager) {
        super(uri, reimager);
    }
};