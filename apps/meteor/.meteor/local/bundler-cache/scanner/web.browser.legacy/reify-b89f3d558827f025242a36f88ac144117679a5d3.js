var $cfIzB$react = require("react");
var $cfIzB$reactstatelyselection = require("@react-stately/selection");
var $cfIzB$reactstatelycollections = require("@react-stately/collections");
var $cfIzB$reactstatelyutils = require("@react-stately/utils");
var $cfIzB$swchelperslib_define_propertyjs = require("@swc/helpers/lib/_define_property.js");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useTreeState", () => $38effb299000faaf$export$728d6ba534403756);
$parcel$export(module.exports, "TreeCollection", () => $fae56b53b03726ff$export$863faf230ee2118a);
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
let $fae56b53b03726ff$var$_Symbol_iterator = Symbol.iterator;
class $fae56b53b03726ff$export$863faf230ee2118a {
    *[$fae56b53b03726ff$var$_Symbol_iterator]() {
        yield* this.iterable;
    }
    get size() {
        return this.keyMap.size;
    }
    getKeys() {
        return this.keyMap.keys();
    }
    getKeyBefore(key) {
        let node = this.keyMap.get(key);
        return node ? node.prevKey : null;
    }
    getKeyAfter(key) {
        let node = this.keyMap.get(key);
        return node ? node.nextKey : null;
    }
    getFirstKey() {
        return this.firstKey;
    }
    getLastKey() {
        return this.lastKey;
    }
    getItem(key) {
        return this.keyMap.get(key);
    }
    at(idx) {
        const keys = [
            ...this.getKeys()
        ];
        return this.getItem(keys[idx]);
    }
    constructor(nodes, { expandedKeys: expandedKeys  } = {}){
        (0, ($parcel$interopDefault($cfIzB$swchelperslib_define_propertyjs)))(this, "keyMap", new Map());
        this.iterable = nodes;
        expandedKeys = expandedKeys || new Set();
        let visit = (node)=>{
            this.keyMap.set(node.key, node);
            if (node.childNodes && (node.type === "section" || expandedKeys.has(node.key))) for (let child of node.childNodes)visit(child);
        };
        for (let node of nodes)visit(node);
        let last;
        let index = 0;
        for (let [key, node1] of this.keyMap){
            if (last) {
                last.nextKey = key;
                node1.prevKey = last.key;
            } else {
                this.firstKey = key;
                node1.prevKey = undefined;
            }
            if (node1.type === "item") node1.index = index++;
            last = node1;
            // Set nextKey as undefined since this might be the last node
            // If it isn't the last node, last.nextKey will properly set at start of new loop
            last.nextKey = undefined;
        }
        this.lastKey = last === null || last === void 0 ? void 0 : last.key;
    }
}




function $38effb299000faaf$export$728d6ba534403756(props) {
    let [expandedKeys, setExpandedKeys] = (0, $cfIzB$reactstatelyutils.useControlledState)(props.expandedKeys ? new Set(props.expandedKeys) : undefined, props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), props.onExpandedChange);
    let selectionState = (0, $cfIzB$reactstatelyselection.useMultipleSelectionState)(props);
    let disabledKeys = (0, $cfIzB$react.useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let tree = (0, $cfIzB$reactstatelycollections.useCollection)(props, (nodes)=>new (0, $fae56b53b03726ff$export$863faf230ee2118a)(nodes, {
            expandedKeys: expandedKeys
        }), null, [
        expandedKeys
    ]);
    // Reset focused key if that item is deleted from the collection.
    (0, $cfIzB$react.useEffect)(()=>{
        if (selectionState.focusedKey != null && !tree.getItem(selectionState.focusedKey)) selectionState.setFocusedKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        tree,
        selectionState.focusedKey
    ]);
    let onToggle = (key)=>{
        setExpandedKeys($38effb299000faaf$var$toggleKey(expandedKeys, key));
    };
    return {
        collection: tree,
        expandedKeys: expandedKeys,
        disabledKeys: disabledKeys,
        toggleKey: onToggle,
        selectionManager: new (0, $cfIzB$reactstatelyselection.SelectionManager)(tree, selectionState)
    };
}
function $38effb299000faaf$var$toggleKey(set, key) {
    let res = new Set(set);
    if (res.has(key)) res.delete(key);
    else res.add(key);
    return res;
}





//# sourceMappingURL=main.js.map
