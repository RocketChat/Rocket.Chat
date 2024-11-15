var $lgnI8$reactstatelyutils = require("@react-stately/utils");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSearchFieldState", () => $1fa0a0eef7fd0825$export$3f8be18b0f41eaf2);
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
function $1fa0a0eef7fd0825$export$3f8be18b0f41eaf2(props) {
    let [value, setValue] = (0, $lgnI8$reactstatelyutils.useControlledState)($1fa0a0eef7fd0825$var$toString(props.value), $1fa0a0eef7fd0825$var$toString(props.defaultValue) || "", props.onChange);
    return {
        value: value,
        setValue: setValue
    };
}
function $1fa0a0eef7fd0825$var$toString(val) {
    if (val == null) return;
    return val.toString();
}




//# sourceMappingURL=main.js.map
