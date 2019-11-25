const Directory = require('../models/directory.js');

const reimager = {};

const dir = new Directory({uri: 'E:/probelab/thermo imaging', stats: {}}, reimager);

dir.refresh().then((dir) => {
	console.log(dir.getAllSubFiles(['pfePointSet', 'thermoPointSet']));
	const someDir = dir.resolveSomeDirectory('2019-05-29 Test/2019-05-29');
	console.log(dir.getAllSubFiles('thermoImage').map(file => {return {name: file.getName(), stats: file.getStats()}}));
//	console.log(dir);
}).catch((err) => {
	console.error(err);
});