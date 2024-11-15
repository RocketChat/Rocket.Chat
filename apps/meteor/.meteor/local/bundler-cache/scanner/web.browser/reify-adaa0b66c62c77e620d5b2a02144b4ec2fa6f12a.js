module.export({useSeparator:()=>$f4b273590fab9f93$export$52210f68a14655d0});let $hvHz9$filterDOMProps;module.link("@react-aria/utils",{filterDOMProps(v){$hvHz9$filterDOMProps=v}},0);

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
function $f4b273590fab9f93$export$52210f68a14655d0(props) {
    let domProps = (0, $hvHz9$filterDOMProps)(props, {
        labelable: true
    });
    let ariaOrientation;
    // if orientation is horizontal, aria-orientation default is horizontal, so we leave it undefined
    // if it's vertical, we need to specify it
    if (props.orientation === "vertical") ariaOrientation = "vertical";
    // hr elements implicitly have role = separator and a horizontal orientation
    if (props.elementType !== "hr") return {
        separatorProps: {
            ...domProps,
            role: "separator",
            "aria-orientation": ariaOrientation
        }
    };
    return {
        separatorProps: domProps
    };
}





//# sourceMappingURL=module.js.map
