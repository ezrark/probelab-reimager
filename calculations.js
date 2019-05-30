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
		return {font: constants.scale.sizes.SUPER, xOffset: 20, yOffset: 30, between: 10};
	if (width === 2048)
		return {font: constants.scale.sizes.LARGE, xOffset: 10, yOffset: 20, between: 10};
	if (width === 1024)
		return {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 10, between: 7};
	if (width === 512)
		return {font: constants.scale.sizes.NORMAL, xOffset: 10, yOffset: 10, between: 5};
	if (width === 256)
		return {font: constants.scale.sizes.SMALL, xOffset: 10, yOffset: 5, between: 5};
	if (width === 128)
		return {font: constants.scale.sizes.SMALL, xOffset: 2, yOffset: 2, between: 2};
	return {font: constants.scale.sizes.TINY, xOffset: 2, yOffset: 2, between: 2};
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

async function calculateScale(startImage, magnification, scaleType, belowColor=constants.scale.colors.AUTO, scaleSize=constants.scale.AUTOSIZE, scaleBarHeight=constants.scale.AUTOSIZE, scaleBarTop=constants.scale.SCALEBARTOP) {
	let scale = {
		x: 0,
		y: 0,
		textX: 0,
		textY: 0,
		barX: 0,
		barY: 0,
		width: 0,
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
	[scale.visualScale, scale.scaleLength, scale.pixelSize, scale.scaleSize] = estimateVisualScale(magnification, startImage.bitmap.width);
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

			let belowHeightOffset = 0;
			switch (startImage.bitmap.width) {
				case 2048:
					belowHeightOffset = 5;
					break;
				case 1024:
					belowHeightOffset = 12;
					break;
				case 512:
					belowHeightOffset = 13;
					break;
				case 256:
					belowHeightOffset = 19;
					break;
				case 128:
					belowHeightOffset = 15;
					break;
				case 64:
					belowHeightOffset = 15;
					break;
			}

			scale.y = scale.y - belowHeightOffset;

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
			const totalNewPixels = startImage.bitmap.width * (scale.height + scale.scaleSize.yOffset + scale.scaleSize.xOffset - belowHeightOffset)/4;
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
					height: startImage.bitmap.height + (scale.height + scale.scaleSize.yOffset + scale.scaleSize.xOffset - belowHeightOffset)
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

	// Return the image and scale information
	return [scale, startImage];
}

module.exports = {
	estimateVisualScale,
	calculatePixelSize,
	sumPixelLuminosity,
	calculateScale
};