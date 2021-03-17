const path = require('path');

const constants = require('./constants');

function scaleSettings(inputSettings = {}) {
	let output = {
		belowColor: inputSettings.belowColor ? inputSettings.belowColor : constants.colors.AUTO,
		scaleColor: inputSettings.scaleColor ? inputSettings.scaleColor : constants.colors.AUTO,
		scaleSize: inputSettings.scaleSize ? inputSettings.scaleSize : constants.scale.AUTOSIZE,
		scaleBarHeight: inputSettings.scaleBarHeight ? inputSettings.scaleBarHeight : constants.scale.AUTOSIZE,
		scaleBarTop: inputSettings.scaleBarTop ? inputSettings.scaleBarTop : constants.scale.SCALEBARTOP,
		pixelSizeConstant: inputSettings.pixelSizeConstant ? inputSettings.pixelSizeConstant : constants.PIXELSIZECONSTANT,
		backgroundOpacity: inputSettings.backgroundOpacity ? inputSettings.backgroundOpacity : constants.scale.background.AUTOOPACITY,
		font: inputSettings.font ? inputSettings.font : constants.fonts.OPENSANS,
		RGBA: ''
	};

	output.backgroundOpacity = (inputSettings.backgroundOpacity < 0 ? 0 : (inputSettings.backgroundOpacity > 100 ? 100 : inputSettings.backgroundOpacity)) / 100;
	output.RGBA = inputSettings.belowColor ? `rgba(${inputSettings.belowColor.R}, ${inputSettings.belowColor.G}, ${inputSettings.belowColor.B}, ${output.backgroundOpacity})`
		: constants.colors.AUTO;

	return output;
}

function pointSettings(inputSettings = {}) {
	return {
		pointType: inputSettings.pointType ? inputSettings.pointType : constants.point.types.THERMOINSTANT,
		textColor: inputSettings.textColor ? inputSettings.textColor : constants.colors.red,
		pointSize: inputSettings.pointSize ? inputSettings.pointSize : constants.point.AUTOSIZE,
		pointFontSize: inputSettings.pointFontSize ? inputSettings.pointFontSize : constants.point.AUTOSIZE,
		pointFont: inputSettings.pointFont ? inputSettings.pointFont : constants.fonts.OPENSANS
	}
}

function writeSettings(inputSettings = {}) {
	const useTiff = typeof inputSettings.tiff === 'object';
	const useWebp = typeof inputSettings.webp === 'object';
	const usePng = typeof inputSettings.png === 'object';
	const useJpeg = typeof inputSettings.jpeg === 'object';
	const makeAcq = typeof inputSettings.acq === 'object';

	inputSettings.tiff = useTiff ? inputSettings.tiff : {};
	inputSettings.webp = useWebp ? inputSettings.webp : {};
	inputSettings.png = usePng ? inputSettings.png : {};
	inputSettings.jpeg = useJpeg ? inputSettings.jpeg : {};
	inputSettings.acq = makeAcq ? inputSettings.acq : {};

	return {
		uri: path.resolve(inputSettings.uri ? inputSettings.uri : '.'),
		pixelSizeConstant: inputSettings.pixelSizeConstant ? inputSettings.pixelSizeConstant : constants.PIXELSIZECONSTANT,
		tiff: {
			use: useTiff,
			quality: inputSettings.tiff.quality === undefined ? constants.export.tiff.quality : inputSettings.tiff.quality,
			compression: inputSettings.tiff.compression === undefined ? constants.export.tiff.compression : inputSettings.tiff.compression,
			predictor: inputSettings.tiff.predictor === undefined ? constants.export.tiff.predictor : inputSettings.tiff.predictor
		},
		webp: {
			use: useWebp,
			quality: inputSettings.webp.quality === undefined ? constants.export.webp.quality : inputSettings.webp.quality,
			compression: inputSettings.webp.lossless === undefined ? constants.export.webp.lossless : inputSettings.webp.lossless,
			predictor: inputSettings.webp.nearLossless === undefined ? constants.export.webp.nearLossless : inputSettings.webp.nearLossless
		},
		png: {
			use: usePng,
			quality: inputSettings.png.quality === undefined ? constants.export.png.quality : inputSettings.png.quality,
			compressionLevel: inputSettings.png.compressionLevel === undefined ? constants.export.png.compressionLevel : inputSettings.png.compressionLevel
		},
		jpeg: {
			use: useJpeg,
			quality: inputSettings.jpeg.quality === undefined ? constants.export.png.quality : inputSettings.jpeg.quality,
			chromaSubsampling: inputSettings.jpeg.chromaSubsampling === undefined ? constants.export.png.chromaSubsampling : inputSettings.jpeg.chromaSubsampling
		},
		acq: {
			use: makeAcq,
			xPolarity: inputSettings.acq.xPolarity === undefined ? constants.pictureSnapApp.XPOLARITYDEFAULT : inputSettings.acq.xPolarity,
			yPolarity: inputSettings.acq.yPolarity === undefined ? constants.pictureSnapApp.YPOLARITYDEFAULT : inputSettings.acq.yPolarity,
			stageUnits: inputSettings.acq.stageUnits === undefined ? constants.pictureSnapApp.STAGEUNITDEFAULT : inputSettings.acq.stageUnits.toLowerCase()
		}
	}
}

module.exports = {
	scaleSettings,
	pointSettings,
	writeSettings
};