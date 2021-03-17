const hash = require('crypto').createHash;

const assert = require('assert');
const {describe, it} = require('mocha');

const io = require('../../io.js');

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
			'19e4aa83510aa3387a46369d7cdf0bc9ed49d32be9757c274d1d8f143cc09c2b'
		);
	});

	it('should read an arbitrary index', async () => {
		assert.deepStrictEqual(
			await readBim('./test/data/pfe-mdb/2019-08-12_Nolen.BIM', 3),
			'cd7e733ff72952862df87a6d915746bc6b96c3982f2cee47265e5ca61d75afb7'
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

describe('#getPFEExpectedImages', function() {
	this.timeout(5000);

	it('should throw when file is not found', async () => {
		await assert.rejects(io.getPFEExpectedImages.bind(undefined, './test/data/pfe-mdb/not-real.mdb'));
	});

	it('should get the number of images in the mdb/bim on windows, otherwise throw', async () => {
		if (process.platform === 'win32')
			assert.deepStrictEqual(
				await io.getPFEExpectedImages('./test/data/pfe-mdb/2019-08-12_Nolen.mdb'),
				9
			);
		else
			await assert.rejects(io.getPFEExpectedImages.bind(undefined, './test/data/pfe-mdb/2019-08-12_Nolen.mdb'));
	});
});

describe('#readPFEEntry', () => {
	it('should throw when file is not found', async () => {
		await assert.rejects(io.readPFEEntry.bind(undefined, './test/data/pfe-mdb/not-real.mdb?1'));
	});

	it('should get image data and points, otherwise throw', async () => {
		if (process.platform === 'win32')
			assert.deepStrictEqual(
				await io.readPFEEntry('./test/data/pfe-mdb/2019-08-12_Nolen.mdb?1'),
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
						'ImageXMax': 7.420400619506836,
						'ImageXMin': 8.135159492492676,
						'ImageYMax': -3.707637071609497,
						'ImageYMin': -3.1693828105926514,
						'ImageZ1': 9.942500114440918,
						'ImageZ2': 9.942500114440918,
						'ImageZ3': 9.942500114440918,
						'ImageZ4': 9.942500114440918,
						'ImageZMax': 12122,
						'ImageZMin': 51
					},
					'points': [
						{
							'analysis': 16,
							'name': 125,
							'type': 'spot',
							'values': [
								0.33566951751708984,
								0.2691471576690674,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 16,
							'name': 126,
							'type': 'spot',
							'values': [
								0.27945947647094727,
								0.24294710159301758,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 16,
							'name': 127,
							'type': 'spot',
							'values': [
								0.28276968002319336,
								0.2794370651245117,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 17,
							'name': 128,
							'type': 'spot',
							'values': [
								0.23475933074951172,
								0.30803704261779785,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 17,
							'name': 129,
							'type': 'spot',
							'values': [
								0.18075942993164062,
								0.336137056350708,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 17,
							'name': 130,
							'type': 'spot',
							'values': [
								0.16026926040649414,
								0.2927370071411133,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 18,
							'name': 131,
							'type': 'spot',
							'values': [
								0.34045934677124023,
								0.15854716300964355,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 18,
							'name': 132,
							'type': 'spot',
							'values': [
								0.36096954345703125,
								0.11954712867736816,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 18,
							'name': 133,
							'type': 'spot',
							'values': [
								0.30946969985961914,
								0.1230471134185791,
								0.7147588729858398,
								0.5382542610168457
							]
						},
						{
							'analysis': 19,
							'name': 134,
							'type': 'spot',
							'values': [
								0.4402594566345215,
								0.3992471694946289,
								0.7147588729858398,
								0.5382542610168457
							]
						}
					]
				}
			);
		else
			await assert.rejects(io.readPFEEntry.bind(undefined, './test/data/pfe-mdb/2019-08-12_Nolen.mdb?1'));
	});
});
