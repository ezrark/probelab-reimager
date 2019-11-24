const GeneralFile = require('../models/file.js');

module.exports = class ElementMap extends GeneralFile {
	constructor({uri, stats}, reimager) {
		super({uri, stats}, reimager);
	}

	process(data) {
		return data;
	}
};