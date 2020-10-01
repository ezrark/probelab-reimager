

const assert = require('assert');
const {describe, it} = require('mocha');

require('./io/test.js');
require('./models/test.js');
require('./sanitize/test.js');

describe('Calculations', () => {
	const calc = require('../calculations.js');

	describe('#calculatePixelSize', () => {
		it('should return 46.4 floating (4)', () => {
			assert.deepStrictEqual(
				calc.calculatePixelSize(10, 256, 116),
				46.400000000000006
			);
		});

		it('should return 11.6 floating (base)', () => {
			assert.deepStrictEqual(
				calc.calculatePixelSize(10, 1024, 116),
				11.600000000000001
			);
		});

		it('should return 2.9 floating (1/4)', () => {
			assert.deepStrictEqual(
				calc.calculatePixelSize(10, 4096, 116),
				2.9000000000000004
			);
		});
	});

	describe('#estimateVisualScale', () => {
		it('should return 1000 visual scale, 86 scale length, 11.6 floating pixel size, for <40', () => {
			assert.deepStrictEqual(
				calc.estimateVisualScale(10, 1024, 116),
				[1000, 86, 11.600000000000001]
			);
		});

		it('should return 5 visual scale, 216 scale length, 0.0232 floating pixel size, for 5000', () => {
			assert.deepStrictEqual(
				calc.estimateVisualScale(5000, 1024, 116),
				[5, 216, 0.023200000000000002]
			);
		});

		it('should return 0.05 visual scale, 216 scale length, 0.00232 floating pixel size, for >500000', () => {
			assert.deepStrictEqual(
				calc.estimateVisualScale(500000, 1024, 116),
				[0.05, 216, 0.000232]
			);
		});
	});

	describe('#pointToXY', () => {
		it('should calculate the lowest corner', () => {
			assert.deepStrictEqual(
				calc.pointToXY([256, 256, 256, 256], 1024, 1024),
				[1024, 1024]
			);
		});

		it('should calculate the highest corner', () => {
			assert.deepStrictEqual(
				calc.pointToXY([0, 0, 256, 256], 1024, 1024),
				[0, 0]
			);
		});
		it('should calculate between extremes', () => {
			assert.deepStrictEqual(
				calc.pointToXY([128, 24, 256, 256], 1024, 1024),
				[512, 96]
			);
		});
	});
});