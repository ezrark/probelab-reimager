const hash = require('crypto').createHash;

const assert = require('assert');
const {describe, it} = require('mocha');

describe('IO', () => {
    const io = require('../io.js')

    async function readBim(uri, index) {
        const pic = await io.readBIM(`${uri}${index !== undefined ? `?${index}` : ''}`);
        if (pic === undefined)
            return undefined

        return hash("sha256").update(pic).digest('hex', undefined);
    }

    describe('#readMASFile', () => {
        it('should read a .psmsa file', () => {
            assert.deepStrictEqual(
                hash("sha256").update(
                    JSON.stringify(io.readMASFile('test/data/1024.PS.EDS/1024_pt1.psmsa'))
                ).digest('hex', undefined),
                'cd795cf196a92b64949170500b40b7e88cce958587de5cd9a62592f7097fa289'
            );
        });

        it('should throw when file is not found', () => {
            assert.throws(
                io.readMASFile.bind(undefined, 'test/data/1024.PS.EDS/1024_pt1')
            );
        });
    });

    describe('#readNSSEntry', () => {
        it('should read a .p_s file', () => {
            assert.deepStrictEqual(
                hash("sha256").update(
                    JSON.stringify(io.readNSSEntry('test/data/1024.PS.EDS/1024.p_s'))
                ).digest('hex', undefined),
                '0f2503a2925d2b5309cbf6ccf84033dc5a97c0cef490f12c64a671e77a3daedc'
            );
        });

        it('should throw when file is not found', () => {
            assert.throws(io.readNSSEntry.bind(undefined, 'test/data/1024.PS.EDS/1024'));
        });
    });

    describe('#readBIM', () => {
        it('should read first index by default', async () => {
            assert.deepStrictEqual(
                await readBim('test/data/pfe-mdb/2019-08-12_Nolen.BIM'),
                '19e4aa83510aa3387a46369d7cdf0bc9ed49d32be9757c274d1d8f143cc09c2b'
            );
        });

        it('should read an arbitrary index', async () => {
            assert.deepStrictEqual(
                await readBim('test/data/pfe-mdb/2019-08-12_Nolen.BIM', 3),
                'cd7e733ff72952862df87a6d915746bc6b96c3982f2cee47265e5ca61d75afb7'
            );
        });

        it('should return undefined if an index is out of range', async () => {
            assert.deepStrictEqual(
                await readBim('test/data/pfe-mdb/2019-08-12_Nolen.BIM', 10),
                undefined
            );
        });
    });

    describe('#readJeolEntry', () => {
        it('should read a .txt file', () => {
            assert.deepStrictEqual(
                hash("sha256").update(
                    JSON.stringify(io.readJeolEntry('test/data/jeol-images/1.txt'))
                ).digest('hex', undefined),
                '0c5cf05632e9d879d656d8bd20d74a2466105812b2fca572f6771eb8aef46546'
            );
        });
    });

    describe('#checkJeolExists', () => {
        it('should find a .tif file', () => {
            assert.doesNotThrow(() => io.checkJeolExists('test/data/jeol-images/1.tif'), Error);
        });

        it('should throw when file is not found', () => {
            assert.throws(io.checkJeolExists.bind(undefined, 'test/data/jeol-images/1'));
        });
    });

    describe('#checkBIMExists', () => {
        it('should find a .bim file', () => {
            assert.doesNotThrow(() => io.checkBIMExists('test/data/pfe-mdb/2019-08-12_Nolen.BIM'), Error);
        });

        it('should throw when file is not found', () => {
            assert.throws(io.checkBIMExists.bind(undefined, 'test/data/pfe-mdb/2019-08-'));
        });
    });
});

describe('Calculations', () => {
    const calc = require('../calculations.js')

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