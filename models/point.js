const GeneralFile = require('./file.js');

module.exports = class Point extends GeneralFile {
	constructor(uri, reimager) {
		super(uri, reimager);
	}

	process(data) {
		return data;
	}
};