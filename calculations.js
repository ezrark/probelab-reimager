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


function estimateVisualScale(magnification, width, pixelSizeConstant, pixelSize=calculatePixelSize(magnification, width, pixelSizeConstant)) {
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
	switch(width) {
		case 4096:
			return {font: constants.scale.sizes.SUPER, xOffset: 20, yOffset: 30, between: 10, heightOffset: 0};
		case 2048:
			return {font: constants.scale.sizes.LARGE, xOffset: 10, yOffset: 20, between: 10, heightOffset: 5};
		case 1024:
			return {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 10, between: 7, heightOffset: 12};
		case 512:
			return {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 10, between: 5, heightOffset: 13};
		case 256:
			return {font: constants.scale.sizes.SMALL, xOffset: 10, yOffset: 5, between: 5, heightOffset: 19};
		case 128:
			return {font: constants.scale.sizes.SMALL, xOffset: 2, yOffset: 2, between: 2, heightOffset: 15};
		case 64:
		default:
			return {font: constants.scale.sizes.TINY, xOffset: 2, yOffset: 2, between: 2, heightOffset: 13};
	}
}

function calculatePixelSize(magnification, width, pixelSizeConstant) {
	const thousand = pixelSizeConstant*Math.pow(magnification, -1);

	switch(width) {
		case 4096:
			return thousand/4;
		case 2048:
			return thousand/2;
		case 1024:
		default:
			return thousand;
		case 512:
			return thousand*2;
		case 256:
			return thousand*4;
		case 128:
			return thousand*8;
		case 64:
			return thousand*16;
	}
}

function sumPixelLuminosity(image, startX, startY, width, height) {
	let luminosity = 0;

	image.scan(startX, startY, width, height, (x, y, index) => {
		luminosity += findPixelLuminosity(image.bitmap.data[index], image.bitmap.data[index + 1], image.bitmap.data[index + 2]);
	});

	return (luminosity /(width * height)) / 255;
}

function findPixelLuminosity(r, g, b) {
	return (constants.luminosity.RED * r) + (constants.luminosity.GREEN * g) + (constants.luminosity.BLUE * b)
}

function convertPositionToXY(posX, posY) {

}

function estimatePointSize(width) {
	switch(width) {
		case 4096:
			return 28;
		case 2048:
			return 14;
		case 1024:
		default:
			return 7;
		case 512:
			return 5;
		case 256:
			return 3;
		case 128:
			return 2;
		case 64:
			return 1;
	}
}

async function calculateScale(startImage, magnification, scaleType, {belowColor, scaleSize, scaleBarHeight, scaleBarTop, pixelSizeConstant}) {
	let scale = {
		x: 0,
		y: 0,
		textX: 0,
		textY: 0,
		barX: 0,
		barY: 0,
		width: 0,
		height: 0,
		textFontHeight: 60,
		visualScale: 0,
		pixelSize: 0,
		scaleLength: 0,
		scaleBar: '',
		scaleIsBlack: false,
		barPixelHeight: 0,
		barFont: constants.scale.sizes.SMALL,
		scaleSize: {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 20, between: 10}
	};

	const smallFont = await Jimp.loadFont(fonts[scale.barFont]);
	const smallFontHeight = Jimp.measureTextHeight(smallFont, '0', 10);

	// General easy calculations and estimations
	[scale.visualScale, scale.scaleLength, scale.pixelSize, scale.scaleSize] = estimateVisualScale(magnification, startImage.bitmap.width, pixelSizeConstant);
	scale.textFontHeight = Jimp.measureTextHeight(await Jimp.loadFont(fonts[scale.scaleSize.font]), '0', 10);

	scale.scaleLength = scaleSize > 0 ? Math.round(scaleSize / scale.pixelSize) : scale.scaleLength;
	scale.visualScale = scaleSize > 0 ? scaleSize : scale.visualScale;
	scale.textFontHeight = scale.textFontHeight % 2 === 0 ? scale.textFontHeight : scale.textFontHeight + 1;

	scale.barPixelHeight = Math.round((scaleBarHeight ? scaleBarHeight : constants.SCALEBARHEIGHTPERCENT) * scale.textFontHeight);

	scale.height = scale.textFontHeight + scale.scaleSize.between + scale.barPixelHeight + smallFontHeight;

	scale.visualScale = '' + scale.visualScale + 'µm';

	// Figure out how long the scale bar needs to be
	let actualBarLength = 0;
	let prevBarLength = 0;

	while (actualBarLength < scale.scaleLength) {
		prevBarLength = actualBarLength;

		scale.scaleBar += '_';
		actualBarLength = await Jimp.measureText(smallFont, scale.scaleBar);
	}

	if (Math.abs(prevBarLength - scale.scaleLength) < Math.abs(actualBarLength - scale.scaleLength))
		scale.scaleBar = scale.scaleBar.substring(1);

	const barWidth = await Jimp.measureText(smallFont, scale.scaleBar);
	const textWidth = await Jimp.measureText(await Jimp.loadFont(fonts[scale.scaleSize.font]), scale.visualScale);

	scale.width = barWidth > textWidth ? barWidth : textWidth;

	// Calculate any changes in the image to account for scale type
	// Also positions the scale bar's x and y positions
	let belowScaleSet = false;
	switch(scaleType) {
		default:
		case constants.scale.types.BELOWLEFT:
			if (!belowScaleSet) {
				// Position the scale
				scale.x = scale.scaleSize.xOffset;
				scale.y = startImage.bitmap.height + scale.scaleSize.xOffset;
				belowScaleSet = true;
			}
		case constants.scale.types.BELOWRIGHT:
			if (!belowScaleSet) {
				// Position the scale
				scale.x = startImage.bitmap.width - scale.width - scale.scaleSize.xOffset;
				scale.y = startImage.bitmap.height + scale.scaleSize.xOffset;
				belowScaleSet = true;
			}
		case constants.scale.types.BELOWCENTER:
			if (!belowScaleSet) {
				scale.x = (startImage.bitmap.width / 2) - (scale.width / 2);
				scale.y = startImage.bitmap.height + scale.scaleSize.xOffset;
				belowScaleSet = true;
			}

			scale.y = scale.y - scale.scaleSize.heightOffset;

			scale.textX = scale.x + (scale.width / 2) - Math.round(textWidth / 2);
			scale.barX = scale.x + (scale.width/2) - Math.round(barWidth / 2);

			if (scaleBarTop) {
				scale.barY = scale.y + scale.barPixelHeight;
				scale.textY = scale.y + scale.height - scale.textFontHeight;
			} else {
				scale.barY = scale.y + scale.height - smallFontHeight;
				scale.textY = scale.y + smallFontHeight;
			}

			let imageIsBlack = belowColor === constants.scale.colors.BLACK;

			// Check the luminosity and use white or black background to make it look nice
			if (belowColor === constants.scale.colors.AUTO)
				imageIsBlack = sumPixelLuminosity(startImage, 0, 0, startImage.bitmap.width, startImage.bitmap.height) < .5;

			const tallBitmap = Array.from(await startImage.bitmap.data);
			const totalNewPixels = startImage.bitmap.width * (scale.height + scale.scaleSize.yOffset + scale.scaleSize.xOffset - scale.scaleSize.heightOffset)/4;
			if (imageIsBlack)
				for (let i = 0; i < totalNewPixels; i++)
					tallBitmap.push(0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255);
			else
				for (let i = 0; i < totalNewPixels; i++)
					tallBitmap.push(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255);

			// Resize the image with the new added scale bit
			const image = await new Promise(async (resolve, reject) => {
				new Jimp({
					data: Buffer.from(tallBitmap),
					width: startImage.bitmap.width,
					height: startImage.bitmap.height + (scale.height + scale.scaleSize.yOffset + scale.scaleSize.xOffset - scale.scaleSize.heightOffset)
				}, (err, image) => {
					if (err) reject(err);
					else resolve(image);
				});
			});

			// Return the new image and scale information
			return [scale, image];
		case constants.scale.types.LOWERCENTER:
			// Position the scale
			scale.x = (startImage.bitmap.width/2) - (scale.width/2);
			scale.y = startImage.bitmap.height - scale.height - scale.scaleSize.yOffset;
			break;
		case constants.scale.types.LOWERRIGHT:
			// Position the scale
			scale.x = startImage.bitmap.width - scale.width - scale.scaleSize.xOffset;
			scale.y = startImage.bitmap.height - scale.height - scale.scaleSize.yOffset;
			break;
		case constants.scale.types.LOWERLEFT:
			// Position the scale
			scale.x = scale.scaleSize.xOffset;
			scale.y = startImage.bitmap.height - scale.height - scale.scaleSize.yOffset;
			break;
		case constants.scale.types.UPPERRIGHT:
			// Position the scale
			scale.x = startImage.bitmap.width - scale.width - scale.scaleSize.xOffset;
			scale.y = scale.scaleSize.yOffset;
			break;
		case constants.scale.types.UPPERLEFT:
			// Position the scale
			scale.x = scale.scaleSize.xOffset;
			scale.y = scale.scaleSize.yOffset;
			break;
	}

	scale.barX = scale.x + (scale.width/2) - Math.round(barWidth / 2);
	scale.textX = scale.x + (scale.width/2) - Math.round(textWidth / 2);

	if (scaleBarTop) {
		scale.barY = scale.y + scale.barPixelHeight;
		scale.textY = scale.y + scale.height - scale.textFontHeight;
	} else {
		scale.barY = scale.y + scale.height - smallFontHeight;
		scale.textY = scale.y + smallFontHeight;
	}

	// Correct the image y and height for the font size depending on the image size
	if (!belowScaleSet) {
		scale.y = scale.y + scale.scaleSize.heightOffset;
		scale.height = scale.height - scale.scaleSize.heightOffset;
	}

	// Return the image and scale information
	return [scale, startImage];
}

module.exports = {
	estimatePointSize,
	estimateVisualScale,
	calculatePixelSize,
	sumPixelLuminosity,
	findPixelLuminosity,
	calculateScale
};