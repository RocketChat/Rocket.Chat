module.export({useOverlayTriggerState:()=>$fc909762b330b746$export$61c6a8c84e605fb6});let $4oA3P$useControlledState;module.link("@react-stately/utils",{useControlledState(v){$4oA3P$useControlledState=v}},0);

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
function $fc909762b330b746$export$61c6a8c84e605fb6(props) {
    let [isOpen, setOpen] = (0, $4oA3P$useControlledState)(props.isOpen, props.defaultOpen || false, props.onOpenChange);
    return {
        isOpen: isOpen,
        setOpen: setOpen,
        open () {
            setOpen(true);
        },
        close () {
            setOpen(false);
        },
        toggle () {
            setOpen(!isOpen);
        }
    };
}





//# sourceMappingURL=module.js.map
