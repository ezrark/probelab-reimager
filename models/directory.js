const fs = require('fs').promises;

const GeneralFile = require('./file.js');

module.exports = class Directory {
    constructor(uri, reimager) {
        this.data = {
            uri,
            reimager,
            files: new Map(),
            subDirs: new Map()
        };
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

    async refresh() {
        const { files, dirs } = await fs.readdir(this.getUri(), {
            withFileTypes: true
        }).reduce((data, file) => {
            if (file.isFile())
                data.files.push(file);
            else if (file.isDirectory())
                data.dirs.push(file);
            return data;
        }, { files: [], dirs: [] });

        this.data.subDirs = new Map(dirs.map(dir => [
            dir.name,
            new Directory(`${this.data.uri}/${dir.name}`, this.data.reimager)
        ]));

        this.data.files = files.map(file => {
            switch(file.name.split('.').pop()) {
                default:
                    return [file.name, new GeneralFile(`${this.getUri()}/${file.name}`, this.data.reimager)];
                case 'psmsa':
                case 'emsa':
                    return [file.name, new MSAFile(`${this.getUri()}/${file.name}`, this.data.reimager)];
                case 'p_s':
                    return [file.name, new ThermoInfo(`${this.getUri()}/${file.name}`, this.data.reimager)];
                case 'txt':
                    return [file.name, new JeolText(`${this.getUri()}/${file.name}`, this.data.reimager)];
                case 'mdb':
                    return [file.name, new PFEMDB(`${this.getUri()}/${file.name}`, this.data.reimager)];
                case 'layer':
                    return [file.name, new Layer(`${this.getUri()}/${file.name}`, this.data.reimager)];
                case 'simcs':
                    return [file.name, new ElementMap(`${this.getUri()}/${file.name}`, this.data.reimager)];
            }
        });
    }
};
