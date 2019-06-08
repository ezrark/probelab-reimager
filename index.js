const fs = require('fs');

const constants = require('./constants');

const ExtractedMap = require('./extractedmap');
const PointShoot = require('./pointshoot');

function help() {
	console.log('Usage: thermo-reimager [options] [directory]\n');
	console.log('Options:');
	console.log('-v, --version                          \tDisplays the version information');
	console.log('-h, --help                             \tProvides this text');
	console.log('-t, --ontop                            \tSets the scale bar on top of the scale value');
	console.log('-i, --points                           \tPrints points onto image');
	console.log('-p [pos], --position [pos]             \tPosition to print the scale');
	console.log('-c [color], --color [color]            \tScale color');
	console.log('-b [color], --background [color]       \t\'Below\' or if \'opaque\', background color');
	console.log('-o [0-100], --opacity [0-100]          \tOpacity of the background for the scale (default 0)');
	console.log('-s [µm], --scale [µm]                  \tScale to display, < 1 for auto');
	console.log('-k [0-100], --barheight [0-100]        \tSet scale bar to a % of the text font height, < 1 for auto(8)');
	console.log('-x [num], --pixelsize [num]            \tSets the pixel size constant for the probe calibration equation');
	console.log('-n [pointType], --pointtype [pointType]\tSets the type used to define points (Only over 128 res)');
	console.log('-e [textColor], --textcolor [textColor]\tSets the color to display the point names in');
	console.log('-z [num], --textsize [num]             \tSets the font size for the point names');
	console.log('-d [num], --pointsize [num]            \tSets the point size');
	console.log('-f [font], --font [font]               \tSets the font to use');
	console.log();
	console.log('Pixel Size Constant:');
	console.log('  Default: 116.73');
	console.log('Default was with the UMN Probelab\'s JEOL JAX 8530F Plus and is the constant of the calibration curve.');
	console.log('The calibration curve seems to always be CONST*x^(-1) or close enough to it for scale estimations.');
	console.log();
	console.log('Colors (Scale and Background):');
	console.log('a, auto \tSelects the color automatically');
	console.log('b, black\t');
	console.log('w, white\t');
	console.log();
	console.log('Colors (Text):');
	console.log('a, auto  \tSelects the color automatically');
	console.log('b, black \t');
	console.log('w, white \t');
	console.log('r, red   \t');
	console.log('o, orange\t');
	console.log();
	console.log('Fonts:');
	console.log('o, opensans \tGood, free sans font');
	console.log('c, comicsans\tWhy');
	console.log();
	console.log('Positions:');
	console.log('d, default      \tScale is Underneath the image, Centered');
	console.log('bl, belowleft   \tScale is Under the image, Left');
	console.log('br, belowright  \tScale is Under the image, Right');
	console.log('bc, belowcenter \tScale is Under the image, Centered');
	console.log('ul, upperleft   \tScale is in the Upper Left');
	console.log('ur, upperright  \tScale is in the Upper Right');
	console.log('ll, lowerleft   \tScale is in the Lower Left');
	console.log('lr, loweright   \tScale is in the Lower Right');
	console.log('lc, lowercenter \tScale is in the Lower Center');
	console.log();
	console.log('Point Types:');
	console.log('t, thermo\tThermo\'s point icon');
	console.log('r, round \tThermo\'s point icon but round');
	console.log('., circle\tA filled in circle');
	console.log('+, cross \tA cross');
	console.log();
}

let options = {
	help: false,
	version: false,
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
	font: constants.fonts.OPENSANS
};

let points = [];

let dirUri = '';

for (let i = 2; i < process.argv.length; i++) {
	if (process.argv[i].startsWith('--')) {
		switch (process.argv[i]) {
			case '--version':
				options.version = true;
				break;
			case '--help':
				options.help = true;
				break;
			case '--ontop':
				options.scaleBarTop = true;
				break;
			case '--textsize':
				options.pointFontSize = parseInt(process.argv[++i]);
				break;
			case '--pointsize':
				options.pointSize = parseInt(process.argv[++i]);
				break;
			case '--scale':
				options.scaleSize = parseInt(process.argv[++i]);
				break;
			case '--pixelsize':
				options.pixelSizeConstant = parseFloat(process.argv[++i]);
				break;
			case '--barheight':
				options.scaleBarHeight = parseInt(process.argv[++i])/100;
				break;
			case '--opacity':
				options.backgroundOpacity = parseInt(process.argv[++i]);
				break;
			case '--points':
				options.addPoints = true;
				break;
			case '--pointtype':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					case 't':
					case 'thermo':
					default:
						options.pointType = constants.point.types.THERMOINSTANT;
						break;
					case 'r':
					case 'round':
						options.pointType = constants.point.types.THERMOINSTANTROUND;
						break;
					case '.':
					case 'circle':
						options.pointType = constants.point.types.CIRCLE;
						break;
					case '+':
					case 'cross':
						options.pointType = constants.point.types.CROSS;
						break;
				}
				break;
			case '--textcolor':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					default:
						options.textColor = constants.colors.AUTO;
						break;
					case 'b':
					case 'black':
						options.textColor = constants.colors.black;
						break;
					case 'w':
					case 'white':
						options.textColor = constants.colors.white;
						break;
					case 'r':
					case 'red':
						options.textColor = constants.colors.red;
						break;
					case 'o':
					case 'orange':
						options.textColor = constants.colors.orange;
						break;
				}
				break;
			case '--font':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					case 'o':
					case 'opensans':
					default:
						options.pointFont = constants.fonts.OPENSANS;
						options.font = constants.fonts.OPENSANS;
						break;
					case 'c':
					case 'comicsans':
						options.pointFont = constants.fonts.COMICSANSMS;
						options.font = constants.fonts.COMICSANSMS;
						break;
				}
				break;
			case '--color':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					default:
						options.scaleColor = constants.colors.AUTO;
						break;
					case 'b':
					case 'black':
						options.scaleColor = constants.colors.black;
						break;
					case 'w':
					case 'white':
						options.scaleColor = constants.colors.white;
						break;
				}
				break;
			case '--background':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					default:
						options.belowColor = constants.colors.AUTO;
						break;
					case 'b':
					case 'black':
						options.belowColor = constants.colors.black;
						break;
					case 'w':
					case 'white':
						options.belowColor = constants.colors.white;
						break;
				}
				break;
			case '--position':
				switch (process.argv[++i]) {
					case 'd':
					case 'default':
					default:
						options.position = constants.scale.types.BELOWCENTER;
						break;
					case 'bl':
					case 'belowleft':
						options.position = constants.scale.types.BELOWLEFT;
						break;
					case 'br':
					case 'belowright':
						options.position = constants.scale.types.BELOWRIGHT;
						break;
					case 'bc':
					case 'belowcenter':
						options.position = constants.scale.types.BELOWCENTER;
						break;
					case 'ul':
					case 'upperleft':
						options.position = constants.scale.types.UPPERLEFT;
						break;
					case 'll':
					case 'lowerleft':
						options.position = constants.scale.types.LOWERLEFT;
						break;
					case 'ur':
					case 'upperright':
						options.position = constants.scale.types.UPPERRIGHT;
						break;
					case 'lr':
					case 'lowerright':
						options.position = constants.scale.types.LOWERRIGHT;
						break;
					case 'lc':
					case 'lowercenter':
						options.position = constants.scale.types.LOWERCENTER;
						break;
				}
				break;
		}
	} else if (process.argv[i].startsWith('-')) {
		switch (process.argv[i]) {
			case '-z':
				options.pointFontSize = parseInt(process.argv[++i]);
				break;
			case '-d':
				options.pointSize = parseInt(process.argv[++i]);
				break;
			case '-s':
				options.scaleSize = parseInt(process.argv[++i]);
				break;
			case '-k':
				options.scaleBarHeight = parseInt(process.argv[++i])/100;
				break;
			case '-x':
				options.pixelSizeConstant = parseFloat(process.argv[++i]);
				break;
			case '-o':
				options.backgroundOpacity = parseInt(process.argv[++i]);
				break;
			case '-i':
				options.addPoints = true;
				break;
			case '-c':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					default:
						options.scaleColor = constants.colors.AUTO;
						break;
					case 'b':
					case 'black':
						options.scaleColor = constants.colors.black;
						break;
					case 'w':
					case 'white':
						options.scaleColor = constants.colors.white;
						break;
				}
				break;
			case '-n':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					case 't':
					case 'thermo':
					default:
						options.pointType = constants.point.types.THERMOINSTANT;
						break;
					case 'r':
					case 'round':
						options.pointType = constants.point.types.THERMOINSTANTROUND;
						break;
					case '.':
					case 'circle':
						options.pointType = constants.point.types.CIRCLE;
						break;
					case '+':
					case 'cross':
						options.pointType = constants.point.types.CROSS;
						break;
				}
				break;
			case '-e':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					default:
						options.textColor = constants.colors.AUTO;
						break;
					case 'b':
					case 'black':
						options.textColor = constants.colors.black;
						break;
					case 'w':
					case 'white':
						options.textColor = constants.colors.white;
						break;
					case 'r':
					case 'red':
						options.textColor = constants.colors.red;
						break;
					case 'o':
					case 'orange':
						options.textColor = constants.colors.orange;
						break;
				}
				break;
			case '-f':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					case 'o':
					case 'opensans':
					default:
						options.pointFont = constants.fonts.OPENSANS;
						options.font = constants.fonts.OPENSANS;
						break;
					case 'c':
					case 'comicsans':
						options.pointFont = constants.fonts.COMICSANSMS;
						options.font = constants.fonts.COMICSANSMS;
						break;
				}
				break;
			case '-b':
				switch (process.argv[++i]) {
					case 'a':
					case 'auto':
					default:
						options.belowColor = constants.colors.AUTO;
						break;
					case 'b':
					case 'black':
						options.belowColor = constants.colors.black;
						break;
					case 'w':
					case 'white':
						options.belowColor = constants.colors.white;
						break;
				}
				break;
			case '-p':
				switch (process.argv[++i]) {
					case 'd':
					case 'default':
					default:
						options.position = constants.scale.types.BELOWCENTER;
						break;
					case 'bl':
					case 'belowleft':
						options.position = constants.scale.types.BELOWLEFT;
						break;
					case 'br':
					case 'belowright':
						options.position = constants.scale.types.BELOWRIGHT;
						break;
					case 'bc':
					case 'belowcenter':
						options.position = constants.scale.types.BELOWCENTER;
						break;
					case 'ul':
					case 'upperleft':
						options.position = constants.scale.types.UPPERLEFT;
						break;
					case 'll':
					case 'lowerleft':
						options.position = constants.scale.types.LOWERLEFT;
						break;
					case 'ur':
					case 'upperright':
						options.position = constants.scale.types.UPPERRIGHT;
						break;
					case 'lr':
					case 'lowerright':
						options.position = constants.scale.types.LOWERRIGHT;
						break;
					case 'lc':
					case 'lowercenter':
						options.position = constants.scale.types.LOWERCENTER;
						break;
				}
				break;
			default:
				for (const char of process.argv[i])
					switch (char) {
						case 'v':
							options.version = true;
							break;
						case 'h':
							options.help = true;
							break;
						case 't':
							options.scaleBarTop = true;
							break;
						case 'i':
							options.addPoints = true;
							break;
					}
				break;
		}
	} else
		dirUri = process.argv[i];
}

if (options.version)
	console.log(require('./package').version);
else {
	if (dirUri === '')
		options.help = true;

	process.env.NODE_ENV = 'production';

	if (options.help)
		help();
	else {
		dirUri = dirUri.replace(/\\/gmi, '/');
		if (!dirUri.endsWith('/'))
			dirUri = dirUri + '/';

		const directory = fs.readdirSync(dirUri, {withFileTypes: true});

		const thermos = directory.flatMap(dir => {
			if (dir.isDirectory()) {
				const files = fs.readdirSync(dirUri + dir.name, {withFileTypes: true});
				return files.filter(file => file.isFile()).map(file => {
					file.uri = dirUri + dir.name + '/' + file.name;
					if (file.name.endsWith(constants.pointShoot.fileFormats.ENTRY))
						return new PointShoot(file);

					if (file.name.endsWith(constants.extractedMap.fileFormats.ENTRY))
						return new ExtractedMap(file);
				}).filter(item => item);
			}
		}).filter(i => i);

		writeThermos(thermos, options, points).then(() => {
			console.log('All images written');
		}).catch(console.warn);
	}
}

async function writeThermos(thermos, options, points) {
	for (const thermo of thermos) {
		await thermo.createWrite(options.position, JSON.parse(JSON.stringify(options)), points);
		console.log(`Wrote ${thermo.data.name}`);
	}
}