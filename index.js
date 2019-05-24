const fs = require('fs');

const constants = require('./constants');

require('./pointshoot')().then(async Pointshoot => {
	//let dirUri = 'C:\\Users\\EPMA_Castaing\\work\\thermo imaging\\2018-11-14_Micrometeorites';
	let  dirUri = 'C:\\Users\\EPMA_Castaing\\work\\thermo imaging\\2019-02-22_Decker_Tiles';

	dirUri = dirUri.replace(/\\/gmi, '/');
	if (!dirUri.endsWith('/'))
		dirUri = dirUri + '/';

	const directory = fs.readdirSync(dirUri, {withFileTypes: true});

	const ps = directory.flatMap(dir => {
		if (dir.isDirectory()) {
			const files = fs.readdirSync(dirUri + dir.name, {withFileTypes: true});
			return files.filter(file => file.isFile() && file.name.endsWith(constants.pointShoot.fileFormats.ENTRY)).map(entryFile => {
				entryFile.uri = dirUri + dir.name + '/' + entryFile.name;
				return new Pointshoot(entryFile);
			});
		}
	}).filter(i => i);

	for (const point of ps)
		await point.addScaleAndWrite();

	console.log('All images written');
});

/*
function processPointShootDirectory(uri, directory) {
	let data = {
		imageFile: {},
		points: []
	};

	let pointData = [];
	let points = {};

	for (const file of directory) {
		if (file.isFile())
			if (file.name.endsWith(constants.pointShoot.fileFormats.IMAGERAW)) {
				file.uri = uri + file.name;
				data.imageFile = file;
			} else if (file.name.endsWith(constants.pointShoot.fileFormats.ENTRY))
				pointData = io.readPSEntryFile(uri + file.name)[1];
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
	const initialImage = await Jimp.read(psData.imageFile.uri);
	const test = Array.from(await initialImage.bitmap.data);

	for (let i = 0; i < initialImage.bitmap.width * 50 * 4; i++)
		test.push(0);

	const image = await new Promise(async (resolve, reject) => {
		new Jimp({
			data: Buffer.from(test),
			width: initialImage.bitmap.width,
			height: initialImage.bitmap.height + 50
		}, (err, image) => {
			if (err) reject(err);
			else resolve(image);
		});
	});

	psData.width = image.bitmap.width;
	psData.height = image.bitmap.height;
	psData.image = image;

	const magnification = parseInt(psData.expectedData[constants.pointShoot.MAGNIFICATIONKEY].data);

	psData.pixelSize = calculatePixelSize(magnification, psData.width);
	[psData.scale, psData.scaleLength] = estimateScale(magnification, psData.width, psData.pixelSize);

	const fonts = {
		white: {
			small: await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
			normal: await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
			large: await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
		},
		black: {
			small: await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
			normal: await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
			large: await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
		}

	};

	let scaleBar = '';
	let actualScaleBarLength = 0;
	let prevActualScaleBarLength = 0;

	while (actualScaleBarLength < psData.scaleLength) {
		prevActualScaleBarLength = actualScaleBarLength;

		scaleBar += '_';
		actualScaleBarLength = await Jimp.measureText(fonts.black.small, scaleBar);
	}

	if (Math.abs(prevActualScaleBarLength - psData.scaleLength) < Math.abs(actualScaleBarLength - psData.scaleLength))
		scaleBar = scaleBar.substring(1);

	let pixels = [];

	image.scan(0, 0, 100, 50, (x, y, index) => {
		pixels.push({
			x,
			y,
			color: {
				r: index,
				g: index + 1,
				b: index + 2,
				a: index + 3
			}
		})
	});

	const isBlack = (pixels.reduce((sum, pixel) => {
		return sum + .2126 * pixel.color.r + .7152 * pixel.color.g + .0722 * pixel.color.b;
	}) / pixels.length) < .5;

	await image.print(
		isBlack ? fonts.white.small : fonts.black.small,
		10,
		psData.height - 53,
		scaleBar
	);

	await image.print(
		isBlack ? fonts.white.small : fonts.black.small,
		10,
		psData.height - 54,
		scaleBar
	);

	await image.print(
		isBlack ? fonts.white.small : fonts.black.small,
		10,
		psData.height - 55,
		scaleBar
	);

	await image.print(
		isBlack ? fonts.white.normal : fonts.black.normal,
		10,
		psData.height - 35,
		'' + psData.scale + 'µm'
	);

	return psData;
}

function estimateScale(magnification, width, pixelSize) {
	const scales = [1000, 500, 250, 100, 50, 25, 10];
	let scaleIndex = 0;

	if (40 < magnification && magnification <= 100)
		scaleIndex = 1;
	if (100 < magnification && magnification <= 250)
		scaleIndex = 2;
	if (250 < magnification && magnification <= 400)
		scaleIndex = 3;
	if (500 < magnification && magnification <= 1000)
		scaleIndex = 4;
	if (1000 < magnification && magnification <= 2000)
		scaleIndex = 5;
	if (2000 < magnification && magnification <= 4000)
		scaleIndex = 6;

	if (Math.round(scales[scaleIndex] / pixelSize) > .3 * width)
		scaleIndex += 1;

	return [scales[scaleIndex], Math.round(scales[scaleIndex] / pixelSize)];
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
	return await psData.image.writeAsync(psData.imageFile.uri.substring(0, psData.imageFile.uri.length - (constants.pointShoot.fileFormats.IMAGERAW.length)) + '.tif')
}

const PSData = directory.map(dir =>
	dir.isDirectory() ? processPointShootDirectory(dirUri + dir.name + '/', fs.readdirSync(dirUri + dir.name, {withFileTypes: true})) : false
).map(cleanupPS).filter(data => data).map(processPSData);

Promise.all(PSData).then(data => {
	Promise.all(data.map(writeImage)).then(() => {
		console.log('All images written');
	}).catch(console.warn);
}).catch(console.warn);
*/