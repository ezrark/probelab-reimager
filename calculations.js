const constants = require('./constants');
const scales = [1000, 500, 250, 100, 50, 25, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.025, 0.01, 0.005, 0.001];

function estimateVisualScale(magnification, width, pixelSizeConstant, pixelSize = calculatePixelSize(magnification, width, pixelSizeConstant)) {
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
	if (3000 < magnification && magnification <= 5000)
		scaleIndex = 7;
	if (5000 < magnification && magnification <= 25000)
		scaleIndex = 8;
	if (25000 < magnification && magnification <= 50000)
		scaleIndex = 9;
	if (50000 < magnification && magnification <= 100000)
		scaleIndex = 10;
	if (100000 < magnification && magnification <= 250000)
		scaleIndex = 11;
	if (250000 < magnification && magnification <= 500000)
		scaleIndex = 12;
	if (500000 < magnification)
		scaleIndex = 13;

	if (Math.round(scales[scaleIndex] / pixelSize) > .3 * width)
		scaleIndex += 1;

	return [scales[scaleIndex], Math.round(scales[scaleIndex] / pixelSize), pixelSize];
}

function calculatePixelSize(magnification, width, pixelSizeConstant) {
	//  Calculated formula    "1 scale"
	// (Constant * mag^-1) * (1024/width)
	return (pixelSizeConstant * Math.pow(magnification, -1)) * (1024 / width);
}

// Values: [pos-x, pos-y, max-x, max-y]
function pointToXY(values, width, height) {
	return [
		Math.floor((values[0] / values[2]) * width),
		Math.floor((values[1] / values[3]) * height)
	];
}

function pointToXYTest(point, image) {
	return [
		Math.floor(Math.abs((image.x[0] - point.stage.reference.x) / image.xDiff) * image.width),
		Math.floor(Math.abs((image.y[1] - point.stage.reference.y) / image.yDiff) * image.height)
	];
}

function circleToXY(values, width, height) {
	const [x, y] = pointToXY(values.slice(0, 4), width, height);
	const [x2, y2] = pointToXY(values.slice(4, 8), width, height);

	return [
		x, y,
		Math.floor(Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2)))
	];
}

function rectToXY(values, width, height) {
	return [
		pointToXY(values.slice(0, 4), width, height),
		pointToXY(values.slice(4, 8), width, height)
	].flat();
}

function polyToXY(values, width, height) {
	let points = [];

	for (let i = 0; i < values.length; i += 4)
		points.push({
			x: Math.floor((values[i] / values[2]) * width),
			y: Math.floor((values[i + 1] / values[3]) * height)
		});

	return points;
}

async function createShape(scratchCtx, size, width, fontSize, font) {
	size = size ? Math.round(width / (100 / size) * constants.FONTWIDTHMUTIPLIER) : Math.round(width * constants.FONTWIDTHMUTIPLIER / 3);
	let shape = {
		lineWidth: Math.floor(size / 8),
		fontHeight: 0,
		fontX: 0,
		fontY: 0,
		fontSize: fontSize ? Math.round(1.5 * size * (fontSize / 100)) : size * 2
	};

	if (shape.fontSize < 8)
		shape.fontSize = 8;

	scratchCtx.setFont(`${shape.fontSize}px "${font}"`);
	shape.fontHeight = (await scratchCtx.measureText('m')).width;

	if (size === 5 || size === 3)
		shape.lineWidth = 3;
	else
		shape.lineWidth = shape.lineWidth === 0 ? 2 : shape.lineWidth;

	return shape;
}

async function calculatePoly(scratchCtx, points, width, size, fontSize, font) {
	let poly = await createShape(scratchCtx, size, width, fontSize, font);

	const bestY = points.reduce((bestY, {y}) => bestY < y ? bestY : y, Infinity);

	poly.fontX = points[0].x;
	poly.fontY = bestY - Math.round(poly.fontHeight / 6);

	return poly;
}

async function calculateCircle(scratchCtx, x, y, radius, width, size, fontSize, font) {
	let circle = await createShape(scratchCtx, size, width, fontSize, font);

	circle.fontX = x + radius - (radius / 4);
	circle.fontY = y - (radius / 2) - Math.round(circle.fontHeight / 3);

	return circle;
}

async function calculateRectangle(scratchCtx, topX, topY, botX, botY, width, size, fontSize, font) {
	let rect = await createShape(scratchCtx, size, width, fontSize, font);

	rect.width = botX - topX;
	rect.height = botY - topY;

	rect.fontX = botX;
	rect.fontY = topY - Math.round(rect.fontHeight / 3);

	return rect;
}

async function calculatePointPosition(scratchCtx, x, y, width, size, fontSize, font) {
	size = size ? Math.round(width / (100 / size) * constants.FONTWIDTHMUTIPLIER) : Math.round(width * constants.FONTWIDTHMUTIPLIER / 3);
	let point = {
		centerX: x,
		centerY: y,
		leftX: 0,
		topY: 0,
		rightX: 0,
		bottomY: 0,
		size: 0,
		halfSize: Math.floor(size / 2),
		quarterSize: Math.floor(size / 4),
		eighthSize: Math.floor(size / 8),
		sixteenthSize: Math.floor(size / 16),
		height: 0,
		width: 0,
		pointHeight: 0,
		pointWidth: 0,
		fontHeight: 0,
		fontX: 0,
		fontY: 0,
		fontSize: fontSize ? Math.round(1.5 * size * (fontSize / 100)) : size * 2
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
	point.fontY = point.topY - Math.round(point.fontHeight / 3);

	return point;
}

async function calculateConstants(meta, scratchCtx, font) {
	const textFontHeight = Math.round(meta.width * constants.FONTWIDTHMUTIPLIER);

	// Multiply by 10 to allow up to 10x font size scaling
	await scratchCtx.setFont(`${textFontHeight * 10}px "${font}"`);
	const maxLineHeight = (await scratchCtx.measureText('m')).width

	await scratchCtx.setFont(`${textFontHeight}px "${font}"`);
	const maxBarPixelHeight = Math.round(textFontHeight);

	const metaConstants = {
		width: meta.width,
		height: meta.cutoffHeight ? (meta.cutoffHeight < meta.height ? meta.cutoffHeight : meta.height * 0.9375) : meta.height,
		maxWidth: meta.width,
		maxHeight: meta.height,
		fullHeight: meta.height,
		textFontHeight,
		lineHeight: maxLineHeight,
		standardLineHeight: (await scratchCtx.measureText('m')).width,
		scaleOffsets: {
			xOffset: Math.round(meta.width * constants.XOFFSETMULTIPLIER),
			yOffset: Math.round(meta.width * constants.YOFFSETMULTIPLIER),
			between: Math.round(meta.width * constants.BETWEENMULTIPLIER)
		}
	};

	metaConstants.maxHeight += metaConstants.lineHeight + metaConstants.scaleOffsets.between + maxBarPixelHeight + (2 * metaConstants.scaleOffsets.yOffset);

	return metaConstants;
}

async function calculateScale(metaConstants, scratchCtx, magnification, scaleType, {
	scaleSize,
	scaleBarHeight,
	scaleBarTop,
	pixelSizeConstant,
	font,
	scaleBarLabelSize
}) {
	let scale = {
		imageHeight: scaleType === constants.scale.types.JEOL ? metaConstants.fullHeight : metaConstants.height,
		imageWidth: metaConstants.width,
		realHeight: scaleType === constants.scale.types.JEOL ? metaConstants.fullHeight : metaConstants.height,
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
		lineHeight: metaConstants.lineHeight,
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

	// Minimum size for readable font
	if (scale.textFontHeight < 8)
		scale.textFontHeight = 8;

	if (scaleBarHeight > 1)
		scaleBarHeight = 1;

	// General easy calculations and estimations
	[scale.visualScale, scale.scaleLength, scale.pixelSize] = estimateVisualScale(magnification, metaConstants.width, pixelSizeConstant);

	// Multiply the scaling of the font height
	if (scaleBarLabelSize !== 1) {
		scale.textFontHeight = scale.textFontHeight * scaleBarLabelSize;
		await scratchCtx.setFont(`${scale.textFontHeight}px "${font}"`);
		scale.lineHeight = (await scratchCtx.measureText('m')).width; // Slow operation but needed if the font height changes
	} else {
		await scratchCtx.setFont(`${scale.textFontHeight}px "${font}"`);
		scale.lineHeight = metaConstants.standardLineHeight;
	}

	// Calculate size of elements using the scaled scale bar label height
	scale.scaleLength = scaleSize > 0 ? Math.round(scaleSize / scale.pixelSize) : scale.scaleLength;
	scale.barPixelHeight = Math.round((scaleBarHeight ? scaleBarHeight : constants.SCALEBARHEIGHTPERCENT) * scale.textFontHeight);

	scale.visualScale = scaleSize > 0 ? scaleSize : scale.visualScale;
	scale.visualScale = '' + (scale.visualScale >= 1 ? scale.visualScale : (scale.visualScale * 1000)) + (scale.visualScale >= 1 ? ' µm' : ' nm');


	const textWidth = (await scratchCtx.measureText(scale.visualScale)).width;

	scale.height = scale.lineHeight + scale.scaleOffsets.between + scale.barPixelHeight + (2 * scale.scaleOffsets.yOffset);
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
			scale.x = Math.round((metaConstants.width / 2) - (scale.width / 2));
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
		case constants.scale.types.JEOL:
			break;
	}

	// Ehhhhhhhhhh
	if (scaleType === constants.scale.types.JEOL) {
		const heightDiff = Math.abs(metaConstants.height - metaConstants.fullHeight);

		scale.barPixelHeight = (heightDiff / 4);
		scale.textFontHeight = heightDiff * .40;

		scale.height = scale.textFontHeight;

		scale.barX = metaConstants.width - scale.scaleLength - (metaConstants.width * .3) - textWidth;
		scale.barY = metaConstants.height + heightDiff / 16 - 2;
		scale.textX = metaConstants.width - (metaConstants.width * .285) - textWidth;
		scale.textY = scale.barY;

		scale.width = metaConstants.width * .738;
		scale.x = 0;
		scale.y = scale.barY;
	} else {
		scale.barX = Math.round(scale.x + (scale.width / 2) - Math.round(scale.scaleLength / 2));
		scale.textX = Math.round(scale.x + (scale.width / 2) - Math.round(textWidth / 2));

		if (scaleBarTop) {
			scale.textY = scale.y + scale.height - scale.lineHeight - Math.round(scale.scaleOffsets.yOffset / 2);
			scale.barY = scale.textY - scale.scaleOffsets.between - Math.round(scale.scaleOffsets.yOffset / 2) - scale.barPixelHeight;
		} else {
			scale.barY = scale.y + scale.height - scale.scaleOffsets.yOffset - scale.barPixelHeight;
			scale.textY = scale.barY - scale.lineHeight - scale.scaleOffsets.between;
		}
	}

	// Return the image and scale information
	return scale;
}

module.exports = {
	pointToXYTest,
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