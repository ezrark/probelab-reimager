const GeneralFile = require('../models/file.js');

module.exports = class PfeMdb extends GeneralFile {
    constructor(uri, reimager) {
        super(uri, reimager);
    }
};