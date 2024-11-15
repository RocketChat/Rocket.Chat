module.export({useTooltipTriggerState:()=>$8796f90736e175cb$export$4d40659c25ecb50b});let $1OhDq$useMemo,$1OhDq$useRef,$1OhDq$useEffect;module.link("react",{useMemo(v){$1OhDq$useMemo=v},useRef(v){$1OhDq$useRef=v},useEffect(v){$1OhDq$useEffect=v}},0);let $1OhDq$useOverlayTriggerState;module.link("@react-stately/overlays",{useOverlayTriggerState(v){$1OhDq$useOverlayTriggerState=v}},1);


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

const $8796f90736e175cb$var$TOOLTIP_DELAY = 1500; // this seems to be a 1.5 second delay, check with design
const $8796f90736e175cb$var$TOOLTIP_COOLDOWN = 500;
let $8796f90736e175cb$var$tooltips = {};
let $8796f90736e175cb$var$tooltipId = 0;
let $8796f90736e175cb$var$globalWarmedUp = false;
let $8796f90736e175cb$var$globalWarmUpTimeout = null;
let $8796f90736e175cb$var$globalCooldownTimeout = null;
function $8796f90736e175cb$export$4d40659c25ecb50b(props = {}) {
    let { delay: delay = $8796f90736e175cb$var$TOOLTIP_DELAY , closeDelay: closeDelay = $8796f90736e175cb$var$TOOLTIP_COOLDOWN  } = props;
    let { isOpen: isOpen , open: open , close: close  } = (0, $1OhDq$useOverlayTriggerState)(props);
    let id = (0, $1OhDq$useMemo)(()=>`${++$8796f90736e175cb$var$tooltipId}`, []);
    let closeTimeout = (0, $1OhDq$useRef)();
    let ensureTooltipEntry = ()=>{
        $8796f90736e175cb$var$tooltips[id] = hideTooltip;
    };
    let closeOpenTooltips = ()=>{
        for(let hideTooltipId in $8796f90736e175cb$var$tooltips)if (hideTooltipId !== id) {
            $8796f90736e175cb$var$tooltips[hideTooltipId](true);
            delete $8796f90736e175cb$var$tooltips[hideTooltipId];
        }
    };
    let showTooltip = ()=>{
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
        closeOpenTooltips();
        ensureTooltipEntry();
        $8796f90736e175cb$var$globalWarmedUp = true;
        open();
        if ($8796f90736e175cb$var$globalWarmUpTimeout) {
            clearTimeout($8796f90736e175cb$var$globalWarmUpTimeout);
            $8796f90736e175cb$var$globalWarmUpTimeout = null;
        }
        if ($8796f90736e175cb$var$globalCooldownTimeout) {
            clearTimeout($8796f90736e175cb$var$globalCooldownTimeout);
            $8796f90736e175cb$var$globalCooldownTimeout = null;
        }
    };
    let hideTooltip = (immediate)=>{
        if (immediate || closeDelay <= 0) {
            clearTimeout(closeTimeout.current);
            closeTimeout.current = null;
            close();
        } else if (!closeTimeout.current) closeTimeout.current = setTimeout(()=>{
            closeTimeout.current = null;
            close();
        }, closeDelay);
        if ($8796f90736e175cb$var$globalWarmUpTimeout) {
            clearTimeout($8796f90736e175cb$var$globalWarmUpTimeout);
            $8796f90736e175cb$var$globalWarmUpTimeout = null;
        }
        if ($8796f90736e175cb$var$globalWarmedUp) {
            if ($8796f90736e175cb$var$globalCooldownTimeout) clearTimeout($8796f90736e175cb$var$globalCooldownTimeout);
            $8796f90736e175cb$var$globalCooldownTimeout = setTimeout(()=>{
                delete $8796f90736e175cb$var$tooltips[id];
                $8796f90736e175cb$var$globalCooldownTimeout = null;
                $8796f90736e175cb$var$globalWarmedUp = false;
            }, Math.max($8796f90736e175cb$var$TOOLTIP_COOLDOWN, closeDelay));
        }
    };
    let warmupTooltip = ()=>{
        closeOpenTooltips();
        ensureTooltipEntry();
        if (!isOpen && !$8796f90736e175cb$var$globalWarmUpTimeout && !$8796f90736e175cb$var$globalWarmedUp) $8796f90736e175cb$var$globalWarmUpTimeout = setTimeout(()=>{
            $8796f90736e175cb$var$globalWarmUpTimeout = null;
            $8796f90736e175cb$var$globalWarmedUp = true;
            showTooltip();
        }, delay);
        else if (!isOpen) showTooltip();
    };
    // eslint-disable-next-line arrow-body-style
    (0, $1OhDq$useEffect)(()=>{
        return ()=>{
            clearTimeout(closeTimeout.current);
            let tooltip = $8796f90736e175cb$var$tooltips[id];
            if (tooltip) delete $8796f90736e175cb$var$tooltips[id];
        };
    }, [
        id
    ]);
    return {
        isOpen: isOpen,
        open: (immediate)=>{
            if (!immediate && delay > 0 && !closeTimeout.current) warmupTooltip();
            else showTooltip();
        },
        close: hideTooltip
    };
}





//# sourceMappingURL=module.js.map
