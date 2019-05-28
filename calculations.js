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
		return constants.scale.sizes.LARGE;
	if (width === 2048)
		return constants.scale.sizes.LARGE;
	if (width === 1024)
		return constants.scale.sizes.NORMAL;
	if (width === 512)
		return constants.scale.sizes.NORMAL;
	if (width === 256)
		return constants.scale.sizes.NORMAL;
	if (width === 128)
		return constants.scale.sizes.SMALL;
	return constants.scale.sizes.TINY;
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

function sumPixelLuminosity(pixels) {
	return (pixels.reduce((sum, pixel) => {
		return sum + (constants.luminosity.RED * pixel.color.r) + (constants.luminosity.GREEN * pixel.color.g) + (constants.luminosity.BLUE * pixel.color.b);
	}, 0) / pixels.length)/255;
}

async function calculateScale(startImage, magnification, scaleType, belowColor=constants.scale.colors.AUTO) {
	let scale = {
		x: 0,
		y: 0,
		width: 0,
		height: 60,
		visualScale: 0,
		pixelSize: 0,
		scaleLength: 0,
		scaleBar: '',
		scaleIsBlack: false,
		scaleSize: constants.scale.sizes.NORMAL
	};

	// General easy calculations and estimations
	[scale.visualScale, scale.scaleLength, scale.pixelSize, scale.scaleSize] = estimateVisualScale(magnification, startImage.bitmap.width);
	scale.height = Jimp.measureTextHeight(await Jimp.loadFont(fonts[scale.scaleSize]), '0', 10);

	scale.height = scale.height % 2 === 0 ? scale.height : scale.height + 1;

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
	if (scaleType === constants.scale.types.BELOW) {
		// Position the scale
		scale.x = 10;
		scale.y = startImage.bitmap.height + 5;

		let imageIsBlack = belowColor === constants.scale.colors.BLACK;
		if (belowColor === constants.scale.colors.AUTO) {
			// Create a luminosity map
			let imageBackground = [];
			startImage.scan(0, 0, startImage.bitmap.width, startImage.bitmap.height, (x, y, index) => {
				imageBackground.push({
					x, y,
					color: {
						r: startImage.bitmap.data[index],
						g: startImage.bitmap.data[index + 1],
						b: startImage.bitmap.data[index + 2],
						a: startImage.bitmap.data[index + 3]
					}
				})
			});

			// Check the luminosity and use white or black background to make it look nice
			imageIsBlack = sumPixelLuminosity(imageBackground) < .5;
		}

		const tallBitmap = Array.from(await startImage.bitmap.data);
		for (let i = 0; i < startImage.bitmap.width * (scale.height + 20); i++)
			tallBitmap.push(imageIsBlack ? 0 : 255, imageIsBlack ? 0 : 255, imageIsBlack ? 0 : 255, 255);

		// Resize the image with the new added scale bit
		image = await new Promise(async (resolve, reject) => {
			new Jimp({
				data: Buffer.from(tallBitmap),
				width: startImage.bitmap.width,
				height: startImage.bitmap.height + (scale.height + 20)
			}, (err, image) => {
				if (err) reject(err);
				else resolve(image);
			});
		});
	} else if (scaleType === constants.scale.types.LOWERLEFT) {
		// Position the scale
		scale.x = 10;
		scale.y = startImage.bitmap.height - scale.height - 20;
	} else if (scaleType === constants.scale.types.LOWERRIGHT) {
		// Position the scale
		scale.x = startImage.bitmap.width - scale.width - 10;
		scale.y = startImage.bitmap.height - scale.height - 20;
	} else if (scaleType === constants.scale.types.UPPERLEFT) {
		// Position the scale
		scale.x = 10;
		scale.y = 20;
	} else if (scaleType === constants.scale.types.UPPERRIGHT) {
		// Position the scale
		scale.x = startImage.bitmap.width - scale.width - 10;
		scale.y = 20;
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