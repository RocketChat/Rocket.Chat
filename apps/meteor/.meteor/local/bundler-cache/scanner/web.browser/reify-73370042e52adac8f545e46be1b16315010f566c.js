module.export({useProgressBar:()=>$204d9ebcedfb8806$export$ed5abd763a836edc});let $e3Dei$filterDOMProps,$e3Dei$clamp,$e3Dei$mergeProps;module.link("@react-aria/utils",{filterDOMProps(v){$e3Dei$filterDOMProps=v},clamp(v){$e3Dei$clamp=v},mergeProps(v){$e3Dei$mergeProps=v}},0);let $e3Dei$useLabel;module.link("@react-aria/label",{useLabel(v){$e3Dei$useLabel=v}},1);let $e3Dei$useNumberFormatter;module.link("@react-aria/i18n",{useNumberFormatter(v){$e3Dei$useNumberFormatter=v}},2);



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


function $204d9ebcedfb8806$export$ed5abd763a836edc(props) {
    let { value: value = 0 , minValue: minValue = 0 , maxValue: maxValue = 100 , valueLabel: valueLabel , isIndeterminate: isIndeterminate , formatOptions: formatOptions = {
        style: "percent"
    }  } = props;
    let domProps = (0, $e3Dei$filterDOMProps)(props, {
        labelable: true
    });
    let { labelProps: labelProps , fieldProps: fieldProps  } = (0, $e3Dei$useLabel)({
        ...props,
        // Progress bar is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: "span"
    });
    value = (0, $e3Dei$clamp)(value, minValue, maxValue);
    let percentage = (value - minValue) / (maxValue - minValue);
    let formatter = (0, $e3Dei$useNumberFormatter)(formatOptions);
    if (!isIndeterminate && !valueLabel) {
        let valueToFormat = formatOptions.style === "percent" ? percentage : value;
        valueLabel = formatter.format(valueToFormat);
    }
    return {
        progressBarProps: (0, $e3Dei$mergeProps)(domProps, {
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





//# sourceMappingURL=module.js.map
