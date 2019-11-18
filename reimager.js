const Canvas = require('canvas');

const NodeCanvas = require('./canvas/nodecanvasmodule.js');
const CanvasRoot = require('./canvas/canvasroot.js');

const Directory = require('./models/directory.js');
const PFEDir = require('./directories/pfe.js');

module.exports = class ReImager {
    constructor(canvas=new CanvasRoot(new NodeCanvas(Canvas)), maxCanvases=1) {
        this.data = {
            canvas,
            maxCanvases
        };

        canvas.init();
    }

    async initializeDir(uri) {

    }
};