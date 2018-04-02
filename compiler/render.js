'use strict';
const velocity = require('velocityjs');

class Render {
    constructor(vm, data) {
        this.vm = vm;
        this.data = data;
    }

    getOutput() {
        return velocity.render(this.vm, this.data, null, {
            escape: false
        });
    }
}

module.exports = Render;
