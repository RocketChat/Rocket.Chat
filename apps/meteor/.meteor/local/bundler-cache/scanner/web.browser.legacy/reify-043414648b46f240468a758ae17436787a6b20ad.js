"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ProtobufSizer = void 0;
var _strlen_1 = require("./$strlen");
/// @reference https://github.com/piotr-oles/as-proto/blob/main/packages/as-proto/assembly/internal/FixedSizer.ts
var $ProtobufSizer = /** @class */ (function () {
    function $ProtobufSizer(length) {
        if (length === void 0) { length = 0; }
        this.len = length;
        this.pos = [];
        this.varlen = [];
        this.varlenidx = [];
    }
    $ProtobufSizer.prototype.bool = function () {
        this.len += 1;
    };
    $ProtobufSizer.prototype.int32 = function (value) {
        if (value < 0) {
            // 10 bytes to encode negative number
            this.len += 10;
        }
        else {
            this.varint32(value);
        }
    };
    $ProtobufSizer.prototype.sint32 = function (value) {
        this.varint32((value << 1) ^ (value >> 31));
    };
    $ProtobufSizer.prototype.uint32 = function (value) {
        this.varint32(value);
    };
    $ProtobufSizer.prototype.int64 = function (value) {
        this.varint64(typeof value === "number" ? BigInt(value) : value);
    };
    $ProtobufSizer.prototype.sint64 = function (value) {
        if (typeof value === "number")
            value = BigInt(value);
        this.varint64((value << BigInt(1)) ^ (value >> BigInt(63)));
    };
    $ProtobufSizer.prototype.uint64 = function (value) {
        this.varint64(typeof value === "number" ? BigInt(value) : value);
    };
    // public fixed32(_value: number): void {
    //     this.len += 4;
    // }
    // public sfixed32(_value: number): void {
    //     this.len += 4;
    // }
    // public fixed64(_value: number | bigint): void {
    //     this.len += 8;
    // }
    // public sfixed64(_value: number | bigint): void {
    //     this.len += 8;
    // }
    $ProtobufSizer.prototype.float = function (_value) {
        this.len += 4;
    };
    $ProtobufSizer.prototype.double = function (_value) {
        this.len += 8;
    };
    $ProtobufSizer.prototype.bytes = function (value) {
        this.uint32(value.byteLength);
        this.len += value.byteLength;
    };
    $ProtobufSizer.prototype.string = function (value) {
        var len = (0, _strlen_1.$strlen)(value);
        this.varlen.push(len);
        this.uint32(len);
        this.len += len;
    };
    $ProtobufSizer.prototype.fork = function () {
        this.pos.push(this.len); // save current position
        this.varlenidx.push(this.varlen.length); // save current index in varlen array
        this.varlen.push(0); // add 0 length to varlen array (to be updated in ldelim())
    };
    $ProtobufSizer.prototype.ldelim = function () {
        if (!(this.pos.length && this.varlenidx.length))
            throw new Error("Error on typia.protobuf.encode(): missing fork() before ldelim() call.");
        var endPos = this.len; // current position is end position
        var startPos = this.pos.pop(); // get start position from stack
        var idx = this.varlenidx.pop(); // get varlen index from stack
        var len = endPos - startPos; // calculate length
        this.varlen[idx] = len; // update variable length
        this.uint32(len); // add uint32 that should be called in fork()
    };
    $ProtobufSizer.prototype.reset = function () {
        this.len = 0;
        // re-use arrays
        this.pos.length = 0;
        this.varlen.length = 0;
        this.varlenidx.length = 0;
    };
    $ProtobufSizer.prototype.varint32 = function (value) {
        this.len +=
            value < 0
                ? 10 // 10 bits with leading 1's
                : value < 0x80
                    ? 1
                    : value < 0x4000
                        ? 2
                        : value < 0x200000
                            ? 3
                            : value < 0x10000000
                                ? 4
                                : 5;
    };
    $ProtobufSizer.prototype.varint64 = function (val) {
        val = BigInt.asUintN(64, val);
        while (val > BigInt(0x7f)) {
            ++this.len;
            val = val >> BigInt(0x07);
        }
        ++this.len;
    };
    return $ProtobufSizer;
}());
exports.$ProtobufSizer = $ProtobufSizer;
//# sourceMappingURL=$ProtobufSizer.js.map