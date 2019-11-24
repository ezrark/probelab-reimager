const Directory = require('../models/directory.js');

const reimager = {};

const dir = new Directory({uri: 'E:/probelab/thermo imaging/', stats: {}}, reimager);

dir.refresh().then((dir) => {
	console.log(dir.getAllSubFiles(['pfePointSet', 'thermoPointSet']));
//	console.log(dir);
}).catch((err) => {
	console.error(err);
});