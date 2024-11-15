module.export({useScrollWheel:()=>$7d0a636d7a4dcefd$export$2123ff2b87c81ca});let $nrdL2$useCallback;module.link("react",{useCallback(v){$nrdL2$useCallback=v}},0);let $nrdL2$useEvent;module.link("@react-aria/utils",{useEvent(v){$nrdL2$useEvent=v}},1);


/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $7d0a636d7a4dcefd$export$2123ff2b87c81ca(props, ref) {
    let { onScroll: onScroll, isDisabled: isDisabled } = props;
    let onScrollHandler = (0, $nrdL2$useCallback)((e)=>{
        // If the ctrlKey is pressed, this is a zoom event, do nothing.
        if (e.ctrlKey) return;
        // stop scrolling the page
        e.preventDefault();
        e.stopPropagation();
        if (onScroll) onScroll({
            deltaX: e.deltaX,
            deltaY: e.deltaY
        });
    }, [
        onScroll
    ]);
    (0, $nrdL2$useEvent)(ref, 'wheel', isDisabled ? undefined : onScrollHandler);
}



//# sourceMappingURL=useScrollWheel.module.js.map
