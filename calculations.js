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

module.exports = {
	estimateScale,
	calculatePixelSize
};