"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeGuardError = void 0;
var TypeGuardError = /** @class */ (function (_super) {
    __extends(TypeGuardError, _super);
    function TypeGuardError(props) {
        var _newTarget = this.constructor;
        // MESSAGE CONSTRUCTION
        var _this = _super.call(this, props.message ||
            "Error on ".concat(props.method, "(): invalid type").concat(props.path ? " on ".concat(props.path) : "", ", expect to be ").concat(props.expected)) || this;
        // INHERITANCE POLYFILL
        var proto = _newTarget.prototype;
        if (Object.setPrototypeOf)
            Object.setPrototypeOf(_this, proto);
        else
            _this.__proto__ = proto;
        // ASSIGN MEMBERS
        _this.method = props.method;
        _this.path = props.path;
        _this.expected = props.expected;
        _this.value = props.value;
        return _this;
    }
    return TypeGuardError;
}(Error));
exports.TypeGuardError = TypeGuardError;
//# sourceMappingURL=TypeGuardError.js.map