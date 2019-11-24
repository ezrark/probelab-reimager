const GeneralFile = require('./file.js');

module.exports = class Point extends GeneralFile {
	constructor({uri, stats}, reimager) {
		super({uri, stats}, reimager);
	}

	process(data) {
		return data;
	}
};