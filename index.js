const fs = require('fs');

const Jimp = require('jimp');

const constants = require('./constants');
const io = require('./io');

let dirUri = 'C:\\Users\\EPMA_Castaing\\work\\thermo imaging\\2018-11-14_Micrometeorites';

dirUri = dirUri.replace(/\\/gmi, '/');
if (!dirUri.endsWith('/'))
	dirUri = dirUri + '/';

const directory = fs.readdirSync(dirUri, {withFileTypes: true});

function processPointShootDirectory(uri, directory) {
	let data = {
		imageFile: {},
		points: []
	};

	let pointData = [];
	let points = {};

	for (const file of directory) {
		if (file.isFile())
			if (file.name.endsWith(constants.pointShoot.files.IMAGERAW)) {
				file.uri = uri + file.name;
				data.imageFile = file;
			} else if (file.name.endsWith(constants.pointShoot.files.POINTDATA))
				pointData = io.readPointDataFile(uri + file.name);
			else if (/_pt.\.psmsa$/gmi.test(file.name))
				points[file.name] = io.readPSMSAFile(uri + file.name)
	}

	data.points = pointData.map(({name, x1, y1, x2, y2}) => {
		const imageData = points[name];
		if (imageData === undefined)
			return false;

		return {
			x1, y1, x2, y2,
			imageData
		}
	});

	return data;
}

function cleanupPS(psData) {
	if (psData && psData.imageFile && psData.points && psData.points.length > 0) {
		psData.integrity = true;
		psData.expectedData = {};
		const expectedData = psData.points[0].imageData;

		for (const point of psData.points)
			for (const key in point.imageData)
				if (!constants.pointShoot.integrity.SKIPARRAY.includes(key) && !key.startsWith('#quant_'))
					if (expectedData[key].data !== point.imageData[key].data)
						psData.integrity = false;
					else
						psData.expectedData[key] = expectedData[key];

		return psData;
	}

	return false;
}

async function processPSData(psData) {
	const image = await Jimp.read(psData.imageFile.uri);

	psData.width = image.bitmap.width;
	psData.height = image.bitmap.height;
	psData.image = image;

	const magnification = parseInt(psData.expectedData[constants.pointShoot.MAGNIFICATIONKEY].data);

	psData.pixelSize = calculatePixelSize(magnification, psData.width);
	[psData.scale, psData.scaleLength] = estimateScaleLength(magnification, psData.pixelSize);

	const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
	let prevScaleBar = '';
	let prevActualScaleBarLength = 0;

	let scaleBar = '';
	let actualScaleBarLength = 0;

	while (actualScaleBarLength < psData.scaleLength) {
		prevScaleBar = scaleBar;
		prevActualScaleBarLength = actualScaleBarLength;

		scaleBar += '_';
		actualScaleBarLength = await Jimp.measureText(font, scaleBar);
	}

	if (Math.abs(prevActualScaleBarLength - psData.scaleLength) < Math.abs(actualScaleBarLength - psData.scaleLength)) {
		scaleBar = prevScaleBar;
		actualScaleBarLength = prevActualScaleBarLength;
	}

	await image.print(
		font,
		10,
		10,
		scaleBar
	);

	await image.print(
		font,
		10,
		50,
		'' + psData.scale + 'µm',
		psData.scaleLength
	);

	return psData;
}

function estimateScaleLength(magnification, pixelSize) {
	let scale = 1000;

	if (40 < magnification && magnification <= 100)
		scale = 500;
	if (100 < magnification && magnification <= 250)
		scale = 250;
	if (250 < magnification && magnification <= 500)
		scale = 100;
	if (500 < magnification && magnification <= 1000)
		scale = 50;
	if (1000 < magnification && magnification <= 2000)
		scale = 25;
	if (2000 < magnification && magnification <= 4000)
		scale = 10;

	return [scale, Math.round(scale/pixelSize)];
}

function calculatePixelSize(magnification, width) {
	const thousand = 116.73*Math.pow(magnification, -1);

	if (width === 4096)
		return thousand/4;
	if (width === 2048)
		return thousand/2;
	if (width === 1024)
		return thousand;
	if (width === 512)
		return thousand*2;
	if (width === 256)
		return thousand*4;
	if (width === 128)
		return thousand*8;
	if (width === 64)
		return thousand*16;
	return thousand;
}

async function writeImage(psData) {
	return await psData.image.writeAsync(psData.imageFile.uri.substring(0, psData.imageFile.uri.length - (constants.pointShoot.files.IMAGERAW.length)) + '.tif')
}

const PSData = directory.map(dir =>
	dir.isDirectory() ? processPointShootDirectory(dirUri + dir.name + '/', fs.readdirSync(dirUri + dir.name, {withFileTypes: true})) : false
).map(cleanupPS).filter(data => data).map(processPSData);

Promise.all(PSData).then(data => {
	Promise.all(data.map(writeImage)).then(console.log).catch(console.warn)
}).catch(err => {
	console.warn(err);
});