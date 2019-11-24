const constants = require('./newConstants.json');

function resolveName(input, refs = []) {
	let parse = undefined;
	const path = input.split('/');
	input = path.pop();

	if (input) {
		if (input.startsWith('*')) {
			parse = 'endsWith';
			input = input.slice(1);
		} else if (input.endsWith('*')) {
			parse = 'startsWith';
			input = input.slice(0, input.length - 1);
		}

		for (const [type, value] of refs)
			input = input.replace(new RegExp(`(<${type}>)`, 'g'), value);
	}

	return {parse, name: path.join('/') + input};
}

class FileSet {
	constructor() {
		this.files = new Map();
	}

	getFiles() {
		return this.files;
	}

	getType(type) {
		return this.files.get(type);
	}

	findFile(name, type=undefined) {
		if (type) {
			const easy = this.files.get(type).get(name);
			if (easy)
				return easy;

			for (const [, file] of this.files.get(type))
				if (file.getName() === name)
					return file;
		} else {
			for (const [, files] of this.files)
				if (files.has(name))
					return files.get(name);
		}
	}

	resolve(type, file) {
		let resolvedType = this.files.get(type);
		if (resolvedType === undefined) {
			resolvedType = new Map();
			this.files.set(type, resolvedType);
		}

		resolvedType.set(file.getFullName(), file);
	}
}

module.exports = class InputStructure {
	constructor(structure) {
		this.types = new Map();
		this.baseTypes = [];
		this.needTypes = [];
		this.useTypes = [];
		this.useFakeTypes = [];

		for (const {type, file, req} of structure) {
			this.types.set(type, require(__dirname + file));

			for (const {ext, needs, uses} of req) {
				if (ext === undefined)
					this.useFakeTypes.push({
						type,
						needs,
						uses: uses.map(str => {
							const [type, filename] = str.split(':');
							return {
								type,
								filename
							};
						}), resolvesIn: Infinity
					});
				else {
					let parse = undefined;
					if (ext.startsWith('*'))
						parse = 'endsWith';
					else if (ext.endsWith('*'))
						parse = 'startsWith';

					if (needs && needs.length > 0) {
						if (uses && uses.length > 0)
							this.useTypes.push({
								parse, ext: ext.replace(/\*/, ''), type, needs, uses: uses.map(str => {
									const [type, filename] = str.split(':');
									return {
										type,
										filename
									};
								})
							});
						else
							this.needTypes.push({parse, ext: ext.replace(/\*/, ''), type, needs});
					} else if (uses && uses.length > 0)
						this.useTypes.push({
							parse, ext: ext.replace(/\*/, ''), type, uses: uses.map(str => {
								const [type, filename] = str.split(':');
								return {
									type,
									filename
								};
							})
						});
					else
						this.baseTypes.push({parse, ext: ext.replace(/\*/, ''), type});
				}
			}
		}

		this.needTypes.sort(({needs: needs1}, {needs: needs2}) => needs1.length - needs2.length);

		let resolved = new Map(this.baseTypes.concat(this.needTypes).map(e => [e.type, 1]));
		let useTypes = new Map(this.useTypes.map(e => [e.type, e.uses.map(({type}) => type)]));
		const resolve = (lastType, type) => {
			if (resolved.has(type))
				return resolved.get(type);
			else if (!useTypes.has(type))
				throw `Unknown type ${type.type} required by ${lastType}`;
			useTypes.get(type).map(resolve.bind(this, type));
		};

		this.useTypes.sort(({type: type1, uses: uses1}, {type: type2, uses: uses2}) => {
			let resolve1 = 0;
			let resolve2 = 0;

			if (!resolved.has(type1)) {
				resolve1 = uses1.map(({type}) => type).reduce(resolve.bind(this, type1));
				resolved.set(type1, resolve1);
			} else
				resolve1 = resolved.get(type1);

			if (!resolved.has(type2)) {
				resolve2 = uses2.map(({type}) => type).reduce(resolve.bind(this, type2));
				resolved.set(type2, resolve2);
			} else
				resolve2 = resolved.get(type2);

			return resolve1 + resolve2;
		});
	}

	process(reimager, files, subDirs = new Map()) {
		let resolved = new FileSet();

		const getRequiredFile = (name, type, str, prependName = true) => {
			if (str) {
				const location = str.split('/').filter(e => e);
				if (location.length === 1)
					return resolved.findFile(`${prependName ? `${name.split('.')[0]}.` : ''}${location[0]}`, prependName ? undefined : type);
				else {
					let file = subDirs.get(location.pop());
					while (location.length > 1)
						file = file.getSubDirectory(location);

					return file.getFile(file.name, type);
				}
			} else
				return resolved.findFile(name.split('.')[0], type);
		};

		for (const {parse, ext, type} of this.baseTypes) {
			const typeConstructor = this.types.get(type);
			for (const {uri} of files.filter(({name}) => (parse === undefined) ? (name.split('.').pop().toLowerCase() === ext) : (name.toLowerCase()[parse](ext))))
				try {
					resolved.resolve(type, new typeConstructor(uri, reimager));
				} catch (err) {
				}
		}

		for (const {parse, ext, type, needs} of this.needTypes) {
			const typeConstructor = this.types.get(type);
			for (const {name, uri} of files.filter(({name}) => (parse === undefined) ? (name.split('.').pop().toLowerCase() === ext) : (name.toLowerCase()[parse](ext))))
				try {
					resolved.resolve(type, new typeConstructor(uri, reimager,
						needs.map(str => getRequiredFile(name, type, str))
					));
				} catch (err) {
				}
		}

		for (const {parse, ext, type, needs = [], uses} of this.useTypes) {
			const typeConstructor = this.types.get(type);
			for (let {name, uri} of files.filter(({name}) => (parse === undefined) ? (name.split('.').pop().toLowerCase() === ext) : (name.toLowerCase()[parse](ext))))
				try {
					resolved.resolve(type, new typeConstructor(uri, reimager,
						needs.map(str => getRequiredFile(name, type, str)),
						uses.map(({type, filename: str}) => getRequiredFile(name, type, str, false))
					));
				} catch (err) {
				}
		}

		for (const {type, uses} of this.useFakeTypes)
			try {
				const typeConstructor = this.types.get(type);

				if (uses.length === 1) {
					const potential = resolved.getType(uses[0].type);
					if (potential === undefined)
						continue;
					if (uses[0].filename) {
						for (const [name, data] of potential)
							if (name === uses[0].filename)
								resolved.resolve(type, new typeConstructor(data.getDirectoryUri(), reimager, [data]));
					} else
						for (const [, data] of potential)
							resolved.resolve(type, new typeConstructor(data.getDirectoryUri(), reimager, [data]));
				} else
					for (const [, data] of resolved.getType(uses[0].type)) {
						const {parse, name} = resolveName(uses[1].filename, [[uses[0].type, data.getName()]]);

						let wantedFiles = [];

						for (const [, files] of resolved.getFiles())
							for (const [, otherData] of files)
								if (parse === undefined) {
									if (otherData.getName() === name)
										wantedFiles.push(otherData);
								} else if (otherData.getName()[parse](name))
									wantedFiles.push(otherData);

						resolved.resolve(type, new typeConstructor(data.getDirectoryUri(), reimager, [data, wantedFiles]));
					}
			} catch (err) {
			}

		return resolved;
	}
};