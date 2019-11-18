const GeneralFile = require('../models/file.js');

module.exports = class MSAFile extends GeneralFile {
    constructor(uri, reimager) {
        super(uri, reimager);
    }

    process(data) {
        return data;
    }
};