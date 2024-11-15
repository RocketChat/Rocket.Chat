"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ProtobufWriter = void 0;
var Singleton_1 = require("../utils/Singleton");
/// @reference https://github.com/piotr-oles/as-proto/blob/main/packages/as-proto/assembly/internal/FixedWriter.ts
var $ProtobufWriter = /** @class */ (function () {
    function $ProtobufWriter(sizer) {
        this.sizer = sizer;
        this.buf = new Uint8Array(sizer.len);
        this.view = new DataView(this.buf.buffer);
        this.ptr = 0;
        this.varlenidx = 0;
    }
    $ProtobufWriter.prototype.buffer = function () {
        return this.buf;
    };
    $ProtobufWriter.prototype.bool = function (value) {
        this.byte(value ? 1 : 0);
    };
    $ProtobufWriter.prototype.byte = function (value) {
        this.buf[this.ptr++] = value & 255;
    };
    $ProtobufWriter.prototype.int32 = function (value) {
        if (value < 0)
            this.int64(value);
        else
            this.variant32(value >>> 0);
    };
    $ProtobufWriter.prototype.sint32 = function (value) {
        this.variant32((value << 1) ^ (value >> 31));
    };
    $ProtobufWriter.prototype.uint32 = function (value) {
        this.variant32(value);
    };
    $ProtobufWriter.prototype.sint64 = function (value) {
        value = BigInt(value);
        this.variant64((value << BigInt(0x01)) ^ (value >> BigInt(0x3f)));
    };
    $ProtobufWriter.prototype.int64 = function (value) {
        this.variant64(BigInt(value));
    };
    $ProtobufWriter.prototype.uint64 = function (value) {
        this.variant64(BigInt(value));
    };
    $ProtobufWriter.prototype.float = function (val) {
        this.view.setFloat32(this.ptr, val, true);
        this.ptr += 4;
    };
    $ProtobufWriter.prototype.double = function (val) {
        this.view.setFloat64(this.ptr, val, true);
        this.ptr += 8;
    };
    $ProtobufWriter.prototype.bytes = function (value) {
        this.uint32(value.byteLength);
        for (var i = 0; i < value.byteLength; i++)
            this.buf[this.ptr++] = value[i];
    };
    $ProtobufWriter.prototype.string = function (value) {
        var len = this.varlen(); // use precomputed length
        this.uint32(len);
        var binary = utf8.get().encode(value);
        for (var i = 0; i < binary.byteLength; i++)
            this.buf[this.ptr++] = binary[i];
    };
    $ProtobufWriter.prototype.fork = function () {
        this.uint32(this.varlen()); // use precomputed length
    };
    $ProtobufWriter.prototype.ldelim = function () {
        // nothing to do - all dirty work done by sizer
    };
    $ProtobufWriter.prototype.finish = function () {
        return this.buf;
    };
    $ProtobufWriter.prototype.reset = function () {
        this.buf = new Uint8Array(this.sizer.len);
        this.view = new DataView(this.buf.buffer);
        this.ptr = 0;
        this.varlenidx = 0;
    };
    $ProtobufWriter.prototype.variant32 = function (val) {
        while (val > 0x7f) {
            this.buf[this.ptr++] = (val & 0x7f) | 0x80;
            val = val >>> 7;
        }
        this.buf[this.ptr++] = val;
    };
    $ProtobufWriter.prototype.variant64 = function (val) {
        val = BigInt.asUintN(64, val);
        while (val > BigInt(0x7f)) {
            this.buf[this.ptr++] = Number((val & BigInt(0x7f)) | BigInt(0x80));
            val = val >> BigInt(0x07);
        }
        this.buf[this.ptr++] = Number(val);
    };
    $ProtobufWriter.prototype.varlen = function () {
        return this.varlenidx >= this.sizer.varlen.length
            ? 0
            : this.sizer.varlen[this.varlenidx++];
    };
    return $ProtobufWriter;
}());
exports.$ProtobufWriter = $ProtobufWriter;
var utf8 = /** @__PURE__ */ new Singleton_1.Singleton(function () { return new TextEncoder(); });
//# sourceMappingURL=$ProtobufWriter.js.map