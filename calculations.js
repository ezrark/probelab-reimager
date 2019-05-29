const Jimp = require('jimp');

const constants = require('./constants');
const scales = [1000, 500, 250, 100, 50, 25, 10, 5, 1];

const fonts = {
	[constants.scale.sizes.TINY]: Jimp.FONT_SANS_8_WHITE,
	[constants.scale.sizes.SMALL]: Jimp.FONT_SANS_16_WHITE,
	[constants.scale.sizes.NORMAL]: Jimp.FONT_SANS_32_WHITE,
	[constants.scale.sizes.LARGE]: Jimp.FONT_SANS_64_WHITE,
	[constants.scale.sizes.SUPER]: Jimp.FONT_SANS_128_WHITE
};


function estimateVisualScale(magnification, width, pixelSize=calculatePixelSize(magnification, width)) {
	let scaleIndex = 0;

	if (40 < magnification && magnification <= 100)
		scaleIndex = 1;
	if (100 < magnification && magnification <= 250)
		scaleIndex = 2;
	if (250 < magnification && magnification <= 500)
		scaleIndex = 3;
	if (500 < magnification && magnification <= 1000)
		scaleIndex = 4;
	if (1000 < magnification && magnification <= 2000)
		scaleIndex = 5;
	if (2000 < magnification && magnification <= 3000)
		scaleIndex = 6;
	if (3000 < magnification)
		scaleIndex = 7;

	if (Math.round(scales[scaleIndex] / pixelSize) > .3 * width)
		scaleIndex += 1;

	return [scales[scaleIndex], Math.round(scales[scaleIndex] / pixelSize), pixelSize, estimateScaleSize(width)];
}

function estimateScaleSize(width) {
	if (width === 4096)
		return {font: constants.scale.sizes.SUPER, xOffset: 20, yOffset: 30};
	if (width === 2048)
		return {font: constants.scale.sizes.LARGE, xOffset: 10, yOffset: 20};
	if (width === 1024)
		return {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 20};
	if (width === 512)
		return {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 20};
	if (width === 256)
		return {font: constants.scale.sizes.SMALL, xOffset: 10, yOffset: 20};
	if (width === 128)
		return {font: constants.scale.sizes.SMALL, xOffset: 5, yOffset: 10};
	return {font: constants.scale.sizes.TINY, xOffset: 2, yOffset: 10};
}

function calculatePixelSize(magnification, width) {
	const thousand = constants.PIXELSIZECONSTANT*Math.pow(magnification, -1);

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

function sumPixelLuminosity(image, startX, startY, width, height) {
	let luminosity = 0;

	image.scan(startX, startY, width, height, (x, y, index) => {
		luminosity += (constants.luminosity.RED * image.bitmap.data[index]) + (constants.luminosity.GREEN * image.bitmap.data[index + 1]) + (constants.luminosity.BLUE * image.bitmap.data[index + 2]);
	});

	return (luminosity/(width * height))/255;
}

async function calculateScale(startImage, magnification, scaleType, belowColor=constants.scale.colors.AUTO, scaleSize=constants.scale.AUTOSIZE, scaleBarHeight=constants.scale.AUTOSIZE) {
	let scale = {
		x: 0,
		y: 0,
		textX: 0,
		textY: 0,
		width: 0,
		height: 60,
		visualScale: 0,
		pixelSize: 0,
		scaleLength: 0,
		scaleBar: '',
		scaleIsBlack: false,
		barPixelHeight: 0,
		scaleSize: {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 20}
	};

	// General easy calculations and estimations
	[scale.visualScale, scale.scaleLength, scale.pixelSize, scale.scaleSize] = estimateVisualScale(magnification, startImage.bitmap.width);
	scale.height = Jimp.measureTextHeight(await Jimp.loadFont(fonts[scale.scaleSize.font]), '0', 10);

	scale.scaleLength = scaleSize > 0 ? Math.round(scaleSize / scale.pixelSize) : scale.scaleLength;
	scale.visualScale = scaleSize > 0 ? scaleSize : scale.visualScale;
	scale.height = scale.height % 2 === 0 ? scale.height : scale.height + 1;

	scale.barPixelHeight = Math.round((scaleBarHeight ? scaleBarHeight : constants.SCALEBARHEIGHTPERCENT) * scale.height);

	scale.visualScale = '' + scale.visualScale + 'µm';

	// Figure out how long the scale bar needs to be
	const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
	let actualBarLength = 0;
	let prevBarLength = 0;

	while (actualBarLength < scale.scaleLength) {
		prevBarLength = actualBarLength;

		scale.scaleBar += '_';
		actualBarLength = await Jimp.measureText(smallFont, scale.scaleBar);
	}

	if (Math.abs(prevBarLength - scale.scaleLength) < Math.abs(actualBarLength - scale.scaleLength))
		scale.scaleBar = scale.scaleBar.substring(1);

	scale.width = await Jimp.measureText(smallFont, scale.scaleBar);

	// Calculate any changes in the image to account for scale type
	// Also positions the scale bar's x and y positions
	let image = startImage;
	let belowScaleSet = false;
	switch(scaleType) {
		default:
		case constants.scale.types.BELOWLEFT:
			if (!belowScaleSet) {
				// Position the scale
				scale.x = scale.scaleSize.xOffset;
				scale.y = startImage.bitmap.height + scale.scaleSize.xOffset;
				scale.textX = scale.x;
				scale.textY = scale.y + 10 + scale.barPixelHeight;
				belowScaleSet = true;
			}
		case constants.scale.types.BELOWRIGHT:
			if (!belowScaleSet) {
				// Position the scale
				scale.x = startImage.bitmap.width - scale.width - scale.scaleSize.xOffset;
				scale.y = startImage.bitmap.height + scale.scaleSize.xOffset;
				scale.textX = scale.x;
				scale.textY = scale.y + 10 + scale.barPixelHeight;
				belowScaleSet = true;
			}
		case constants.scale.types.BELOWCENTER:
			if (!belowScaleSet) {
				scale.x = (startImage.bitmap.width / 2) - (scale.width / 2);
				scale.y = startImage.bitmap.height + scale.scaleSize.xOffset;
				scale.textX = scale.x + (scale.width / 2) - Math.round(await Jimp.measureText(await Jimp.loadFont(fonts[scale.scaleSize.font]), scale.visualScale) / 2);
				scale.textY = scale.y + 10 + scale.barPixelHeight;
				belowScaleSet = true;
			}

			let imageIsBlack = belowColor === constants.scale.colors.BLACK;

			// Check the luminosity and use white or black background to make it look nice
			if (belowColor === constants.scale.colors.AUTO)
				imageIsBlack = sumPixelLuminosity(image, 0, 0, startImage.bitmap.width, startImage.bitmap.height) < .5;

			const tallBitmap = Array.from(await startImage.bitmap.data);
			const totalNewPixels = startImage.bitmap.width * (scale.height + scale.scaleSize.yOffset + scale.scaleSize.xOffset + scale.barPixelHeight);
			if (imageIsBlack)
				for (let i = 0; i < totalNewPixels; i++)
					tallBitmap.push(0, 0, 0, 255);
			else
				for (let i = 0; i < totalNewPixels; i++)
					tallBitmap.push(255, 255, 255, 255);

			// Resize the image with the new added scale bit
			image = await new Promise(async (resolve, reject) => {
				new Jimp({
					data: Buffer.from(tallBitmap),
					width: startImage.bitmap.width,
					height: startImage.bitmap.height + (scale.height + scale.scaleSize.yOffset + scale.scaleSize.xOffset + scale.barPixelHeight)
				}, (err, image) => {
					if (err) reject(err);
					else resolve(image);
				});
			});
			break;
		case constants.scale.types.LOWERCENTER:
			// Position the scale
			scale.x = (startImage.bitmap.width/2) - (scale.width/2);
			scale.y = startImage.bitmap.height - scale.height - scale.scaleSize.yOffset;
			scale.textX = scale.x + (scale.width/2) - Math.round(await Jimp.measureText(await Jimp.loadFont(fonts[scale.scaleSize.font]), scale.visualScale) / 2);
			scale.textY = scale.y + 10;
			break;
		case constants.scale.types.LOWERRIGHT:
			// Position the scale
			scale.x = startImage.bitmap.width - scale.width - scale.scaleSize.xOffset;
			scale.y = startImage.bitmap.height - scale.height - scale.scaleSize.yOffset;
			scale.textX = scale.x;
			scale.textY = scale.y + 10;
			break;
		case constants.scale.types.LOWERLEFT:
			// Position the scale
			scale.x = scale.scaleSize.xOffset;
			scale.y = startImage.bitmap.height - scale.height - scale.scaleSize.yOffset;
			scale.textX = scale.x;
			scale.textY = scale.y + 10;
			break;
		case constants.scale.types.UPPERRIGHT:
			// Position the scale
			scale.x = startImage.bitmap.width - scale.width - scale.scaleSize.xOffset;
			scale.y = scale.scaleSize.yOffset;
			scale.textX = scale.x;
			scale.textY = scale.y + 10;
			break;
		case constants.scale.types.UPPERLEFT:
			// Position the scale
			scale.x = scale.scaleSize.xOffset;
			scale.y = scale.scaleSize.yOffset;
			scale.textX = scale.x;
			scale.textY = scale.y + 10;
			break;
	}

	// Return the new image and scale information
	return [scale, image];
}

module.exports = {
	estimateVisualScale,
	calculatePixelSize,
	sumPixelLuminosity,
	calculateScale
};