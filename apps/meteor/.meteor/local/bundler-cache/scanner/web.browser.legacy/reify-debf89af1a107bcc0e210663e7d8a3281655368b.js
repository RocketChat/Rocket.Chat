var $4aZkW$react = require("react");
var $4aZkW$swchelperslib_define_propertyjs = require("@swc/helpers/lib/_define_property.js");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "Item", () => $c870f3b549c61b6b$export$6d08773d2e66f8f2);
$parcel$export(module.exports, "Section", () => $350f13aa4d8b327c$export$6e2c8f0811a474ce);
$parcel$export(module.exports, "useCollection", () => $98fc0fafaca75b6a$export$6cd28814d92fa9c9);
$parcel$export(module.exports, "getItemCount", () => $e749fe52977fe2c2$export$77d5aafae4e095b2);
$parcel$export(module.exports, "getChildNodes", () => $7a155683b0d79a6a$export$1005530eda016c13);
$parcel$export(module.exports, "getFirstItem", () => $7a155683b0d79a6a$export$fbdeaa6a76694f71);
$parcel$export(module.exports, "getLastItem", () => $7a155683b0d79a6a$export$7475b2c64539e4cf);
$parcel$export(module.exports, "getNthItem", () => $7a155683b0d79a6a$export$5f3398f8733f90e2);
$parcel$export(module.exports, "compareNodeOrder", () => $7a155683b0d79a6a$export$8c434b3a7a4dad6);
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
function $c870f3b549c61b6b$var$Item(props) {
    return null;
}
$c870f3b549c61b6b$var$Item.getCollectionNode = function* getCollectionNode(props, context) {
    let { childItems: childItems , title: title , children: children  } = props;
    let rendered = props.title || props.children;
    let textValue = props.textValue || (typeof rendered === "string" ? rendered : "") || props["aria-label"] || "";
    // suppressTextValueWarning is used in components like Tabs, which don't have type to select support.
    if (!textValue && !(context === null || context === void 0 ? void 0 : context.suppressTextValueWarning)) console.warn("<Item> with non-plain text contents is unsupported by type to select for accessibility. Please add a `textValue` prop.");
    yield {
        type: "item",
        props: props,
        rendered: rendered,
        textValue: textValue,
        "aria-label": props["aria-label"],
        hasChildNodes: $c870f3b549c61b6b$var$hasChildItems(props),
        *childNodes () {
            if (childItems) for (let child of childItems)yield {
                type: "item",
                value: child
            };
            else if (title) {
                let items = [];
                (0, ($parcel$interopDefault($4aZkW$react))).Children.forEach(children, (child)=>{
                    items.push({
                        type: "item",
                        element: child
                    });
                });
                yield* items;
            }
        }
    };
};
function $c870f3b549c61b6b$var$hasChildItems(props) {
    if (props.hasChildItems != null) return props.hasChildItems;
    if (props.childItems) return true;
    if (props.title && (0, ($parcel$interopDefault($4aZkW$react))).Children.count(props.children) > 0) return true;
    return false;
}
// We don't want getCollectionNode to show up in the type definition
let $c870f3b549c61b6b$export$6d08773d2e66f8f2 = $c870f3b549c61b6b$var$Item;


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
function $350f13aa4d8b327c$var$Section(props) {
    return null;
}
$350f13aa4d8b327c$var$Section.getCollectionNode = function* getCollectionNode(props) {
    let { children: children , title: title , items: items  } = props;
    yield {
        type: "section",
        props: props,
        hasChildNodes: true,
        rendered: title,
        "aria-label": props["aria-label"],
        *childNodes () {
            if (typeof children === "function") {
                if (!items) throw new Error("props.children was a function but props.items is missing");
                for (let item of items)yield {
                    type: "item",
                    value: item,
                    renderer: children
                };
            } else {
                let items1 = [];
                (0, ($parcel$interopDefault($4aZkW$react))).Children.forEach(children, (child)=>{
                    items1.push({
                        type: "item",
                        element: child
                    });
                });
                yield* items1;
            }
        }
    };
};
// We don't want getCollectionNode to show up in the type definition
let $350f13aa4d8b327c$export$6e2c8f0811a474ce = $350f13aa4d8b327c$var$Section;


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

class $51588fd411aace25$export$bf788dd355e3a401 {
    build(props, context) {
        this.context = context;
        return $51588fd411aace25$var$iterable(()=>this.iterateCollection(props));
    }
    *iterateCollection(props) {
        let { children: children , items: items  } = props;
        if (typeof children === "function") {
            if (!items) throw new Error("props.children was a function but props.items is missing");
            for (let item of props.items)yield* this.getFullNode({
                value: item
            }, {
                renderer: children
            });
        } else {
            let items1 = [];
            (0, ($parcel$interopDefault($4aZkW$react))).Children.forEach(children, (child)=>{
                items1.push(child);
            });
            let index = 0;
            for (let item1 of items1){
                let nodes = this.getFullNode({
                    element: item1,
                    index: index
                }, {});
                for (let node of nodes){
                    index++;
                    yield node;
                }
            }
        }
    }
    getKey(item, partialNode, state, parentKey) {
        if (item.key != null) return item.key;
        if (partialNode.type === "cell" && partialNode.key != null) return `${parentKey}${partialNode.key}`;
        let v = partialNode.value;
        if (v != null) {
            var _v_key;
            let key = (_v_key = v.key) !== null && _v_key !== void 0 ? _v_key : v.id;
            if (key == null) throw new Error("No key found for item");
            return key;
        }
        return parentKey ? `${parentKey}.${partialNode.index}` : `$.${partialNode.index}`;
    }
    getChildState(state, partialNode) {
        return {
            renderer: partialNode.renderer || state.renderer
        };
    }
    *getFullNode(partialNode, state, parentKey, parentNode) {
        // If there's a value instead of an element on the node, and a parent renderer function is available,
        // use it to render an element for the value.
        let element = partialNode.element;
        if (!element && partialNode.value && state && state.renderer) {
            let cached = this.cache.get(partialNode.value);
            if (cached && (!cached.shouldInvalidate || !cached.shouldInvalidate(this.context))) {
                cached.index = partialNode.index;
                cached.parentKey = parentNode ? parentNode.key : null;
                yield cached;
                return;
            }
            element = state.renderer(partialNode.value);
        }
        // If there's an element with a getCollectionNode function on its type, then it's a supported component.
        // Call this function to get a partial node, and recursively build a full node from there.
        if ((0, ($parcel$interopDefault($4aZkW$react))).isValidElement(element)) {
            let type = element.type;
            if (typeof type !== "function" && typeof type.getCollectionNode !== "function") {
                let name = typeof element.type === "function" ? element.type.name : element.type;
                throw new Error(`Unknown element <${name}> in collection.`);
            }
            let childNodes = type.getCollectionNode(element.props, this.context);
            let index = partialNode.index;
            let result = childNodes.next();
            while(!result.done && result.value){
                let childNode = result.value;
                partialNode.index = index;
                let nodeKey = childNode.key;
                if (!nodeKey) nodeKey = childNode.element ? null : this.getKey(element, partialNode, state, parentKey);
                let nodes = this.getFullNode({
                    ...childNode,
                    key: nodeKey,
                    index: index,
                    wrapper: $51588fd411aace25$var$compose(partialNode.wrapper, childNode.wrapper)
                }, this.getChildState(state, childNode), parentKey ? `${parentKey}${element.key}` : element.key, parentNode);
                let children = [
                    ...nodes
                ];
                for (let node of children){
                    // Cache the node based on its value
                    node.value = childNode.value || partialNode.value;
                    if (node.value) this.cache.set(node.value, node);
                    // The partial node may have specified a type for the child in order to specify a constraint.
                    // Verify that the full node that was built recursively matches this type.
                    if (partialNode.type && node.type !== partialNode.type) throw new Error(`Unsupported type <${$51588fd411aace25$var$capitalize(node.type)}> in <${$51588fd411aace25$var$capitalize(parentNode.type)}>. Only <${$51588fd411aace25$var$capitalize(partialNode.type)}> is supported.`);
                    index++;
                    yield node;
                }
                result = childNodes.next(children);
            }
            return;
        }
        // Ignore invalid elements
        if (partialNode.key == null) return;
        // Create full node
        let builder = this;
        let node1 = {
            type: partialNode.type,
            props: partialNode.props,
            key: partialNode.key,
            parentKey: parentNode ? parentNode.key : null,
            value: partialNode.value,
            level: parentNode ? parentNode.level + 1 : 0,
            index: partialNode.index,
            rendered: partialNode.rendered,
            textValue: partialNode.textValue,
            "aria-label": partialNode["aria-label"],
            wrapper: partialNode.wrapper,
            shouldInvalidate: partialNode.shouldInvalidate,
            hasChildNodes: partialNode.hasChildNodes,
            childNodes: $51588fd411aace25$var$iterable(function*() {
                if (!partialNode.hasChildNodes) return;
                let index = 0;
                for (let child of partialNode.childNodes()){
                    // Ensure child keys are globally unique by prepending the parent node's key
                    if (child.key != null) // TODO: Remove this line entirely and enforce that users always provide unique keys.
                    // Currently this line will have issues when a parent has a key `a` and a child with key `bc`
                    // but another parent has key `ab` and its child has a key `c`. The combined keys would result in both
                    // children having a key of `abc`.
                    child.key = `${node1.key}${child.key}`;
                    child.index = index;
                    let nodes = builder.getFullNode(child, builder.getChildState(state, child), node1.key, node1);
                    for (let node of nodes){
                        index++;
                        yield node;
                    }
                }
            })
        };
        yield node1;
    }
    constructor(){
        (0, ($parcel$interopDefault($4aZkW$swchelperslib_define_propertyjs)))(this, "cache", new WeakMap());
    }
}
// Wraps an iterator function as an iterable object, and caches the results.
function $51588fd411aace25$var$iterable(iterator) {
    let cache = [];
    let iterable = null;
    return {
        *[Symbol.iterator] () {
            for (let item of cache)yield item;
            if (!iterable) iterable = iterator();
            for (let item1 of iterable){
                cache.push(item1);
                yield item1;
            }
        }
    };
}
function $51588fd411aace25$var$compose(outer, inner) {
    if (outer && inner) return (element)=>outer(inner(element));
    if (outer) return outer;
    if (inner) return inner;
}
function $51588fd411aace25$var$capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}



function $98fc0fafaca75b6a$export$6cd28814d92fa9c9(props, factory, context, invalidators = []) {
    let builder = (0, $4aZkW$react.useMemo)(()=>new (0, $51588fd411aace25$export$bf788dd355e3a401)(), []);
    let prev = (0, $4aZkW$react.useRef)(null);
    return (0, $4aZkW$react.useMemo)(()=>{
        if (props.collection) return props.collection;
        let nodes = builder.build(props, context);
        prev.current = factory(nodes, prev.current);
        return prev.current;
    // Don't invalidate when any prop changes, just the two we care about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        builder,
        props.children,
        props.items,
        props.collection,
        context,
        ...invalidators
    ]);
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
 */ function $7a155683b0d79a6a$export$1005530eda016c13(node, collection) {
    // New API: call collection.getChildren with the node key.
    if (typeof collection.getChildren === "function") return collection.getChildren(node.key);
    // Old API: access childNodes directly.
    return node.childNodes;
}
function $7a155683b0d79a6a$export$fbdeaa6a76694f71(iterable) {
    return $7a155683b0d79a6a$export$5f3398f8733f90e2(iterable, 0);
}
function $7a155683b0d79a6a$export$5f3398f8733f90e2(iterable, index) {
    if (index < 0) return undefined;
    let i = 0;
    for (let item of iterable){
        if (i === index) return item;
        i++;
    }
}
function $7a155683b0d79a6a$export$7475b2c64539e4cf(iterable) {
    let lastItem = undefined;
    for (let value of iterable)lastItem = value;
    return lastItem;
}
function $7a155683b0d79a6a$export$8c434b3a7a4dad6(collection, a, b) {
    // If the two nodes have the same parent, compare their indices.
    if (a.parentKey === b.parentKey) return a.index - b.index;
    // Otherwise, collect all of the ancestors from each node, and find the first one that doesn't match starting from the root.
    let aAncestors = $7a155683b0d79a6a$var$getAncestors(collection, a);
    let bAncestors = $7a155683b0d79a6a$var$getAncestors(collection, b);
    let firstNonMatchingAncestor = aAncestors.slice(0, bAncestors.length).findIndex((a, i)=>a !== bAncestors[i]);
    if (firstNonMatchingAncestor !== -1) {
        // Compare the indices of two children within the common ancestor.
        a = aAncestors[firstNonMatchingAncestor];
        b = bAncestors[firstNonMatchingAncestor];
        return a.index - b.index;
    }
    // 🤷
    return -1;
}
function $7a155683b0d79a6a$var$getAncestors(collection, node) {
    let parents = [];
    while((node === null || node === void 0 ? void 0 : node.parentKey) != null){
        node = collection.getItem(node.parentKey);
        parents.unshift(node);
    }
    return parents;
}


const $e749fe52977fe2c2$var$cache = new WeakMap();
function $e749fe52977fe2c2$export$77d5aafae4e095b2(collection) {
    let count = $e749fe52977fe2c2$var$cache.get(collection);
    if (count != null) return count;
    count = 0;
    let countItems = (items)=>{
        for (let item of items)if (item.type === "section") countItems((0, $7a155683b0d79a6a$export$1005530eda016c13)(item, collection));
        else count++;
    };
    countItems(collection);
    $e749fe52977fe2c2$var$cache.set(collection, count);
    return count;
}





//# sourceMappingURL=main.js.map
