const hash = require('crypto').createHash;

const assert = require('assert');
const {describe, it} = require('mocha');

const io = require('../../io.js');
const PFE = require('../../pfe.js');

async function readBim(uri, index) {
	const pic = await io.readBIM(`${uri}${index !== undefined ? `?${index}` : ''}`);
	if (pic === undefined)
		return undefined;

	return hash('sha256').update(pic).digest('hex', undefined);
}

describe('#readBIM', () => {
	it('should read first index by default', async () => {
		assert.deepStrictEqual(
			await readBim('./test/data/pfe-mdb/2019-08-12_Nolen.BIM'),
			'2ebc1d4725ff54206d37b49f76d71562d2594f834f2b5444c5214f4906675854'
		);
	});

	it('should read an arbitrary index', async () => {
		assert.deepStrictEqual(
			await readBim('./test/data/pfe-mdb/2019-08-12_Nolen.BIM', 3),
			'fd126053b27d3244889f5b7f87b9deac2eebe69a0492ed9d364fbc18962c5d73'
		);
	});

	it('should return undefined if an index is out of range', async () => {
		assert.deepStrictEqual(
			await readBim('./test/data/pfe-mdb/2019-08-12_Nolen.BIM', 10),
			undefined
		);
	});
});

describe('#checkBIMExists', () => {
	it('should find a .bim file', () => {
		assert.doesNotThrow(io.checkBIMExists.bind(undefined, './test/data/pfe-mdb/2019-08-12_Nolen.BIM'));
	});

	it('should throw when file is not found', () => {
		assert.throws(io.checkBIMExists.bind(undefined, './test/data/pfe-mdb/2019-08-'));
	});
});

describe('#readPFEEntry', () => {
	it('should throw when file is not found', async () => {
		await assert.rejects(io.readPFEEntry.bind(undefined, './test/data/pfe-mdb/not-real.mdb?1'));
	});
/*
	it('should get all image data with pojhkintggggggs', async () => {
		const pfe = new PFE({
			name: '2019-08-12_Nolen.MDB',
			uri: './test/data/pfe-mdb/2019-08-12_Nolen.MDB'
		}, undefined);
		const test = await pfe.init();

		console.log();
	});

	it('should get all image data with pojhkints', async () => {
		const pfe = new PFE({
			name: 'Inqua-Intav_01-26-2010.MDB',
			uri: 'C:/Users/brude/Downloads/New folder/Inqua-Intav_01-26-2010.MDB'
		}, undefined);
		const test = await pfe.init();

		console.log();
	});
*/
	it('should get all image data with points', async () => {
		assert.deepStrictEqual(
			(await io.readPFEEntry('./test/data/pfe-mdb/2019-08-12_Nolen.MDB'))[0],
			{
				'image': {
					'ImageAnalogAverages': 20,
					'ImageBeamCurrent': 30,
					'ImageBeamSize': 0,
					'ImageChannelName': 'BSE',
					'ImageChannelNumber': 2,
					'ImageDisplayDPI': 1,
					'ImageIx': 1024,
					'ImageIy': 768,
					'ImageKilovolts': 20,
					'ImageMag': 160,
					'ImageNumber': 1,
					'ImageScanRotation': 0,
					'ImageTakeoff': 40,
					'ImageTitle': 'PM1-phase1',
					'ImageToRow': 12,
					'ImageXMax': 7.4204006,
					'ImageXMin': 8.1351595,
					'ImageYMax': -3.7076371,
					'ImageYMin': -3.1693828,
					'ImageZ1': 9.9425001,
					'ImageZ2': 9.9425001,
					'ImageZ3': 9.9425001,
					'ImageZ4': 9.9425001,
					'ImageZMax': 12122,
					'ImageZMin': 51,
					'xDiff': 0.7147589,
					'yDiff': 0.5382543
				},
				'points': [
					{
						'analysis': 16,
						'name': '125',
						'stage': {
							'orientation': {
								x: 'reverse',
								y: 'reverse'
							},
							'reference': {
								x: 7.79949,
								y: -3.4384899,
								z: 9.9425001
							}
						},
						'type': 'spot'
					},
					{
						'analysis': 16,
						'name': 126,
						'type': 'spot',
						'values': [
							0.2794595,
							0.2429471,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 16,
						'name': 127,
						'type': 'spot',
						'values': [
							0.2827697,
							0.2794371,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 17,
						'name': 128,
						'type': 'spot',
						'values': [
							0.2347593,
							0.3080371,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 17,
						'name': 129,
						'type': 'spot',
						'values': [
							0.1807594,
							0.3361371,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 17,
						'name': 130,
						'type': 'spot',
						'values': [
							0.1602693,
							0.2927370,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 18,
						'name': 131,
						'type': 'spot',
						'values': [
							0.3404594,
							0.1585472,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 18,
						'name': 132,
						'type': 'spot',
						'values': [
							0.3609696,
							0.1195472,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 18,
						'name': 133,
						'type': 'spot',
						'values': [
							0.3094697,
							0.1230471,
							0.7147589,
							0.5382543
						]
					},
					{
						'analysis': 19,
						'name': 134,
						'type': 'spot',
						'values': [
							0.4402595,
							0.3992472,
							0.7147589,
							0.5382543
						]
					}
				]
			}
		);
	});
});
