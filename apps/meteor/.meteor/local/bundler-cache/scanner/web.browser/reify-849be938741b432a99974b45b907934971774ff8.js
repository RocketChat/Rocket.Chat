module.export({useListState:()=>$e72dd72e1c76a225$export$2f645645f7bca764,useSingleSelectListState:()=>$a0d645289fe9b86b$export$e7f05e985daf4b5f,ListCollection:()=>$a02d57049d202695$export$d085fb9e920b5ca7});let $58Phs$useMemo,$58Phs$useRef,$58Phs$useEffect;module.link("react",{useMemo(v){$58Phs$useMemo=v},useRef(v){$58Phs$useRef=v},useEffect(v){$58Phs$useEffect=v}},0);let $58Phs$useMultipleSelectionState,$58Phs$SelectionManager;module.link("@react-stately/selection",{useMultipleSelectionState(v){$58Phs$useMultipleSelectionState=v},SelectionManager(v){$58Phs$SelectionManager=v}},1);let $58Phs$useCollection;module.link("@react-stately/collections",{useCollection(v){$58Phs$useCollection=v}},2);let $58Phs$swchelperssrc_define_propertymjs;module.link("@swc/helpers/src/_define_property.mjs",{default(v){$58Phs$swchelperssrc_define_propertymjs=v}},3);let $58Phs$useControlledState;module.link("@react-stately/utils",{useControlledState(v){$58Phs$useControlledState=v}},4);





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
let $a02d57049d202695$var$_Symbol_iterator = Symbol.iterator;
class $a02d57049d202695$export$d085fb9e920b5ca7 {
    *[$a02d57049d202695$var$_Symbol_iterator]() {
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
    getChildren(key) {
        let node = this.keyMap.get(key);
        return (node === null || node === void 0 ? void 0 : node.childNodes) || [];
    }
    constructor(nodes){
        (0, $58Phs$swchelperssrc_define_propertymjs)(this, "keyMap", new Map());
        this.iterable = nodes;
        let visit = (node)=>{
            this.keyMap.set(node.key, node);
            if (node.childNodes && node.type === "section") for (let child of node.childNodes)visit(child);
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




function $e72dd72e1c76a225$export$2f645645f7bca764(props) {
    let { filter: filter  } = props;
    let selectionState = (0, $58Phs$useMultipleSelectionState)(props);
    let disabledKeys = (0, $58Phs$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let factory = (nodes)=>filter ? new (0, $a02d57049d202695$export$d085fb9e920b5ca7)(filter(nodes)) : new (0, $a02d57049d202695$export$d085fb9e920b5ca7)(nodes);
    let context = (0, $58Phs$useMemo)(()=>({
            suppressTextValueWarning: props.suppressTextValueWarning
        }), [
        props.suppressTextValueWarning
    ]);
    let collection = (0, $58Phs$useCollection)(props, factory, context, [
        filter
    ]);
    let selectionManager = (0, $58Phs$useMemo)(()=>new (0, $58Phs$SelectionManager)(collection, selectionState), [
        collection,
        selectionState
    ]);
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $58Phs$useRef)(null);
    (0, $58Phs$useEffect)(()=>{
        if (selectionState.focusedKey != null && !collection.getItem(selectionState.focusedKey)) {
            const startItem = cachedCollection.current.getItem(selectionState.focusedKey);
            const cachedItemNodes = [
                ...cachedCollection.current.getKeys()
            ].map((key)=>{
                const itemNode = cachedCollection.current.getItem(key);
                return itemNode.type === "item" ? itemNode : null;
            }).filter((node)=>node !== null);
            const itemNodes = [
                ...collection.getKeys()
            ].map((key)=>{
                const itemNode = collection.getItem(key);
                return itemNode.type === "item" ? itemNode : null;
            }).filter((node)=>node !== null);
            const diff = cachedItemNodes.length - itemNodes.length;
            let index = Math.min(diff > 1 ? Math.max(startItem.index - diff + 1, 0) : startItem.index, itemNodes.length - 1);
            let newNode;
            while(index >= 0){
                if (!selectionManager.isDisabled(itemNodes[index].key)) {
                    newNode = itemNodes[index];
                    break;
                }
                // Find next, not disabled item.
                if (index < itemNodes.length - 1) index++;
                else {
                    if (index > startItem.index) index = startItem.index;
                    index--;
                }
            }
            selectionState.setFocusedKey(newNode ? newNode.key : null);
        }
        cachedCollection.current = collection;
    }, [
        collection,
        selectionManager,
        selectionState,
        selectionState.focusedKey
    ]);
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager
    };
}


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


function $a0d645289fe9b86b$export$e7f05e985daf4b5f(props) {
    var _props_defaultSelectedKey;
    let [selectedKey, setSelectedKey] = (0, $58Phs$useControlledState)(props.selectedKey, (_props_defaultSelectedKey = props.defaultSelectedKey) !== null && _props_defaultSelectedKey !== void 0 ? _props_defaultSelectedKey : null, props.onSelectionChange);
    let selectedKeys = (0, $58Phs$useMemo)(()=>selectedKey != null ? [
            selectedKey
        ] : [], [
        selectedKey
    ]);
    let { collection: collection , disabledKeys: disabledKeys , selectionManager: selectionManager  } = (0, $e72dd72e1c76a225$export$2f645645f7bca764)({
        ...props,
        selectionMode: "single",
        disallowEmptySelection: true,
        allowDuplicateSelectionEvents: true,
        selectedKeys: selectedKeys,
        onSelectionChange: (keys)=>{
            let key = keys.values().next().value;
            // Always fire onSelectionChange, even if the key is the same
            // as the current key (useControlledState does not).
            if (key === selectedKey && props.onSelectionChange) props.onSelectionChange(key);
            setSelectedKey(key);
        }
    });
    let selectedItem = selectedKey != null ? collection.getItem(selectedKey) : null;
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager,
        selectedKey: selectedKey,
        setSelectedKey: setSelectedKey,
        selectedItem: selectedItem
    };
}






//# sourceMappingURL=module.js.map
