const fs = require('fs');

const constants = require('./constants');

function help() {
	console.log('Usage: thermo-reimager [options] [directory]\n');
	console.log('Options:');
	console.log('-v, --version              \tDisplays the version information');
	console.log('-h, --help                 \tProvides this text');
	console.log('-p [pos], --position [pos] \tPosition to print the scale');
	console.log();
	console.log('Positions:');
	console.log('d, default    \tScale is Underneath the image');
	console.log('b, below      \tScale is Underneath the image');
	console.log('ul, upperleft \tScale is in the Upper Left');
	console.log('ur, upperright\tScale is in the Upper Right');
	console.log('ll, lowerleft \tScale is in the Lower Left');
	console.log('lr, loweright \tScale is in the Lower Right');
}


require('./pointshoot')().then(async Pointshoot => {
	let options = {
		help: false,
		version: false,
		position: constants.scale.types.BELOW
	};

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
				case '--position':
					switch (process.argv[++i]) {
						case 'd':
						case 'default':
						default:
							options.position = constants.scale.types.BELOW;
							break;
						case 'b':
						case 'below':
							options.position = constants.scale.types.BELOW;
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
					}
					break;
			}
		} else if (process.argv[i].startsWith('-')) {
			switch (process.argv[i]) {
				case '-p':
					switch (process.argv[++i]) {
						case 'd':
						case 'default':
						default:
							options.position = constants.scale.types.BELOW;
							break;
						case 'b':
						case 'below':
							options.position = constants.scale.types.BELOW;
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
						}
					break;
			}
		} else
			dirUri = process.argv[i];
	}

	if (dirUri === '')
		options.help = true;

	process.env.NODE_ENV = 'production';

	if (options.version)
		console.log(require('./package').version);

	if (options.help)
		help();
	else {
		dirUri = dirUri.replace(/\\/gmi, '/');
		if (!dirUri.endsWith('/'))
			dirUri = dirUri + '/';

		const directory = fs.readdirSync(dirUri, {withFileTypes: true});

		const ps = directory.flatMap(dir => {
			if (dir.isDirectory()) {
				const files = fs.readdirSync(dirUri + dir.name, {withFileTypes: true});
				return files.filter(file => file.isFile() && file.name.endsWith(constants.pointShoot.fileFormats.ENTRY)).map(entryFile => {
					entryFile.uri = dirUri + dir.name + '/' + entryFile.name;
					return new Pointshoot(entryFile);
				});
			}
		}).filter(i => i);

		for (const point of ps)
			await point.addScaleAndWrite(options.position);

		console.log('All images written');
	}
});