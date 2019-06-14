const fs = require('fs');
const fsPromise = require('fs').promises;

const Canvas = require('canvas');

const constants = require('../constants');
const { PointShoot, ExtractedMap, CanvasRoot, NodeCanvas } = require('../module');

let options = {
	dirUri: './data/',
	position: constants.scale.types.BELOWCENTER,
	scaleColor: constants.colors.AUTO,
	belowColor: constants.colors.AUTO,
	scaleSize: constants.scale.AUTOSIZE,
	scaleBarHeight: constants.scale.AUTOSIZE,
	scaleBarTop: constants.scale.SCALEBARTOP,
	pixelSizeConstant: constants.PIXELSIZECONSTANT,
	backgroundOpacity: constants.scale.background.AUTOOPACITY,
	addPoints: false,
	pointType: constants.point.types.THERMOINSTANT,
	textColor: constants.colors.red,
	pointSize: constants.point.AUTOSIZE,
	pointFontSize: constants.point.AUTOSIZE,
	pointFont: constants.fonts.OPENSANS,
	font: constants.fonts.OPENSANS,
	tiff: {
		quality: constants.export.tiff.quality,
		compression: constants.export.tiff.compression,
		predictor: constants.export.tiff.predictor
	}
};

process.env.NODE_ENV = 'production';

async function getThermos(dirUri) {
	const directory = await fsPromise.readdir(dirUri, {withFileTypes: true});
	const nodeCanvas = new NodeCanvas(Canvas);
	const canvas = new CanvasRoot(nodeCanvas);
	await canvas.init();
	return directory.flatMap(dir => {
		if (dir.isDirectory()) {
			const files = fs.readdirSync(dirUri + dir.name, {withFileTypes: true});
			return files.filter(file => file.isFile()).map(file => {
				file.uri = dirUri + dir.name + '/' + file.name;
				if (file.name.endsWith(constants.pointShoot.fileFormats.ENTRY))
					return new PointShoot(file, canvas);

				if (file.name.endsWith(constants.extractedMap.fileFormats.ENTRY))
					return new ExtractedMap(file, canvas);
			}).filter(item => item);
		}
	}).filter(i => i);
}

async function bufferThermos(thermos, options, points) {
	for (const thermo of thermos)
		await thermo.createBuffer(options.position, JSON.parse(JSON.stringify(options)), points);
}

async function speed(thermos=false, options={}) {
	const initTime = Date.now();
	let gotThermosTime = initTime;
	if (!thermos) {
		thermos = await getThermos(options.dirUri);
		gotThermosTime = Date.now();
//		console.log(`Got thermos in ${gotThermosTime - initTime}ms`);
	}
	await bufferThermos(thermos, options);
	const finished = Date.now();
//	console.log(`All images buffered in ${finished - gotThermosTime}ms`);
//	console.log(`Finished in ${finished - initTime}ms`);

	return {initTime, gotThermosTime, finished};
}

console.log('Operation \tdefault\tbaseOptions\tbaseOptions + Points');
getThermos(options.dirUri).then(async thermos => {
	for (let i = 0; i < 10; i++) {
		const defaultTimes = await speed(thermos);
		const baseOptionTimes = await speed(thermos, options);
		options.addPoints = true;
		const pointBaseOptionTimes = await speed(thermos, options);

		//console.log(`gotThermos\t${defaultTimes.gotThermosTime - defaultTimes.initTime}\t${baseOptionTimes.gotThermosTime - baseOptionTimes.initTime}\t${pointBaseOptionTimes.gotThermosTime - pointBaseOptionTimes.initTime}`);
		console.log(`Finished  \t${defaultTimes.finished - defaultTimes.initTime}  \t${baseOptionTimes.finished - baseOptionTimes.initTime}      \t${pointBaseOptionTimes.finished - pointBaseOptionTimes.initTime}`);
	}
});
