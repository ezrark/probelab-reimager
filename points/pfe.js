const Point = require('../models/point.js');

module.exports = class PfePointSet extends Point {
	constructor(uri, reimager, [mdb]) {
		if (mdb === undefined)
			throw 'MDB required to extract a point set';
		super(uri, reimager);
	}
};