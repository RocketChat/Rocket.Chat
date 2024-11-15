module.export({useSyncRef:()=>$e7801be82b4b2a53$export$4debdb1a3f0fa79e});let $f0a04ccd8dbdd83b$export$e5c5a5f917a5871c;module.link("./useLayoutEffect.module.js",{useLayoutEffect(v){$f0a04ccd8dbdd83b$export$e5c5a5f917a5871c=v}},0);

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
 */ 
function $e7801be82b4b2a53$export$4debdb1a3f0fa79e(context, ref) {
    (0, $f0a04ccd8dbdd83b$export$e5c5a5f917a5871c)(()=>{
        if (context && context.ref && ref) {
            context.ref.current = ref.current;
            return ()=>{
                if (context.ref) context.ref.current = null;
            };
        }
    });
}



//# sourceMappingURL=useSyncRef.module.js.map
