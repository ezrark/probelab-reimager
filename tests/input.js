const constants = require('../newConstants.json');
const InputStructure = require('../inputstructure.js');

const input = new InputStructure(constants.inputStructures);

const reimager = {};
const subDirs = new Map();
const files = [
	{
		name: 'test.msa',
		uri: 'C:/fake/test.msa'
	},
	{
		name: 'test.siref',
		uri: 'C:/fake/test.siref',
	},
	{
		name: 'Extracted Spectrum.emsa',
		uri: 'C:/fake/Extracted Spectrum.emsa'
	},
	{
		name: 'test.csi',
		uri: 'C:/fake/test.csi',
	},
	{
		name: 'test.mdb',
		uri: 'C:/fake/test.mdb'
	},
	{
		name: 'test.bim',
		uri: 'C:/fake/test.bim'
	},
	{
		name: 'jeol.txt',
		uri: 'C:/fake/jeol.txt'
	},
	{
		name: 'jeol.tif',
		uri: 'C:/fake/jeol.tif'
	},
	{
		name: 'idk.p_s',
		uri: 'C:/fake/idk.p_s'
	}
];

const parsed = input.process(reimager, files, subDirs);

console.log(parsed);