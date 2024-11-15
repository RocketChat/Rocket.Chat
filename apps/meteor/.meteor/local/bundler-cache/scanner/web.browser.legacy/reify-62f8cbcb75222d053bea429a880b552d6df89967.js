"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guessTimezone = exports.guessTimezoneFromOffset = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const padOffset = (offset) => {
    const numberOffset = Number(offset);
    const absOffset = Math.abs(numberOffset);
    const isNegative = !(numberOffset === absOffset);
    return `${isNegative ? '-' : '+'}${absOffset < 10 ? `0${absOffset}` : absOffset}:00`;
};
const guessTimezoneFromOffset = (offset) => moment_timezone_1.default.tz.names().find((tz) => padOffset(offset) === moment_timezone_1.default.tz(tz).format('Z').toString()) || moment_timezone_1.default.tz.guess();
exports.guessTimezoneFromOffset = guessTimezoneFromOffset;
const guessTimezone = () => moment_timezone_1.default.tz.guess();
exports.guessTimezone = guessTimezone;
//# sourceMappingURL=timezone.js.map