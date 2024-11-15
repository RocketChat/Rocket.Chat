var $jaqU8$reactariautils = require("@react-aria/utils");
var $jaqU8$reactarialabel = require("@react-aria/label");
var $jaqU8$reactariai18n = require("@react-aria/i18n");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useProgressBar", () => $c6bb999a3b4eb4f3$export$ed5abd763a836edc);
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ /*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


function $c6bb999a3b4eb4f3$export$ed5abd763a836edc(props) {
    let { value: value = 0 , minValue: minValue = 0 , maxValue: maxValue = 100 , valueLabel: valueLabel , isIndeterminate: isIndeterminate , formatOptions: formatOptions = {
        style: "percent"
    }  } = props;
    let domProps = (0, $jaqU8$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    let { labelProps: labelProps , fieldProps: fieldProps  } = (0, $jaqU8$reactarialabel.useLabel)({
        ...props,
        // Progress bar is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: "span"
    });
    value = (0, $jaqU8$reactariautils.clamp)(value, minValue, maxValue);
    let percentage = (value - minValue) / (maxValue - minValue);
    let formatter = (0, $jaqU8$reactariai18n.useNumberFormatter)(formatOptions);
    if (!isIndeterminate && !valueLabel) {
        let valueToFormat = formatOptions.style === "percent" ? percentage : value;
        valueLabel = formatter.format(valueToFormat);
    }
    return {
        progressBarProps: (0, $jaqU8$reactariautils.mergeProps)(domProps, {
            ...fieldProps,
            "aria-valuenow": isIndeterminate ? undefined : value,
            "aria-valuemin": minValue,
            "aria-valuemax": maxValue,
            "aria-valuetext": isIndeterminate ? undefined : valueLabel,
            role: "progressbar"
        }),
        labelProps: labelProps
    };
}




//# sourceMappingURL=index.js.map
