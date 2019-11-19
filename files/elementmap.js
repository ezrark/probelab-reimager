const GeneralFile = require('../models/file.js');

module.exports = class ElementMap extends GeneralFile {
	constructor(uri, reimager) {
		super(uri, reimager);
	}

	process(data) {
		return data;
	}
};