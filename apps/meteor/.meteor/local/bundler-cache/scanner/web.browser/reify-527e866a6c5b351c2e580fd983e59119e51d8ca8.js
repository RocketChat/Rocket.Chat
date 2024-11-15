module.export({getScrollParents:()=>$a40c673dc9f6d9c7$export$94ed1c92c7beeb22});let $cc38e7bd3fc7b213$export$2bb74740c4e19def;module.link("./isScrollable.module.js",{isScrollable(v){$cc38e7bd3fc7b213$export$2bb74740c4e19def=v}},0);

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $a40c673dc9f6d9c7$export$94ed1c92c7beeb22(node, checkForOverflow) {
    const scrollParents = [];
    while(node && node !== document.documentElement){
        if ((0, $cc38e7bd3fc7b213$export$2bb74740c4e19def)(node, checkForOverflow)) scrollParents.push(node);
        node = node.parentElement;
    }
    return scrollParents;
}



//# sourceMappingURL=getScrollParents.module.js.map
