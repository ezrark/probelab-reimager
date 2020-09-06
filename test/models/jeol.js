const assert = require('assert');
const {describe, it} = require('mocha');

const JeolImage = require('../../jeolimage.js');

describe('Initialize', () => {
	it('should fail to initialize a non-existent file', () => {
		assert.throws(() => new JeolImage({name: '64.txt', uri: './test/data/jeol-images/64.txt'}, {}));
	});

	it('should create the correct base metadata for a txt entry file with a .tif', () => {
		const jeol = new JeolImage({name: '1.txt', uri: './test/data/jeol-images/1.txt'}, {});

		assert.deepStrictEqual(jeol.data, {
			"Canvas": {},
			"uuid": jeol.data.uuid,
			"uri": "./test/data/jeol-images/",
			"name": "1",
			"scale": {},
			"scratchCanvas": undefined,
			"scratchCtx": undefined,
			"canvas": undefined,
			"ctx": undefined,
			"metaConstants": {},
			"integrity": true,
			"magnification": 430,
			"points": {},
			"layers": {},
			"files": {
				"base": "./test/data/jeol-images/1.tif",
				"entry": "./test/data/jeol-images/1.txt",
				"points": [],
				"layers": [
					{
						"element": "base",
						"file": "./test/data/jeol-images/1.tif",
						"cutoffHeight": 1920
					},
					{
						"element": "solid",
						"file": ""
					}
				]
			},
			"metadata": {},
			"data": {
				"point": {},
				"map": {}
			},
			"outputFormat": ".png"
		});
	});

	it('should create the correct base metadata for a txt entry file with a .jpg', () => {
		const jeol = new JeolImage({name: '5.txt', uri: './test/data/jeol-images/5.txt'}, {});

		assert.deepStrictEqual(jeol.data, {
			"Canvas": {},
			"uuid": jeol.data.uuid,
			"uri": "./test/data/jeol-images/",
			"name": "5",
			"scale": {},
			"scratchCanvas": undefined,
			"scratchCtx": undefined,
			"canvas": undefined,
			"ctx": undefined,
			"metaConstants": {},
			"integrity": true,
			"magnification": 95,
			"points": {},
			"layers": {},
			"files": {
				"base": "./test/data/jeol-images/5.jpg",
				"entry": "./test/data/jeol-images/5.txt",
				"points": [],
				"layers": [
					{
						"element": "base",
						"file": "./test/data/jeol-images/5.jpg",
						"cutoffHeight": 960
					},
					{
						"element": "solid",
						"file": ""
					}
				]
			},
			"metadata": {},
			"data": {
				"point": {},
				"map": {}
			},
			"outputFormat": ".png"
		});
	});

	it('should create the correct base metadata for a txt entry file with a .png', () => {
		const jeol = new JeolImage({name: '4.txt', uri: './test/data/jeol-images/4.txt'}, {});

		assert.deepStrictEqual(jeol.data, {
			"Canvas": {},
			"uuid": jeol.data.uuid,
			"uri": "./test/data/jeol-images/",
			"name": "4",
			"scale": {},
			"scratchCanvas": undefined,
			"scratchCtx": undefined,
			"canvas": undefined,
			"ctx": undefined,
			"metaConstants": {},
			"integrity": true,
			"magnification": 430,
			"points": {},
			"layers": {},
			"files": {
				"base": "./test/data/jeol-images/4.png",
				"entry": "./test/data/jeol-images/4.txt",
				"points": [],
				"layers": [
					{
						"element": "base",
						"file": "./test/data/jeol-images/4.png",
						"cutoffHeight": 1920
					},
					{
						"element": "solid",
						"file": ""
					}
				]
			},
			"metadata": {},
			"data": {
				"point": {},
				"map": {}
			},
			"outputFormat": ".png"
		});
	});
});