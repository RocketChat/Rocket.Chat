var $82f7L$reactstatelycollections = require("@react-stately/collections");
var $82f7L$react = require("react");
var $82f7L$reactstatelyselection = require("@react-stately/selection");
var $82f7L$swchelperslib_define_propertyjs = require("@swc/helpers/lib/_define_property.js");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useGridState", () => $38009b28e45912ea$export$4007ac09ff9c68ed);
$parcel$export(module.exports, "GridCollection", () => $8bb6a9101b052a66$export$de3fdf6493c353d);
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


function $38009b28e45912ea$export$4007ac09ff9c68ed(props) {
    let { collection: collection , focusMode: focusMode  } = props;
    let selectionState = (0, $82f7L$reactstatelyselection.useMultipleSelectionState)(props);
    let disabledKeys = (0, $82f7L$react.useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let setFocusedKey = selectionState.setFocusedKey;
    selectionState.setFocusedKey = (key, child)=>{
        // If focusMode is cell and an item is focused, focus a child cell instead.
        if (focusMode === "cell" && key != null) {
            let item = collection.getItem(key);
            if ((item === null || item === void 0 ? void 0 : item.type) === "item") {
                var _getLastItem, _getFirstItem;
                let children = (0, $82f7L$reactstatelycollections.getChildNodes)(item, collection);
                if (child === "last") key = (_getLastItem = (0, $82f7L$reactstatelycollections.getLastItem)(children)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key;
                else key = (_getFirstItem = (0, $82f7L$reactstatelycollections.getFirstItem)(children)) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key;
            }
        }
        setFocusedKey(key, child);
    };
    let selectionManager = (0, $82f7L$react.useMemo)(()=>new (0, $82f7L$reactstatelyselection.SelectionManager)(collection, selectionState), [
        collection,
        selectionState
    ]);
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $82f7L$react.useRef)(null);
    (0, $82f7L$react.useEffect)(()=>{
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
                    ...(0, $82f7L$reactstatelycollections.getChildNodes)(newRow, collection)
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
let $8bb6a9101b052a66$var$_Symbol_iterator = Symbol.iterator;
class $8bb6a9101b052a66$export$de3fdf6493c353d {
    *[$8bb6a9101b052a66$var$_Symbol_iterator]() {
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
        (0, ($parcel$interopDefault($82f7L$swchelperslib_define_propertyjs)))(this, "keyMap", new Map());
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




//# sourceMappingURL=main.js.map
