var $g2CPN$reactariautils = require("@react-aria/utils");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useField", () => $50e2f39368b9c636$export$294aa081a6c6f55d);
$parcel$export(module.exports, "useLabel", () => $ce7359c25a7dec1c$export$8467354a121f1b9f);
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
 * Copyright 2021 Adobe. All rights reserved.
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
function $ce7359c25a7dec1c$export$8467354a121f1b9f(props) {
    let { id: id , label: label , "aria-labelledby": ariaLabelledby , "aria-label": ariaLabel , labelElementType: labelElementType = "label"  } = props;
    id = (0, $g2CPN$reactariautils.useId)(id);
    let labelId = (0, $g2CPN$reactariautils.useId)();
    let labelProps = {};
    if (label) {
        ariaLabelledby = ariaLabelledby ? `${ariaLabelledby} ${labelId}` : labelId;
        labelProps = {
            id: labelId,
            htmlFor: labelElementType === "label" ? id : undefined
        };
    } else if (!ariaLabelledby && !ariaLabel) console.warn("If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility");
    let fieldProps = (0, $g2CPN$reactariautils.useLabels)({
        id: id,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledby
    });
    return {
        labelProps: labelProps,
        fieldProps: fieldProps
    };
}



function $50e2f39368b9c636$export$294aa081a6c6f55d(props) {
    let { description: description , errorMessage: errorMessage , validationState: validationState  } = props;
    let { labelProps: labelProps , fieldProps: fieldProps  } = (0, $ce7359c25a7dec1c$export$8467354a121f1b9f)(props);
    let descriptionId = (0, $g2CPN$reactariautils.useSlotId)([
        Boolean(description),
        Boolean(errorMessage),
        validationState
    ]);
    let errorMessageId = (0, $g2CPN$reactariautils.useSlotId)([
        Boolean(description),
        Boolean(errorMessage),
        validationState
    ]);
    fieldProps = (0, $g2CPN$reactariautils.mergeProps)(fieldProps, {
        "aria-describedby": [
            descriptionId,
            // Use aria-describedby for error message because aria-errormessage is unsupported using VoiceOver or NVDA. See https://github.com/adobe/react-spectrum/issues/1346#issuecomment-740136268
            errorMessageId,
            props["aria-describedby"]
        ].filter(Boolean).join(" ") || undefined
    });
    return {
        labelProps: labelProps,
        fieldProps: fieldProps,
        descriptionProps: {
            id: descriptionId
        },
        errorMessageProps: {
            id: errorMessageId
        }
    };
}





//# sourceMappingURL=main.js.map
