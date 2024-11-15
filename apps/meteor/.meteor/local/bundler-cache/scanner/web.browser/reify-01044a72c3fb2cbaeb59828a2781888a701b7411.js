module.export({useEvent:()=>$e9faafb641e167db$export$90fc3a17d93f704c});let $8ae05eaa5c114e9c$export$7f54fc3180508a52;module.link("./useEffectEvent.module.js",{useEffectEvent(v){$8ae05eaa5c114e9c$export$7f54fc3180508a52=v}},0);let $ceQd6$useEffect;module.link("react",{useEffect(v){$ceQd6$useEffect=v}},1);


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

function $e9faafb641e167db$export$90fc3a17d93f704c(ref, event, handler, options) {
    let handleEvent = (0, $8ae05eaa5c114e9c$export$7f54fc3180508a52)(handler);
    let isDisabled = handler == null;
    (0, $ceQd6$useEffect)(()=>{
        if (isDisabled || !ref.current) return;
        let element = ref.current;
        element.addEventListener(event, handleEvent, options);
        return ()=>{
            element.removeEventListener(event, handleEvent, options);
        };
    }, [
        ref,
        event,
        options,
        isDisabled,
        handleEvent
    ]);
}



//# sourceMappingURL=useEvent.module.js.map
