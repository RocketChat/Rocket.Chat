var $8aPAr$react = require("react");
var $8aPAr$reactstatelyoverlays = require("@react-stately/overlays");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTooltipTriggerState", () => $3391baedd777a697$export$4d40659c25ecb50b);
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

const $3391baedd777a697$var$TOOLTIP_DELAY = 1500; // this seems to be a 1.5 second delay, check with design
const $3391baedd777a697$var$TOOLTIP_COOLDOWN = 500;
let $3391baedd777a697$var$tooltips = {};
let $3391baedd777a697$var$tooltipId = 0;
let $3391baedd777a697$var$globalWarmedUp = false;
let $3391baedd777a697$var$globalWarmUpTimeout = null;
let $3391baedd777a697$var$globalCooldownTimeout = null;
function $3391baedd777a697$export$4d40659c25ecb50b(props = {}) {
    let { delay: delay = $3391baedd777a697$var$TOOLTIP_DELAY , closeDelay: closeDelay = $3391baedd777a697$var$TOOLTIP_COOLDOWN  } = props;
    let { isOpen: isOpen , open: open , close: close  } = (0, $8aPAr$reactstatelyoverlays.useOverlayTriggerState)(props);
    let id = (0, $8aPAr$react.useMemo)(()=>`${++$3391baedd777a697$var$tooltipId}`, []);
    let closeTimeout = (0, $8aPAr$react.useRef)();
    let ensureTooltipEntry = ()=>{
        $3391baedd777a697$var$tooltips[id] = hideTooltip;
    };
    let closeOpenTooltips = ()=>{
        for(let hideTooltipId in $3391baedd777a697$var$tooltips)if (hideTooltipId !== id) {
            $3391baedd777a697$var$tooltips[hideTooltipId](true);
            delete $3391baedd777a697$var$tooltips[hideTooltipId];
        }
    };
    let showTooltip = ()=>{
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
        closeOpenTooltips();
        ensureTooltipEntry();
        $3391baedd777a697$var$globalWarmedUp = true;
        open();
        if ($3391baedd777a697$var$globalWarmUpTimeout) {
            clearTimeout($3391baedd777a697$var$globalWarmUpTimeout);
            $3391baedd777a697$var$globalWarmUpTimeout = null;
        }
        if ($3391baedd777a697$var$globalCooldownTimeout) {
            clearTimeout($3391baedd777a697$var$globalCooldownTimeout);
            $3391baedd777a697$var$globalCooldownTimeout = null;
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
        if ($3391baedd777a697$var$globalWarmUpTimeout) {
            clearTimeout($3391baedd777a697$var$globalWarmUpTimeout);
            $3391baedd777a697$var$globalWarmUpTimeout = null;
        }
        if ($3391baedd777a697$var$globalWarmedUp) {
            if ($3391baedd777a697$var$globalCooldownTimeout) clearTimeout($3391baedd777a697$var$globalCooldownTimeout);
            $3391baedd777a697$var$globalCooldownTimeout = setTimeout(()=>{
                delete $3391baedd777a697$var$tooltips[id];
                $3391baedd777a697$var$globalCooldownTimeout = null;
                $3391baedd777a697$var$globalWarmedUp = false;
            }, Math.max($3391baedd777a697$var$TOOLTIP_COOLDOWN, closeDelay));
        }
    };
    let warmupTooltip = ()=>{
        closeOpenTooltips();
        ensureTooltipEntry();
        if (!isOpen && !$3391baedd777a697$var$globalWarmUpTimeout && !$3391baedd777a697$var$globalWarmedUp) $3391baedd777a697$var$globalWarmUpTimeout = setTimeout(()=>{
            $3391baedd777a697$var$globalWarmUpTimeout = null;
            $3391baedd777a697$var$globalWarmedUp = true;
            showTooltip();
        }, delay);
        else if (!isOpen) showTooltip();
    };
    // eslint-disable-next-line arrow-body-style
    (0, $8aPAr$react.useEffect)(()=>{
        return ()=>{
            clearTimeout(closeTimeout.current);
            let tooltip = $3391baedd777a697$var$tooltips[id];
            if (tooltip) delete $3391baedd777a697$var$tooltips[id];
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




//# sourceMappingURL=main.js.map
