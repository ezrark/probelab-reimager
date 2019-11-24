const fs = require('fs').promises;

const constants = require('../newConstants.json');
const InputStructure = require('../inputstructure.js');

module.exports = class Directory {
	constructor(uri, reimager, inputStructure = new InputStructure(constants.inputStructures)) {
		let nameTest = uri.split('/');
		if (nameTest[nameTest.length - 1].length === 0)
			nameTest.pop();

		this.data = {
			uri: uri.endsWith('/') ? uri : uri + '/',
			dirName: nameTest.pop(),
			reimager,
			files: new Map(),
			subDirs: new Map(),
			inputStructure
		};
	}

	getFullName() {
		return this.data.dirName;
	}

	getName() {
		return this.data.dirName;
	}

	getUri() {
		return this.data.uri;
	}

	getFiles(type) {
		if (type)
			return this.data.files.getType(type);
		return this.data.files.getFiles();
	}

	getSubDirectories() {
		return this.data.subDirs;
	}

	getSubDirectory(name) {
		return this.data.subDirs.get(name);
	}

	getFile(name, type) {
		this.data.files.findFile(name, type);
	}

	getAllSubFiles(type) {
		try {
			let files = Array.from(this.getFiles(type).values());
			try {
				if (files.length > 0)
					files = files.flatMap(e => Array.from(e.values()));
			} catch(err) {
			}

			return Array.from(files.values()).map(file => file.getUri())
			.concat(Array.from(this.getSubDirectories().values()).flatMap(dir => dir.getAllSubFiles(type)));
		} catch (err) {
		}

		return Array.from(this.getSubDirectories().values()).flatMap(dir => dir.getAllSubFiles(type));
	}

	async refresh() {
		const {files, dirs} = (await fs.readdir(this.getUri(), {
			withFileTypes: true
		}))
		.map(file => {
			file.uri = `${this.getUri()}${file.name}`;
			return file;
		})
		.reduce((data, file) => {
			if (file.isFile())
				data.files.push(file);
			else if (file.isDirectory())
				data.dirs.push(file);
			return data;
		}, {files: [], dirs: []});

		const subDirs = await Promise.all(dirs.map(dir => (new Directory(`${this.data.uri}${dir.name}`, this.data.reimager, this.data.inputStructure)).refresh()));

		this.data.subDirs = new Map(subDirs.map(dir => [dir.getName(), dir]));

		this.data.files = await this.data.inputStructure.process(this.data.reimager, files, this.data.subDirs);

		return this;
	}
};
