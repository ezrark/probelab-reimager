module.exports = class GeneralFile {
    constructor(uri, reimager) {
        this.data = {
            uri,
            extension: uri.split('.').pop(),
            name: uri.split('/').pop(),
            reimager
        }
    }

    getUri() {
        return this.data.uri;
    }

    getExtension() {
        return this.data.extension;
    }

    getName() {
        return this.data.name;
    }

    getData() {

    }
};