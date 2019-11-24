const GeneralFile = require('../models/file.js');

module.exports = class JeolText extends GeneralFile {
	constructor({uri, stats}, reimager) {
		super({uri, stats}, reimager);
	}

	process(data) {
		return data;
	}
};