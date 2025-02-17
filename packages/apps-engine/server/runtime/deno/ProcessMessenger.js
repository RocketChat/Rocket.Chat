"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessMessenger = void 0;
const codec_1 = require("./codec");
class ProcessMessenger {
    constructor(debug) {
        this.debug = debug;
        this._sendStrategy = this.strategyError;
    }
    get send() {
        return this._sendStrategy.bind(this);
    }
    setReceiver(deno) {
        this.deno = deno;
        this.switchStrategy();
    }
    clearReceiver() {
        delete this.deno;
        delete this.encoder;
        this.switchStrategy();
    }
    switchStrategy() {
        var _a, _b;
        if ((_b = (_a = this.deno) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.writable) {
            this._sendStrategy = this.strategySend.bind(this);
            // Get a clean encoder
            this.encoder = (0, codec_1.newEncoder)();
        }
        else {
            this._sendStrategy = this.strategyError.bind(this);
        }
    }
    strategyError(_message) {
        throw new Error('No process configured to receive a message');
    }
    strategySend(message) {
        this.debug('Sending message to subprocess %o', message);
        this.deno.stdin.write(this.encoder.encode(message));
    }
}
exports.ProcessMessenger = ProcessMessenger;
//# sourceMappingURL=ProcessMessenger.js.map