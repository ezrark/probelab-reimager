const Directory = require('../models/directory.js');

const reimager = {};

const dir = new Directory('E:/probelab/thermo imaging/', reimager);

dir.refresh().then((dir) => {
	console.log(dir.getAllSubFiles('pfePointSet'));
	console.log(dir);
}).catch((err) => {
	console.error(err);
});