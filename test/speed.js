const fs = require('fs');
const fsPromise = require('fs').promises;

require('sharp');
const Canvas = require('canvas');

const constants = require('../constants');
const { PointShoot, ExtractedMap, CanvasRoot, NodeCanvas, JeolImage, PFE } = require('../module');

let options = {
	dirUri: 'test/data/',
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
	return (await Promise.all(directory.flatMap(dir => {
		if (dir.isDirectory()) {
			const files = fs.readdirSync(dirUri + dir.name, {withFileTypes: true});
			return files.filter(file => file.isFile()).map(file => {
				file.uri = dirUri + dir.name + '/' + file.name;
				if (file.name.endsWith(constants.pointShoot.fileFormats.ENTRY))
					return new PointShoot(file, canvas).init();

				if (file.name.endsWith(constants.extractedMap.fileFormats.ENTRY))
					return new ExtractedMap(file, canvas).init();

//				if (file.name.endsWith(constants.jeol.fileFormats.ENTRY))
//					return new JeolImage(file, canvas).init();

				if (file.name.endsWith(constants.pfe.fileFormats.ENTRY))
					return new PFE(file, canvas).init();
			}).filter(item => item);
		}
	}).filter(i => i))).flat();
}

async function bufferThermos(thermos, options, points) {
	for (const thermo of thermos)
		await (await thermo.addLayer({name: 'base'})).createBuffer(options.position, JSON.parse(JSON.stringify(options)), points);
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

//	for (const thermo of thermos) {
//		await thermo.write({uri: `./test/test/${thermo.data.name}.png`, png: {}});
//	}
//	console.log(`All images buffered in ${finished - gotThermosTime}ms`);
//	console.log(`Finished in ${finished - initTime}ms`);

	return {initTime, gotThermosTime, finished};
}

console.log('Operation  \tdefault \tbaseOptions\tbaseOptions + Points');
getThermos(options.dirUri).then(async thermos => {
	const iterations = 10;
	let totals = {
		default: 0,
		base: 0,
		pointBase: 0
	};

	for (let i = 0; i < iterations; i++) {
		const defaultTimes = await speed(thermos);

		options.addPoints = false;
		const baseOptionTimes = await speed(thermos, options);

		options.addPoints = true;
		const pointBaseOptionTimes = await speed(thermos, options);

		totals.default += (defaultTimes.finished - defaultTimes.initTime);
		totals.base += (baseOptionTimes.finished - baseOptionTimes.initTime);
		totals.pointBase += (pointBaseOptionTimes.finished - pointBaseOptionTimes.initTime);

		//console.log(`gotThermos\t${defaultTimes.gotThermosTime - defaultTimes.initTime}\t${baseOptionTimes.gotThermosTime - baseOptionTimes.initTime}\t${pointBaseOptionTimes.gotThermosTime - pointBaseOptionTimes.initTime}`);
		console.log(`Finished ${thermos.length} \t${defaultTimes.finished - defaultTimes.initTime}   \t${baseOptionTimes.finished - baseOptionTimes.initTime}      \t${pointBaseOptionTimes.finished - pointBaseOptionTimes.initTime}`);
	}

	console.log(`Averaged  \t${Math.round(totals.default/iterations)}  \t${Math.round(totals.base/iterations)}      \t${Math.round(totals.pointBase/iterations)}`);

});
