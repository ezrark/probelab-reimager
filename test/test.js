const hash = require('crypto').createHash;
const assert = require('assert');

const io = require('../io.js')

async function readBim(uri, index) {
    const pic = await io.readBIM(`${uri}${index !== undefined ? `?${index}` : ''}`);
    if (pic === undefined) {
        return undefined
    }

    const sha = hash("sha256");
    sha.update(pic);
    return sha.digest('hex');
}

describe('IO', () => {
    describe('#readMASFile', () => {
        it('should read a .psmsa file', () => {
            assert.deepStrictEqual(
                io.readMASFile('test/data/1024.PS.EDS/1024_pt1.psmsa'),
                require('./expected/1024_pt1.psmsa.json')
            )
        });
    });

    describe('#readNSSEntry', () => {
        it('should read a .p_s file', () => {
            assert.deepStrictEqual(
                io.readNSSEntry('test/data/1024.PS.EDS/1024.p_s'),
                require('./expected/1024.p_s.json')
            )
        });
    });

    describe('#readBIM', () => {
        it('should read first index by default', async () => {
            assert.deepStrictEqual(
                await readBim('test/data/pfe-mdb/2019-08-12_Nolen.BIM'),
                '19e4aa83510aa3387a46369d7cdf0bc9ed49d32be9757c274d1d8f143cc09c2b'
            )
        });

        it('should read an arbitrary index', async () => {
            assert.deepStrictEqual(
                await readBim('test/data/pfe-mdb/2019-08-12_Nolen.BIM', 3),
                'cd7e733ff72952862df87a6d915746bc6b96c3982f2cee47265e5ca61d75afb7'
            )
        });

        it('should return undefined if an index is out of range', async () => {
            assert.deepStrictEqual(
                await readBim('test/data/pfe-mdb/2019-08-12_Nolen.BIM', 10),
                undefined
            )
        });
    });
});