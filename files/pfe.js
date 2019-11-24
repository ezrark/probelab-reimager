const GeneralFile = require('../models/file.js');

module.exports = class PfeMdb extends GeneralFile {
    constructor({uri, stats}, reimager) {
        super({uri, stats}, reimager);
    }
};