const fs = require('fs').promises;

const constants = require('../newConstants.json');
const InputStructure = require('../inputstructure.js');

module.exports = class Directory {
	constructor({uri, stats, name}, reimager, inputStructure = new InputStructure(constants.inputStructures)) {
		let nameTest = name ? [name] : uri.split('/');
		if (nameTest[nameTest.length - 1].length === 0)
			nameTest.pop();

		this.data = {
			uri: uri.endsWith('/') ? uri : uri + '/',
			dirName: nameTest.pop(),
			stats,
			reimager,
			files: undefined,
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

	resolveSomeDirectory(path) {
		if (!Array.isArray(path))
			path = path.split('/').filter(e => e);

		if (path.length >= 1) {
			const subDir = this.getSubDirectory(path.shift());
			if (subDir && path.length !== 0)
				return subDir.resolveSomeDirectory(path);
			return subDir;
		}
	}

	resolveSomeFile(path, type) {
		if (!Array.isArray(path))
			path = path.split('/').filter(e => e);
		const file = path.pop();
		let dir = this;

		if (path.length !== 0)
			dir = this.resolveSomeDirectory(path);

		if (dir !== undefined)
			return dir.getFile(file, type);
	}

	getFile(name, type) {
		if (this.data.files)
			return this.data.files.findFile(name, type);
	}

	getAllSubFiles(type) {
		if (Array.isArray(type))
			return type.flatMap(this.getAllSubFiles.bind(this));

		let files = this.getFiles(type);

		if (files)
			files = Array.from(files.values());
		else
			files = [];

		if (type === undefined)
			files = files.flatMap(e => Array.from(e.values()));

		return Array.from(files).concat(Array.from(this.getSubDirectories().values()).flatMap(dir => dir.getAllSubFiles(type)));
	}

	async refresh() {
		const {files, dirs} = (await Promise.all((await fs.readdir(this.getUri()))
		.map(async name => {
			try {
				const uri = `${this.getUri()}${name}`;
				return {
					name,
					uri,
					stats: await fs.stat(uri)
				};
			} catch (err) {
			}
		})))
		.filter(file => {
			if (file) {
				const existingFile = this.getFile(file.name);
				if (existingFile === undefined || existingFile.getModifiedTime() < file.stats.mtimeMs)
					return true;
			}
		})
		.reduce((data, file) => {
			if (file.stats.isFile())
				data.files.push(file);
			else if (file.stats.isDirectory())
				data.dirs.push(file);
			return data;
		}, {files: [], dirs: []});

		const subDirs = await Promise.all(dirs.map(dir => (new Directory(dir, this.data.reimager, this.data.inputStructure)).refresh()));

		this.data.subDirs = new Map(subDirs.map(dir => [dir.getName(), dir]));

		this.data.files = await this.data.inputStructure.process(this.data.reimager, files, this.data.subDirs);

		return this;
	}
};
