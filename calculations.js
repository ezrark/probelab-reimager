const constants = require('./constants');
const scales = [1000, 500, 250, 100, 50, 25, 10, 5, 1];

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

	return [scales[scaleIndex], Math.round(scales[scaleIndex] / pixelSize), pixelSize];
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

function sumPixelLuminosity(image, startX, startY, width, height, hasAlpha=false) {
	let luminosity = 0;
	const step = (hasAlpha ? 4 : 3);
	const init = startX*startY*step;
	const max = init + (width*height*step);

	for (let i = init; i < max; i += step)
		luminosity += findPixelLuminosity(image[i], image[i + 1], image[i + 2]);
	return luminosity / width / height;
}

function findPixelLuminosity(r, g, b) {
	return ((constants.luminosity.RED * r) + (constants.luminosity.GREEN * g) + (constants.luminosity.BLUE * b))/768;
}

function pointToXY(pos, width, height) {
	return [Math.floor((pos.values[0] / pos.values[2]) * width), Math.floor((pos.values[1] / pos.values[3]) * height)];
}

async function calculatePointPosition(scratchCtx, x, y, width, size, fontSize, font) {
	size = size ? size : Math.round(width*constants.FONTWIDTHMUTIPLIER/3);
	let point = {
		centerX: x,
		centerY: y,
		leftX: 0,
		topY: 0,
		rightX: 0,
		bottomY: 0,
		size: 0,
		halfSize: Math.floor(size/2),
		quarterSize: Math.floor(size/4),
		eighthSize: Math.floor(size/8),
		sixteenthSize: Math.floor(size/16),
		height: 0,
		width: 0,
		pointHeight: 0,
		pointWidth: 0,
		fontHeight: 0,
		fontX: 0,
		fontY: 0,
		fontSize: fontSize ? fontSize : Math.round(width*constants.FONTWIDTHMUTIPLIER/2)
	};

	if (point.fontSize < 8)
		point.fontSize = 8;

	scratchCtx.font = `${point.fontSize}px "${font}"`;
	point.fontHeight = (await scratchCtx.measureText('m')).width;

	if (size === 5 || size === 3) {
		point.sixteenthSize = 1;
		point.eighthSize = 1;
		point.quarterSize = 2;
		point.halfSize = 3;
	} else {
		point.sixteenthSize = point.sixteenthSize === 0 ? 1 : point.sixteenthSize;
		point.eighthSize = point.eighthSize === 0 ? 1 : point.eighthSize;
		point.quarterSize = point.quarterSize === 0 ? 1 : point.quarterSize;
		point.halfSize = point.halfSize === 0 ? 2 : point.halfSize;
	}

	point.size = point.pointHeight = point.pointWidth = point.halfSize * 2;

	point.leftX = x - point.halfSize;
	point.topY = y - point.halfSize;
	point.rightX = x + point.halfSize;
	point.bottomY = y + point.halfSize;

	point.height = point.fontHeight + point.size;
	point.fontX = point.rightX;
	point.fontY = point.topY - Math.round(point.fontHeight/3);

	return point;
}

async function calculateScale(startImage, scratchCtx, magnification, scaleType, {scaleSize, scaleBarHeight, scaleBarTop, pixelSizeConstant, font}) {
	let scale = {
		imageHeight: startImage.height,
		imageWidth: startImage.width,
		realHeight: startImage.height,
		realWidth: startImage.width,
		x: 0,
		y: 0,
		textX: 0,
		textY: 0,
		barX: 0,
		barY: 0,
		width: 0,
		height: 0,
		textFontHeight: Math.round(startImage.width*constants.FONTWIDTHMUTIPLIER),
		visualScale: 0,
		pixelSize: 0,
		scaleLength: 0,
		scaleIsBlack: false,
		barPixelHeight: 0,
		scaleOffsets: {
			xOffset: Math.round(startImage.width*constants.XOFFSETMULTIPLIER),
			yOffset: Math.round(startImage.width*constants.YOFFSETMULTIPLIER),
			between: Math.round(startImage.width*constants.BETWEENMULTIPLIER)
		}
	};

	if (scale.textFontHeight < 8)
		scale.textFontHeight = 8;

	// General easy calculations and estimations
	[scale.visualScale, scale.scaleLength, scale.pixelSize] = estimateVisualScale(magnification, startImage.width, pixelSizeConstant);

	scale.scaleLength = scaleSize > 0 ? Math.round(scaleSize / scale.pixelSize) : scale.scaleLength;
	scale.barPixelHeight = Math.round((scaleBarHeight ? scaleBarHeight : constants.SCALEBARHEIGHTPERCENT) * scale.textFontHeight);

	scale.visualScale = scaleSize > 0 ? scaleSize : scale.visualScale;
	scale.visualScale = '' + scale.visualScale + 'µm';

	await scratchCtx.setFont(`${scale.textFontHeight}px "${font}"`);
	const textWidth = (await scratchCtx.measureText(scale.visualScale)).width;
	const lineHeight = (await scratchCtx.measureText('m')).width;

	scale.height = lineHeight + scale.scaleOffsets.between + scale.barPixelHeight + (2 * scale.scaleOffsets.yOffset);
	scale.width = (scale.scaleLength > textWidth ? scale.scaleLength : textWidth) + (2 * scale.scaleOffsets.xOffset);

	// Calculate any changes in the image to account for scale type
	// Also positions the scale bar's x and y positions
	switch(scaleType) {
		case constants.scale.types.BELOWLEFT:
			scale.x = 0;
			scale.y = startImage.height;

			scale.realHeight = startImage.height + scale.height;
			scale.realWidth = startImage.width;
			break;
		case constants.scale.types.BELOWRIGHT:
			scale.x = startImage.width - scale.width;
			scale.y = startImage.height;

			scale.realHeight = startImage.height + scale.height;
			scale.realWidth = startImage.width;
			break;
		default:
		case constants.scale.types.BELOWCENTER:
			scale.x = Math.round((startImage.width / 2) - (scale.width / 2));
			scale.y = startImage.height;

			scale.realHeight = startImage.height + scale.height;
			scale.realWidth = startImage.width;
			break;
		case constants.scale.types.LOWERCENTER:
			scale.x = Math.round((startImage.width/2) - (scale.width/2));
			scale.y = startImage.height - scale.height;
			break;
		case constants.scale.types.LOWERRIGHT:
			scale.x = startImage.width - scale.width;
			scale.y = startImage.height - scale.height;
			break;
		case constants.scale.types.LOWERLEFT:
			scale.x = 0;
			scale.y = startImage.height - scale.height;
			break;
		case constants.scale.types.UPPERRIGHT:
			scale.x = startImage.width - scale.width;
			scale.y = 0;
			break;
		case constants.scale.types.UPPERLEFT:
			scale.x = 0;
			scale.y = 0;
			break;
	}

	scale.barX = Math.round(scale.x + (scale.width / 2) - Math.round(scale.scaleLength / 2));
	scale.textX = Math.round(scale.x + (scale.width / 2) - Math.round(textWidth / 2));

	if (scaleBarTop) {
		scale.textY = scale.y + scale.height - lineHeight - Math.round(scale.scaleOffsets.yOffset / 2);
		scale.barY = scale.textY - scale.scaleOffsets.between - Math.round(scale.scaleOffsets.yOffset / 2) - scale.barPixelHeight;
	} else {
		scale.barY = scale.y + scale.height - scale.scaleOffsets.yOffset - scale.barPixelHeight;
		scale.textY = scale.barY - lineHeight - scale.scaleOffsets.between;
	}

	// Return the image and scale information
	return scale;
}

module.exports = {
	pointToXY,
	calculatePointPosition,
	estimateVisualScale,
	calculatePixelSize,
	sumPixelLuminosity,
	findPixelLuminosity,
	calculateScale
};