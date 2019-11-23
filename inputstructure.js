const constants = require('./newConstants.json');

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
								}), resolvesIn: Infinity
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
							}), resolvesIn: Infinity
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

			return resolve1 - resolve2;
		});
	}

	process(reimager, files, subDirs = new Map()) {
		let resolved = new Map();

		const resolveFile = (type, file) => {
			let resolvedType = resolved.get(type);
			if (resolvedType === undefined) {
				resolvedType = new Map();
				resolved.set(type, resolvedType);
			}

			resolvedType.set(file.getFullName(), file);
		};

		const findFile = (name, type) => {
			if (type) {
				const easy = resolved.get(type).get(name);
				if (easy)
					return easy;

				for (const [, file] of resolved.get(type))
					if (file.getName() === name)
						return file;
			} else {
				for (const [, files] of resolved)
					if (files.has(name))
						return files.get(name);
			}
		};

		const getRequiredFile = (name, type, str, prependName = true) => {
			if (str) {
				const location = str.split('/').filter(e => e);
				if (location.length === 1) {
					return findFile(`${prependName ? `${name.split('.')[0]}.` : ''}${location[0]}`, prependName ? undefined : type);
				} else {
					let file = subDirs.get(location.pop());
					while (location.length > 1)
						file = file.getSubDirectory(location);

					return file.getFile(file.name, type);
				}
			} else {
				return findFile(name.split('.')[0], type);
			}
		};

		for (const {parse, ext, type} of this.baseTypes) {
			const typeConstructor = this.types.get(type);
			for (const file of files.filter(({name}) => (parse === undefined) ? (name.split('.').pop() === ext) : (name[parse](ext))))
				try {
					resolveFile(type, new typeConstructor(file.uri, reimager));
				} catch (err) {
				}
		}

		for (const {parse, ext, type, needs} of this.needTypes) {
			const typeConstructor = this.types.get(type);
			for (const file of files.filter(({name}) => (parse === undefined) ? (name.split('.').pop() === ext) : (name[parse](ext))))
				try {
					resolveFile(type, new typeConstructor(file.uri, reimager,
						needs.map(str => getRequiredFile(file.name, type, str))
					));
				} catch (err) {
				}
		}

		for (const {parse, ext, type, needs = [], uses} of this.useTypes) {
			const typeConstructor = this.types.get(type);
			for (const file of files.filter(({name}) => (parse === undefined) ? (name.split('.').pop() === ext) : (name[parse](ext))))
				try {
					resolveFile(type, new typeConstructor(file.uri, reimager,
						needs.map(str => getRequiredFile(file.name, type, str)),
						uses.map(({type, filename: str}) => getRequiredFile(file.name, type, str, false))
					));
				} catch (err) {
				}
		}

		for (const {type, needs = [], uses} of this.useFakeTypes) {
			const typeConstructor = this.types.get(type);

			if (uses.length === 1) {
				const potential = resolved.get(uses[0].type);
				if (uses[0].filename !== '') {
					for (const [name, data] of potential)
						if (name === uses[0].filename)
							resolveFile(type, new typeConstructor(data.getDirectoryUri(), reimager, [data]));
				} else
					for (const [, data] of potential)
						resolveFile(type, new typeConstructor(data.getDirectoryUri(), reimager, [data]));
			} else {
				for (const [usesType, data] of resolved.get(uses[0].type)) {
					let filename = (uses[1].filename === '' || uses[1].filename === undefined) ? data.getName() : uses[1].filename.replace(new RegExp(`(<${usesType}>)`, 'g'), data.getName());
					let parse = undefined;

					if (uses[1].filename)
						if (uses[1].filename.startsWith('*')) {
							parse = 'endsWith';
							filename = filename.slice(1);
						} else if (uses[1].filename.endsWith('*')) {
							parse = 'startsWith';
							filename = filename.slice(0, filename.length - 1)
						}

					let wantedFiles = [];

					for (const [, files] of resolved)
						for (const [, otherData] of files) {
							if (parse === undefined) {
								if (otherData.getName() === filename)
									wantedFiles.push(otherData);
							} else if (otherData.getName()[parse](filename))
								wantedFiles.push(otherData);
						}

					resolveFile(type, new typeConstructor(data.getDirectoryUri(), reimager, [data, wantedFiles]));
				}
			}
		}

		return resolved;
	}
};