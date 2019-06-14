const constants = require('./constants');

function scaleSettings(inputSettings) {
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
	output.RGBA = `rgba(${inputSettings.belowColor ? inputSettings.belowColor.R : constants.colors.white.R}, ${
		inputSettings.belowColor ? inputSettings.belowColor.G : constants.colors.white.G}, ${
		inputSettings.belowColor ? inputSettings.belowColor.B : constants.colors.white.B}, ${inputSettings.backgroundOpacity})`;

	return output;
}

function pointSettings(inputSettings) {
	return {
		pointType: inputSettings.pointType ? inputSettings.pointType : constants.point.types.THERMOINSTANT,
		textColor: inputSettings.textColor ? inputSettings.textColor : constants.colors.red,
		pointSize: inputSettings.pointSize ? inputSettings.pointSize : constants.point.AUTOSIZE,
		pointFontSize: inputSettings.pointFontSize ? inputSettings.pointFontSize : constants.point.AUTOSIZE,
		pointFont: inputSettings.pointFont ? inputSettings.pointFont : constants.fonts.OPENSANS
	}
}

function writeSettings(inputSettings) {
	inputSettings.tiff = typeof inputSettings.tiff !== 'object' ? {} : inputSettings.tiff;

	return {
		tiff: {
			quality: inputSettings.tiff.quality === undefined ? constants.export.tiff.quality : inputSettings.tiff.quality,
			compression: inputSettings.tiff.compression === undefined ? constants.export.tiff.compression : inputSettings.tiff.compression,
			predictor: inputSettings.tiff.predictor === undefined ? constants.export.tiff.predictor : inputSettings.tiff.predictor
		}
	}
}

module.exports = {
	scaleSettings,
	pointSettings,
	writeSettings
};