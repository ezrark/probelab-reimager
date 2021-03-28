const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');

const {v4} = require('../generateuuid.js');

fs.existsSync('./mdb-sql');

class MdbSql {
	constructor(conn) {
		this.data = {
			conn,
			closed: false,
			onClosed: [],
			onData: {},
			commands: [],
			data: '',
			activeId: undefined
		};

		conn.stdout.on('data', data => {
			if (this.data.onData[this.data.activeId]) {
				this.data.data += data.toString();
				if (data.toString().endsWith('retrieved\n')) {
					const id = this.data.activeId;
					this.data.activeId = undefined;
					data = this.data.data;
					this.data.data = '';
					try {
						const lines = data.split('\n').map(i => i.split('\t')).slice(1, -2);
						const headers = lines.shift();

						this.data.onData[id][0](lines.map(item => {
							let finalItem = {};

							for (let i = 0; i < headers.length; i++) {
								let value = item[i];
								try {
									value = parseFloat(item[i]);
									if (isNaN(value))
										value = item[i];
								} catch (e) {}

								finalItem[headers[i]] = value;
							}

							return finalItem;
						}));
					} catch (err) {
						this.data.onData[id][0]([]);
					}
					delete this.data.onData[id];
				}
			}
		});

		conn.stderr.on('data', data => {
			if (!data.toString().startsWith('Calling mdb_test_sarg'))
				if (this.data.onData[this.data.activeId]) {
					this.data.onData[this.data.activeId][1](data.toString());
					delete this.data.onData[this.data.activeId];
				} else {
					this.close();
				}
		});

		conn.on('close', () => {
			this.data.closed = true;
			for (const func of this.data.onClosed)
				func();
			this.data.onClosed = [];
		});
	}

	next() {
		if (this.data.activeId === undefined && this.data.commands.length > 0) {
			const command = this.data.commands.shift();
			this.data.activeId = command.id;

			this.data.conn.stdin.write(command.command);
		}
	}

	get isClosed() {
		return this.data.closed;
	}

	query(command) {
		if (this.isClosed)
			throw new Error('not connected to database');

		const id = v4();

		let sanitizedCommand = command.replace(/[\[\]]/g, '')//.replace(/([-.e+\d]+)(?= <?>?=?=)/g, `'$1'`);

		return new Promise((resolve, reject) => {
			this.data.onData[id] = [i => {
				resolve(i);
				this.next();
			}, i => {
				reject(i);
				this.next();
			}];

			this.data.commands.push({
				id,
				command: sanitizedCommand + '\ngo\n'
			});
			this.next();
		});
	}

	close() {
		if (this.isClosed)
			return Promise.resolve();

		return new Promise(resolve => {
			this.data.onClosed.push(resolve);
			this.data.conn.kill();
		});
	}
}

module.exports = {
	open: settings => {
		return new MdbSql(spawn(path.join(__dirname, 'mdb-sql'), ['-P', path.resolve(settings.Database)], {
			stdio: 'pipe',
			env: {
				LD_LIBRARY_PATH: path.resolve('./external/.libs')
			}
		}));
	}
};