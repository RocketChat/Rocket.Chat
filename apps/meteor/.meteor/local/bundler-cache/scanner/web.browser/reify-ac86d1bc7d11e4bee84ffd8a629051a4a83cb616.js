module.export({useGridState:()=>$62967d126f3aa823$export$4007ac09ff9c68ed,GridCollection:()=>$16805b1b18093c5f$export$de3fdf6493c353d});let $cAn5f$getChildNodes,$cAn5f$getLastItem,$cAn5f$getFirstItem;module.link("@react-stately/collections",{getChildNodes(v){$cAn5f$getChildNodes=v},getLastItem(v){$cAn5f$getLastItem=v},getFirstItem(v){$cAn5f$getFirstItem=v}},0);let $cAn5f$useMemo,$cAn5f$useRef,$cAn5f$useEffect;module.link("react",{useMemo(v){$cAn5f$useMemo=v},useRef(v){$cAn5f$useRef=v},useEffect(v){$cAn5f$useEffect=v}},1);let $cAn5f$useMultipleSelectionState,$cAn5f$SelectionManager;module.link("@react-stately/selection",{useMultipleSelectionState(v){$cAn5f$useMultipleSelectionState=v},SelectionManager(v){$cAn5f$SelectionManager=v}},2);let $cAn5f$swchelperssrc_define_propertymjs;module.link("@swc/helpers/src/_define_property.mjs",{default(v){$cAn5f$swchelperssrc_define_propertymjs=v}},3);




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


function $62967d126f3aa823$export$4007ac09ff9c68ed(props) {
    let { collection: collection , focusMode: focusMode  } = props;
    let selectionState = (0, $cAn5f$useMultipleSelectionState)(props);
    let disabledKeys = (0, $cAn5f$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let setFocusedKey = selectionState.setFocusedKey;
    selectionState.setFocusedKey = (key, child)=>{
        // If focusMode is cell and an item is focused, focus a child cell instead.
        if (focusMode === "cell" && key != null) {
            let item = collection.getItem(key);
            if ((item === null || item === void 0 ? void 0 : item.type) === "item") {
                var _getLastItem, _getFirstItem;
                let children = (0, $cAn5f$getChildNodes)(item, collection);
                if (child === "last") key = (_getLastItem = (0, $cAn5f$getLastItem)(children)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key;
                else key = (_getFirstItem = (0, $cAn5f$getFirstItem)(children)) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key;
            }
        }
        setFocusedKey(key, child);
    };
    let selectionManager = (0, $cAn5f$useMemo)(()=>new (0, $cAn5f$SelectionManager)(collection, selectionState), [
        collection,
        selectionState
    ]);
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $cAn5f$useRef)(null);
    (0, $cAn5f$useEffect)(()=>{
        if (selectionState.focusedKey != null && !collection.getItem(selectionState.focusedKey)) {
            const node = cachedCollection.current.getItem(selectionState.focusedKey);
            const parentNode = node.parentKey != null && (node.type === "cell" || node.type === "rowheader" || node.type === "column") ? cachedCollection.current.getItem(node.parentKey) : node;
            const cachedRows = cachedCollection.current.rows;
            const rows = collection.rows;
            const diff = cachedRows.length - rows.length;
            let index = Math.min(diff > 1 ? Math.max(parentNode.index - diff + 1, 0) : parentNode.index, rows.length - 1);
            let newRow;
            while(index >= 0){
                if (!selectionManager.isDisabled(rows[index].key)) {
                    newRow = rows[index];
                    break;
                }
                // Find next, not disabled row.
                if (index < rows.length - 1) index++;
                else {
                    if (index > parentNode.index) index = parentNode.index;
                    index--;
                }
            }
            if (newRow) {
                const childNodes = newRow.hasChildNodes ? [
                    ...(0, $cAn5f$getChildNodes)(newRow, collection)
                ] : [];
                const keyToFocus = newRow.hasChildNodes && parentNode !== node && node.index < childNodes.length ? childNodes[node.index].key : newRow.key;
                selectionState.setFocusedKey(keyToFocus);
            } else selectionState.setFocusedKey(null);
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
        isKeyboardNavigationDisabled: false,
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
let $16805b1b18093c5f$var$_Symbol_iterator = Symbol.iterator;
class $16805b1b18093c5f$export$de3fdf6493c353d {
    *[$16805b1b18093c5f$var$_Symbol_iterator]() {
        yield* [
            ...this.rows
        ];
    }
    get size() {
        return [
            ...this.rows
        ].length;
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
        var _;
        return (_ = [
            ...this.rows
        ][0]) === null || _ === void 0 ? void 0 : _.key;
    }
    getLastKey() {
        var _rows_;
        let rows = [
            ...this.rows
        ];
        return (_rows_ = rows[rows.length - 1]) === null || _rows_ === void 0 ? void 0 : _rows_.key;
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
    constructor(opts){
        (0, $cAn5f$swchelperssrc_define_propertymjs)(this, "keyMap", new Map());
        this.keyMap = new Map();
        this.columnCount = opts === null || opts === void 0 ? void 0 : opts.columnCount;
        this.rows = [];
        let visit = (node)=>{
            // If the node is the same object as the previous node for the same key,
            // we can skip this node and its children. We always visit columns though,
            // because we depend on order to build the columns array.
            let prevNode = this.keyMap.get(node.key);
            if (opts.visitNode) node = opts.visitNode(node);
            this.keyMap.set(node.key, node);
            let childKeys = new Set();
            let last;
            for (let child of node.childNodes){
                if (child.type === "cell" && child.parentKey == null) // if child is a cell parent key isn't already established by the collection, match child node to parent row
                child.parentKey = node.key;
                childKeys.add(child.key);
                if (last) {
                    last.nextKey = child.key;
                    child.prevKey = last.key;
                } else child.prevKey = null;
                visit(child);
                last = child;
            }
            if (last) last.nextKey = null;
            // Remove deleted nodes and their children from the key map
            if (prevNode) {
                for (let child1 of prevNode.childNodes)if (!childKeys.has(child1.key)) remove(child1);
            }
        };
        let remove = (node)=>{
            this.keyMap.delete(node.key);
            for (let child of node.childNodes)if (this.keyMap.get(child.key) === child) remove(child);
        };
        let last;
        opts.items.forEach((node, i)=>{
            let rowNode = {
                level: 0,
                key: "row-" + i,
                type: "row",
                value: undefined,
                hasChildNodes: true,
                childNodes: [
                    ...node.childNodes
                ],
                rendered: undefined,
                textValue: undefined,
                ...node,
                index: i
            };
            if (last) {
                last.nextKey = rowNode.key;
                rowNode.prevKey = last.key;
            } else rowNode.prevKey = null;
            this.rows.push(rowNode);
            visit(rowNode);
            last = rowNode;
        });
        if (last) last.nextKey = null;
    }
}





//# sourceMappingURL=module.js.map
