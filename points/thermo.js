const Point = require('../models/point.js');

module.exports = class ThermoPointSet extends Point {
	constructor(uri, reimager, [msa, info]) {
		if (msa === undefined || info.length === 0)
			throw 'An msa and point info file required to extract thermo points';
		super({uri, stats: msa.getStats()}, reimager);
	}
};