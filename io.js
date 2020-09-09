const fs = require('fs');

const iconv = require('iconv-lite');
let Adodb;

try {
	Adodb = require('database-js-adodb');
} catch (err) {
}

const constants = require('./constants.json');

function readMASFile(uri) {
	let rawData = fs.readFileSync(uri, {encoding: 'utf8'}).split('#');

	return rawData.filter(data => data).reduce((output, line) => {
		const [rawName, data] = line.split(':');
		const [name, units] = rawName.toLowerCase().trim().split('-');

		if (name && data && name !== 'spectrum' && name !== 'endofdata')
			output[name.trim()] = {
				units: units ? units.trim() : '',
				data: data.trim()
			};

		return output;
	}, {});
}

function readNSSEntry(uri) {
	let rawData = fs.readFileSync(uri, {encoding: 'utf8'}).replace(/�/gi, '\u00a0').split('#').map(text => {
		const data = text.split('\r\n');
		if (data.length === 1)
			return text.split('\n');
		else
			return data;
	});

	let output = {
		points: [],
		layers: [],
		data: {
			spectra: '',
			base: '',
			grey: '',
			raw: ''
		}
	};

	for (const line of rawData.shift())
		if (line.length > 1 && line.includes('.'))
			switch(line.split('.')[1].toLowerCase()) {
				case 'psref':
				case 'siref':
					output.data.base = line;
					break;
				case 'si':
					output.data.raw = line;
					break;
				case 'sitif':
					output.data.grey = line;
					break;
				case 'simcs':
					const name = line.toLowerCase().split(' ');
					output.layers.push({
						element: `${name.pop().split('.')[0]} ${name.pop()}`,
						file: line
					});
					break;

			}

	for (const element of rawData) {
		let type = element.shift().split(' ')[1].toLowerCase();
		if (type !== 'imgint')
			output.points.push({
				type,
				file: element.shift(),
				values: element.map(line => line.length > 1 ? line.split(',').filter(x => x !== undefined && x.length > 0).map(num => parseInt(num)) : []).flat()
			});
	}

	return output;
}

async function getPFEExpectedImages(databaseUri) {
	const uri = databaseUri.split('?')[0];

	try {
		const connection = Adodb.open({
			Database: uri.replace(/\//g, '\\\\')
		});

		const images = (await connection.query(`SELECT * FROM [Image]`));

		return images.length;

	} catch (err) {
		throw 'Unable to open and read PFE mdb file';
	}
}

async function readPFEEntry(databaseUri) {
	const [uri, imageNum = '1'] = databaseUri.split('?');

	let connection;

	try {
		connection = Adodb.open({
			Database: uri.replace(/\//g, '\\\\')
		});

		const image = (await connection.query(`SELECT * FROM [Image] WHERE ImageNumber = ${parseInt(imageNum)}`))[0];

		const xSmall = image.ImageXMin <= image.ImageXMax ? image.ImageXMin : image.ImageXMax;
		const xLarge = image.ImageXMin <= image.ImageXMax ? image.ImageXMax : image.ImageXMin;
		const ySmall = image.ImageYMin <= image.ImageYMax ? image.ImageYMin : image.ImageYMax;
		const yLarge = image.ImageYMin <= image.ImageYMax ? image.ImageYMax : image.ImageYMin;

		const initialPoints = await connection.query(`SELECT * FROM [Line] WHERE ${xSmall} <= StageX AND ${xLarge} >= StageX AND ${ySmall} <= StageY AND ${yLarge} >= StageY`);

		await connection.close();

		const xDiff = Math.abs(xLarge - xSmall);
		const yDiff = Math.abs(yLarge - ySmall);

		const points = initialPoints
		.map(({Number, StageX, StageY, LineToRow}) => {
			return {
				name: Number,
				analysis: LineToRow,
				type: 'spot',
				values: [Math.abs(xLarge - StageX), Math.abs(ySmall - StageY), xDiff, yDiff]
			};
		});

		return {image, points};
	} catch (err) {
		if (connection)
			await connection.close();
		throw 'Unable to open and read PFE mdb file';
	}
}

async function readBIM(bimUri) {
	let [uri, index = '1'] = bimUri.split('?');
	index = parseInt(index);

	const data = Buffer.from(await fs.promises.readFile(uri.slice(0, uri.length - constants.pfe.fileFormats.ENTRY.length) + constants.pfe.fileFormats.IMAGE, {encoding: null}));
	const maxLength = data.byteLength;
	let offset = 0;
	let fileIndex = 1;

	while (offset < maxLength) {
		const width = data.readUInt32LE(offset);
		const height = data.readUInt32LE(offset + 4);
		offset += 8;

		if (fileIndex === index) {
			let pixels = [];
			let largest = 0;

			for (let i = 0; i < width * height; i++) {
				const value = data.readUInt8(offset + (i * 4) + 1);

				if (value > largest)
					largest = value;

				pixels.push(value);
			}

			if (largest !== 255)
				pixels = pixels.map(pixel => pixel / largest * 255);

			return Buffer.from(pixels);
		}
		offset += width * height * 4;
		fileIndex++;
	}
}

function readJeolEntry(uri) {
	let rawData = iconv.decode(fs.readFileSync(uri), 'win1251').split('$');

	return rawData.filter(data => data).reduce((output, line) => {
		const [prop, ...data] = line.trim().toLowerCase().split(' ');
		output[prop] = data.length === 1 ? data[0] : data;

		return output;
	}, {});
}

function checkJeolExists(uri) {
	return fs.accessSync(uri, fs.constants.R_OK);
}

function checkBIMExists(uri) {
	return fs.accessSync(uri, fs.constants.R_OK);
}

// nothing exists to do this apparently
function readBmp(uri) {
	const raw = fs.readFileSync(uri);

	if (raw[0] !== 66 || raw[1] !== 77)
		throw new Error('Unsupported bmp format');

	const data = new DataView(raw.buffer);

//	const fileSize = data.getInt32(2, true);
	const offset = data.getInt16(10, true);
	const format = data.getInt32(14, true);

	if (format !== 40)
		throw new Error('Unsupported bmp format');

	const width = data.getInt32(18, true);
	const height = data.getInt32(22, true);
	const planes = data.getInt16(26, true);
	const colorDepth = data.getInt16(28, true);
	const compressionMethod = data.getInt32(30, true);

	if (planes !== 1 || colorDepth !== 8)
		throw new Error('Unsupported bmp format');

	if (compressionMethod !== 0)
		throw new Error('Unsupported compression method');

	let pixels = [];
	for (let i = 0; i < width * height; i++)
		pixels.push(data.getInt8(offset + i));

	return {
		pixels: Buffer.from(pixels),
		height,
		width
	};
}

module.exports = {
	readBmp,
	readMASFile,
	readNSSEntry,
	getPFEExpectedImages,
	readPFEEntry,
	readJeolEntry,
	readBIM,
	checkJeolExists,
	checkBIMExists
};