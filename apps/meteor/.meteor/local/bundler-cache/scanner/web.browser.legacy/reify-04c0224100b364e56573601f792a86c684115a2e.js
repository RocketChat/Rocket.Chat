"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ProtobufReader = void 0;
var Singleton_1 = require("../utils/Singleton");
/// @reference https://github.com/piotr-oles/as-proto/blob/main/packages/as-proto/assembly/internal/FixedReader.ts
var $ProtobufReader = /** @class */ (function () {
    function $ProtobufReader(buf) {
        this.buf = buf;
        this.ptr = 0;
        this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    $ProtobufReader.prototype.index = function () {
        return this.ptr;
    };
    $ProtobufReader.prototype.size = function () {
        return this.buf.length;
    };
    $ProtobufReader.prototype.uint32 = function () {
        return this.varint32();
    };
    $ProtobufReader.prototype.int32 = function () {
        return this.varint32();
    };
    $ProtobufReader.prototype.sint32 = function () {
        var value = this.varint32();
        return (value >>> 1) ^ -(value & 1);
    };
    $ProtobufReader.prototype.uint64 = function () {
        return this.varint64();
    };
    $ProtobufReader.prototype.int64 = function () {
        return this.varint64();
    };
    $ProtobufReader.prototype.sint64 = function () {
        var value = this.varint64();
        return (value >> BigInt(0x01)) ^ -(value & BigInt(0x01));
    };
    $ProtobufReader.prototype.bool = function () {
        return this.varint32() !== 0;
    };
    $ProtobufReader.prototype.float = function () {
        var value = this.view.getFloat32(this.ptr, true);
        this.ptr += 4;
        return value;
    };
    $ProtobufReader.prototype.double = function () {
        var value = this.view.getFloat64(this.ptr, true);
        this.ptr += 8;
        return value;
    };
    $ProtobufReader.prototype.bytes = function () {
        var length = this.uint32();
        var from = this.ptr;
        this.ptr += length;
        return this.buf.subarray(from, from + length);
    };
    $ProtobufReader.prototype.string = function () {
        return utf8.get().decode(this.bytes());
    };
    $ProtobufReader.prototype.skip = function (length) {
        if (length === 0)
            while (this.u8() & 0x80)
                ;
        else {
            if (this.index() + length > this.size())
                throw new Error("Error on typia.protobuf.decode(): buffer overflow.");
            this.ptr += length;
        }
    };
    $ProtobufReader.prototype.skipType = function (wireType) {
        switch (wireType) {
            case 0 /* ProtobufWire.VARIANT */:
                this.skip(0);
                break;
            case 1 /* ProtobufWire.I64 */:
                this.skip(8);
                break;
            case 2 /* ProtobufWire.LEN */:
                this.skip(this.uint32());
                break;
            case 3 /* ProtobufWire.START_GROUP */:
                while ((wireType = this.uint32() & 0x07) !== 4 /* ProtobufWire.END_GROUP */)
                    this.skipType(wireType);
                break;
            case 5 /* ProtobufWire.I32 */:
                this.skip(4);
                break;
            default:
                throw new Error("Invalid wire type ".concat(wireType, " at offset ").concat(this.ptr, "."));
        }
    };
    $ProtobufReader.prototype.varint32 = function () {
        var loaded;
        var value;
        value = (loaded = this.u8()) & 0x7f;
        if (loaded < 0x80)
            return value;
        value |= ((loaded = this.u8()) & 0x7f) << 7;
        if (loaded < 0x80)
            return value;
        value |= ((loaded = this.u8()) & 0x7f) << 14;
        if (loaded < 0x80)
            return value;
        value |= ((loaded = this.u8()) & 0x7f) << 21;
        if (loaded < 0x80)
            return value;
        value |= ((loaded = this.u8()) & 0xf) << 28;
        if (loaded < 0x80)
            return value;
        // increment position until there is no continuation bit or until we read 10 bytes
        if (this.u8() < 0x80)
            return value;
        if (this.u8() < 0x80)
            return value;
        if (this.u8() < 0x80)
            return value;
        if (this.u8() < 0x80)
            return value;
        if (this.u8() < 0x80)
            return value;
        return value;
    };
    $ProtobufReader.prototype.varint64 = function () {
        var loaded;
        var value;
        value = (loaded = this.u8n()) & BigInt(0x7f);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(7);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(14);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(21);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(28);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(35);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(42);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(49);
        if (loaded < BigInt(0x80))
            return value;
        value |= ((loaded = this.u8n()) & BigInt(0x7f)) << BigInt(56);
        if (loaded < BigInt(0x80))
            return value;
        value |= (this.u8n() & BigInt(0x01)) << BigInt(63);
        return BigInt.asIntN(64, value);
    };
    $ProtobufReader.prototype.u8 = function () {
        return this.view.getUint8(this.ptr++);
    };
    $ProtobufReader.prototype.u8n = function () {
        return BigInt(this.u8());
    };
    return $ProtobufReader;
}());
exports.$ProtobufReader = $ProtobufReader;
var utf8 = /** @__PURE__ */ new Singleton_1.Singleton(function () { return new TextDecoder("utf-8"); });
//# sourceMappingURL=$ProtobufReader.js.map