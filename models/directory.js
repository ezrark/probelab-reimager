const fs = require('fs').promises;

const constants = require('../newConstants.json');
const GeneralFile = require('./file.js');
const ThermoInfo = require('../files/thermoinfo.js');
const MSA = require('../files/msa.js');
const Layer = require('../files/layer.js');
const InputStructure = require('../inputstructure.js');

module.exports = class Directory {
	constructor(uri, reimager, inputStructure = new InputStructure(constants.inputStructures)) {
		this.data = {
			uri,
			reimager,
			files: new Map(),
			subDirs: new Map(),
			inputStructure
		};
	}

	getFullName() {
		return this.data.uri.split('/').pop();
	}

	getName() {
		return this.data.uri.split('/').pop();
	}

	getUri() {
		return this.data.uri;
	}

	getFiles() {
		return this.data.files;
	}

	getImages() {
		return this.data.images;
	}

	getAllImages() {
		return Array.from(this.getSubDirectories().values()).flatMap(dir =>
			dir.getAllImages()
		);
	}

	getSubDirectories() {
		return this.data.subDirs;
	}

	getSubDirectory(name) {
		return this.data.subDirs.get(name);
	}

	getFile(name, type) {
		if (type)
			return this.data.files.get(type).get(name);

		for (const [, files] of this.data.files)
			if (files.has(name))
				return files.get(name);
	}

	getImage(name) {
		return this.data.images.get(name);
	}

	async refresh() {
		const {files, dirs} = await fs.readdir(this.getUri(), {
			withFileTypes: true
		}).reduce((data, file) => {
			if (file.isFile())
				data.files.push(file);
			else if (file.isDirectory())
				data.dirs.push(file);
			return data;
		}, {files: [], dirs: []});

		this.data.subDirs = new Map(dirs.map(dir => [
			dir.name,
			new Directory(`${this.data.uri}/${dir.name}`, this.data.reimager)
		]));

		this.data.files = await this.data.inputStructure.process(files, this.data.subDirs);
	}
};
