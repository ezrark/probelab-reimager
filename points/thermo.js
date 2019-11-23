const Point = require('../models/point.js');

module.exports = class ThermoPointSet extends Point {
	constructor(uri, reimager, [msa, info]) {
		if (msa === undefined || info === undefined)
			throw 'An msa and point info file required to extract thermo points';
		super(uri, reimager);
	}
};