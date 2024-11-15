"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInitialValue = void 0;
const hasInitialValue = (element) => 'initialValue' in element;
const hasInitialTime = (element) => 'initialTime' in element;
const hasInitialDate = (element) => 'initialDate' in element;
const hasInitialOption = (element) => 'initialOption' in element;
const hasInitialOptions = (element) => 'initialOptions' in element;
const getInitialValue = (element) => (hasInitialValue(element) && element.initialValue) ||
    (hasInitialTime(element) && element.initialTime) ||
    (hasInitialDate(element) && element.initialDate) ||
    (hasInitialOption(element) && element.initialOption.value) ||
    (hasInitialOptions(element) &&
        element.initialOptions.map((option) => option.value)) ||
    undefined;
exports.getInitialValue = getInitialValue;
//# sourceMappingURL=getInitialValue.js.map