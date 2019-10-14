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

function pointToXY(values, width, height) {
	return [
		Math.floor((values[0] / values[2]) * width),
		Math.floor((values[1] / values[3]) * height)
	];
}

function circleToXY(values, width, height) {
	const x = Math.floor((values[0] / values[2]) * width);
	const y = Math.floor((values[1] / values[3]) * height);
	const x2 = Math.floor((values[4] / values[2]) * width);
	const y2 = Math.floor((values[5] / values[3]) * height);

	return [
		x, y,
		Math.floor(Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2))),
	];
}

function rectToXY(values, width, height) {
	return [
		Math.floor((values[0] / values[2]) * width),
		Math.floor((values[1] / values[3]) * height),
		Math.floor((values[4] / values[2]) * width),
		Math.floor((values[5] / values[3]) * height)
	];
}

function polyToXY(values, width, height) {
	let points = [];

	for (let i = 0; i < values.length; i+=4)
		points.push({
			x: Math.floor((values[i] / values[2]) * width),
			y: Math.floor((values[i+1] / values[3]) * height)
		});

	return points;
}

async function calculatePoly(scratchCtx, points, width, size, fontSize, font) {
	size = size ? size : Math.round(width*constants.FONTWIDTHMUTIPLIER/3);
	let poly = {
		lineWidth: Math.floor(size/8),
		fontHeight: 0,
		fontX: 0,
		fontY: 0,
		fontSize: fontSize ? fontSize : Math.round(width*constants.FONTWIDTHMUTIPLIER/2)
	};

	if (poly.fontSize < 8)
		poly.fontSize = 8;

	scratchCtx.setFont(`${poly.fontSize}px "${font}"`);
	poly.fontHeight = (await scratchCtx.measureText('m')).width;

	if (size === 5 || size === 3)
		poly.lineWidth = 3;
	else
		poly.lineWidth = poly.lineWidth === 0 ? 2 : poly.lineWidth;

	const bestY = points.reduce((bestY, {y}) => bestY < y ? bestY : y, Infinity);

	poly.fontX = points[0].x;
	poly.fontY = bestY - Math.round(poly.fontHeight/6);

	return poly;
}

async function calculateCircle(scratchCtx, x, y, radius, width, size, fontSize, font) {
	size = size ? size : Math.round(width*constants.FONTWIDTHMUTIPLIER/3);
	let circle = {
		lineWidth: Math.floor(size/8),
		fontHeight: 0,
		fontX: 0,
		fontY: 0,
		fontSize: fontSize ? fontSize : Math.round(width*constants.FONTWIDTHMUTIPLIER/2)
	};

	if (circle.fontSize < 8)
		circle.fontSize = 8;

	scratchCtx.setFont(`${circle.fontSize}px "${font}"`);
	circle.fontHeight = (await scratchCtx.measureText('m')).width;

	if (size === 5 || size === 3)
		circle.lineWidth = 3;
	else
		circle.lineWidth = circle.lineWidth === 0 ? 2 : circle.lineWidth;

	circle.fontX = x + radius - (radius/4);
	circle.fontY = y - (radius/2) - Math.round(circle.fontHeight/3);

	return circle;
}

async function calculateRectangle(scratchCtx, topX, topY, botX, botY, width, size, fontSize, font) {
	size = size ? size : Math.round(width*constants.FONTWIDTHMUTIPLIER/3);
	let rect = {
		width: botX - topX,
		height: botY - topY,
		lineWidth: Math.floor(size/8),
		fontHeight: 0,
		fontX: 0,
		fontY: 0,
		fontSize: fontSize ? fontSize : Math.round(width*constants.FONTWIDTHMUTIPLIER/2)
	};

	if (rect.fontSize < 8)
		rect.fontSize = 8;

	scratchCtx.setFont(`${rect.fontSize}px "${font}"`);
	rect.fontHeight = (await scratchCtx.measureText('m')).width;

	if (size === 5 || size === 3)
		rect.lineWidth = 3;
	else
		rect.lineWidth = rect.lineWidth === 0 ? 2 : rect.lineWidth;

	rect.fontX = botX;
	rect.fontY = topY - Math.round(rect.fontHeight/3);

	return rect;
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

	scratchCtx.setFont(`${point.fontSize}px "${font}"`);
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

async function calculateConstants(meta, scratchCtx, font) {
	const textFontHeight = Math.round(meta.width*constants.FONTWIDTHMUTIPLIER);
	await scratchCtx.setFont(`${textFontHeight}px "${font}"`);
	const maxBarPixelHeight = Math.round(textFontHeight);

	const metaConstants = {
		width: meta.width,
		height: meta.height,
		maxWidth: meta.width,
		maxHeight: meta.height,
		textFontHeight,
		lineHeight: (await scratchCtx.measureText('m')).width,
		scaleOffsets: {
			xOffset: Math.round(meta.width * constants.XOFFSETMULTIPLIER),
			yOffset: Math.round(meta.width * constants.YOFFSETMULTIPLIER),
			between: Math.round(meta.width * constants.BETWEENMULTIPLIER)
		}
	};

	metaConstants.maxHeight += metaConstants.lineHeight + metaConstants.scaleOffsets.between + maxBarPixelHeight + (2 * metaConstants.scaleOffsets.yOffset);

	return metaConstants;
}

async function calculateScale(metaConstants, scratchCtx, magnification, scaleType, {scaleSize, scaleBarHeight, scaleBarTop, pixelSizeConstant, font}) {
	let scale = {
		imageHeight: metaConstants.height,
		imageWidth: metaConstants.width,
		realHeight: metaConstants.height,
		realWidth: metaConstants.width,
		x: 0,
		y: 0,
		textX: 0,
		textY: 0,
		barX: 0,
		barY: 0,
		width: 0,
		height: 0,
		textFontHeight: metaConstants.textFontHeight,
		visualScale: 0,
		pixelSize: 0,
		scaleLength: 0,
		scaleIsBlack: false,
		barPixelHeight: 0,
		scaleOffsets: {
			xOffset: metaConstants.scaleOffsets.xOffset,
			yOffset: metaConstants.scaleOffsets.yOffset,
			between: metaConstants.scaleOffsets.between
		}
	};

	if (scale.textFontHeight < 8)
		scale.textFontHeight = 8;

	if (scaleBarHeight > 1)
		scaleBarHeight = 1;

	// General easy calculations and estimations
	[scale.visualScale, scale.scaleLength, scale.pixelSize] = estimateVisualScale(magnification, metaConstants.width, pixelSizeConstant);

	scale.scaleLength = scaleSize > 0 ? Math.round(scaleSize / scale.pixelSize) : scale.scaleLength;
	scale.barPixelHeight = Math.round((scaleBarHeight ? scaleBarHeight : constants.SCALEBARHEIGHTPERCENT) * scale.textFontHeight);

	scale.visualScale = scaleSize > 0 ? scaleSize : scale.visualScale;
	scale.visualScale = '' + scale.visualScale + 'µm';

	await scratchCtx.setFont(`${scale.textFontHeight}px "${font}"`);
	const textWidth = (await scratchCtx.measureText(scale.visualScale)).width;

	scale.height = metaConstants.lineHeight + scale.scaleOffsets.between + scale.barPixelHeight + (2 * scale.scaleOffsets.yOffset);
	scale.width = (scale.scaleLength > textWidth ? scale.scaleLength : textWidth) + (2 * scale.scaleOffsets.xOffset);

	// Calculate any changes in the image to account for scale type
	// Also positions the scale bar's x and y positions
	switch(scaleType) {
		case constants.scale.types.BELOWLEFT:
			scale.x = 0;
			scale.y = metaConstants.height;

			scale.realHeight = metaConstants.height + scale.height;
			scale.realWidth = metaConstants.width;
			break;
		case constants.scale.types.BELOWRIGHT:
			scale.x = metaConstants.width - scale.width;
			scale.y = metaConstants.height;

			scale.realHeight = metaConstants.height + scale.height;
			scale.realWidth = metaConstants.width;
			break;
		default:
		case constants.scale.types.BELOWCENTER:
			scale.x = Math.round((metaConstants.width / 2) - (scale.width / 2));
			scale.y = metaConstants.height;

			scale.realHeight = metaConstants.height + scale.height;
			scale.realWidth = metaConstants.width;
			break;
		case constants.scale.types.LOWERCENTER:
			scale.x = Math.round((metaConstants.width/2) - (scale.width/2));
			scale.y = metaConstants.height - scale.height;
			break;
		case constants.scale.types.LOWERRIGHT:
			scale.x = metaConstants.width - scale.width;
			scale.y = metaConstants.height - scale.height;
			break;
		case constants.scale.types.LOWERLEFT:
			scale.x = 0;
			scale.y = metaConstants.height - scale.height;
			break;
		case constants.scale.types.UPPERRIGHT:
			scale.x = metaConstants.width - scale.width;
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
		scale.textY = scale.y + scale.height - metaConstants.lineHeight - Math.round(scale.scaleOffsets.yOffset / 2);
		scale.barY = scale.textY - scale.scaleOffsets.between - Math.round(scale.scaleOffsets.yOffset / 2) - scale.barPixelHeight;
	} else {
		scale.barY = scale.y + scale.height - scale.scaleOffsets.yOffset - scale.barPixelHeight;
		scale.textY = scale.barY - metaConstants.lineHeight - scale.scaleOffsets.between;
	}

	// Return the image and scale information
	return scale;
}

module.exports = {
	rectToXY,
	polyToXY,
	circleToXY,
	pointToXY,
	calculatePoly,
	calculateCircle,
	calculateRectangle,
	calculatePointPosition,
	estimateVisualScale,
	calculatePixelSize,
	calculateConstants,
	calculateScale
};