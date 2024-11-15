var $4vY0V$reactariainteractions = require("@react-aria/interactions");
var $4vY0V$react = require("react");
var $4vY0V$reactariautils = require("@react-aria/utils");
var $4vY0V$reactariai18n = require("@react-aria/i18n");
var $4vY0V$reactarialiveannouncer = require("@react-aria/live-announcer");
var $4vY0V$reactariaoverlays = require("@react-aria/overlays");
var $4vY0V$reactdom = require("react-dom");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "DIRECTORY_DRAG_TYPE", () => $4620ae0dc40f0031$export$990fced5dfac2637);
$parcel$export(module.exports, "useDrag", () => $dc204e8ec58447a6$export$7941f8aafa4b6021);
$parcel$export(module.exports, "useDrop", () => $1ca228bc9257ca16$export$ccdee5eaf73cf661);
$parcel$export(module.exports, "useDroppableCollection", () => $7f93a158ac20b90a$export$f4e2f423c21f7b04);
$parcel$export(module.exports, "useDroppableItem", () => $fc1876157e07bcec$export$f7b0c5d28b66b6a5);
$parcel$export(module.exports, "useDropIndicator", () => $c5557edbed563ebf$export$8d0e41d2815afac5);
$parcel$export(module.exports, "useDraggableItem", () => $0cbbd00cda972c67$export$b35afafff42da2d9);
$parcel$export(module.exports, "useDraggableCollection", () => $c3e901bab7fcc6ff$export$2962a7984b2f0a80);
$parcel$export(module.exports, "useClipboard", () => $74f3dedaa4d234b4$export$2314ca2a3e892862);
$parcel$export(module.exports, "DragPreview", () => $2dccaca1f4baa446$export$905ab40ac2179daa);
$parcel$export(module.exports, "ListDropTargetDelegate", () => $2268795bbb597ecb$export$fbd65d14c79e28cc);
$parcel$export(module.exports, "isVirtualDragging", () => $28e10663603f5ea1$export$403bc76cbf68cf60);
$parcel$export(module.exports, "isDirectoryDropItem", () => $4620ae0dc40f0031$export$2b40a62bdbe6b2b0);
$parcel$export(module.exports, "isFileDropItem", () => $4620ae0dc40f0031$export$a144e1752ebe0aa);
$parcel$export(module.exports, "isTextDropItem", () => $4620ae0dc40f0031$export$97fd558bdc44bea1);
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
 */ let $76b1e110a27b1ccd$export$60b7b4bcf3903d8e;
(function(DROP_OPERATION) {
    DROP_OPERATION[DROP_OPERATION["none"] = 0] = "none";
    DROP_OPERATION[DROP_OPERATION["cancel"] = 0] = "cancel";
    DROP_OPERATION[DROP_OPERATION["move"] = 1] = "move";
    DROP_OPERATION[DROP_OPERATION["copy"] = 2] = "copy";
    DROP_OPERATION[DROP_OPERATION["link"] = 4] = "link";
    DROP_OPERATION[DROP_OPERATION["all"] = 7] = "all";
})($76b1e110a27b1ccd$export$60b7b4bcf3903d8e || ($76b1e110a27b1ccd$export$60b7b4bcf3903d8e = {}));
const $76b1e110a27b1ccd$export$9bbdfc78cf083e16 = {
    ...$76b1e110a27b1ccd$export$60b7b4bcf3903d8e,
    copyMove: $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.copy | $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.move,
    copyLink: $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.copy | $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.link,
    linkMove: $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.link | $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.move,
    all: $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.all,
    uninitialized: $76b1e110a27b1ccd$export$60b7b4bcf3903d8e.all
};
const $76b1e110a27b1ccd$export$dd0165308d8bff45 = $76b1e110a27b1ccd$var$invert($76b1e110a27b1ccd$export$9bbdfc78cf083e16);
$76b1e110a27b1ccd$export$dd0165308d8bff45[$76b1e110a27b1ccd$export$60b7b4bcf3903d8e.all] = "all"; // ensure we don't map to 'uninitialized'.
const $76b1e110a27b1ccd$export$d7ebf00f36b7a95e = $76b1e110a27b1ccd$var$invert($76b1e110a27b1ccd$export$60b7b4bcf3903d8e);
const $76b1e110a27b1ccd$export$608ecc6f1b23c35d = {
    none: "cancel",
    link: "link",
    copy: "copy",
    move: "move"
};
const $76b1e110a27b1ccd$export$5eacb0769d26d3b2 = $76b1e110a27b1ccd$var$invert($76b1e110a27b1ccd$export$608ecc6f1b23c35d);
function $76b1e110a27b1ccd$var$invert(object) {
    let res = {};
    for(let key in object)res[object[key]] = key;
    return res;
}
const $76b1e110a27b1ccd$export$4a7729b856e9a690 = new Set([
    "text/plain",
    "text/uri-list",
    "text/html"
]);
const $76b1e110a27b1ccd$export$fd9f9fc120c5402d = "application/vnd.react-aria.items+json";
const $76b1e110a27b1ccd$export$f8fc6581787339b3 = "application/octet-stream";



const $4620ae0dc40f0031$export$dfdf5deeaf27473f = new WeakMap();
const $4620ae0dc40f0031$export$990fced5dfac2637 = Symbol();
function $4620ae0dc40f0031$export$3093291712f09a77(state) {
    let { id: id  } = $4620ae0dc40f0031$export$dfdf5deeaf27473f.get(state);
    if (!id) throw new Error("Droppable item outside a droppable collection");
    return id;
}
function $4620ae0dc40f0031$export$7e397efd01d3db27(state) {
    let { ref: ref  } = $4620ae0dc40f0031$export$dfdf5deeaf27473f.get(state);
    if (!ref) throw new Error("Droppable item outside a droppable collection");
    return ref;
}
function $4620ae0dc40f0031$export$e1d41611756c6326(items) {
    let types = new Set();
    for (let item of items)for (let type of Object.keys(item))types.add(type);
    return types;
}
function $4620ae0dc40f0031$var$mapModality(modality) {
    if (!modality) modality = "virtual";
    if (modality === "pointer") modality = "virtual";
    if (modality === "virtual" && typeof window !== "undefined" && "ontouchstart" in window) modality = "touch";
    return modality;
}
function $4620ae0dc40f0031$export$49bac5d6d4b352ea() {
    return $4620ae0dc40f0031$var$mapModality((0, $4vY0V$reactariainteractions.useInteractionModality)());
}
function $4620ae0dc40f0031$export$1fb2158d224b542c() {
    return $4620ae0dc40f0031$var$mapModality((0, $4vY0V$reactariainteractions.getInteractionModality)());
}
function $4620ae0dc40f0031$export$f9c1490890ddd063(dataTransfer, items) {
    // The data transfer API doesn't support more than one item of a given type at once.
    // In addition, only a small set of types are supported natively for transfer between applications.
    // We allow for both multiple items, as well as multiple representations of a single item.
    // In order to make our API work with the native API, we serialize all items to JSON and
    // store as a single native item. We only need to do this if there is more than one item
    // of the same type, or if an item has more than one representation. Otherwise the native
    // API is sufficient.
    //
    // The DataTransferItemList API also theoretically supports adding files, which would enable
    // dragging binary data out of the browser onto the user's desktop for example. Unfortunately,
    // this does not currently work in any browser, so it is not currently supported by our API.
    // See e.g. https://bugs.chromium.org/p/chromium/issues/detail?id=438479.
    let groupedByType = new Map();
    let needsCustomData = false;
    let customData = [];
    for (let item of items){
        let types = Object.keys(item);
        if (types.length > 1) needsCustomData = true;
        let dataByType = {};
        for (let type of types){
            let typeItems = groupedByType.get(type);
            if (!typeItems) {
                typeItems = [];
                groupedByType.set(type, typeItems);
            } else needsCustomData = true;
            let data = item[type];
            dataByType[type] = data;
            typeItems.push(data);
        }
        customData.push(dataByType);
    }
    for (let [type1, items1] of groupedByType)if ((0, $76b1e110a27b1ccd$export$4a7729b856e9a690).has(type1)) {
        // Only one item of a given type can be set on a data transfer.
        // Join all of the items together separated by newlines.
        let data1 = items1.join("\n");
        dataTransfer.items.add(data1, type1);
    } else // Set data to the first item so we have access to the list of types.
    dataTransfer.items.add(items1[0], type1);
    if (needsCustomData) {
        let data2 = JSON.stringify(customData);
        dataTransfer.items.add(data2, (0, $76b1e110a27b1ccd$export$fd9f9fc120c5402d));
    }
}
class $4620ae0dc40f0031$export$7f04ce188c91447c {
    has(type) {
        if (this.includesUnknownTypes || type === $4620ae0dc40f0031$export$990fced5dfac2637 && this.types.has((0, $76b1e110a27b1ccd$export$f8fc6581787339b3))) return true;
        return typeof type === "string" && this.types.has(type);
    }
    constructor(dataTransfer){
        this.types = new Set();
        let hasFiles = false;
        for (let item of dataTransfer.items)if (item.type !== (0, $76b1e110a27b1ccd$export$fd9f9fc120c5402d)) {
            if (item.kind === "file") hasFiles = true;
            if (item.type) this.types.add(item.type);
            else // Files with unknown types or extensions that don't map to a known mime type
            // are sometimes exposed as an empty string by the browser. Map to a generic
            // mime type instead. Note that this could also be a directory as there's no
            // way to determine if something is a file or directory until drop.
            this.types.add((0, $76b1e110a27b1ccd$export$f8fc6581787339b3));
        }
        // In Safari, when dragging files, the dataTransfer.items list is empty, but dataTransfer.types contains "Files".
        // Unfortunately, this doesn't tell us what types of files the user is dragging, so we need to assume that any
        // type the user checks for is included. See https://bugs.webkit.org/show_bug.cgi?id=223517.
        this.includesUnknownTypes = !hasFiles && dataTransfer.types.includes("Files");
    }
}
function $4620ae0dc40f0031$export$d9e760437831f8b3(dataTransfer) {
    let items = [];
    // If our custom drag type is available, use that. This is a JSON serialized
    // representation of all items in the drag, set when there are multiple items
    // of the same type, or an individual item has multiple representations.
    let hasCustomType = false;
    if (dataTransfer.types.includes((0, $76b1e110a27b1ccd$export$fd9f9fc120c5402d))) try {
        let data = dataTransfer.getData((0, $76b1e110a27b1ccd$export$fd9f9fc120c5402d));
        let parsed = JSON.parse(data);
        for (let item of parsed)items.push({
            kind: "text",
            types: new Set(Object.keys(item)),
            getText: (type)=>Promise.resolve(item[type])
        });
        hasCustomType = true;
    } catch (e) {
    // ignore
    }
    // Otherwise, map native drag items to items of a single representation.
    if (!hasCustomType) {
        let stringItems = new Map();
        for (let item1 of dataTransfer.items){
            if (item1.kind === "string") // The data for all formats must be read here because the data transfer gets
            // cleared out after the event handler finishes. If the item has an empty string
            // as a type, the mime type is unknown. Map to a generic mime type instead.
            stringItems.set(item1.type || (0, $76b1e110a27b1ccd$export$f8fc6581787339b3), dataTransfer.getData(item1.type));
            else if (item1.kind === "file") {
                // Despite the name, webkitGetAsEntry is also implemented in Firefox and Edge.
                // In the future, we may use getAsFileSystemHandle instead, but that's currently
                // only implemented in Chrome.
                if (typeof item1.webkitGetAsEntry === "function") {
                    let entry = item1.webkitGetAsEntry();
                    // eslint-disable-next-line max-depth
                    if (!entry) continue;
                    // eslint-disable-next-line max-depth
                    if (entry.isFile) items.push($4620ae0dc40f0031$var$createFileItem(item1.getAsFile()));
                    else if (entry.isDirectory) items.push($4620ae0dc40f0031$var$createDirectoryItem(entry));
                } else // Assume it's a file.
                items.push($4620ae0dc40f0031$var$createFileItem(item1.getAsFile()));
            }
        }
        // All string items are different representations of the same item. There's no way to have
        // multiple string items at once in the current DataTransfer API.
        if (stringItems.size > 0) items.push({
            kind: "text",
            types: new Set(stringItems.keys()),
            getText: (type)=>Promise.resolve(stringItems.get(type))
        });
    }
    return items;
}
function $4620ae0dc40f0031$var$blobToString(blob) {
    if (typeof blob.text === "function") return blob.text();
    // Safari doesn't have the Blob#text() method yet...
    return new Promise((resolve, reject)=>{
        let reader = new FileReader;
        reader.onload = ()=>{
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsText(blob);
    });
}
function $4620ae0dc40f0031$var$createFileItem(file) {
    return {
        kind: "file",
        type: file.type || (0, $76b1e110a27b1ccd$export$f8fc6581787339b3),
        name: file.name,
        getText: ()=>$4620ae0dc40f0031$var$blobToString(file),
        getFile: ()=>Promise.resolve(file)
    };
}
function $4620ae0dc40f0031$var$createDirectoryItem(entry) {
    return {
        kind: "directory",
        name: entry.name,
        getEntries: ()=>$4620ae0dc40f0031$var$getEntries(entry)
    };
}
async function* $4620ae0dc40f0031$var$getEntries(item) {
    let reader = item.createReader();
    // We must call readEntries repeatedly because there may be a limit to the
    // number of entries that are returned at once.
    let entries;
    do {
        entries = await new Promise((resolve, reject)=>{
            reader.readEntries(resolve, reject);
        });
        for (let entry of entries){
            if (entry.isFile) {
                let file = await $4620ae0dc40f0031$var$getEntryFile(entry);
                yield $4620ae0dc40f0031$var$createFileItem(file);
            } else if (entry.isDirectory) yield $4620ae0dc40f0031$var$createDirectoryItem(entry);
        }
    }while (entries.length > 0);
}
function $4620ae0dc40f0031$var$getEntryFile(entry) {
    return new Promise((resolve, reject)=>entry.file(resolve, reject));
}
function $4620ae0dc40f0031$export$97fd558bdc44bea1(dropItem) {
    return dropItem.kind === "text";
}
function $4620ae0dc40f0031$export$a144e1752ebe0aa(dropItem) {
    return dropItem.kind === "file";
}
function $4620ae0dc40f0031$export$2b40a62bdbe6b2b0(dropItem) {
    return dropItem.kind === "directory";
}
let $4620ae0dc40f0031$export$6ca6700462636d0b = {
    draggingKeys: new Set()
};
function $4620ae0dc40f0031$export$f2be18a910c0caa6(ref) {
    $4620ae0dc40f0031$export$6ca6700462636d0b.draggingCollectionRef = ref;
}
function $4620ae0dc40f0031$export$72cb63bdda528276(keys) {
    $4620ae0dc40f0031$export$6ca6700462636d0b.draggingKeys = keys;
}
function $4620ae0dc40f0031$export$dac8db29d42db9a1(ref) {
    $4620ae0dc40f0031$export$6ca6700462636d0b.dropCollectionRef = ref;
}
function $4620ae0dc40f0031$export$70936501603e6c57() {
    $4620ae0dc40f0031$export$6ca6700462636d0b = {
        draggingKeys: new Set()
    };
}
function $4620ae0dc40f0031$export$6c10d32b362bfa5f(state) {
    $4620ae0dc40f0031$export$6ca6700462636d0b = state;
}
function $4620ae0dc40f0031$export$78bf638634500fa5(ref) {
    let { draggingCollectionRef: draggingCollectionRef , dropCollectionRef: dropCollectionRef  } = $4620ae0dc40f0031$export$6ca6700462636d0b;
    return (draggingCollectionRef === null || draggingCollectionRef === void 0 ? void 0 : draggingCollectionRef.current) != null && draggingCollectionRef.current === ((ref === null || ref === void 0 ? void 0 : ref.current) || (dropCollectionRef === null || dropCollectionRef === void 0 ? void 0 : dropCollectionRef.current));
}
let $4620ae0dc40f0031$export$8e6636520ac15722;
function $4620ae0dc40f0031$export$64f52ed7349ddb84(dropEffect) {
    $4620ae0dc40f0031$export$8e6636520ac15722 = dropEffect;
}
let $4620ae0dc40f0031$export$f0130eb70b6347b8 = (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).none;
function $4620ae0dc40f0031$export$6539bc8c3a0a2d67(o) {
    $4620ae0dc40f0031$export$f0130eb70b6347b8 = o;
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





let $28e10663603f5ea1$var$dropTargets = new Map();
let $28e10663603f5ea1$var$dropItems = new Map();
let $28e10663603f5ea1$var$dragSession = null;
let $28e10663603f5ea1$var$subscriptions = new Set();
function $28e10663603f5ea1$export$c28d9fb4a54e471a(target) {
    $28e10663603f5ea1$var$dropTargets.set(target.element, target);
    $28e10663603f5ea1$var$dragSession === null || $28e10663603f5ea1$var$dragSession === void 0 ? void 0 : $28e10663603f5ea1$var$dragSession.updateValidDropTargets();
    return ()=>{
        $28e10663603f5ea1$var$dropTargets.delete(target.element);
        $28e10663603f5ea1$var$dragSession === null || $28e10663603f5ea1$var$dragSession === void 0 ? void 0 : $28e10663603f5ea1$var$dragSession.updateValidDropTargets();
    };
}
function $28e10663603f5ea1$export$aef80212ac99c003(item) {
    $28e10663603f5ea1$var$dropItems.set(item.element, item);
    return ()=>{
        $28e10663603f5ea1$var$dropItems.delete(item.element);
    };
}
function $28e10663603f5ea1$export$549dbcf8649bf3b2(target, stringFormatter) {
    if ($28e10663603f5ea1$var$dragSession) throw new Error("Cannot begin dragging while already dragging");
    $28e10663603f5ea1$var$dragSession = new $28e10663603f5ea1$var$DragSession(target, stringFormatter);
    requestAnimationFrame(()=>{
        $28e10663603f5ea1$var$dragSession.setup();
        if ((0, $4620ae0dc40f0031$export$1fb2158d224b542c)() === "keyboard") $28e10663603f5ea1$var$dragSession.next();
    });
    for (let cb of $28e10663603f5ea1$var$subscriptions)cb();
}
function $28e10663603f5ea1$export$418e185dd3f1b968() {
    let [session, setSession] = (0, $4vY0V$react.useState)($28e10663603f5ea1$var$dragSession);
    (0, $4vY0V$react.useEffect)(()=>{
        let cb = ()=>setSession($28e10663603f5ea1$var$dragSession);
        $28e10663603f5ea1$var$subscriptions.add(cb);
        return ()=>{
            $28e10663603f5ea1$var$subscriptions.delete(cb);
        };
    }, []);
    return session;
}
function $28e10663603f5ea1$export$403bc76cbf68cf60() {
    return !!$28e10663603f5ea1$var$dragSession;
}
function $28e10663603f5ea1$var$endDragging() {
    $28e10663603f5ea1$var$dragSession = null;
    for (let cb of $28e10663603f5ea1$var$subscriptions)cb();
}
function $28e10663603f5ea1$export$7454aff2e161f241(element) {
    for (let target of $28e10663603f5ea1$var$dropTargets.keys()){
        if (target.contains(element)) return true;
    }
    return false;
}
const $28e10663603f5ea1$var$CANCELED_EVENTS = [
    "pointerdown",
    "pointermove",
    "pointerenter",
    "pointerleave",
    "pointerover",
    "pointerout",
    "pointerup",
    "mousedown",
    "mousemove",
    "mouseenter",
    "mouseleave",
    "mouseover",
    "mouseout",
    "mouseup",
    "touchstart",
    "touchmove",
    "touchend",
    "focusin",
    "focusout"
];
const $28e10663603f5ea1$var$CLICK_EVENTS = [
    "pointerup",
    "mouseup",
    "touchend"
];
const $28e10663603f5ea1$var$MESSAGES = {
    keyboard: "dragStartedKeyboard",
    touch: "dragStartedTouch",
    virtual: "dragStartedVirtual"
};
class $28e10663603f5ea1$var$DragSession {
    setup() {
        document.addEventListener("keydown", this.onKeyDown, true);
        document.addEventListener("keyup", this.onKeyUp, true);
        window.addEventListener("focus", this.onFocus, true);
        window.addEventListener("blur", this.onBlur, true);
        document.addEventListener("click", this.onClick, true);
        document.addEventListener("pointerdown", this.onPointerDown, true);
        for (let event of $28e10663603f5ea1$var$CANCELED_EVENTS)document.addEventListener(event, this.cancelEvent, true);
        this.mutationObserver = new MutationObserver(()=>this.updateValidDropTargets());
        this.updateValidDropTargets();
        (0, $4vY0V$reactarialiveannouncer.announce)(this.stringFormatter.format($28e10663603f5ea1$var$MESSAGES[(0, $4620ae0dc40f0031$export$1fb2158d224b542c)()]));
    }
    teardown() {
        document.removeEventListener("keydown", this.onKeyDown, true);
        document.removeEventListener("keyup", this.onKeyUp, true);
        window.removeEventListener("focus", this.onFocus, true);
        window.removeEventListener("blur", this.onBlur, true);
        document.removeEventListener("click", this.onClick, true);
        document.removeEventListener("pointerdown", this.onPointerDown, true);
        for (let event of $28e10663603f5ea1$var$CANCELED_EVENTS)document.removeEventListener(event, this.cancelEvent, true);
        this.mutationObserver.disconnect();
        this.restoreAriaHidden();
    }
    onKeyDown(e) {
        var _this_currentDropTarget;
        this.cancelEvent(e);
        if (e.key === "Escape") {
            this.cancel();
            return;
        }
        if (e.key === "Tab" && !(e.metaKey || e.altKey || e.ctrlKey)) {
            if (e.shiftKey) this.previous();
            else this.next();
        }
        if (typeof ((_this_currentDropTarget = this.currentDropTarget) === null || _this_currentDropTarget === void 0 ? void 0 : _this_currentDropTarget.onKeyDown) === "function") this.currentDropTarget.onKeyDown(e, this.dragTarget);
    }
    onKeyUp(e) {
        this.cancelEvent(e);
        if (e.key === "Enter") {
            if (e.altKey) this.activate();
            else this.drop();
        }
    }
    onFocus(e) {
        // Prevent focus events, except to the original drag target.
        if (e.target !== this.dragTarget.element) this.cancelEvent(e);
        // Ignore focus events on the window/document (JSDOM). Will be handled in onBlur, below.
        if (!(e.target instanceof HTMLElement) || e.target === this.dragTarget.element) return;
        let dropTarget = this.validDropTargets.find((target)=>target.element.contains(e.target));
        if (!dropTarget) {
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
            return;
        }
        let item = $28e10663603f5ea1$var$dropItems.get(e.target);
        this.setCurrentDropTarget(dropTarget, item);
    }
    onBlur(e) {
        if (e.target !== this.dragTarget.element) this.cancelEvent(e);
        // If nothing is gaining focus, or e.relatedTarget is the window/document (JSDOM),
        // restore focus back to the current drop target if any, or the original drag target.
        if (!e.relatedTarget || !(e.relatedTarget instanceof HTMLElement)) {
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
        }
    }
    onClick(e) {
        this.cancelEvent(e);
        if ((0, $4vY0V$reactariautils.isVirtualClick)(e) || this.isVirtualClick) {
            if (e.target === this.dragTarget.element) {
                this.cancel();
                return;
            }
            let dropTarget = this.validDropTargets.find((target)=>target.element.contains(e.target));
            if (dropTarget) {
                let item = $28e10663603f5ea1$var$dropItems.get(e.target);
                this.setCurrentDropTarget(dropTarget, item);
                this.drop(item);
            }
        }
    }
    onPointerDown(e) {
        // Android Talkback double tap has e.detail = 1 for onClick. Detect the virtual click in onPointerDown before onClick fires
        // so we can properly perform cancel and drop operations.
        this.cancelEvent(e);
        this.isVirtualClick = (0, $4vY0V$reactariautils.isVirtualPointerEvent)(e);
    }
    cancelEvent(e) {
        var _this_dragTarget;
        // Allow focusin and focusout on the drag target so focus ring works properly.
        if ((e.type === "focusin" || e.type === "focusout") && e.target === ((_this_dragTarget = this.dragTarget) === null || _this_dragTarget === void 0 ? void 0 : _this_dragTarget.element)) return;
        // Allow default for events that might cancel a click event
        if (!$28e10663603f5ea1$var$CLICK_EVENTS.includes(e.type)) e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    updateValidDropTargets() {
        if (!this.mutationObserver) return;
        this.mutationObserver.disconnect();
        if (this.restoreAriaHidden) this.restoreAriaHidden();
        this.validDropTargets = $28e10663603f5ea1$var$findValidDropTargets(this.dragTarget);
        // Shuffle drop target order based on starting drag target.
        if (this.validDropTargets.length > 0) {
            let nearestIndex = this.findNearestDropTarget();
            this.validDropTargets = [
                ...this.validDropTargets.slice(nearestIndex),
                ...this.validDropTargets.slice(0, nearestIndex)
            ];
        }
        if (this.currentDropTarget && !this.validDropTargets.includes(this.currentDropTarget)) this.setCurrentDropTarget(this.validDropTargets[0]);
        // Find valid drop items within collections
        let types = (0, $4620ae0dc40f0031$export$e1d41611756c6326)(this.dragTarget.items);
        let validDropItems = [
            ...$28e10663603f5ea1$var$dropItems.values()
        ].filter((item)=>{
            if (typeof item.getDropOperation === "function") return item.getDropOperation(types, this.dragTarget.allowedDropOperations) !== "cancel";
            return true;
        });
        // Filter out drop targets that contain valid items. We don't want to stop hiding elements
        // other than the drop items that exist inside the collection.
        let visibleDropTargets = this.validDropTargets.filter((target)=>!validDropItems.some((item)=>target.element.contains(item.element)));
        this.restoreAriaHidden = (0, $4vY0V$reactariaoverlays.ariaHideOutside)([
            this.dragTarget.element,
            ...validDropItems.map((item)=>item.element),
            ...visibleDropTargets.map((target)=>target.element)
        ]);
        this.mutationObserver.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: [
                "aria-hidden"
            ]
        });
    }
    next() {
        if (!this.currentDropTarget) {
            this.setCurrentDropTarget(this.validDropTargets[0]);
            return;
        }
        let index = this.validDropTargets.indexOf(this.currentDropTarget);
        if (index < 0) {
            this.setCurrentDropTarget(this.validDropTargets[0]);
            return;
        }
        // If we've reached the end of the valid drop targets, cycle back to the original drag target.
        // This lets the user cancel the drag in case they don't have an Escape key (e.g. iPad keyboard case).
        if (index === this.validDropTargets.length - 1) {
            if (!this.dragTarget.element.closest('[aria-hidden="true"]')) {
                this.setCurrentDropTarget(null);
                this.dragTarget.element.focus();
            } else this.setCurrentDropTarget(this.validDropTargets[0]);
        } else this.setCurrentDropTarget(this.validDropTargets[index + 1]);
    }
    previous() {
        if (!this.currentDropTarget) {
            this.setCurrentDropTarget(this.validDropTargets[this.validDropTargets.length - 1]);
            return;
        }
        let index = this.validDropTargets.indexOf(this.currentDropTarget);
        if (index < 0) {
            this.setCurrentDropTarget(this.validDropTargets[this.validDropTargets.length - 1]);
            return;
        }
        // If we've reached the start of the valid drop targets, cycle back to the original drag target.
        // This lets the user cancel the drag in case they don't have an Escape key (e.g. iPad keyboard case).
        if (index === 0) {
            if (!this.dragTarget.element.closest('[aria-hidden="true"]')) {
                this.setCurrentDropTarget(null);
                this.dragTarget.element.focus();
            } else this.setCurrentDropTarget(this.validDropTargets[this.validDropTargets.length - 1]);
        } else this.setCurrentDropTarget(this.validDropTargets[index - 1]);
    }
    findNearestDropTarget() {
        let dragTargetRect = this.dragTarget.element.getBoundingClientRect();
        let minDistance = Infinity;
        let nearest = -1;
        for(let i = 0; i < this.validDropTargets.length; i++){
            let dropTarget = this.validDropTargets[i];
            let rect = dropTarget.element.getBoundingClientRect();
            let dx = rect.left - dragTargetRect.left;
            let dy = rect.top - dragTargetRect.top;
            let dist = dx * dx + dy * dy;
            if (dist < minDistance) {
                minDistance = dist;
                nearest = i;
            }
        }
        return nearest;
    }
    setCurrentDropTarget(dropTarget, item) {
        if (dropTarget !== this.currentDropTarget) {
            if (this.currentDropTarget && typeof this.currentDropTarget.onDropExit === "function") {
                let rect = this.currentDropTarget.element.getBoundingClientRect();
                this.currentDropTarget.onDropExit({
                    type: "dropexit",
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                });
            }
            this.currentDropTarget = dropTarget;
            if (dropTarget) {
                if (typeof dropTarget.onDropEnter === "function") {
                    let rect1 = dropTarget.element.getBoundingClientRect();
                    dropTarget.onDropEnter({
                        type: "dropenter",
                        x: rect1.left + rect1.width / 2,
                        y: rect1.top + rect1.height / 2
                    }, this.dragTarget);
                }
                if (!item) dropTarget === null || dropTarget === void 0 ? void 0 : dropTarget.element.focus();
            }
        }
        if (item !== this.currentDropItem) {
            if (item && typeof this.currentDropTarget.onDropTargetEnter === "function") this.currentDropTarget.onDropTargetEnter(item === null || item === void 0 ? void 0 : item.target);
            item === null || item === void 0 ? void 0 : item.element.focus();
            this.currentDropItem = item;
            // Annouce first drop target after drag start announcement finishes.
            // Otherwise, it will never get announced because drag start announcement is assertive.
            if (!this.initialFocused) {
                (0, $4vY0V$reactarialiveannouncer.announce)(item === null || item === void 0 ? void 0 : item.element.getAttribute("aria-label"), "polite");
                this.initialFocused = true;
            }
        }
    }
    end() {
        this.teardown();
        if (typeof this.dragTarget.onDragEnd === "function") {
            let target = this.currentDropTarget && this.dropOperation !== "cancel" ? this.currentDropTarget : this.dragTarget;
            let rect = target.element.getBoundingClientRect();
            this.dragTarget.onDragEnd({
                type: "dragend",
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                dropOperation: this.dropOperation || "cancel"
            });
        }
        // Blur and re-focus the drop target so that the focus ring appears.
        if (this.currentDropTarget) {
            // Since we cancel all focus events in drag sessions, refire blur to make sure state gets updated so drag target doesn't think it's still focused
            // i.e. When you from one list to another during a drag session, we need the blur to fire on the first list after the drag.
            if (!this.dragTarget.element.contains(this.currentDropTarget.element)) {
                this.dragTarget.element.dispatchEvent(new FocusEvent("blur"));
                this.dragTarget.element.dispatchEvent(new FocusEvent("focusout", {
                    bubbles: true
                }));
            }
            // Re-focus the focusedKey upon reorder. This requires a React rerender between blurring and focusing.
            (0, $4vY0V$reactdom.flushSync)(()=>{
                this.currentDropTarget.element.blur();
            });
            this.currentDropTarget.element.focus();
        }
        this.setCurrentDropTarget(null);
        $28e10663603f5ea1$var$endDragging();
    }
    cancel() {
        this.end();
        if (!this.dragTarget.element.closest('[aria-hidden="true"]')) this.dragTarget.element.focus();
        (0, $4vY0V$reactarialiveannouncer.announce)(this.stringFormatter.format("dropCanceled"));
    }
    drop(item) {
        if (!this.currentDropTarget) {
            this.cancel();
            return;
        }
        if (typeof (item === null || item === void 0 ? void 0 : item.getDropOperation) === "function") {
            let types = (0, $4620ae0dc40f0031$export$e1d41611756c6326)(this.dragTarget.items);
            this.dropOperation = item.getDropOperation(types, this.dragTarget.allowedDropOperations);
        } else if (typeof this.currentDropTarget.getDropOperation === "function") {
            let types1 = (0, $4620ae0dc40f0031$export$e1d41611756c6326)(this.dragTarget.items);
            this.dropOperation = this.currentDropTarget.getDropOperation(types1, this.dragTarget.allowedDropOperations);
        } else // TODO: show menu ??
        this.dropOperation = this.dragTarget.allowedDropOperations[0];
        if (typeof this.currentDropTarget.onDrop === "function") {
            let items = this.dragTarget.items.map((item)=>({
                    kind: "text",
                    types: new Set(Object.keys(item)),
                    getText: (type)=>Promise.resolve(item[type])
                }));
            let rect = this.currentDropTarget.element.getBoundingClientRect();
            this.currentDropTarget.onDrop({
                type: "drop",
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                items: items,
                dropOperation: this.dropOperation
            }, item === null || item === void 0 ? void 0 : item.target);
        }
        this.end();
        (0, $4vY0V$reactarialiveannouncer.announce)(this.stringFormatter.format("dropComplete"));
    }
    activate() {
        if (this.currentDropTarget && typeof this.currentDropTarget.onDropActivate === "function") {
            let rect = this.currentDropTarget.element.getBoundingClientRect();
            this.currentDropTarget.onDropActivate({
                type: "dropactivate",
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            });
        }
    }
    constructor(target, stringFormatter){
        this.dragTarget = target;
        this.stringFormatter = stringFormatter;
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.cancelEvent = this.cancelEvent.bind(this);
        this.initialFocused = false;
    }
}
function $28e10663603f5ea1$var$findValidDropTargets(options) {
    let types = (0, $4620ae0dc40f0031$export$e1d41611756c6326)(options.items);
    return [
        ...$28e10663603f5ea1$var$dropTargets.values()
    ].filter((target)=>{
        if (target.element.closest('[aria-hidden="true"]')) return false;
        if (typeof target.getDropOperation === "function") return target.getDropOperation(types, options.allowedDropOperations) !== "cancel";
        return true;
    });
}




var $d624b4da796f302a$exports = {};
var $12ee6b0bfb4232ad$exports = {};
$12ee6b0bfb4232ad$exports = {
    "dragDescriptionKeyboard": `اضغط Enter لبدء السحب.`,
    "dragDescriptionKeyboardAlt": `اضغط على Alt + Enter لبدء السحب.`,
    "dragDescriptionLongPress": `اضغط باستمرار لبدء السحب.`,
    "dragDescriptionTouch": `اضغط مرتين لبدء السحب.`,
    "dragDescriptionVirtual": `انقر لبدء السحب.`,
    "dragItem": (args)=>`اسحب ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`اسحب ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} عنصر محدد`,
            other: ()=>`${formatter.number(args.count)} عناصر محددة`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`اضغط على Enter للسحب ${formatter.plural(args.count, {
            one: `عدد العناصر المختارة`,
            other: `عدد العناصر المختارة`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`اضغط على مفتاحي Alt + Enter للسحب ${formatter.plural(args.count, {
            one: `عدد العناصر المختارة`,
            other: `عدد العناصر المختارة`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`اضغط باستمرار للسحب ${formatter.plural(args.count, {
            one: `عدد العناصر المختارة`,
            other: `عدد العناصر المختارة`
        })}.`,
    "dragStartedKeyboard": `بدأ السحب. اضغط Tab للانتقال إلى موضع الإفلات، ثم اضغط Enter للإفلات، أو اضغط Escape للإلغاء.`,
    "dragStartedTouch": `بدأ السحب. انتقل إلى موضع الإفلات، ثم اضغط مرتين للإفلات.`,
    "dragStartedVirtual": `بدأ السحب. انتقل إلى مكان الإفلات، ثم انقر أو اضغط Enter للإفلات.`,
    "dropCanceled": `تم إلغاء الإفلات.`,
    "dropComplete": `اكتمل الإفلات.`,
    "dropDescriptionKeyboard": `اضغط Enter للإفلات. اضغط Escape لإلغاء السحب.`,
    "dropDescriptionTouch": `اضغط مرتين للإفلات.`,
    "dropDescriptionVirtual": `انقر للإفلات.`,
    "dropIndicator": `مؤشر الإفلات`,
    "dropOnItem": (args)=>`إفلات ${args.itemText}`,
    "dropOnRoot": `الإفلات`,
    "endDragKeyboard": `السحب. اضغط Enter لإلغاء السحب.`,
    "endDragTouch": `السحب. اضغط مرتين لإلغاء السحب.`,
    "endDragVirtual": `السحب. انقر لإلغاء السحب.`,
    "insertAfter": (args)=>`أدخل بعد ${args.itemText}`,
    "insertBefore": (args)=>`أدخل قبل ${args.itemText}`,
    "insertBetween": (args)=>`أدخل بين ${args.beforeItemText} و ${args.afterItemText}`
};


var $e21ef7c55796c5e1$exports = {};
$e21ef7c55796c5e1$exports = {
    "dragDescriptionKeyboard": `Натиснете „Enter“, за да започнете да плъзгате.`,
    "dragDescriptionKeyboardAlt": `Натиснете Alt + Enter, за да започнете да плъзгате.`,
    "dragDescriptionLongPress": `Натиснете продължително, за да започнете да плъзгате.`,
    "dragDescriptionTouch": `Натиснете двукратно, за да започнете да плъзгате.`,
    "dragDescriptionVirtual": `Щракнете, за да започнете да плъзгате.`,
    "dragItem": (args)=>`Плъзни ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Плъзни ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} избран елемент`,
            other: ()=>`${formatter.number(args.count)} избрани елемента`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Натиснете Enter, за да плъзнете ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} избран елемент`,
            other: ()=>`${formatter.number(args.count)} избрани елементи`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Натиснете Alt и Enter, за да плъзнете ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} избран елемент`,
            other: ()=>`${formatter.number(args.count)} избрани елементи`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Натиснете продължително, за да плъзнете ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} избран елемент`,
            other: ()=>`${formatter.number(args.count)} избрани елементи`
        })}.`,
    "dragStartedKeyboard": `Започна плъзгане. Натиснете „Tab“, за да се придвижите до целта, след което натиснете „Enter“ за пускане или натиснете „Escape“ за отмяна.`,
    "dragStartedTouch": `Започна плъзгане. Придвижете се до целта, след което натиснете двукратно, за да пуснете.`,
    "dragStartedVirtual": `Започна плъзгане. Придвижете се до целта, след което щракнете или натиснете „Enter“ за пускане.`,
    "dropCanceled": `Пускането е отменено.`,
    "dropComplete": `Пускането е завършено.`,
    "dropDescriptionKeyboard": `Натиснете „Enter“ за пускане. Натиснете „Escape“ за отмяна на плъзгането.`,
    "dropDescriptionTouch": `Натиснете двукратно за пускане.`,
    "dropDescriptionVirtual": `Щракнете за пускане.`,
    "dropIndicator": `индикатор за пускане`,
    "dropOnItem": (args)=>`Пусни върху ${args.itemText}`,
    "dropOnRoot": `Пусни върху`,
    "endDragKeyboard": `Плъзгане. Натиснете „Enter“ за отмяна на плъзгането.`,
    "endDragTouch": `Плъзгане. Натиснете двукратно за отмяна на плъзгането.`,
    "endDragVirtual": `Плъзгане. Щракнете за отмяна.`,
    "insertAfter": (args)=>`Вмъкни след ${args.itemText}`,
    "insertBefore": (args)=>`Вмъкни преди ${args.itemText}`,
    "insertBetween": (args)=>`Вмъкни между ${args.beforeItemText} и ${args.afterItemText}`
};


var $dfa9cd1c2317d9aa$exports = {};
$dfa9cd1c2317d9aa$exports = {
    "dragDescriptionKeyboard": `Stisknutím klávesy Enter začnete s přetahováním.`,
    "dragDescriptionKeyboardAlt": `Stisknutím Alt + Enter zahájíte přetahování.`,
    "dragDescriptionLongPress": `Dlouhým stisknutím zahájíte přetahování.`,
    "dragDescriptionTouch": `Poklepáním začnete s přetahováním.`,
    "dragDescriptionVirtual": `Kliknutím začnete s přetahováním.`,
    "dragItem": (args)=>`Přetáhnout ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Přetáhnout ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybranou položku`,
            few: ()=>`${formatter.number(args.count)} vybrané položky`,
            other: ()=>`${formatter.number(args.count)} vybraných položek`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Stisknutím klávesy Enter přetáhněte ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybranou položku`,
            other: ()=>`${formatter.number(args.count)} vybrané položky`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Stisknutím Alt + Enter přetáhněte ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybranou položku`,
            other: ()=>`${formatter.number(args.count)} vybrané položky`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Dlouhým stisknutím přetáhnete ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybranou položku`,
            other: ()=>`${formatter.number(args.count)} vybrané položky`
        })}.`,
    "dragStartedKeyboard": `Začněte s přetahováním. Po stisknutí klávesy Tab najděte požadovaný cíl a stisknutím klávesy Enter přetažení dokončete nebo stisknutím klávesy Esc akci zrušte.`,
    "dragStartedTouch": `Začněte s přetahováním. Najděte požadovaný cíl a poklepáním přetažení dokončete.`,
    "dragStartedVirtual": `Začněte s přetahováním. Najděte požadovaný cíl a kliknutím nebo stisknutím klávesy Enter přetažení dokončete.`,
    "dropCanceled": `Přetažení bylo zrušeno.`,
    "dropComplete": `Přetažení bylo dokončeno.`,
    "dropDescriptionKeyboard": `Stisknutím klávesy Enter přetažení dokončete nebo stisknutím klávesy Esc akci zrušte.`,
    "dropDescriptionTouch": `Poklepáním přetažení dokončete.`,
    "dropDescriptionVirtual": `Kliknutím objekt přetáhněte.`,
    "dropIndicator": `indikátor přetažení`,
    "dropOnItem": (args)=>`Přetáhnout na ${args.itemText}`,
    "dropOnRoot": `Přetáhnout na`,
    "endDragKeyboard": `Probíhá přetahování. Stisknutím klávesy Enter přetažení zrušíte.`,
    "endDragTouch": `Probíhá přetahování. Poklepáním přetažení zrušíte.`,
    "endDragVirtual": `Probíhá přetahování. Kliknutím přetažení zrušíte.`,
    "insertAfter": (args)=>`Vložit za ${args.itemText}`,
    "insertBefore": (args)=>`Vložit před ${args.itemText}`,
    "insertBetween": (args)=>`Vložit mezi ${args.beforeItemText} a ${args.afterItemText}`
};


var $65fff3bbacfa8956$exports = {};
$65fff3bbacfa8956$exports = {
    "dragDescriptionKeyboard": `Tryk på Enter for at starte med at trække.`,
    "dragDescriptionKeyboardAlt": `Tryk på Alt + Enter for at starte med at trække.`,
    "dragDescriptionLongPress": `Tryk længe for at starte med at trække.`,
    "dragDescriptionTouch": `Dobbelttryk for at starte med at trække.`,
    "dragDescriptionVirtual": `Klik for at starte med at trække.`,
    "dragItem": (args)=>`Træk ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Træk ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Tryk på Enter for at trække ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgte element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Tryk på Alt + Enter for at trække ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgte element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Tryk længe for at trække ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgte element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragStartedKeyboard": `Startet med at trække. Tryk på Tab for at gå til et slip-mål, tryk derefter på Enter for at slippe, eller tryk på Escape for at annullere.`,
    "dragStartedTouch": `Startet med at trække. Gå til et slip-mål, og dobbelttryk derefter for at slippe.`,
    "dragStartedVirtual": `Startet med at trække. Gå til et slip-mål, og klik eller tryk derefter på enter for at slippe.`,
    "dropCanceled": `Slip annulleret.`,
    "dropComplete": `Slip fuldført.`,
    "dropDescriptionKeyboard": `Tryk på Enter for at slippe. Tryk på Escape for at annullere trækning.`,
    "dropDescriptionTouch": `Dobbelttryk for at slippe.`,
    "dropDescriptionVirtual": `Klik for at slippe.`,
    "dropIndicator": `slip-indikator`,
    "dropOnItem": (args)=>`Slip på ${args.itemText}`,
    "dropOnRoot": `Slip på`,
    "endDragKeyboard": `Trækning. Tryk på enter for at annullere træk.`,
    "endDragTouch": `Trækning. Dobbelttryk for at annullere træk.`,
    "endDragVirtual": `Trækning. Klik for at annullere trækning.`,
    "insertAfter": (args)=>`Indsæt efter ${args.itemText}`,
    "insertBefore": (args)=>`Indsæt før ${args.itemText}`,
    "insertBetween": (args)=>`Indsæt mellem ${args.beforeItemText} og ${args.afterItemText}`
};


var $10b7dfe45cd41c2d$exports = {};
$10b7dfe45cd41c2d$exports = {
    "dragDescriptionKeyboard": `Drücken Sie die Eingabetaste, um den Ziehvorgang zu starten.`,
    "dragDescriptionKeyboardAlt": `Alt + Eingabe drücken, um den Ziehvorgang zu starten.`,
    "dragDescriptionLongPress": `Lang drücken, um mit dem Ziehen zu beginnen.`,
    "dragDescriptionTouch": `Tippen Sie doppelt, um den Ziehvorgang zu starten.`,
    "dragDescriptionVirtual": `Zum Starten des Ziehvorgangs klicken.`,
    "dragItem": (args)=>`${args.itemText} ziehen`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ausgewähltes Objekt`,
            other: ()=>`${formatter.number(args.count)} ausgewählte Objekte`
        })} ziehen`,
    "dragSelectedKeyboard": (args, formatter)=>`Eingabetaste drücken, um ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ausgewähltes Element`,
            other: ()=>`${formatter.number(args.count)} ausgewählte Elemente`
        })} zu ziehen.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Alt + Eingabetaste drücken, um ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ausgewähltes Element`,
            other: ()=>`${formatter.number(args.count)} ausgewählte Elemente`
        })} zu ziehen.`,
    "dragSelectedLongPress": (args, formatter)=>`Lang drücken, um ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ausgewähltes Element`,
            other: ()=>`${formatter.number(args.count)} ausgewählte Elemente`
        })} zu ziehen.`,
    "dragStartedKeyboard": `Ziehvorgang gestartet. Drücken Sie die Tabulatortaste, um zu einem Ablegeziel zu navigieren und drücken Sie dann die Eingabetaste, um das Objekt abzulegen, oder Escape, um den Vorgang abzubrechen.`,
    "dragStartedTouch": `Ziehvorgang gestartet. Navigieren Sie zu einem Ablegeziel und tippen Sie doppelt, um das Objekt abzulegen.`,
    "dragStartedVirtual": `Ziehvorgang gestartet. Navigieren Sie zu einem Ablegeziel und klicken Sie oder drücken Sie die Eingabetaste, um das Objekt abzulegen.`,
    "dropCanceled": `Ablegen abgebrochen.`,
    "dropComplete": `Ablegen abgeschlossen.`,
    "dropDescriptionKeyboard": `Drücken Sie die Eingabetaste, um das Objekt abzulegen. Drücken Sie Escape, um den Vorgang abzubrechen.`,
    "dropDescriptionTouch": `Tippen Sie doppelt, um das Objekt abzulegen.`,
    "dropDescriptionVirtual": `Zum Ablegen klicken.`,
    "dropIndicator": `Ablegeanzeiger`,
    "dropOnItem": (args)=>`Auf ${args.itemText} ablegen`,
    "dropOnRoot": `Ablegen auf`,
    "endDragKeyboard": `Ziehvorgang läuft. Drücken Sie die Eingabetaste, um den Vorgang abzubrechen.`,
    "endDragTouch": `Ziehvorgang läuft. Tippen Sie doppelt, um den Vorgang abzubrechen.`,
    "endDragVirtual": `Ziehvorgang läuft. Klicken Sie, um den Vorgang abzubrechen.`,
    "insertAfter": (args)=>`Nach ${args.itemText} einfügen`,
    "insertBefore": (args)=>`Vor ${args.itemText} einfügen`,
    "insertBetween": (args)=>`Zwischen ${args.beforeItemText} und ${args.afterItemText} einfügen`
};


var $0cadcffb7abc96b8$exports = {};
$0cadcffb7abc96b8$exports = {
    "dragDescriptionKeyboard": `Πατήστε Enter για έναρξη της μεταφοράς.`,
    "dragDescriptionKeyboardAlt": `Πατήστε Alt + Enter για έναρξη της μεταφοράς.`,
    "dragDescriptionLongPress": `Πατήστε παρατεταμένα για να ξεκινήσετε τη μεταφορά.`,
    "dragDescriptionTouch": `Πατήστε δύο φορές για έναρξη της μεταφοράς.`,
    "dragDescriptionVirtual": `Κάντε κλικ για να ξεκινήσετε τη μεταφορά.`,
    "dragItem": (args)=>`Μεταφορά ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Μεταφορά σε ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} επιλεγμένο στοιχείο`,
            other: ()=>`${formatter.number(args.count)} επιλεγμένα στοιχεία`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Πατήστε Enter για να σύρετε ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} επιλεγμένο στοιχείο`,
            other: ()=>`${formatter.number(args.count)} επιλεγμένα στοιχεία`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Πατήστε Alt + Enter για να σύρετε ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} επιλεγμένο στοιχείο`,
            other: ()=>`${formatter.number(args.count)} επιλεγμένα στοιχεία`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Πατήστε παρατεταμένα για να σύρετε ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} επιλεγμένο στοιχείο`,
            other: ()=>`${formatter.number(args.count)} επιλεγμένα στοιχεία`
        })}.`,
    "dragStartedKeyboard": `Η μεταφορά ξεκίνησε. Πατήστε το πλήκτρο Tab για να μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, πατήστε Enter για απόθεση ή πατήστε Escape για ακύρωση.`,
    "dragStartedTouch": `Η μεταφορά ξεκίνησε. Μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, πατήστε δύο φορές για απόθεση.`,
    "dragStartedVirtual": `Η μεταφορά ξεκίνησε. Μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, κάντε κλικ ή πατήστε Enter για απόθεση.`,
    "dropCanceled": `Η απόθεση ακυρώθηκε.`,
    "dropComplete": `Η απόθεση ολοκληρώθηκε.`,
    "dropDescriptionKeyboard": `Πατήστε Enter για απόθεση. Πατήστε Escape για ακύρωση της μεταφοράς.`,
    "dropDescriptionTouch": `Πατήστε δύο φορές για απόθεση.`,
    "dropDescriptionVirtual": `Κάντε κλικ για απόθεση.`,
    "dropIndicator": `δείκτης απόθεσης`,
    "dropOnItem": (args)=>`Απόθεση σε ${args.itemText}`,
    "dropOnRoot": `Απόθεση σε`,
    "endDragKeyboard": `Μεταφορά σε εξέλιξη. Πατήστε Enter για ακύρωση της μεταφοράς.`,
    "endDragTouch": `Μεταφορά σε εξέλιξη. Πατήστε δύο φορές για ακύρωση της μεταφοράς.`,
    "endDragVirtual": `Μεταφορά σε εξέλιξη. Κάντε κλικ για ακύρωση της μεταφοράς.`,
    "insertAfter": (args)=>`Εισαγωγή μετά από ${args.itemText}`,
    "insertBefore": (args)=>`Εισαγωγή πριν από ${args.itemText}`,
    "insertBetween": (args)=>`Εισαγωγή μεταξύ ${args.beforeItemText} και ${args.afterItemText}`
};


var $7e3982b34ddf1bdf$exports = {};
$7e3982b34ddf1bdf$exports = {
    "dragItem": (args)=>`Drag ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}`,
    "dragDescriptionKeyboard": `Press Enter to start dragging.`,
    "dragDescriptionKeyboardAlt": `Press Alt + Enter to start dragging.`,
    "dragDescriptionTouch": `Double tap to start dragging.`,
    "dragDescriptionVirtual": `Click to start dragging.`,
    "dragDescriptionLongPress": `Long press to start dragging.`,
    "dragSelectedKeyboard": (args, formatter)=>`Press Enter to drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Press Alt + Enter to drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Long press to drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}.`,
    "dragStartedKeyboard": `Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.`,
    "dragStartedTouch": `Started dragging. Navigate to a drop target, then double tap to drop.`,
    "dragStartedVirtual": `Started dragging. Navigate to a drop target, then click or press Enter to drop.`,
    "endDragKeyboard": `Dragging. Press Enter to cancel drag.`,
    "endDragTouch": `Dragging. Double tap to cancel drag.`,
    "endDragVirtual": `Dragging. Click to cancel drag.`,
    "dropDescriptionKeyboard": `Press Enter to drop. Press Escape to cancel drag.`,
    "dropDescriptionTouch": `Double tap to drop.`,
    "dropDescriptionVirtual": `Click to drop.`,
    "dropCanceled": `Drop canceled.`,
    "dropComplete": `Drop complete.`,
    "dropIndicator": `drop indicator`,
    "dropOnRoot": `Drop on`,
    "dropOnItem": (args)=>`Drop on ${args.itemText}`,
    "insertBefore": (args)=>`Insert before ${args.itemText}`,
    "insertBetween": (args)=>`Insert between ${args.beforeItemText} and ${args.afterItemText}`,
    "insertAfter": (args)=>`Insert after ${args.itemText}`
};


var $cb29ce0b655c4023$exports = {};
$cb29ce0b655c4023$exports = {
    "dragDescriptionKeyboard": `Pulse Intro para empezar a arrastrar.`,
    "dragDescriptionKeyboardAlt": `Pulse Intro para empezar a arrastrar.`,
    "dragDescriptionLongPress": `Mantenga pulsado para comenzar a arrastrar.`,
    "dragDescriptionTouch": `Pulse dos veces para iniciar el arrastre.`,
    "dragDescriptionVirtual": `Haga clic para iniciar el arrastre.`,
    "dragItem": (args)=>`Arrastrar ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Arrastrar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento seleccionado`,
            other: ()=>`${formatter.number(args.count)} elementos seleccionados`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Pulse Intro para arrastrar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento seleccionado`,
            other: ()=>`${formatter.number(args.count)} elementos seleccionados`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Pulse Alt + Intro para arrastrar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento seleccionado`,
            other: ()=>`${formatter.number(args.count)} elementos seleccionados`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Mantenga pulsado para arrastrar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento seleccionado`,
            other: ()=>`${formatter.number(args.count)} elementos seleccionados`
        })}.`,
    "dragStartedKeyboard": `Se ha empezado a arrastrar. Pulse el tabulador para ir al destino de colocación y, a continuación, pulse Intro para soltar, o pulse Escape para cancelar.`,
    "dragStartedTouch": `Se ha empezado a arrastrar. Vaya al destino de colocación y, a continuación, pulse dos veces para soltar.`,
    "dragStartedVirtual": `Se ha empezado a arrastrar. Vaya al destino de colocación y, a continuación, haga clic o pulse Intro para soltar.`,
    "dropCanceled": `Se ha cancelado la colocación.`,
    "dropComplete": `Colocación finalizada.`,
    "dropDescriptionKeyboard": `Pulse Intro para soltar. Pulse Escape para cancelar el arrastre.`,
    "dropDescriptionTouch": `Pulse dos veces para soltar.`,
    "dropDescriptionVirtual": `Haga clic para soltar.`,
    "dropIndicator": `indicador de colocación`,
    "dropOnItem": (args)=>`Soltar en ${args.itemText}`,
    "dropOnRoot": `Soltar en`,
    "endDragKeyboard": `Arrastrando. Pulse Intro para cancelar el arrastre.`,
    "endDragTouch": `Arrastrando. Pulse dos veces para cancelar el arrastre.`,
    "endDragVirtual": `Arrastrando. Haga clic para cancelar el arrastre.`,
    "insertAfter": (args)=>`Insertar después de ${args.itemText}`,
    "insertBefore": (args)=>`Insertar antes de ${args.itemText}`,
    "insertBetween": (args)=>`Insertar entre ${args.beforeItemText} y ${args.afterItemText}`
};


var $067d46bab80bcf4b$exports = {};
$067d46bab80bcf4b$exports = {
    "dragDescriptionKeyboard": `Lohistamise alustamiseks vajutage klahvi Enter.`,
    "dragDescriptionKeyboardAlt": `Lohistamise alustamiseks vajutage klahvikombinatsiooni Alt + Enter.`,
    "dragDescriptionLongPress": `Vajutage pikalt lohistamise alustamiseks.`,
    "dragDescriptionTouch": `Topeltpuudutage lohistamise alustamiseks.`,
    "dragDescriptionVirtual": `Klõpsake lohistamise alustamiseks.`,
    "dragItem": (args)=>`Lohista ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Lohista ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud üksust`,
            other: ()=>`${formatter.number(args.count)} valitud üksust`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud üksuse`,
            other: ()=>`${formatter.number(args.count)} valitud üksuse`
        })} lohistamiseks vajutage sisestusklahvi Enter.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Lohistamiseks vajutage klahvikombinatsiooni Alt + Enter ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud üksuse`,
            other: ()=>`${formatter.number(args.count)} valitud üksuse`
        })} jaoks.`,
    "dragSelectedLongPress": (args, formatter)=>`Pikk vajutus ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud üksuse`,
            other: ()=>`${formatter.number(args.count)} valitud üksuse`
        })} lohistamiseks.`,
    "dragStartedKeyboard": `Alustati lohistamist. Kukutamise sihtmärgi juurde navigeerimiseks vajutage klahvi Tab, seejärel vajutage kukutamiseks klahvi Enter või loobumiseks klahvi Escape.`,
    "dragStartedTouch": `Alustati lohistamist. Navigeerige kukutamise sihtmärgi juurde ja topeltpuudutage kukutamiseks.`,
    "dragStartedVirtual": `Alustati lohistamist. Navigeerige kukutamise sihtmärgi juurde ja kukutamiseks klõpsake või vajutage klahvi Enter.`,
    "dropCanceled": `Lohistamisest loobuti.`,
    "dropComplete": `Lohistamine on tehtud.`,
    "dropDescriptionKeyboard": `Kukutamiseks vajutage klahvi Enter. Lohistamisest loobumiseks vajutage klahvi Escape.`,
    "dropDescriptionTouch": `Kukutamiseks topeltpuudutage.`,
    "dropDescriptionVirtual": `Kukutamiseks klõpsake.`,
    "dropIndicator": `lohistamise indikaator`,
    "dropOnItem": (args)=>`Kukuta asukohta ${args.itemText}`,
    "dropOnRoot": `Kukuta asukohta`,
    "endDragKeyboard": `Lohistamine. Lohistamisest loobumiseks vajutage klahvi Enter.`,
    "endDragTouch": `Lohistamine. Lohistamisest loobumiseks topeltpuudutage.`,
    "endDragVirtual": `Lohistamine. Lohistamisest loobumiseks klõpsake.`,
    "insertAfter": (args)=>`Sisesta ${args.itemText} järele`,
    "insertBefore": (args)=>`Sisesta ${args.itemText} ette`,
    "insertBetween": (args)=>`Sisesta ${args.beforeItemText} ja ${args.afterItemText} vahele`
};


var $8aa1b9a1f9d783d3$exports = {};
$8aa1b9a1f9d783d3$exports = {
    "dragDescriptionKeyboard": `Aloita vetäminen painamalla Enter-näppäintä.`,
    "dragDescriptionKeyboardAlt": `Aloita vetäminen painamalla Alt + Enter -näppäinyhdistelmää.`,
    "dragDescriptionLongPress": `Aloita vetäminen pitämällä painettuna.`,
    "dragDescriptionTouch": `Aloita vetäminen kaksoisnapauttamalla.`,
    "dragDescriptionVirtual": `Aloita vetäminen napsauttamalla.`,
    "dragItem": (args)=>`Vedä kohdetta ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Vedä ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valittua kohdetta`,
            other: ()=>`${formatter.number(args.count)} valittua kohdetta`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Vedä painamalla Enter ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valittu kohde`,
            other: ()=>`${formatter.number(args.count)} valittua kohdetta`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Vedä painamalla Alt + Enter ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valittu kohde`,
            other: ()=>`${formatter.number(args.count)} valittua kohdetta`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Vedä pitämällä painettuna ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valittu kohde`,
            other: ()=>`${formatter.number(args.count)} valittua kohdetta`
        })}.`,
    "dragStartedKeyboard": `Vetäminen aloitettu. Siirry pudotuskohteeseen painamalla sarkainnäppäintä ja sitten pudota painamalla Enter-näppäintä tai peruuta painamalla Escape-näppäintä.`,
    "dragStartedTouch": `Vetäminen aloitettu. Siirry pudotuskohteeseen ja pudota kaksoisnapauttamalla.`,
    "dragStartedVirtual": `Vetäminen aloitettu. Siirry pudotuskohteeseen ja pudota napsauttamalla tai painamalla Enter-näppäintä.`,
    "dropCanceled": `Pudotus peruutettu.`,
    "dropComplete": `Pudotus suoritettu.`,
    "dropDescriptionKeyboard": `Pudota painamalla Enter-näppäintä. Peruuta vetäminen painamalla Escape-näppäintä.`,
    "dropDescriptionTouch": `Pudota kaksoisnapauttamalla.`,
    "dropDescriptionVirtual": `Pudota napsauttamalla.`,
    "dropIndicator": `pudotuksen ilmaisin`,
    "dropOnItem": (args)=>`Pudota kohteeseen ${args.itemText}`,
    "dropOnRoot": `Pudota kohteeseen`,
    "endDragKeyboard": `Vedetään. Peruuta vetäminen painamalla Enter-näppäintä.`,
    "endDragTouch": `Vedetään. Peruuta vetäminen kaksoisnapauttamalla.`,
    "endDragVirtual": `Vedetään. Peruuta vetäminen napsauttamalla.`,
    "insertAfter": (args)=>`Lisää kohteen ${args.itemText} jälkeen`,
    "insertBefore": (args)=>`Lisää ennen kohdetta ${args.itemText}`,
    "insertBetween": (args)=>`Lisää kohteiden ${args.beforeItemText} ja ${args.afterItemText} väliin`
};


var $9e248ec27f7dc55f$exports = {};
$9e248ec27f7dc55f$exports = {
    "dragDescriptionKeyboard": `Appuyez sur Entrée pour commencer le déplacement.`,
    "dragDescriptionKeyboardAlt": `Appuyez sur Alt + Entrée pour commencer à faire glisser.`,
    "dragDescriptionLongPress": `Appuyez de manière prolongée pour commencer à faire glisser.`,
    "dragDescriptionTouch": `Touchez deux fois pour commencer le déplacement.`,
    "dragDescriptionVirtual": `Cliquez pour commencer le déplacement.`,
    "dragItem": (args)=>`Déplacer ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Déplacer ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} élément sélectionné`,
            other: ()=>`${formatter.number(args.count)} éléments sélectionnés`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Appuyez sur Entrée pour faire glisser ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} élément sélectionné`,
            other: ()=>`${formatter.number(args.count)} éléments sélectionnés`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Appuyez sur Alt + Entrée pour faire glisser ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} élément sélectionné`,
            other: ()=>`${formatter.number(args.count)} éléments sélectionnés`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Appuyez de manière prolongée pour faire glisser ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} élément sélectionné`,
            other: ()=>`${formatter.number(args.count)} éléments sélectionnés`
        })}.`,
    "dragStartedKeyboard": `Déplacement commencé. Appuyez sur Tabulation pour accéder à une cible de dépôt, puis appuyez sur Entrée pour déposer, ou appuyez sur Échap pour annuler.`,
    "dragStartedTouch": `Déplacement commencé. Accédez à une cible de dépôt, puis touchez deux fois pour déposer.`,
    "dragStartedVirtual": `Déplacement commencé. Accédez à une cible de dépôt, puis cliquez ou appuyez sur Entrée pour déposer.`,
    "dropCanceled": `Dépôt annulé.`,
    "dropComplete": `Dépôt terminé.`,
    "dropDescriptionKeyboard": `Appuyez sur Entrée pour déposer. Appuyez sur Échap pour annuler le déplacement.`,
    "dropDescriptionTouch": `Touchez deux fois pour déposer.`,
    "dropDescriptionVirtual": `Cliquez pour déposer.`,
    "dropIndicator": `indicateur de dépôt`,
    "dropOnItem": (args)=>`Déposer sur ${args.itemText}`,
    "dropOnRoot": `Déposer sur`,
    "endDragKeyboard": `Déplacement. Appuyez sur Entrée pour annuler le déplacement.`,
    "endDragTouch": `Déplacement. Touchez deux fois pour annuler le déplacement.`,
    "endDragVirtual": `Déplacement. Cliquez pour annuler le déplacement.`,
    "insertAfter": (args)=>`Insérer après ${args.itemText}`,
    "insertBefore": (args)=>`Insérer avant ${args.itemText}`,
    "insertBetween": (args)=>`Insérer entre ${args.beforeItemText} et ${args.afterItemText}`
};


var $6387f7228f0de45e$exports = {};
$6387f7228f0de45e$exports = {
    "dragDescriptionKeyboard": `הקש על Enter כדי להתחיל לגרור.`,
    "dragDescriptionKeyboardAlt": `הקש Alt + Enter כדי להתחיל לגרור.`,
    "dragDescriptionLongPress": `לחץ לחיצה ארוכה כדי להתחיל לגרור.`,
    "dragDescriptionTouch": `הקש פעמיים כדי להתחיל בגרירה.`,
    "dragDescriptionVirtual": `לחץ כדי להתחיל לגרור.`,
    "dragItem": (args)=>`גרור את ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`גרור ${formatter.plural(args.count, {
            one: ()=>`פריט נבחר ${formatter.number(args.count)}`,
            other: ()=>`${formatter.number(args.count)} פריטים שנבחרו`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`הקש על Enter כדי לגרור ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} פריט שנבחר`,
            other: ()=>`${formatter.number(args.count)} פריטים שנבחרו`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`הקש Alt + Enter כדי לגרור ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} פריט שנבחר`,
            other: ()=>`${formatter.number(args.count)} פריטים שנבחרו`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`לחץ לחיצה ארוכה כדי לגרור ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} פריט שנבחר`,
            other: ()=>`${formatter.number(args.count)} פריטים שנבחרו`
        })}.`,
    "dragStartedKeyboard": `התחלת לגרור. הקש על Tab כדי לנווט לנקודת הגרירה ולאחר מכן הקש על Enter כדי לשחרר או על Escape כדי לבטל.`,
    "dragStartedTouch": `התחלת לגרור. נווט לנקודת השחרור ולאחר מכן הקש פעמיים כדי לשחרר.`,
    "dragStartedVirtual": `התחלת לגרור. נווט לנקודת השחרור ולאחר מכן לחץ או הקש על Enter כדי לשחרר.`,
    "dropCanceled": `השחרור בוטל.`,
    "dropComplete": `השחרור הושלם.`,
    "dropDescriptionKeyboard": `הקש על Enter כדי לשחרר. הקש על Escape כדי לבטל את הגרירה.`,
    "dropDescriptionTouch": `הקש פעמיים כדי לשחרר.`,
    "dropDescriptionVirtual": `לחץ כדי לשחרר.`,
    "dropIndicator": `מחוון שחרור`,
    "dropOnItem": (args)=>`שחרר על ${args.itemText}`,
    "dropOnRoot": `שחרר על`,
    "endDragKeyboard": `גורר. הקש על Enter כדי לבטל את הגרירה.`,
    "endDragTouch": `גורר. הקש פעמיים כדי לבטל את הגרירה.`,
    "endDragVirtual": `גורר. לחץ כדי לבטל את הגרירה.`,
    "insertAfter": (args)=>`הוסף אחרי ${args.itemText}`,
    "insertBefore": (args)=>`הוסף לפני ${args.itemText}`,
    "insertBetween": (args)=>`הוסף בין ${args.beforeItemText} לבין ${args.afterItemText}`
};


var $34a283567735f754$exports = {};
$34a283567735f754$exports = {
    "dragDescriptionKeyboard": `Pritisnite Enter da biste počeli povlačiti.`,
    "dragDescriptionKeyboardAlt": `Pritisnite Alt + Enter za početak povlačenja.`,
    "dragDescriptionLongPress": `Dugo pritisnite za početak povlačenja.`,
    "dragDescriptionTouch": `Dvaput dodirnite da biste počeli povlačiti.`,
    "dragDescriptionVirtual": `Kliknite da biste počeli povlačiti.`,
    "dragItem": (args)=>`Povucite stavku ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Povucite ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabranu stavku`,
            other: ()=>`ovoliko odabranih stavki: ${formatter.number(args.count)}`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Pritisnite Enter za povlačenje ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabrana stavka`,
            other: ()=>`${formatter.number(args.count)} odabrane stavke`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Pritisnite Alt + Enter za povlačenje ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabrana stavka`,
            other: ()=>`${formatter.number(args.count)} odabrane stavke`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Dugo pritisnite za povlačenje ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabrana stavka`,
            other: ()=>`${formatter.number(args.count)} odabrane stavke`
        })}.`,
    "dragStartedKeyboard": `Počeli ste povlačiti. Pritisnite tipku tabulatora da biste došli do cilja ispuštanja, a zatim Enter da biste ispustili stavku ili Escape da biste prekinuli povlačenje.`,
    "dragStartedTouch": `Počeli ste povlačiti. Dođite do cilja ispuštanja, a zatim dvaput dodirnite da biste ispustili stavku.`,
    "dragStartedVirtual": `Počeli ste povlačiti. Dođite do cilja ispuštanja, a zatim kliknite ili pritisnite Enter da biste ispustili stavku.`,
    "dropCanceled": `Povlačenje je prekinuto.`,
    "dropComplete": `Ispuštanje je dovršeno.`,
    "dropDescriptionKeyboard": `Pritisnite Enter da biste ispustili stavku. Pritisnite Escape da biste prekinuli povlačenje.`,
    "dropDescriptionTouch": `Dvaput dodirnite da biste ispustili stavku.`,
    "dropDescriptionVirtual": `Kliknite da biste ispustili stavku.`,
    "dropIndicator": `pokazatelj ispuštanja`,
    "dropOnItem": (args)=>`Ispustite na stavku ${args.itemText}`,
    "dropOnRoot": `Ispustite na`,
    "endDragKeyboard": `Povlačenje. Pritisnite Enter da biste prekinuli povlačenje.`,
    "endDragTouch": `Povlačenje. Dvaput dodirnite da biste prekinuli povlačenje.`,
    "endDragVirtual": `Povlačenje. Kliknite da biste prekinuli povlačenje.`,
    "insertAfter": (args)=>`Umetnite iza stavke ${args.itemText}`,
    "insertBefore": (args)=>`Ispustite ispred stavke ${args.itemText}`,
    "insertBetween": (args)=>`Umetnite između stavki ${args.beforeItemText} i ${args.afterItemText}`
};


var $466590c56bee4342$exports = {};
$466590c56bee4342$exports = {
    "dragDescriptionKeyboard": `Nyomja le az Enter billentyűt a húzás megkezdéséhez.`,
    "dragDescriptionKeyboardAlt": `Nyomja le az Alt + Enter billentyűket a húzás megkezdéséhez.`,
    "dragDescriptionLongPress": `Hosszan nyomja meg a húzás elindításához.`,
    "dragDescriptionTouch": `Koppintson duplán a húzás megkezdéséhez.`,
    "dragDescriptionVirtual": `Kattintson a húzás megkezdéséhez.`,
    "dragItem": (args)=>`${args.itemText} húzása`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} kijelölt elem`,
            other: ()=>`${formatter.number(args.count)} kijelölt elem`
        })} húzása`,
    "dragSelectedKeyboard": (args, formatter)=>`Nyomja meg az Entert ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} kijelölt elem`,
            other: ()=>`${formatter.number(args.count)} kijelölt elem`
        })} húzásához.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Nyomja meg az Alt + Enter billentyűket ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} kijelölt elem`,
            other: ()=>`${formatter.number(args.count)} kijelölt elem`
        })} húzásához.`,
    "dragSelectedLongPress": (args, formatter)=>`Tartsa lenyomva hosszan ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} kijelölt elem`,
            other: ()=>`${formatter.number(args.count)} kijelölt elem`
        })} húzásához.`,
    "dragStartedKeyboard": `Húzás megkezdve. Nyomja le a Tab billentyűt az elengedési célhoz navigálásához, majd nyomja le az Enter billentyűt az elengedéshez, vagy nyomja le az Escape billentyűt a megszakításhoz.`,
    "dragStartedTouch": `Húzás megkezdve. Navigáljon egy elengedési célhoz, majd koppintson duplán az elengedéshez.`,
    "dragStartedVirtual": `Húzás megkezdve. Navigáljon egy elengedési célhoz, majd kattintson vagy nyomja le az Enter billentyűt az elengedéshez.`,
    "dropCanceled": `Elengedés megszakítva.`,
    "dropComplete": `Elengedés teljesítve.`,
    "dropDescriptionKeyboard": `Nyomja le az Enter billentyűt az elengedéshez. Nyomja le az Escape billentyűt a húzás megszakításához.`,
    "dropDescriptionTouch": `Koppintson duplán az elengedéshez.`,
    "dropDescriptionVirtual": `Kattintson az elengedéshez.`,
    "dropIndicator": `elengedésjelző`,
    "dropOnItem": (args)=>`Elengedés erre: ${args.itemText}`,
    "dropOnRoot": `Elengedés erre:`,
    "endDragKeyboard": `Húzás folyamatban. Nyomja le az Enter billentyűt a húzás megszakításához.`,
    "endDragTouch": `Húzás folyamatban. Koppintson duplán a húzás megszakításához.`,
    "endDragVirtual": `Húzás folyamatban. Kattintson a húzás megszakításához.`,
    "insertAfter": (args)=>`Beszúrás ${args.itemText} után`,
    "insertBefore": (args)=>`Beszúrás ${args.itemText} elé`,
    "insertBetween": (args)=>`Beszúrás ${args.beforeItemText} és ${args.afterItemText} közé`
};


var $e013896dcb6a6884$exports = {};
$e013896dcb6a6884$exports = {
    "dragDescriptionKeyboard": `Premi Invio per iniziare a trascinare.`,
    "dragDescriptionKeyboardAlt": `Premi Alt + Invio per iniziare a trascinare.`,
    "dragDescriptionLongPress": `Premi a lungo per iniziare a trascinare.`,
    "dragDescriptionTouch": `Tocca due volte per iniziare a trascinare.`,
    "dragDescriptionVirtual": `Fai clic per iniziare a trascinare.`,
    "dragItem": (args)=>`Trascina ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Trascina ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} altro elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} altri elementi selezionati`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Premi Invio per trascinare ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Premi Alt + Invio per trascinare ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Premi a lungo per trascinare ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "dragStartedKeyboard": `Hai iniziato a trascinare. Premi Tab per arrivare sull’area di destinazione, quindi premi Invio per rilasciare o Esc per annullare.`,
    "dragStartedTouch": `Hai iniziato a trascinare. Arriva sull’area di destinazione, quindi tocca due volte per rilasciare.`,
    "dragStartedVirtual": `Hai iniziato a trascinare. Arriva sull’area di destinazione, quindi fai clic o premi Invio per rilasciare.`,
    "dropCanceled": `Rilascio annullato.`,
    "dropComplete": `Rilascio completato.`,
    "dropDescriptionKeyboard": `Premi Invio per rilasciare. Premi Esc per annullare.`,
    "dropDescriptionTouch": `Tocca due volte per rilasciare.`,
    "dropDescriptionVirtual": `Fai clic per rilasciare.`,
    "dropIndicator": `indicatore di rilascio`,
    "dropOnItem": (args)=>`Rilascia su ${args.itemText}`,
    "dropOnRoot": `Rilascia su`,
    "endDragKeyboard": `Trascinamento. Premi Invio per annullare.`,
    "endDragTouch": `Trascinamento. Tocca due volte per annullare.`,
    "endDragVirtual": `Trascinamento. Fai clic per annullare.`,
    "insertAfter": (args)=>`Inserisci dopo ${args.itemText}`,
    "insertBefore": (args)=>`Inserisci prima di ${args.itemText}`,
    "insertBetween": (args)=>`Inserisci tra ${args.beforeItemText} e ${args.afterItemText}`
};


var $d6121e4246c6e502$exports = {};
$d6121e4246c6e502$exports = {
    "dragDescriptionKeyboard": `Enter キーを押してドラッグを開始してください。`,
    "dragDescriptionKeyboardAlt": `Alt+Enter キーを押してドラッグを開始します。`,
    "dragDescriptionLongPress": `長押ししてドラッグを開始します。`,
    "dragDescriptionTouch": `ダブルタップしてドラッグを開始します。`,
    "dragDescriptionVirtual": `クリックしてドラッグを開始します。`,
    "dragItem": (args)=>`${args.itemText} をドラッグ`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 個の選択項目`,
            other: ()=>`${formatter.number(args.count)} 個の選択項目`
        })} をドラッグ`,
    "dragSelectedKeyboard": (args, formatter)=>`Enter キーを押して、${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 選択した項目`,
            other: ()=>`${formatter.number(args.count)} 選択した項目`
        })}をドラッグします。`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Alt+Enter キーを押して、${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 選択した項目`,
            other: ()=>`${formatter.number(args.count)} 選択した項目`
        })}をドラッグします。`,
    "dragSelectedLongPress": (args, formatter)=>`長押しして、${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 選択した項目`,
            other: ()=>`${formatter.number(args.count)} 選択した項目`
        })}をドラッグします。`,
    "dragStartedKeyboard": `ドラッグを開始します。Tab キーを押してドロップターゲットにいどうし、Enter キーを押してドロップするか、Esc キーを押してキャンセルします。`,
    "dragStartedTouch": `ドラッグを開始しました。ドロップのターゲットに移動し、ダブルタップしてドロップします。`,
    "dragStartedVirtual": `ドラッグを開始しました。ドロップのターゲットに移動し、クリックまたは Enter キーを押してドロップします。`,
    "dropCanceled": `ドロップがキャンセルされました。`,
    "dropComplete": `ドロップが完了しました。`,
    "dropDescriptionKeyboard": `Enter キーを押してドロップします。Esc キーを押してドラッグをキャンセルします。`,
    "dropDescriptionTouch": `ダブルタップしてドロップします。`,
    "dropDescriptionVirtual": `クリックしてドロップします。`,
    "dropIndicator": `ドロップインジケーター`,
    "dropOnItem": (args)=>`${args.itemText} にドロップ`,
    "dropOnRoot": `ドロップ場所`,
    "endDragKeyboard": `ドラッグしています。Enter キーを押してドラッグをキャンセルします。`,
    "endDragTouch": `ドラッグしています。ダブルタップしてドラッグをキャンセルします。`,
    "endDragVirtual": `ドラッグしています。クリックしてドラッグをキャンセルします。`,
    "insertAfter": (args)=>`${args.itemText} の後に挿入`,
    "insertBefore": (args)=>`${args.itemText} の前に挿入`,
    "insertBetween": (args)=>`${args.beforeItemText} と ${args.afterItemText} の間に挿入`
};


var $cf48a963c482dcba$exports = {};
$cf48a963c482dcba$exports = {
    "dragDescriptionKeyboard": `드래그를 시작하려면 Enter를 누르세요.`,
    "dragDescriptionKeyboardAlt": `드래그를 시작하려면 Alt + Enter를 누르십시오.`,
    "dragDescriptionLongPress": `드래그를 시작하려면 길게 누르십시오.`,
    "dragDescriptionTouch": `드래그를 시작하려면 더블 탭하세요.`,
    "dragDescriptionVirtual": `드래그를 시작하려면 클릭하세요.`,
    "dragItem": (args)=>`${args.itemText} 드래그`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}개 선택 항목`,
            other: ()=>`${formatter.number(args.count)}개 선택 항목`
        })} 드래그`,
    "dragSelectedKeyboard": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}개 선택 항목`,
            other: ()=>`${formatter.number(args.count)}개 선택 항목`
        })}을 드래그하려면 Enter를 누르십시오.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}개 선택 항목`,
            other: ()=>`${formatter.number(args.count)}개 선택 항목`
        })}을 드래그하려면 Alt + Enter를 누르십시오.`,
    "dragSelectedLongPress": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}개 선택 항목`,
            other: ()=>`${formatter.number(args.count)}개 선택 항목`
        })}을 드래그하려면 길게 누르십시오.`,
    "dragStartedKeyboard": `드래그가 시작되었습니다. Tab을 눌러 드롭 대상으로 이동한 다음 Enter를 눌러 드롭하거나 Esc를 눌러 취소하세요.`,
    "dragStartedTouch": `드래그가 시작되었습니다. 드롭 대상으로 이동한 다음 더블 탭하여 드롭하세요.`,
    "dragStartedVirtual": `드래그가 시작되었습니다. 드롭 대상으로 이동한 다음 클릭하거나 Enter를 눌러 드롭하세요.`,
    "dropCanceled": `드롭이 취소되었습니다.`,
    "dropComplete": `드롭이 완료되었습니다.`,
    "dropDescriptionKeyboard": `드롭하려면 Enter를 누르세요. 드래그를 취소하려면 Esc를 누르세요.`,
    "dropDescriptionTouch": `더블 탭하여 드롭하세요.`,
    "dropDescriptionVirtual": `드롭하려면 클릭하세요.`,
    "dropIndicator": `드롭 표시기`,
    "dropOnItem": (args)=>`${args.itemText}에 드롭`,
    "dropOnRoot": `드롭 대상`,
    "endDragKeyboard": `드래그 중입니다. 드래그를 취소하려면 Enter를 누르세요.`,
    "endDragTouch": `드래그 중입니다. 드래그를 취소하려면 더블 탭하세요.`,
    "endDragVirtual": `드래그 중입니다. 드래그를 취소하려면 클릭하세요.`,
    "insertAfter": (args)=>`${args.itemText} 이후에 삽입`,
    "insertBefore": (args)=>`${args.itemText} 이전에 삽입`,
    "insertBetween": (args)=>`${args.beforeItemText} 및 ${args.afterItemText} 사이에 삽입`
};


var $b156071f04f1c899$exports = {};
$b156071f04f1c899$exports = {
    "dragDescriptionKeyboard": `Paspauskite „Enter“, kad pradėtumėte vilkti.`,
    "dragDescriptionKeyboardAlt": `Paspauskite „Alt + Enter“, kad pradėtumėte vilkti.`,
    "dragDescriptionLongPress": `Palaikykite nuspaudę, kad pradėtumėte vilkti.`,
    "dragDescriptionTouch": `Palieskite dukart, kad pradėtumėte vilkti.`,
    "dragDescriptionVirtual": `Spustelėkite, kad pradėtumėte vilkti.`,
    "dragItem": (args)=>`Vilkti ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Vilkti ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} pasirinktą elementą`,
            other: ()=>`${formatter.number(args.count)} pasirinktus elementus`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Paspauskite „Enter“, jei norite nuvilkti ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} pasirinktą elementą`,
            other: ()=>`${formatter.number(args.count)} pasirinktus elementus`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Paspauskite „Alt + Enter“, kad nuvilktumėte ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} pasirinktą elementą`,
            other: ()=>`${formatter.number(args.count)} pasirinktus elementus`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Nuspaudę palaikykite, kad nuvilktumėte ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} pasirinktą elementą`,
            other: ()=>`${formatter.number(args.count)} pasirinktus elementus`
        })}.`,
    "dragStartedKeyboard": `Pradėta vilkti. Paspauskite „Tab“, kad pereitumėte į tiesioginę paskirties vietą, tada paspauskite „Enter“, kad numestumėte, arba „Escape“, kad atšauktumėte.`,
    "dragStartedTouch": `Pradėta vilkti. Eikite į tiesioginę paskirties vietą, tada palieskite dukart, kad numestumėte.`,
    "dragStartedVirtual": `Pradėta vilkti. Eikite į tiesioginę paskirties vietą ir spustelėkite arba paspauskite „Enter“, kad numestumėte.`,
    "dropCanceled": `Numetimas atšauktas.`,
    "dropComplete": `Numesta.`,
    "dropDescriptionKeyboard": `Paspauskite „Enter“, kad numestumėte. Paspauskite „Escape“, kad atšauktumėte vilkimą.`,
    "dropDescriptionTouch": `Palieskite dukart, kad numestumėte.`,
    "dropDescriptionVirtual": `Spustelėkite, kad numestumėte.`,
    "dropIndicator": `numetimo indikatorius`,
    "dropOnItem": (args)=>`Numesti ant ${args.itemText}`,
    "dropOnRoot": `Numesti ant`,
    "endDragKeyboard": `Velkama. Paspauskite „Enter“, kad atšauktumėte vilkimą.`,
    "endDragTouch": `Velkama. Spustelėkite dukart, kad atšauktumėte vilkimą.`,
    "endDragVirtual": `Velkama. Spustelėkite, kad atšauktumėte vilkimą.`,
    "insertAfter": (args)=>`Įterpti po ${args.itemText}`,
    "insertBefore": (args)=>`Įterpti prieš ${args.itemText}`,
    "insertBetween": (args)=>`Įterpti tarp ${args.beforeItemText} ir ${args.afterItemText}`
};


var $5300be8ef98d39fa$exports = {};
$5300be8ef98d39fa$exports = {
    "dragDescriptionKeyboard": `Nospiediet Enter, lai sāktu vilkšanu.`,
    "dragDescriptionKeyboardAlt": `Nospiediet taustiņu kombināciju Alt+Enter, lai sāktu vilkšanu.`,
    "dragDescriptionLongPress": `Turiet nospiestu, lai sāktu vilkšanu.`,
    "dragDescriptionTouch": `Veiciet dubultskārienu, lai sāktu vilkšanu.`,
    "dragDescriptionVirtual": `Noklikšķiniet, lai sāktu vilkšanu.`,
    "dragItem": (args)=>`Velciet ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Velciet ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} atlasīto vienumu`,
            other: ()=>`${formatter.number(args.count)} atlasītos vienumus`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Nospiediet taustiņu Enter, lai vilktu ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} atlasīto vienumu`,
            other: ()=>`${formatter.number(args.count)} atlasītos vienumus`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Nospiediet taustiņu kombināciju Alt+Enter, lai vilktu ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} atlasīto vienumu`,
            other: ()=>`${formatter.number(args.count)} atlasītos vienumus`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Turiet nospiestu, lai vilktu ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} atlasīto vienumu`,
            other: ()=>`${formatter.number(args.count)} atlasītos vienumus`
        })}.`,
    "dragStartedKeyboard": `Uzsākta vilkšana. Nospiediet taustiņu Tab, lai pārietu uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu, vai nospiediet Escape, lai atceltu.`,
    "dragStartedTouch": `Uzsākta vilkšana. Pārejiet uz nomešanas mērķi, pēc tam veiciet dubultskārienu, lai nomestu.`,
    "dragStartedVirtual": `Uzsākta vilkšana. Pārejiet uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu.`,
    "dropCanceled": `Nomešana atcelta.`,
    "dropComplete": `Nomešana pabeigta.`,
    "dropDescriptionKeyboard": `Nospiediet Enter, lai nomestu. Nospiediet Escape, lai atceltu vilkšanu.`,
    "dropDescriptionTouch": `Veiciet dubultskārienu, lai nomestu.`,
    "dropDescriptionVirtual": `Noklikšķiniet, lai nomestu.`,
    "dropIndicator": `nomešanas indikators`,
    "dropOnItem": (args)=>`Nometiet uz ${args.itemText}`,
    "dropOnRoot": `Nometiet uz`,
    "endDragKeyboard": `Notiek vilkšana. Nospiediet Enter, lai atceltu vilkšanu.`,
    "endDragTouch": `Notiek vilkšana. Veiciet dubultskārienu, lai atceltu vilkšanu.`,
    "endDragVirtual": `Notiek vilkšana. Noklikšķiniet, lai atceltu vilkšanu.`,
    "insertAfter": (args)=>`Ievietojiet pēc ${args.itemText}`,
    "insertBefore": (args)=>`Ievietojiet pirms ${args.itemText}`,
    "insertBetween": (args)=>`Ievietojiet starp ${args.beforeItemText} un ${args.afterItemText}`
};


var $7484477aad199932$exports = {};
$7484477aad199932$exports = {
    "dragDescriptionKeyboard": `Trykk på Enter for å begynne å dra.`,
    "dragDescriptionKeyboardAlt": `Trykk på Alt + Enter for å begynne å dra.`,
    "dragDescriptionLongPress": `Trykk lenge for å begynne å dra.`,
    "dragDescriptionTouch": `Dobbelttrykk for å begynne å dra.`,
    "dragDescriptionVirtual": `Klikk for å begynne å dra.`,
    "dragItem": (args)=>`Dra ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} merket element`,
            other: ()=>`${formatter.number(args.count)} merkede elementer`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Trykk Enter for å dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Trykk på Alt + Enter for å dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Trykk lenge for å dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragStartedKeyboard": `Begynte å dra. Trykk på Tab for å navigere til et mål, og trykk deretter på Enter for å slippe eller på Esc for å avbryte.`,
    "dragStartedTouch": `Begynte å dra. Naviger til et mål, og dobbelttrykk for å slippe.`,
    "dragStartedVirtual": `Begynte å dra. Naviger til et mål, og klikk eller trykk på Enter for å slippe.`,
    "dropCanceled": `Avbrøt slipping.`,
    "dropComplete": `Slippingen er fullført.`,
    "dropDescriptionKeyboard": `Trykk på Enter for å slippe. Trykk på Esc hvis du vil avbryte draingen.`,
    "dropDescriptionTouch": `Dobbelttrykk for å slippe.`,
    "dropDescriptionVirtual": `Klikk for å slippe.`,
    "dropIndicator": `slippeindikator`,
    "dropOnItem": (args)=>`Slipp på ${args.itemText}`,
    "dropOnRoot": `Slipp på`,
    "endDragKeyboard": `Drar. Trykk på Enter hvis du vil avbryte.`,
    "endDragTouch": `Drar. Dobbelttrykk hvis du vil avbryte.`,
    "endDragVirtual": `Drar. Klikk hvis du vil avbryte.`,
    "insertAfter": (args)=>`Sett inn etter ${args.itemText}`,
    "insertBefore": (args)=>`Sett inn før ${args.itemText}`,
    "insertBetween": (args)=>`Sett inn mellom ${args.beforeItemText} og ${args.afterItemText}`
};


var $968e09cb41d6cd76$exports = {};
$968e09cb41d6cd76$exports = {
    "dragDescriptionKeyboard": `Druk op Enter om te slepen.`,
    "dragDescriptionKeyboardAlt": `Druk op Alt + Enter om te slepen.`,
    "dragDescriptionLongPress": `Houd lang ingedrukt om te slepen.`,
    "dragDescriptionTouch": `Dubbeltik om te slepen.`,
    "dragDescriptionVirtual": `Klik om met slepen te starten.`,
    "dragItem": (args)=>`${args.itemText} slepen`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} slepen`,
    "dragSelectedKeyboard": (args, formatter)=>`Druk op Enter om ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} te slepen.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Druk op Alt + Enter om ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} te slepen.`,
    "dragSelectedLongPress": (args, formatter)=>`Houd lang ingedrukt om ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} te slepen.`,
    "dragStartedKeyboard": `Begonnen met slepen. Druk op Tab om naar een locatie te gaan. Druk dan op Enter om neer te zetten, of op Esc om te annuleren.`,
    "dragStartedTouch": `Begonnen met slepen. Ga naar de gewenste locatie en dubbeltik om neer te zetten.`,
    "dragStartedVirtual": `Begonnen met slepen. Ga naar de gewenste locatie en klik of druk op Enter om neer te zetten.`,
    "dropCanceled": `Neerzetten geannuleerd.`,
    "dropComplete": `Neerzetten voltooid.`,
    "dropDescriptionKeyboard": `Druk op Enter om neer te zetten. Druk op Esc om het slepen te annuleren.`,
    "dropDescriptionTouch": `Dubbeltik om neer te zetten.`,
    "dropDescriptionVirtual": `Klik om neer te zetten.`,
    "dropIndicator": `aanwijzer voor neerzetten`,
    "dropOnItem": (args)=>`Neerzetten op ${args.itemText}`,
    "dropOnRoot": `Neerzetten op`,
    "endDragKeyboard": `Bezig met slepen. Druk op Enter om te annuleren.`,
    "endDragTouch": `Bezig met slepen. Dubbeltik om te annuleren.`,
    "endDragVirtual": `Bezig met slepen. Klik om te annuleren.`,
    "insertAfter": (args)=>`Plaatsen na ${args.itemText}`,
    "insertBefore": (args)=>`Plaatsen vóór ${args.itemText}`,
    "insertBetween": (args)=>`Plaatsen tussen ${args.beforeItemText} en ${args.afterItemText}`
};


var $0c2c6c954dd638d7$exports = {};
$0c2c6c954dd638d7$exports = {
    "dragDescriptionKeyboard": `Naciśnij Enter, aby rozpocząć przeciąganie.`,
    "dragDescriptionKeyboardAlt": `Naciśnij Alt + Enter, aby rozpocząć przeciąganie.`,
    "dragDescriptionLongPress": `Naciśnij i przytrzymaj, aby rozpocząć przeciąganie.`,
    "dragDescriptionTouch": `Dotknij dwukrotnie, aby rozpocząć przeciąganie.`,
    "dragDescriptionVirtual": `Kliknij, aby rozpocząć przeciąganie.`,
    "dragItem": (args)=>`Przeciągnij ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Przeciągnij ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} wybrany element`,
            other: ()=>`${formatter.number(args.count)} wybranych elementów`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Naciśnij Enter, aby przeciągnąć ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} wybrany element`,
            other: ()=>`${formatter.number(args.count)} wybrane(-ych) elementy(-ów)`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Naciśnij Alt + Enter, aby przeciągnąć ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} wybrany element`,
            other: ()=>`${formatter.number(args.count)} wybrane(-ych) elementy(-ów)`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Naciśnij i przytrzymaj, aby przeciągnąć ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} wybrany element`,
            other: ()=>`${formatter.number(args.count)} wybrane(-ych) elementy(-ów)`
        })}.`,
    "dragStartedKeyboard": `Rozpoczęto przeciąganie. Naciśnij Tab, aby wybrać miejsce docelowe, a następnie naciśnij Enter, aby upuścić, lub Escape, aby anulować.`,
    "dragStartedTouch": `Rozpoczęto przeciąganie. Wybierz miejsce, w którym chcesz upuścić element, a następnie dotknij dwukrotnie, aby upuścić.F`,
    "dragStartedVirtual": `Rozpoczęto przeciąganie. Wybierz miejsce, w którym chcesz upuścić element, a następnie kliknij lub naciśnij Enter, aby upuścić.`,
    "dropCanceled": `Anulowano upuszczenie.`,
    "dropComplete": `Zakończono upuszczanie.`,
    "dropDescriptionKeyboard": `Naciśnij Enter, aby upuścić. Naciśnij Escape, aby anulować przeciągnięcie.`,
    "dropDescriptionTouch": `Dotknij dwukrotnie, aby upuścić.`,
    "dropDescriptionVirtual": `Kliknij, aby upuścić.`,
    "dropIndicator": `wskaźnik upuszczenia`,
    "dropOnItem": (args)=>`Upuść na ${args.itemText}`,
    "dropOnRoot": `Upuść`,
    "endDragKeyboard": `Przeciąganie. Naciśnij Enter, aby anulować przeciągnięcie.`,
    "endDragTouch": `Przeciąganie. Kliknij dwukrotnie, aby anulować przeciągnięcie.`,
    "endDragVirtual": `Przeciąganie. Kliknij, aby anulować przeciąganie.`,
    "insertAfter": (args)=>`Umieść za ${args.itemText}`,
    "insertBefore": (args)=>`Umieść przed ${args.itemText}`,
    "insertBetween": (args)=>`Umieść między ${args.beforeItemText} i ${args.afterItemText}`
};


var $db510f249c1f2e00$exports = {};
$db510f249c1f2e00$exports = {
    "dragDescriptionKeyboard": `Pressione Enter para começar a arrastar.`,
    "dragDescriptionKeyboardAlt": `Pressione Alt + Enter para começar a arrastar.`,
    "dragDescriptionLongPress": `Pressione e segure para começar a arrastar.`,
    "dragDescriptionTouch": `Toque duas vezes para começar a arrastar.`,
    "dragDescriptionVirtual": `Clique para começar a arrastar.`,
    "dragItem": (args)=>`Arrastar ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Pressione Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Pressione Alt + Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Pressione e segure para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragStartedKeyboard": `Comece a arrastar. Pressione Tab para navegar até um alvo e, em seguida, pressione Enter para soltar ou pressione Escape para cancelar.`,
    "dragStartedTouch": `Comece a arrastar. Navegue até um alvo e toque duas vezes para soltar.`,
    "dragStartedVirtual": `Comece a arrastar. Navegue até um alvo e clique ou pressione Enter para soltar.`,
    "dropCanceled": `Liberação cancelada.`,
    "dropComplete": `Liberação concluída.`,
    "dropDescriptionKeyboard": `Pressione Enter para soltar. Pressione Escape para cancelar.`,
    "dropDescriptionTouch": `Toque duas vezes para soltar.`,
    "dropDescriptionVirtual": `Clique para soltar.`,
    "dropIndicator": `indicador de liberação`,
    "dropOnItem": (args)=>`Soltar em ${args.itemText}`,
    "dropOnRoot": `Soltar`,
    "endDragKeyboard": `Arrastando. Pressione Enter para cancelar.`,
    "endDragTouch": `Arrastando. Toque duas vezes para cancelar.`,
    "endDragVirtual": `Arrastando. Clique para cancelar.`,
    "insertAfter": (args)=>`Inserir após ${args.itemText}`,
    "insertBefore": (args)=>`Inserir antes de ${args.itemText}`,
    "insertBetween": (args)=>`Inserir entre ${args.beforeItemText} e ${args.afterItemText}`
};


var $d734686296d37387$exports = {};
$d734686296d37387$exports = {
    "dragDescriptionKeyboard": `Prima Enter para iniciar o arrasto.`,
    "dragDescriptionKeyboardAlt": `Prima Alt + Enter para iniciar o arrasto.`,
    "dragDescriptionLongPress": `Prima longamente para começar a arrastar.`,
    "dragDescriptionTouch": `Faça duplo toque para começar a arrastar.`,
    "dragDescriptionVirtual": `Clique para iniciar o arrasto.`,
    "dragItem": (args)=>`Arrastar ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Prima Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Prima Alt + Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Prima longamente para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragStartedKeyboard": `Arrasto iniciado. Prima a tecla de tabulação para navegar para um destino para largar, e em seguida prima Enter para largar ou prima Escape para cancelar.`,
    "dragStartedTouch": `Arrasto iniciado. Navegue para um destino para largar, e em seguida faça duplo toque para largar.`,
    "dragStartedVirtual": `Arrasto iniciado. Navegue para um destino para largar, e em seguida clique ou prima Enter para largar.`,
    "dropCanceled": `Largar cancelado.`,
    "dropComplete": `Largar completo.`,
    "dropDescriptionKeyboard": `Prima Enter para largar. Prima Escape para cancelar o arrasto.`,
    "dropDescriptionTouch": `Faça duplo toque para largar.`,
    "dropDescriptionVirtual": `Clique para largar.`,
    "dropIndicator": `Indicador de largar`,
    "dropOnItem": (args)=>`Largar em ${args.itemText}`,
    "dropOnRoot": `Largar em`,
    "endDragKeyboard": `A arrastar. Prima Enter para cancelar o arrasto.`,
    "endDragTouch": `A arrastar. Faça duplo toque para cancelar o arrasto.`,
    "endDragVirtual": `A arrastar. Clique para cancelar o arrasto.`,
    "insertAfter": (args)=>`Inserir depois de ${args.itemText}`,
    "insertBefore": (args)=>`Inserir antes de ${args.itemText}`,
    "insertBetween": (args)=>`Inserir entre ${args.beforeItemText} e ${args.afterItemText}`
};


var $d239d4998a584a23$exports = {};
$d239d4998a584a23$exports = {
    "dragDescriptionKeyboard": `Apăsați pe Enter pentru a începe glisarea.`,
    "dragDescriptionKeyboardAlt": `Apăsați pe Alt + Enter pentru a începe glisarea.`,
    "dragDescriptionLongPress": `Apăsați lung pentru a începe glisarea.`,
    "dragDescriptionTouch": `Atingeți de două ori pentru a începe să glisați.`,
    "dragDescriptionVirtual": `Faceți clic pentru a începe glisarea.`,
    "dragItem": (args)=>`Glisați ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Glisați ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Apăsați pe Enter pentru a glisa ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Apăsați pe Alt + Enter pentru a glisa ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Apăsați lung pentru a glisa ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "dragStartedKeyboard": `A început glisarea. Apăsați pe Tab pentru a naviga la o țintă de fixare, apoi apăsați pe Enter pentru a fixa sau apăsați pe Escape pentru a anula glisarea.`,
    "dragStartedTouch": `A început glisarea. Navigați la o țintă de fixare, apoi atingeți de două ori pentru a fixa.`,
    "dragStartedVirtual": `A început glisarea. Navigați la o țintă de fixare, apoi faceți clic sau apăsați pe Enter pentru a fixa.`,
    "dropCanceled": `Fixare anulată.`,
    "dropComplete": `Fixare finalizată.`,
    "dropDescriptionKeyboard": `Apăsați pe Enter pentru a fixa. Apăsați pe Escape pentru a anula glisarea.`,
    "dropDescriptionTouch": `Atingeți de două ori pentru a fixa.`,
    "dropDescriptionVirtual": `Faceți clic pentru a fixa.`,
    "dropIndicator": `indicator de fixare`,
    "dropOnItem": (args)=>`Fixați pe ${args.itemText}`,
    "dropOnRoot": `Fixare pe`,
    "endDragKeyboard": `Se glisează. Apăsați pe Enter pentru a anula glisarea.`,
    "endDragTouch": `Se glisează. Atingeți de două ori pentru a anula glisarea.`,
    "endDragVirtual": `Se glisează. Faceți clic pentru a anula glisarea.`,
    "insertAfter": (args)=>`Inserați după ${args.itemText}`,
    "insertBefore": (args)=>`Inserați înainte de ${args.itemText}`,
    "insertBetween": (args)=>`Inserați între ${args.beforeItemText} și ${args.afterItemText}`
};


var $a06126b47eabe64f$exports = {};
$a06126b47eabe64f$exports = {
    "dragDescriptionKeyboard": `Нажмите клавишу Enter для начала перетаскивания.`,
    "dragDescriptionKeyboardAlt": `Нажмите Alt + Enter, чтобы начать перетаскивать.`,
    "dragDescriptionLongPress": `Нажмите и удерживайте, чтобы начать перетаскивать.`,
    "dragDescriptionTouch": `Дважды нажмите для начала перетаскивания.`,
    "dragDescriptionVirtual": `Щелкните для начала перетаскивания.`,
    "dragItem": (args)=>`Перетащить ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Перетащить ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} выбранный элемент`,
            other: ()=>`${formatter.number(args.count)} выбранных элем`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Нажмите Enter для перетаскивания ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} выбранного элемента`,
            other: ()=>`${formatter.number(args.count)} выбранных элементов`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Нажмите Alt + Enter для перетаскивания ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} выбранного элемента`,
            other: ()=>`${formatter.number(args.count)} выбранных элементов`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Нажмите и удерживайте для перетаскивания ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} выбранного элемента`,
            other: ()=>`${formatter.number(args.count)} выбранных элементов`
        })}.`,
    "dragStartedKeyboard": `Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание, или клавишу Escape для отмены действия.`,
    "dragStartedTouch": `Начато перетаскивание. Выберите цель, затем дважды нажмите, чтобы применить перетаскивание.`,
    "dragStartedVirtual": `Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание.`,
    "dropCanceled": `Перетаскивание отменено.`,
    "dropComplete": `Перетаскивание завершено.`,
    "dropDescriptionKeyboard": `Нажмите клавишу Enter, чтобы применить перетаскивание. Нажмите клавишу Escape для отмены.`,
    "dropDescriptionTouch": `Дважды нажмите, чтобы применить перетаскивание.`,
    "dropDescriptionVirtual": `Щелкните, чтобы применить перетаскивание.`,
    "dropIndicator": `индикатор перетаскивания`,
    "dropOnItem": (args)=>`Перетащить на ${args.itemText}`,
    "dropOnRoot": `Перетащить на`,
    "endDragKeyboard": `Перетаскивание. Нажмите клавишу Enter для отмены.`,
    "endDragTouch": `Перетаскивание. Дважды нажмите для отмены.`,
    "endDragVirtual": `Перетаскивание. Щелкните для отмены.`,
    "insertAfter": (args)=>`Вставить после ${args.itemText}`,
    "insertBefore": (args)=>`Вставить перед ${args.itemText}`,
    "insertBetween": (args)=>`Вставить между ${args.beforeItemText} и ${args.afterItemText}`
};


var $0983413fc05d96fb$exports = {};
$0983413fc05d96fb$exports = {
    "dragDescriptionKeyboard": `Stlačením klávesu Enter začnete presúvanie.`,
    "dragDescriptionKeyboardAlt": `Stlačením klávesov Alt + Enter začnete presúvanie.`,
    "dragDescriptionLongPress": `Dlhým stlačením začnete presúvanie.`,
    "dragDescriptionTouch": `Dvojitým kliknutím začnete presúvanie.`,
    "dragDescriptionVirtual": `Kliknutím začnete presúvanie.`,
    "dragItem": (args)=>`Presunúť položku ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Presunúť ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybratú položku`,
            other: ()=>`${formatter.number(args.count)} vybraté položky`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Stlačením klávesu Enter presuniete ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybratú položku`,
            other: ()=>`${formatter.number(args.count)} vybratých položiek`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Stlačením klávesov Alt + Enter presuniete ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybratú položku`,
            other: ()=>`${formatter.number(args.count)} vybratých položiek`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Dlhým stlačením presuniete ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} vybratú položku`,
            other: ()=>`${formatter.number(args.count)} vybratých položiek`
        })}.`,
    "dragStartedKeyboard": `Presúvanie sa začalo. Do cieľového umiestnenia prejdete stlačením klávesu Tab. Ak chcete položku umiestniť, stlačte kláves Enter alebo stlačte kláves Esc, ak chcete presúvanie zrušiť.`,
    "dragStartedTouch": `Presúvanie sa začalo. Prejdite na cieľové umiestnenie a dvojitým kliknutím umiestnite položku.`,
    "dragStartedVirtual": `Presúvanie sa začalo. Prejdite na cieľové umiestnenie a kliknutím alebo stlačením klávesu Enter umiestnite položku.`,
    "dropCanceled": `Umiestnenie zrušené.`,
    "dropComplete": `Umiestnenie dokončené.`,
    "dropDescriptionKeyboard": `Stlačením klávesu Enter umiestnite položku. Stlačením klávesu Esc zrušíte presúvanie.`,
    "dropDescriptionTouch": `Dvojitým kliknutím umiestnite položku.`,
    "dropDescriptionVirtual": `Kliknutím umiestnite položku.`,
    "dropIndicator": `indikátor umiestnenia`,
    "dropOnItem": (args)=>`Umiestniť na položku ${args.itemText}`,
    "dropOnRoot": `Umiestniť na`,
    "endDragKeyboard": `Prebieha presúvanie. Ak ho chcete zrušiť, stlačte kláves Enter.`,
    "endDragTouch": `Prebieha presúvanie. Dvojitým kliknutím ho môžete zrušiť.`,
    "endDragVirtual": `Prebieha presúvanie.`,
    "insertAfter": (args)=>`Vložiť za položku ${args.itemText}`,
    "insertBefore": (args)=>`Vložiť pred položku ${args.itemText}`,
    "insertBetween": (args)=>`Vložiť medzi položky ${args.beforeItemText} a ${args.afterItemText}`
};


var $c66896a0464692f1$exports = {};
$c66896a0464692f1$exports = {
    "dragDescriptionKeyboard": `Pritisnite tipko Enter za začetek vlečenja.`,
    "dragDescriptionKeyboardAlt": `Pritisnite tipki Alt + Enter za začetek vlečenja.`,
    "dragDescriptionLongPress": `Pritisnite in zadržite za začetek vlečenja.`,
    "dragDescriptionTouch": `Dvotapnite za začetek vlečenja.`,
    "dragDescriptionVirtual": `Kliknite za začetek vlečenja.`,
    "dragItem": (args)=>`Povleci ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Povlecite ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izbran element`,
            other: ()=>`izbrane elemente (${formatter.number(args.count)})`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Pritisnite tipko Enter, da povlečete ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izbrani element`,
            other: ()=>`${formatter.number(args.count)} izbranih elementov`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Pritisnite tipki Alt + Enter, da povlečete ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izbrani element`,
            other: ()=>`${formatter.number(args.count)} izbranih elementov`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Pritisnite in zadržite, da povlečete ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izbrani element`,
            other: ()=>`${formatter.number(args.count)} izbranih elementov`
        })}.`,
    "dragStartedKeyboard": `Vlečenje se je začelo. Pritisnite tipko Tab za pomik na mesto, kamor želite spustiti elemente, in pritisnite tipko Enter, da jih spustite, ali tipko Escape, da prekličete postopek.`,
    "dragStartedTouch": `Vlečenje se je začelo. Pomaknite se na mesto, kamor želite spustiti elemente, in dvotapnite, da jih spustite.`,
    "dragStartedVirtual": `Vlečenje se je začelo. Pomaknite se na mesto, kamor želite spustiti elemente, in kliknite ali pritisnite tipko Enter, da jih spustite.`,
    "dropCanceled": `Spust je preklican.`,
    "dropComplete": `Spust je končan.`,
    "dropDescriptionKeyboard": `Pritisnite tipko Enter, da spustite. Pritisnite tipko Escape, da prekličete vlečenje.`,
    "dropDescriptionTouch": `Dvotapnite, da spustite.`,
    "dropDescriptionVirtual": `Kliknite, da spustite.`,
    "dropIndicator": `indikator spusta`,
    "dropOnItem": (args)=>`Spusti na mesto ${args.itemText}`,
    "dropOnRoot": `Spusti na mesto`,
    "endDragKeyboard": `Vlečenje. Pritisnite tipko Enter za preklic vlečenja.`,
    "endDragTouch": `Vlečenje. Dvotapnite za preklic vlečenja.`,
    "endDragVirtual": `Vlečenje. Kliknite, da prekličete vlečenje.`,
    "insertAfter": (args)=>`Vstavi za ${args.itemText}`,
    "insertBefore": (args)=>`Vstavi pred ${args.itemText}`,
    "insertBetween": (args)=>`Vstavi med ${args.beforeItemText} in ${args.afterItemText}`
};


var $f0d9abe43a1bcdf6$exports = {};
$f0d9abe43a1bcdf6$exports = {
    "dragItem": (args)=>`Prevucite ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Prevucite ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izabranu stavku`,
            other: ()=>`${formatter.number(args.count)} izabrane stavke`
        })}`,
    "dragDescriptionKeyboard": `Pritisnite Enter da biste započeli prevlačenje..`,
    "dragDescriptionKeyboardAlt": `Pritisnite Alt + Enter da biste započeli prevlačenje.`,
    "dragDescriptionLongPress": `Pritisnite dugo da biste započeli prevlačenje.`,
    "dragDescriptionTouch": `Dvaput dodirnite za otpuštanje.`,
    "dragDescriptionVirtual": `Kliknite da biste započeli prevlačenje.`,
    "dragStartedKeyboard": `Prevlačenje je započeto. Pritisnite Tab da biste otišli do cilja za otpuštanje, zatim pritisnite Enter za ispuštanje ili pritisnite Escape za otkazivanje.`,
    "dragStartedTouch": `Prevlačenje je započeto. Idite do cilja za otpuštanje, a zatim dvaput dodirnite za otpuštanje.`,
    "dragStartedVirtual": `Prevlačenje je započeto. Idite do cilja za otpuštanje, a zatim kliknite ili pritinite Enter za otpuštanje.`,
    "endDragKeyboard": `Prevlačenje u toku. Pritisnite Enter da biste otkazali prevlačenje.`,
    "endDragTouch": `Prevlačenje u toku. Dvaput dodirnite da biste otkazali prevlačenje.`,
    "endDragVirtual": `Prevlačenje u toku. Kliknite da biste otkazali prevlačenje.`,
    "dragSelectedKeyboard": (args, formatter)=>`Pritisnite Enter da biste prevukli ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izabranu stavku`,
            other: ()=>`${formatter.number(args.count)} izabranih stavki`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Pritisnite Alt + Enter da biste prevukli ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izabranu stavku`,
            other: ()=>`${formatter.number(args.count)} izabranih stavki`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Pritisnite dugo da biste prevukli ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} izabranu stavku`,
            other: ()=>`${formatter.number(args.count)} izabranih stavki`
        })}.`,
    "dropDescriptionKeyboard": `Pritisnite Enter da biste otpustili. Pritisnite Escape da biste otkazali prevlačenje.`,
    "dropDescriptionTouch": `Dvaput dodirnite za otpuštanje.`,
    "dropDescriptionVirtual": `Kliknite za otpuštanje.`,
    "dropCanceled": `Otpuštanje je otkazano.`,
    "dropComplete": `Prevlačenje je završeno.`,
    "dropIndicator": `Indikator otpuštanja`,
    "dropOnRoot": `Otpusti na`,
    "dropOnItem": (args)=>`Otpusti na ${args.itemText}`,
    "insertBefore": (args)=>`Umetnite ispred ${args.itemText}`,
    "insertBetween": (args)=>`Umetnite između ${args.beforeItemText} i ${args.afterItemText}`,
    "insertAfter": (args)=>`Umetnite posle ${args.itemText}`
};


var $f3e2ce4b6d6cc4ac$exports = {};
$f3e2ce4b6d6cc4ac$exports = {
    "dragDescriptionKeyboard": `Tryck på enter för att börja dra.`,
    "dragDescriptionKeyboardAlt": `Tryck på Alt + Retur för att börja dra.`,
    "dragDescriptionLongPress": `Tryck länge för att börja dra.`,
    "dragDescriptionTouch": `Dubbeltryck för att börja dra.`,
    "dragDescriptionVirtual": `Klicka för att börja dra.`,
    "dragItem": (args)=>`Dra ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valt objekt`,
            other: ()=>`${formatter.number(args.count)} valda objekt`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Tryck på Retur för att dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Tryck på Alt + Retur för att dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Tryck länge för att dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "dragStartedKeyboard": `Börja dra. Tryck på tabb för att navigera till målet, tryck på enter för att släppa eller på escape för att avbryta.`,
    "dragStartedTouch": `Börja dra. Navigera till ett mål och dubbeltryck för att släppa.`,
    "dragStartedVirtual": `Börja dra. Navigera till ett mål och klicka eller tryck på enter för att släppa.`,
    "dropCanceled": `Släppåtgärd avbröts.`,
    "dropComplete": `Släppåtgärd klar.`,
    "dropDescriptionKeyboard": `Tryck på enter för att släppa. Tryck på escape för att avbryta dragåtgärd.`,
    "dropDescriptionTouch": `Dubbeltryck för att släppa.`,
    "dropDescriptionVirtual": `Klicka för att släppa.`,
    "dropIndicator": `släppindikator`,
    "dropOnItem": (args)=>`Släpp på ${args.itemText}`,
    "dropOnRoot": `Släpp på`,
    "endDragKeyboard": `Drar. Tryck på enter för att avbryta dragåtgärd.`,
    "endDragTouch": `Drar. Dubbeltryck för att avbryta dragåtgärd.`,
    "endDragVirtual": `Drar. Klicka för att avbryta dragåtgärd.`,
    "insertAfter": (args)=>`Infoga efter ${args.itemText}`,
    "insertBefore": (args)=>`Infoga före ${args.itemText}`,
    "insertBetween": (args)=>`Infoga mellan ${args.beforeItemText} och ${args.afterItemText}`
};


var $da91b0d12d273475$exports = {};
$da91b0d12d273475$exports = {
    "dragDescriptionKeyboard": `Sürüklemeyi başlatmak için Enter'a basın.`,
    "dragDescriptionKeyboardAlt": `Sürüklemeyi başlatmak için Alt + Enter'a basın.`,
    "dragDescriptionLongPress": `Sürüklemeye başlamak için uzun basın.`,
    "dragDescriptionTouch": `Sürüklemeyi başlatmak için çift tıklayın.`,
    "dragDescriptionVirtual": `Sürüklemeyi başlatmak için tıklayın.`,
    "dragItem": (args)=>`${args.itemText}’i sürükle`,
    "dragSelectedItems": (args, formatter)=>`Sürükle ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} seçili öge`,
            other: ()=>`${formatter.number(args.count)} seçili öge`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} seçilmiş öğe`,
            other: ()=>`${formatter.number(args.count)} seçilmiş öğe`
        })} öğesini sürüklemek için Enter'a basın.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} seçilmiş öğe`,
            other: ()=>`${formatter.number(args.count)} seçilmiş öğe`
        })} öğesini sürüklemek için Alt + Enter tuşuna basın.`,
    "dragSelectedLongPress": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} seçilmiş öğe`,
            other: ()=>`${formatter.number(args.count)} seçilmiş öğe`
        })} öğesini sürüklemek için uzun basın.`,
    "dragStartedKeyboard": `Sürükleme başlatıldı. Bir bırakma hedefine gitmek için Tab’a basın, ardından bırakmak için Enter’a basın veya iptal etmek için Escape’e basın.`,
    "dragStartedTouch": `Sürükleme başlatıldı. Bir bırakma hedefine gidin, ardından bırakmak için çift tıklayın.`,
    "dragStartedVirtual": `Sürükleme başlatıldı. Bir bırakma hedefine gidin, ardından bırakmak için Enter’a tıklayın veya basın.`,
    "dropCanceled": `Bırakma iptal edildi.`,
    "dropComplete": `Bırakma tamamlandı.`,
    "dropDescriptionKeyboard": `Bırakmak için Enter'a basın. Sürüklemeyi iptal etmek için Escape'e basın.`,
    "dropDescriptionTouch": `Bırakmak için çift tıklayın.`,
    "dropDescriptionVirtual": `Bırakmak için tıklayın.`,
    "dropIndicator": `bırakma göstergesi`,
    "dropOnItem": (args)=>`${args.itemText} üzerine bırak`,
    "dropOnRoot": `Bırakın`,
    "endDragKeyboard": `Sürükleme. Sürüklemeyi iptal etmek için Enter'a basın.`,
    "endDragTouch": `Sürükleme. Sürüklemeyi iptal etmek için çift tıklayın.`,
    "endDragVirtual": `Sürükleme. Sürüklemeyi iptal etmek için tıklayın.`,
    "insertAfter": (args)=>`${args.itemText}’den sonra gir`,
    "insertBefore": (args)=>`${args.itemText}’den önce gir`,
    "insertBetween": (args)=>`${args.beforeItemText} ve ${args.afterItemText} arasına gir`
};


var $d6f72e28f0f4871c$exports = {};
$d6f72e28f0f4871c$exports = {
    "dragDescriptionKeyboard": `Натисніть Enter, щоб почати перетягування.`,
    "dragDescriptionKeyboardAlt": `Натисніть Alt + Enter, щоб почати перетягування.`,
    "dragDescriptionLongPress": `Натисніть і утримуйте, щоб почати перетягування.`,
    "dragDescriptionTouch": `Натисніть двічі, щоб почати перетягування.`,
    "dragDescriptionVirtual": `Натисніть, щоб почати перетягування.`,
    "dragItem": (args)=>`Перетягнути ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Перетягніть ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} вибраний елемент`,
            other: ()=>`${formatter.number(args.count)} вибраних елем`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Натисніть Enter, щоб перетягнути ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} вибраний елемент`,
            other: ()=>`${formatter.number(args.count)} вибраних елементи(-ів)`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Натисніть Alt + Enter, щоб перетягнути ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} вибраний елемент`,
            other: ()=>`${formatter.number(args.count)} вибраних елементи(-ів)`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Утримуйте, щоб перетягнути ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} вибраний елемент`,
            other: ()=>`${formatter.number(args.count)} вибраних елементи(-ів)`
        })}.`,
    "dragStartedKeyboard": `Перетягування почалося. Натисніть Tab, щоб перейти до цілі перетягування, потім натисніть Enter, щоб перетягнути, або Escape, щоб скасувати.`,
    "dragStartedTouch": `Перетягування почалося. Перейдіть до цілі перетягування, потім натисніть двічі, щоб перетягнути.`,
    "dragStartedVirtual": `Перетягування почалося. Перейдіть до цілі перетягування, потім натисніть Enter, щоб перетягнути.`,
    "dropCanceled": `Перетягування скасовано.`,
    "dropComplete": `Перетягування завершено.`,
    "dropDescriptionKeyboard": `Натисніть Enter, щоб перетягнути. Натисніть Escape, щоб скасувати перетягування.`,
    "dropDescriptionTouch": `Натисніть двічі, щоб перетягнути.`,
    "dropDescriptionVirtual": `Натисніть, щоб перетягнути.`,
    "dropIndicator": `індикатор перетягування`,
    "dropOnItem": (args)=>`Перетягнути на ${args.itemText}`,
    "dropOnRoot": `Перетягнути на`,
    "endDragKeyboard": `Триває перетягування. Натисніть Enter, щоб скасувати перетягування.`,
    "endDragTouch": `Триває перетягування. Натисніть двічі, щоб скасувати перетягування.`,
    "endDragVirtual": `Триває перетягування. Натисніть, щоб скасувати перетягування.`,
    "insertAfter": (args)=>`Вставити після ${args.itemText}`,
    "insertBefore": (args)=>`Вставити перед ${args.itemText}`,
    "insertBetween": (args)=>`Вставити між ${args.beforeItemText} і ${args.afterItemText}`
};


var $187738fbdc896f75$exports = {};
$187738fbdc896f75$exports = {
    "dragDescriptionKeyboard": `按 Enter 开始拖动。`,
    "dragDescriptionKeyboardAlt": `按 Alt + Enter 开始拖动。`,
    "dragDescriptionLongPress": `长按以开始拖动。`,
    "dragDescriptionTouch": `双击开始拖动。`,
    "dragDescriptionVirtual": `单击开始拖动。`,
    "dragItem": (args)=>`拖动 ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`拖动 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 选中项目`,
            other: ()=>`${formatter.number(args.count)} 选中项目`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`按 Enter 以拖动 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 个选定项`,
            other: ()=>`${formatter.number(args.count)} 个选定项`
        })}。`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`按 Alt + Enter 以拖动 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 个选定项`,
            other: ()=>`${formatter.number(args.count)} 个选定项`
        })}。`,
    "dragSelectedLongPress": (args, formatter)=>`长按以拖动 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 个选定项`,
            other: ()=>`${formatter.number(args.count)} 个选定项`
        })}。`,
    "dragStartedKeyboard": `已开始拖动。按 Tab 导航到放置目标，然后按 Enter 放置或按 Escape 取消。`,
    "dragStartedTouch": `已开始拖动。导航到放置目标，然后双击放置。`,
    "dragStartedVirtual": `已开始拖动。导航到放置目标，然后单击或按 Enter 放置。`,
    "dropCanceled": `放置已取消。`,
    "dropComplete": `放置已完成。`,
    "dropDescriptionKeyboard": `按 Enter 放置。按 Escape 取消拖动。`,
    "dropDescriptionTouch": `双击放置。`,
    "dropDescriptionVirtual": `单击放置。`,
    "dropIndicator": `放置标记`,
    "dropOnItem": (args)=>`放置于 ${args.itemText}`,
    "dropOnRoot": `放置于`,
    "endDragKeyboard": `正在拖动。按 Enter 取消拖动。`,
    "endDragTouch": `正在拖动。双击取消拖动。`,
    "endDragVirtual": `正在拖动。单击取消拖动。`,
    "insertAfter": (args)=>`插入到 ${args.itemText} 之后`,
    "insertBefore": (args)=>`插入到 ${args.itemText} 之前`,
    "insertBetween": (args)=>`插入到 ${args.beforeItemText} 和 ${args.afterItemText} 之间`
};


var $80cfc1f1f7d356d3$exports = {};
$80cfc1f1f7d356d3$exports = {
    "dragDescriptionKeyboard": `按 Enter 鍵以開始拖曳。`,
    "dragDescriptionKeyboardAlt": `按 Alt+Enter 鍵以開始拖曳。`,
    "dragDescriptionLongPress": `長按以開始拖曳。`,
    "dragDescriptionTouch": `輕點兩下以開始拖曳。`,
    "dragDescriptionVirtual": `按一下滑鼠以開始拖曳。`,
    "dragItem": (args)=>`拖曳「${args.itemText}」`,
    "dragSelectedItems": (args, formatter)=>`拖曳 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 個選定項目`,
            other: ()=>`${formatter.number(args.count)} 個選定項目`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`按 Enter 鍵以拖曳 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 個選定項目`,
            other: ()=>`${formatter.number(args.count)} 個選定項目`
        })}。`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`按 Alt+Enter 鍵以拖曳 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 個選定項目`,
            other: ()=>`${formatter.number(args.count)} 個選定項目`
        })}。`,
    "dragSelectedLongPress": (args, formatter)=>`長按以拖曳 ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} 個選定項目`,
            other: ()=>`${formatter.number(args.count)} 個選定項目`
        })}。`,
    "dragStartedKeyboard": `已開始拖曳。按 Tab 鍵以瀏覽至放置目標，然後按 Enter 鍵以放置，或按 Escape 鍵以取消。`,
    "dragStartedTouch": `已開始拖曳。瀏覽至放置目標，然後輕點兩下以放置。`,
    "dragStartedVirtual": `已開始拖曳。瀏覽至放置目標，然後按一下滑鼠或按 Enter 鍵以放置。`,
    "dropCanceled": `放置已取消。`,
    "dropComplete": `放置已完成。`,
    "dropDescriptionKeyboard": `按 Enter 鍵以放置。按 Escape 鍵以取消拖曳。`,
    "dropDescriptionTouch": `輕點兩下以放置。`,
    "dropDescriptionVirtual": `按一下滑鼠以放置。`,
    "dropIndicator": `放置指示器`,
    "dropOnItem": (args)=>`放置在「${args.itemText}」上`,
    "dropOnRoot": `放置在`,
    "endDragKeyboard": `拖曳中。按 Enter 鍵以取消拖曳。`,
    "endDragTouch": `拖曳中。輕點兩下以取消拖曳。`,
    "endDragVirtual": `拖曳中。按一下滑鼠以取消拖曳。`,
    "insertAfter": (args)=>`插入至「${args.itemText}」之後`,
    "insertBefore": (args)=>`插入至「${args.itemText}」之前`,
    "insertBetween": (args)=>`插入至「${args.beforeItemText}」和「${args.afterItemText}」之間`
};


$d624b4da796f302a$exports = {
    "ar-AE": $12ee6b0bfb4232ad$exports,
    "bg-BG": $e21ef7c55796c5e1$exports,
    "cs-CZ": $dfa9cd1c2317d9aa$exports,
    "da-DK": $65fff3bbacfa8956$exports,
    "de-DE": $10b7dfe45cd41c2d$exports,
    "el-GR": $0cadcffb7abc96b8$exports,
    "en-US": $7e3982b34ddf1bdf$exports,
    "es-ES": $cb29ce0b655c4023$exports,
    "et-EE": $067d46bab80bcf4b$exports,
    "fi-FI": $8aa1b9a1f9d783d3$exports,
    "fr-FR": $9e248ec27f7dc55f$exports,
    "he-IL": $6387f7228f0de45e$exports,
    "hr-HR": $34a283567735f754$exports,
    "hu-HU": $466590c56bee4342$exports,
    "it-IT": $e013896dcb6a6884$exports,
    "ja-JP": $d6121e4246c6e502$exports,
    "ko-KR": $cf48a963c482dcba$exports,
    "lt-LT": $b156071f04f1c899$exports,
    "lv-LV": $5300be8ef98d39fa$exports,
    "nb-NO": $7484477aad199932$exports,
    "nl-NL": $968e09cb41d6cd76$exports,
    "pl-PL": $0c2c6c954dd638d7$exports,
    "pt-BR": $db510f249c1f2e00$exports,
    "pt-PT": $d734686296d37387$exports,
    "ro-RO": $d239d4998a584a23$exports,
    "ru-RU": $a06126b47eabe64f$exports,
    "sk-SK": $0983413fc05d96fb$exports,
    "sl-SI": $c66896a0464692f1$exports,
    "sr-SP": $f0d9abe43a1bcdf6$exports,
    "sv-SE": $f3e2ce4b6d6cc4ac$exports,
    "tr-TR": $da91b0d12d273475$exports,
    "uk-UA": $d6f72e28f0f4871c$exports,
    "zh-CN": $187738fbdc896f75$exports,
    "zh-TW": $80cfc1f1f7d356d3$exports
};




const $dc204e8ec58447a6$var$MESSAGES = {
    keyboard: {
        start: "dragDescriptionKeyboard",
        end: "endDragKeyboard"
    },
    touch: {
        start: "dragDescriptionTouch",
        end: "endDragTouch"
    },
    virtual: {
        start: "dragDescriptionVirtual",
        end: "endDragVirtual"
    }
};
function $dc204e8ec58447a6$export$7941f8aafa4b6021(options) {
    let { hasDragButton: hasDragButton  } = options;
    let stringFormatter = (0, $4vY0V$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($d624b4da796f302a$exports))));
    let state = (0, $4vY0V$react.useRef)({
        options: options,
        x: 0,
        y: 0
    }).current;
    state.options = options;
    let isDraggingRef = (0, $4vY0V$react.useRef)(false);
    let [, setDraggingState] = (0, $4vY0V$react.useState)(false);
    let setDragging = (isDragging)=>{
        isDraggingRef.current = isDragging;
        setDraggingState(isDragging);
    };
    let { addGlobalListener: addGlobalListener , removeAllGlobalListeners: removeAllGlobalListeners  } = (0, $4vY0V$reactariautils.useGlobalListeners)();
    let modalityOnPointerDown = (0, $4vY0V$react.useRef)(null);
    let onDragStart = (e)=>{
        var _options_preview;
        if (e.defaultPrevented) return;
        // If this drag was initiated by a mobile screen reader (e.g. VoiceOver or TalkBack), enter virtual dragging mode.
        if (modalityOnPointerDown.current === "virtual") {
            e.preventDefault();
            startDragging(e.target);
            modalityOnPointerDown.current = null;
            return;
        }
        if (typeof options.onDragStart === "function") options.onDragStart({
            type: "dragstart",
            x: e.clientX,
            y: e.clientY
        });
        let items = options.getItems();
        (0, $4620ae0dc40f0031$export$f9c1490890ddd063)(e.dataTransfer, items);
        let allowed = (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).all;
        if (typeof options.getAllowedDropOperations === "function") {
            let allowedOperations = options.getAllowedDropOperations();
            allowed = (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).none;
            for (let operation of allowedOperations)allowed |= (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e)[operation] || (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).none;
        }
        (0, $4620ae0dc40f0031$export$6539bc8c3a0a2d67)(allowed);
        e.dataTransfer.effectAllowed = (0, $76b1e110a27b1ccd$export$dd0165308d8bff45)[allowed] || "none";
        // If there is a preview option, use it to render a custom preview image that will
        // appear under the pointer while dragging. If not, the element itself is dragged by the browser.
        if (typeof ((_options_preview = options.preview) === null || _options_preview === void 0 ? void 0 : _options_preview.current) === "function") options.preview.current(items, (node)=>{
            // Compute the offset that the preview will appear under the mouse.
            // If possible, this is based on the point the user clicked on the target.
            // If the preview is much smaller, then just use the center point of the preview.
            let size = node.getBoundingClientRect();
            let rect = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - rect.x;
            let y = e.clientY - rect.y;
            if (x > size.width || y > size.height) {
                x = size.width / 2;
                y = size.height / 2;
            }
            // Rounding height to an even number prevents blurry preview seen on some screens
            let height = 2 * Math.round(size.height / 2);
            node.style.height = `${height}px`;
            e.dataTransfer.setDragImage(node, x, y);
        });
        // Enforce that drops are handled by useDrop.
        addGlobalListener(window, "drop", (e)=>{
            if (!$28e10663603f5ea1$export$7454aff2e161f241(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                throw new Error("Drags initiated from the React Aria useDrag hook may only be dropped on a target created with useDrop. This ensures that a keyboard and screen reader accessible alternative is available.");
            }
        }, {
            capture: true,
            once: true
        });
        state.x = e.clientX;
        state.y = e.clientY;
        // Wait a frame before we set dragging to true so that the browser has time to
        // render the preview image before we update the element that has been dragged.
        requestAnimationFrame(()=>{
            setDragging(true);
        });
    };
    let onDrag = (e)=>{
        if (e.clientX === state.x && e.clientY === state.y) return;
        if (typeof options.onDragMove === "function") options.onDragMove({
            type: "dragmove",
            x: e.clientX,
            y: e.clientY
        });
        state.x = e.clientX;
        state.y = e.clientY;
    };
    let onDragEnd = (e)=>{
        if (typeof options.onDragEnd === "function") {
            let event = {
                type: "dragend",
                x: e.clientX,
                y: e.clientY,
                dropOperation: (0, $76b1e110a27b1ccd$export$608ecc6f1b23c35d)[e.dataTransfer.dropEffect]
            };
            // Chrome Android always returns none as its dropEffect so we use the drop effect set in useDrop via
            // onDragEnter/onDragOver instead. https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
            if (0, $4620ae0dc40f0031$export$8e6636520ac15722) event.dropOperation = (0, $76b1e110a27b1ccd$export$608ecc6f1b23c35d)[0, $4620ae0dc40f0031$export$8e6636520ac15722];
            options.onDragEnd(event);
        }
        setDragging(false);
        removeAllGlobalListeners();
        (0, $4620ae0dc40f0031$export$6539bc8c3a0a2d67)((0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).none);
        (0, $4620ae0dc40f0031$export$64f52ed7349ddb84)(undefined);
    };
    // If the dragged element is removed from the DOM via onDrop, onDragEnd won't fire: https://bugzilla.mozilla.org/show_bug.cgi?id=460801
    // In this case, we need to manually call onDragEnd on cleanup
    // eslint-disable-next-line arrow-body-style
    (0, $4vY0V$reactariautils.useLayoutEffect)(()=>{
        return ()=>{
            if (isDraggingRef.current) {
                if (typeof state.options.onDragEnd === "function") {
                    let event = {
                        type: "dragend",
                        x: 0,
                        y: 0,
                        dropOperation: (0, $76b1e110a27b1ccd$export$608ecc6f1b23c35d)[(0, $4620ae0dc40f0031$export$8e6636520ac15722) || "none"]
                    };
                    state.options.onDragEnd(event);
                }
                setDragging(false);
                (0, $4620ae0dc40f0031$export$6539bc8c3a0a2d67)((0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).none);
                (0, $4620ae0dc40f0031$export$64f52ed7349ddb84)(undefined);
            }
        };
    }, [
        state
    ]);
    let onPress = (e)=>{
        if (e.pointerType !== "keyboard" && e.pointerType !== "virtual") return;
        startDragging(e.target);
    };
    let startDragging = (target)=>{
        if (typeof state.options.onDragStart === "function") {
            let rect = target.getBoundingClientRect();
            state.options.onDragStart({
                type: "dragstart",
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2
            });
        }
        $28e10663603f5ea1$export$549dbcf8649bf3b2({
            element: target,
            items: state.options.getItems(),
            allowedDropOperations: typeof state.options.getAllowedDropOperations === "function" ? state.options.getAllowedDropOperations() : [
                "move",
                "copy",
                "link"
            ],
            onDragEnd (e) {
                setDragging(false);
                if (typeof state.options.onDragEnd === "function") state.options.onDragEnd(e);
            }
        }, stringFormatter);
        setDragging(true);
    };
    let modality = (0, $4620ae0dc40f0031$export$49bac5d6d4b352ea)();
    let message = !isDraggingRef.current ? $dc204e8ec58447a6$var$MESSAGES[modality].start : $dc204e8ec58447a6$var$MESSAGES[modality].end;
    let descriptionProps = (0, $4vY0V$reactariautils.useDescription)(stringFormatter.format(message));
    let interactions;
    if (!hasDragButton) // If there's no separate button to trigger accessible drag and drop mode,
    // then add event handlers to the draggable element itself to start dragging.
    // For keyboard, we use the Enter key in a capturing listener to prevent other
    // events such as selection from also occurring. We attempt to infer whether a
    // pointer event (e.g. long press) came from a touch screen reader, and then initiate
    // dragging in the native onDragStart listener above.
    interactions = {
        ...descriptionProps,
        onPointerDown (e) {
            modalityOnPointerDown.current = (0, $4vY0V$reactariautils.isVirtualPointerEvent)(e.nativeEvent) ? "virtual" : e.pointerType;
            // Try to detect virtual drag passthrough gestures.
            if (e.width < 1 && e.height < 1) // iOS VoiceOver.
            modalityOnPointerDown.current = "virtual";
            else {
                let rect = e.currentTarget.getBoundingClientRect();
                let offsetX = e.clientX - rect.x;
                let offsetY = e.clientY - rect.y;
                let centerX = rect.width / 2;
                let centerY = rect.height / 2;
                if (Math.abs(offsetX - centerX) <= 0.5 && Math.abs(offsetY - centerY) <= 0.5) // Android TalkBack.
                modalityOnPointerDown.current = "virtual";
                else modalityOnPointerDown.current = e.pointerType;
            }
        },
        onKeyDownCapture (e) {
            if (e.target === e.currentTarget && e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        onKeyUpCapture (e) {
            if (e.target === e.currentTarget && e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                startDragging(e.target);
            }
        },
        onClick (e) {
            // Handle NVDA/JAWS in browse mode, and touch screen readers. In this case, no keyboard events are fired.
            if ((0, $4vY0V$reactariautils.isVirtualClick)(e.nativeEvent) || modalityOnPointerDown.current === "virtual") {
                e.preventDefault();
                e.stopPropagation();
                startDragging(e.target);
            }
        }
    };
    return {
        dragProps: {
            ...interactions,
            draggable: "true",
            onDragStart: onDragStart,
            onDrag: onDrag,
            onDragEnd: onDragEnd
        },
        dragButtonProps: {
            ...descriptionProps,
            onPress: onPress
        },
        isDragging: isDraggingRef.current
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




const $419982e205c8e8dc$var$MESSAGES = {
    keyboard: "dropDescriptionKeyboard",
    touch: "dropDescriptionTouch",
    virtual: "dropDescriptionVirtual"
};
function $419982e205c8e8dc$export$62447ad3d2ec7da6() {
    let stringFormatter = (0, $4vY0V$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($d624b4da796f302a$exports))));
    let modality = (0, $4620ae0dc40f0031$export$49bac5d6d4b352ea)();
    let dragSession = $28e10663603f5ea1$export$418e185dd3f1b968();
    let descriptionProps = (0, $4vY0V$reactariautils.useDescription)(dragSession ? stringFormatter.format($419982e205c8e8dc$var$MESSAGES[modality]) : "");
    return {
        dropProps: {
            ...descriptionProps,
            // Mobile Safari does not properly bubble click events on elements except links or inputs
            // unless there is an onclick handler bound directly to the element itself. By adding this
            // handler, React will take care of adding that for us, and we are able to handle document
            // level click events in the DragManager.
            // See https://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
            onClick: ()=>{}
        }
    };
}


const $1ca228bc9257ca16$var$DROP_ACTIVATE_TIMEOUT = 800;
function $1ca228bc9257ca16$export$ccdee5eaf73cf661(options) {
    let [isDropTarget, setDropTarget] = (0, $4vY0V$react.useState)(false);
    let state = (0, $4vY0V$react.useRef)({
        x: 0,
        y: 0,
        dragOverElements: new Set(),
        dropEffect: "none",
        allowedOperations: (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).all,
        dropActivateTimer: null
    }).current;
    let fireDropEnter = (e)=>{
        setDropTarget(true);
        if (typeof options.onDropEnter === "function") {
            let rect = e.currentTarget.getBoundingClientRect();
            options.onDropEnter({
                type: "dropenter",
                x: e.clientX - rect.x,
                y: e.clientY - rect.y
            });
        }
    };
    let fireDropExit = (e)=>{
        setDropTarget(false);
        if (typeof options.onDropExit === "function") {
            let rect = e.currentTarget.getBoundingClientRect();
            options.onDropExit({
                type: "dropexit",
                x: e.clientX - rect.x,
                y: e.clientY - rect.y
            });
        }
    };
    let onDragOver = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        let allowedOperations = $1ca228bc9257ca16$var$getAllowedOperations(e);
        if (e.clientX === state.x && e.clientY === state.y && allowedOperations === state.allowedOperations) {
            e.dataTransfer.dropEffect = state.dropEffect;
            return;
        }
        state.x = e.clientX;
        state.y = e.clientY;
        let prevDropEffect = state.dropEffect;
        // Update drop effect if allowed drop operations changed (e.g. user pressed modifier key).
        if (allowedOperations !== state.allowedOperations) {
            let allowedOps = $1ca228bc9257ca16$var$allowedOperationsToArray(allowedOperations);
            let dropOperation = allowedOps[0];
            if (typeof options.getDropOperation === "function") {
                let types = new (0, $4620ae0dc40f0031$export$7f04ce188c91447c)(e.dataTransfer);
                dropOperation = $1ca228bc9257ca16$var$getDropOperation(allowedOperations, options.getDropOperation(types, allowedOps));
            }
            state.dropEffect = (0, $76b1e110a27b1ccd$export$5eacb0769d26d3b2)[dropOperation] || "none";
        }
        if (typeof options.getDropOperationForPoint === "function") {
            let types1 = new (0, $4620ae0dc40f0031$export$7f04ce188c91447c)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            let dropOperation1 = $1ca228bc9257ca16$var$getDropOperation(allowedOperations, options.getDropOperationForPoint(types1, $1ca228bc9257ca16$var$allowedOperationsToArray(allowedOperations), state.x - rect.x, state.y - rect.y));
            state.dropEffect = (0, $76b1e110a27b1ccd$export$5eacb0769d26d3b2)[dropOperation1] || "none";
        }
        state.allowedOperations = allowedOperations;
        e.dataTransfer.dropEffect = state.dropEffect;
        // If the drop operation changes, update state and fire events appropriately.
        if (state.dropEffect === "none" && prevDropEffect !== "none") fireDropExit(e);
        else if (state.dropEffect !== "none" && prevDropEffect === "none") fireDropEnter(e);
        if (typeof options.onDropMove === "function" && state.dropEffect !== "none") {
            let rect1 = e.currentTarget.getBoundingClientRect();
            options.onDropMove({
                type: "dropmove",
                x: state.x - rect1.x,
                y: state.y - rect1.y
            });
        }
        clearTimeout(state.dropActivateTimer);
        if (typeof options.onDropActivate === "function" && state.dropEffect !== "none") {
            let rect2 = e.currentTarget.getBoundingClientRect();
            state.dropActivateTimer = setTimeout(()=>{
                options.onDropActivate({
                    type: "dropactivate",
                    x: state.x - rect2.x,
                    y: state.y - rect2.y
                });
            }, $1ca228bc9257ca16$var$DROP_ACTIVATE_TIMEOUT);
        }
    };
    let onDragEnter = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        state.dragOverElements.add(e.target);
        if (state.dragOverElements.size > 1) return;
        let allowedOperationsBits = $1ca228bc9257ca16$var$getAllowedOperations(e);
        let allowedOperations = $1ca228bc9257ca16$var$allowedOperationsToArray(allowedOperationsBits);
        let dropOperation = allowedOperations[0];
        if (typeof options.getDropOperation === "function") {
            let types = new (0, $4620ae0dc40f0031$export$7f04ce188c91447c)(e.dataTransfer);
            dropOperation = $1ca228bc9257ca16$var$getDropOperation(allowedOperationsBits, options.getDropOperation(types, allowedOperations));
        }
        if (typeof options.getDropOperationForPoint === "function") {
            let types1 = new (0, $4620ae0dc40f0031$export$7f04ce188c91447c)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            dropOperation = $1ca228bc9257ca16$var$getDropOperation(allowedOperationsBits, options.getDropOperationForPoint(types1, allowedOperations, e.clientX - rect.x, e.clientY - rect.y));
        }
        state.x = e.clientX;
        state.y = e.clientY;
        state.allowedOperations = allowedOperationsBits;
        state.dropEffect = (0, $76b1e110a27b1ccd$export$5eacb0769d26d3b2)[dropOperation] || "none";
        e.dataTransfer.dropEffect = state.dropEffect;
        if (dropOperation !== "cancel") fireDropEnter(e);
    };
    let onDragLeave = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        // We would use e.relatedTarget to detect if the drag is still inside the drop target,
        // but it is always null in WebKit. https://bugs.webkit.org/show_bug.cgi?id=66547
        // Instead, we track all of the targets of dragenter events in a set, and remove them
        // in dragleave. When the set becomes empty, we've left the drop target completely.
        // We must also remove any elements that are no longer in the DOM, because dragleave
        // events will never be fired for these. This can happen, for example, with drop
        // indicators between items, which disappear when the drop target changes.
        state.dragOverElements.delete(e.target);
        for (let element of state.dragOverElements)if (!e.currentTarget.contains(element)) state.dragOverElements.delete(element);
        if (state.dragOverElements.size > 0) return;
        if (state.dropEffect !== "none") fireDropExit(e);
        clearTimeout(state.dropActivateTimer);
    };
    let onDrop = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        // Track drop effect in global state for Chrome Android. https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
        // Android onDragEnd always returns "none" as its drop effect.
        (0, $4620ae0dc40f0031$export$64f52ed7349ddb84)(state.dropEffect);
        if (typeof options.onDrop === "function") {
            let dropOperation = (0, $76b1e110a27b1ccd$export$608ecc6f1b23c35d)[state.dropEffect];
            let items = (0, $4620ae0dc40f0031$export$d9e760437831f8b3)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            let event = {
                type: "drop",
                x: e.clientX - rect.x,
                y: e.clientY - rect.y,
                items: items,
                dropOperation: dropOperation
            };
            options.onDrop(event);
        }
        let dndStateSnapshot = {
            ...(0, $4620ae0dc40f0031$export$6ca6700462636d0b)
        };
        state.dragOverElements.clear();
        fireDropExit(e);
        clearTimeout(state.dropActivateTimer);
        // If there wasn't a collection being tracked as a dragged collection, then we are in a case where a non RSP drag is dropped on a
        // RSP collection and thus we don't need to preserve the global drop effect
        if (dndStateSnapshot.draggingCollectionRef == null) (0, $4620ae0dc40f0031$export$64f52ed7349ddb84)(undefined);
        else // Otherwise we need to preserve the global dnd state for onDragEnd's isInternal check.
        // At the moment fireDropExit may clear dropCollectionRef (i.e. useDroppableCollection's provided onDropExit, required to clear dropCollectionRef when exiting a valid drop target)
        (0, $4620ae0dc40f0031$export$6c10d32b362bfa5f)(dndStateSnapshot);
    };
    let optionsRef = (0, $4vY0V$react.useRef)(options);
    optionsRef.current = options;
    (0, $4vY0V$reactariautils.useLayoutEffect)(()=>$28e10663603f5ea1$export$c28d9fb4a54e471a({
            element: optionsRef.current.ref.current,
            getDropOperation: optionsRef.current.getDropOperation,
            onDropEnter (e) {
                setDropTarget(true);
                if (typeof optionsRef.current.onDropEnter === "function") optionsRef.current.onDropEnter(e);
            },
            onDropExit (e) {
                setDropTarget(false);
                if (typeof optionsRef.current.onDropExit === "function") optionsRef.current.onDropExit(e);
            },
            onDrop (e) {
                if (typeof optionsRef.current.onDrop === "function") optionsRef.current.onDrop(e);
            },
            onDropActivate (e) {
                if (typeof optionsRef.current.onDropActivate === "function") optionsRef.current.onDropActivate(e);
            }
        }), [
        optionsRef
    ]);
    let { dropProps: dropProps  } = (0, $419982e205c8e8dc$export$62447ad3d2ec7da6)();
    return {
        dropProps: {
            ...dropProps,
            onDragEnter: onDragEnter,
            onDragOver: onDragOver,
            onDragLeave: onDragLeave,
            onDrop: onDrop
        },
        isDropTarget: isDropTarget
    };
}
function $1ca228bc9257ca16$var$getAllowedOperations(e) {
    let allowedOperations = (0, $76b1e110a27b1ccd$export$9bbdfc78cf083e16)[e.dataTransfer.effectAllowed];
    // WebKit always sets effectAllowed to "copyMove" on macOS, and "all" on iOS, regardless of what was
    // set during the dragstart event: https://bugs.webkit.org/show_bug.cgi?id=178058
    //
    // Android Chrome also sets effectAllowed to "copyMove" in all cases: https://bugs.chromium.org/p/chromium/issues/detail?id=1359182
    //
    // If the drag started within the page, we can use a global variable to get the real allowed operations.
    // This needs to be intersected with the actual effectAllowed, which may have been filtered based on modifier keys.
    // Unfortunately, this means that link operations do not work at all in Safari.
    if (0, $4620ae0dc40f0031$export$f0130eb70b6347b8) allowedOperations &= (0, $4620ae0dc40f0031$export$f0130eb70b6347b8);
    // Chrome and Safari on macOS will automatically filter effectAllowed when pressing modifier keys,
    // allowing the user to switch between move, link, and copy operations. Firefox on macOS and all
    // Windows browsers do not do this, so do it ourselves instead. The exact keys are platform dependent.
    // https://ux.stackexchange.com/questions/83748/what-are-the-most-common-modifier-keys-for-dragging-objects-with-a-mouse
    //
    // Note that none of these modifiers are ever set in WebKit due to a bug: https://bugs.webkit.org/show_bug.cgi?id=77465
    // However, Safari does update effectAllowed correctly, so we can just rely on that.
    let allowedModifiers = (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).none;
    if ((0, $4vY0V$reactariautils.isMac)()) {
        if (e.altKey) allowedModifiers |= (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).copy;
        // Chrome and Safari both use the Control key for link, even though Finder uses Command + Option.
        // iPadOS doesn't support link operations and will not fire the drop event at all if dropEffect is set to link.
        // https://bugs.webkit.org/show_bug.cgi?id=244701
        if (e.ctrlKey && !(0, $4vY0V$reactariautils.isIPad)()) allowedModifiers |= (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).link;
        if (e.metaKey) allowedModifiers |= (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).move;
    } else {
        if (e.altKey) allowedModifiers |= (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).link;
        if (e.shiftKey) allowedModifiers |= (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).move;
        if (e.ctrlKey) allowedModifiers |= (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).copy;
    }
    if (allowedModifiers) return allowedOperations & allowedModifiers;
    return allowedOperations;
}
function $1ca228bc9257ca16$var$allowedOperationsToArray(allowedOperationsBits) {
    let allowedOperations = [];
    if (allowedOperationsBits & (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).move) allowedOperations.push("move");
    if (allowedOperationsBits & (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).copy) allowedOperations.push("copy");
    if (allowedOperationsBits & (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e).link) allowedOperations.push("link");
    return allowedOperations;
}
function $1ca228bc9257ca16$var$getDropOperation(allowedOperations, operation) {
    let op = (0, $76b1e110a27b1ccd$export$60b7b4bcf3903d8e)[operation];
    return allowedOperations & op ? operation : "cancel";
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

const $12cc069a1c69155b$var$AUTOSCROLL_AREA_SIZE = 20;
function $12cc069a1c69155b$export$6323452ca4533ed8(ref) {
    let scrollableRef = (0, $4vY0V$react.useRef)(null);
    (0, $4vY0V$react.useEffect)(()=>{
        if (ref.current) scrollableRef.current = (0, $4vY0V$reactariautils.isScrollable)(ref.current) ? ref.current : (0, $4vY0V$reactariautils.getScrollParent)(ref.current);
    }, [
        ref
    ]);
    let state = (0, $4vY0V$react.useRef)({
        timer: null,
        dx: 0,
        dy: 0
    }).current;
    let scroll = (0, $4vY0V$react.useCallback)(()=>{
        scrollableRef.current.scrollLeft += state.dx;
        scrollableRef.current.scrollTop += state.dy;
        if (state.timer) state.timer = requestAnimationFrame(scroll);
    }, [
        scrollableRef,
        state
    ]);
    return {
        move (x, y) {
            // Most browsers auto scroll natively, but WebKit on macOS does not (iOS does 🤷‍♂️).
            // https://bugs.webkit.org/show_bug.cgi?id=222636
            if (!(0, $4vY0V$reactariautils.isWebKit)() || (0, $4vY0V$reactariautils.isIOS)() || !scrollableRef.current) return;
            let box = scrollableRef.current.getBoundingClientRect();
            let left = $12cc069a1c69155b$var$AUTOSCROLL_AREA_SIZE;
            let top = $12cc069a1c69155b$var$AUTOSCROLL_AREA_SIZE;
            let bottom = box.height - $12cc069a1c69155b$var$AUTOSCROLL_AREA_SIZE;
            let right = box.width - $12cc069a1c69155b$var$AUTOSCROLL_AREA_SIZE;
            if (x < left || x > right || y < top || y > bottom) {
                if (x < left) state.dx = x - left;
                else if (x > right) state.dx = x - right;
                if (y < top) state.dy = y - top;
                else if (y > bottom) state.dy = y - bottom;
                if (!state.timer) state.timer = requestAnimationFrame(scroll);
            } else this.stop();
        },
        stop () {
            if (state.timer) {
                cancelAnimationFrame(state.timer);
                state.timer = null;
            }
        }
    };
}



const $7f93a158ac20b90a$var$DROP_POSITIONS = [
    "before",
    "on",
    "after"
];
function $7f93a158ac20b90a$export$f4e2f423c21f7b04(props, state, ref) {
    let localState = (0, $4vY0V$react.useRef)({
        props: props,
        state: state,
        nextTarget: null,
        dropOperation: null
    }).current;
    localState.props = props;
    localState.state = state;
    let defaultOnDrop = (0, $4vY0V$react.useCallback)(async (e)=>{
        let { onInsert: onInsert , onRootDrop: onRootDrop , onItemDrop: onItemDrop , onReorder: onReorder , acceptedDragTypes: acceptedDragTypes = "all" , shouldAcceptItemDrop: shouldAcceptItemDrop  } = localState.props;
        let { draggingKeys: draggingKeys  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
        let isInternal = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(ref);
        let { target: target , dropOperation: dropOperation , items: items  } = e;
        let filteredItems = items;
        if (acceptedDragTypes !== "all" || shouldAcceptItemDrop) filteredItems = items.filter((item)=>{
            let itemTypes;
            if (item.kind === "directory") itemTypes = new Set([
                (0, $4620ae0dc40f0031$export$990fced5dfac2637)
            ]);
            else itemTypes = item.kind === "file" ? new Set([
                item.type
            ]) : item.types;
            if (acceptedDragTypes === "all" || acceptedDragTypes.some((type)=>itemTypes.has(type))) {
                // If we are performing a on item drop, check if the item in question accepts the dropped item since the item may have heavier restrictions
                // than the droppable collection itself
                if (target.type === "item" && target.dropPosition === "on" && shouldAcceptItemDrop) return shouldAcceptItemDrop(target, itemTypes);
                return true;
            }
            return false;
        });
        if (filteredItems.length > 0) {
            if (target.type === "root" && onRootDrop) await onRootDrop({
                items: filteredItems,
                dropOperation: dropOperation
            });
            if (target.type === "item") {
                if (target.dropPosition === "on" && onItemDrop) await onItemDrop({
                    items: filteredItems,
                    dropOperation: dropOperation,
                    isInternal: isInternal,
                    target: target
                });
                if (target.dropPosition !== "on") {
                    if (!isInternal && onInsert) await onInsert({
                        items: filteredItems,
                        dropOperation: dropOperation,
                        target: target
                    });
                    if (isInternal && onReorder) await onReorder({
                        keys: draggingKeys,
                        dropOperation: dropOperation,
                        target: target
                    });
                }
            }
        }
    }, [
        localState,
        ref
    ]);
    let autoScroll = (0, $12cc069a1c69155b$export$6323452ca4533ed8)(ref);
    let { dropProps: dropProps  } = (0, $1ca228bc9257ca16$export$ccdee5eaf73cf661)({
        ref: ref,
        onDropEnter () {
            state.setTarget(localState.nextTarget);
        },
        onDropMove (e) {
            state.setTarget(localState.nextTarget);
            autoScroll.move(e.x, e.y);
        },
        getDropOperationForPoint (types, allowedOperations, x, y) {
            let { draggingKeys: draggingKeys , dropCollectionRef: dropCollectionRef  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
            let isInternal = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(ref);
            let isValidDropTarget = (target)=>state.getDropOperation({
                    target: target,
                    types: types,
                    allowedOperations: allowedOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                }) !== "cancel";
            let target = props.dropTargetDelegate.getDropTargetFromPoint(x, y, isValidDropTarget);
            if (!target) {
                localState.dropOperation = "cancel";
                localState.nextTarget = null;
                return "cancel";
            }
            localState.dropOperation = state.getDropOperation({
                target: target,
                types: types,
                allowedOperations: allowedOperations,
                isInternal: isInternal,
                draggingKeys: draggingKeys
            });
            // If the target doesn't accept the drop, see if the root accepts it instead.
            if (localState.dropOperation === "cancel") {
                let rootTarget = {
                    type: "root"
                };
                let dropOperation = state.getDropOperation({
                    target: rootTarget,
                    types: types,
                    allowedOperations: allowedOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                });
                if (dropOperation !== "cancel") {
                    target = rootTarget;
                    localState.dropOperation = dropOperation;
                }
            }
            // Only set dropCollectionRef if there is a valid drop target since we cleanup dropCollectionRef in onDropExit
            // which only runs when leaving a valid drop target or if the dropEffect become none (mouse dnd only).
            if (target && localState.dropOperation !== "cancel" && (ref === null || ref === void 0 ? void 0 : ref.current) !== (dropCollectionRef === null || dropCollectionRef === void 0 ? void 0 : dropCollectionRef.current)) (0, $4620ae0dc40f0031$export$dac8db29d42db9a1)(ref);
            localState.nextTarget = localState.dropOperation === "cancel" ? null : target;
            return localState.dropOperation;
        },
        onDropExit () {
            (0, $4620ae0dc40f0031$export$dac8db29d42db9a1)(undefined);
            state.setTarget(null);
            autoScroll.stop();
        },
        onDropActivate (e) {
            var _state_target, _state_target1;
            if (((_state_target = state.target) === null || _state_target === void 0 ? void 0 : _state_target.type) === "item" && ((_state_target1 = state.target) === null || _state_target1 === void 0 ? void 0 : _state_target1.dropPosition) === "on" && typeof props.onDropActivate === "function") props.onDropActivate({
                type: "dropactivate",
                x: e.x,
                y: e.y,
                target: state.target
            });
        },
        onDrop (e) {
            (0, $4620ae0dc40f0031$export$dac8db29d42db9a1)(ref);
            if (state.target) onDrop(e, state.target);
            // If there wasn't a collection being tracked as a dragged collection, then we are in a case where a non RSP drag is dropped on a
            // RSP collection and thus we don't need to preserve the global DnD state for onDragEnd
            let { draggingCollectionRef: draggingCollectionRef  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
            if (draggingCollectionRef == null) (0, $4620ae0dc40f0031$export$70936501603e6c57)();
        }
    });
    let droppingState = (0, $4vY0V$react.useRef)(null);
    let onDrop = (0, $4vY0V$react.useCallback)((e, target)=>{
        var _state_collection_getItem;
        let { state: state  } = localState;
        // Focus the collection.
        state.selectionManager.setFocused(true);
        // Save some state of the collection/selection before the drop occurs so we can compare later.
        let focusedKey = state.selectionManager.focusedKey;
        // If parent key was dragged, we want to use it instead (i.e. focus row instead of cell after dropping)
        if ((0, $4620ae0dc40f0031$export$6ca6700462636d0b).draggingKeys.has((_state_collection_getItem = state.collection.getItem(focusedKey)) === null || _state_collection_getItem === void 0 ? void 0 : _state_collection_getItem.parentKey)) {
            focusedKey = state.collection.getItem(focusedKey).parentKey;
            state.selectionManager.setFocusedKey(focusedKey);
        }
        droppingState.current = {
            timeout: null,
            focusedKey: focusedKey,
            collection: state.collection,
            selectedKeys: state.selectionManager.selectedKeys
        };
        let onDropFn = localState.props.onDrop || defaultOnDrop;
        onDropFn({
            type: "drop",
            x: e.x,
            y: e.y,
            target: target,
            items: e.items,
            dropOperation: e.dropOperation
        });
        // Wait for a short time period after the onDrop is called to allow the data to be read asynchronously
        // and for React to re-render. If an insert occurs during this time, it will be selected/focused below.
        // If items are not "immediately" inserted by the onDrop handler, the application will need to handle
        // selecting and focusing those items themselves.
        droppingState.current.timeout = setTimeout(()=>{
            // If focus didn't move already (e.g. due to an insert), and the user dropped on an item,
            // focus that item and show the focus ring to give the user feedback that the drop occurred.
            // Also show the focus ring if the focused key is not selected, e.g. in case of a reorder.
            let { state: state  } = localState;
            if (target.type === "item" && target.dropPosition === "on" && state.collection.getItem(target.key) != null) {
                state.selectionManager.setFocusedKey(target.key);
                state.selectionManager.setFocused(true);
                (0, $4vY0V$reactariainteractions.setInteractionModality)("keyboard");
            } else if (!state.selectionManager.isSelected(focusedKey)) (0, $4vY0V$reactariainteractions.setInteractionModality)("keyboard");
            droppingState.current = null;
        }, 50);
    }, [
        localState,
        defaultOnDrop
    ]);
    // eslint-disable-next-line arrow-body-style
    (0, $4vY0V$react.useEffect)(()=>{
        return ()=>{
            if (droppingState.current) clearTimeout(droppingState.current.timeout);
        };
    }, []);
    (0, $4vY0V$reactariautils.useLayoutEffect)(()=>{
        // If an insert occurs during a drop, we want to immediately select these items to give
        // feedback to the user that a drop occurred. Only do this if the selection didn't change
        // since the drop started so we don't override if the user or application did something.
        if (droppingState.current && state.selectionManager.isFocused && state.collection.size > droppingState.current.collection.size && state.selectionManager.isSelectionEqual(droppingState.current.selectedKeys)) {
            let newKeys = new Set();
            for (let key of state.collection.getKeys())if (!droppingState.current.collection.getItem(key)) newKeys.add(key);
            state.selectionManager.setSelectedKeys(newKeys);
            // If the focused item didn't change since the drop occurred, also focus the first
            // inserted item. If selection is disabled, then also show the focus ring so there
            // is some indication that items were added.
            if (state.selectionManager.focusedKey === droppingState.current.focusedKey) {
                let first = newKeys.keys().next().value;
                let item = state.collection.getItem(first);
                // If this is a cell, focus the parent row.
                if ((item === null || item === void 0 ? void 0 : item.type) === "cell") first = item.parentKey;
                state.selectionManager.setFocusedKey(first);
                if (state.selectionManager.selectionMode === "none") (0, $4vY0V$reactariainteractions.setInteractionModality)("keyboard");
            }
            droppingState.current = null;
        }
    });
    (0, $4vY0V$react.useEffect)(()=>{
        let getNextTarget = (target, wrap = true)=>{
            if (!target) return {
                type: "root"
            };
            let { keyboardDelegate: keyboardDelegate  } = localState.props;
            let nextKey = target.type === "item" ? keyboardDelegate.getKeyBelow(target.key) : keyboardDelegate.getFirstKey();
            let dropPosition = "before";
            if (target.type === "item") {
                let positionIndex = $7f93a158ac20b90a$var$DROP_POSITIONS.indexOf(target.dropPosition);
                let nextDropPosition = $7f93a158ac20b90a$var$DROP_POSITIONS[positionIndex + 1];
                if (positionIndex < $7f93a158ac20b90a$var$DROP_POSITIONS.length - 1 && !(nextDropPosition === "after" && nextKey != null)) return {
                    type: "item",
                    key: target.key,
                    dropPosition: nextDropPosition
                };
                // If the last drop position was 'after', then 'before' on the next key is equivalent.
                // Switch to 'on' instead.
                if (target.dropPosition === "after") dropPosition = "on";
            }
            if (nextKey == null) {
                if (wrap) return {
                    type: "root"
                };
                return null;
            }
            return {
                type: "item",
                key: nextKey,
                dropPosition: dropPosition
            };
        };
        let getPreviousTarget = (target, wrap = true)=>{
            let { keyboardDelegate: keyboardDelegate  } = localState.props;
            let nextKey = (target === null || target === void 0 ? void 0 : target.type) === "item" ? keyboardDelegate.getKeyAbove(target.key) : keyboardDelegate.getLastKey();
            let dropPosition = !target || target.type === "root" ? "after" : "on";
            if ((target === null || target === void 0 ? void 0 : target.type) === "item") {
                let positionIndex = $7f93a158ac20b90a$var$DROP_POSITIONS.indexOf(target.dropPosition);
                let nextDropPosition = $7f93a158ac20b90a$var$DROP_POSITIONS[positionIndex - 1];
                if (positionIndex > 0 && nextDropPosition !== "after") return {
                    type: "item",
                    key: target.key,
                    dropPosition: nextDropPosition
                };
                // If the last drop position was 'before', then 'after' on the previous key is equivalent.
                // Switch to 'on' instead.
                if (target.dropPosition === "before") dropPosition = "on";
            }
            if (nextKey == null) {
                if (wrap) return {
                    type: "root"
                };
                return null;
            }
            return {
                type: "item",
                key: nextKey,
                dropPosition: dropPosition
            };
        };
        let nextValidTarget = (target, types, allowedDropOperations, getNextTarget, wrap = true)=>{
            let seenRoot = 0;
            let operation;
            let { draggingKeys: draggingKeys  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
            let isInternal = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(ref);
            do {
                let nextTarget = getNextTarget(target, wrap);
                if (!nextTarget) return null;
                target = nextTarget;
                operation = localState.state.getDropOperation({
                    target: nextTarget,
                    types: types,
                    allowedOperations: allowedDropOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                });
                if (target.type === "root") seenRoot++;
            }while (operation === "cancel" && !localState.state.isDropTarget(target) && seenRoot < 2);
            if (operation === "cancel") return null;
            return target;
        };
        return $28e10663603f5ea1$export$c28d9fb4a54e471a({
            element: ref.current,
            getDropOperation (types, allowedOperations) {
                if (localState.state.target) {
                    let { draggingKeys: draggingKeys  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
                    let isInternal = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(ref);
                    return localState.state.getDropOperation({
                        target: localState.state.target,
                        types: types,
                        allowedOperations: allowedOperations,
                        isInternal: isInternal,
                        draggingKeys: draggingKeys
                    });
                }
                // Check if any of the targets accept the drop.
                // TODO: should we have a faster way of doing this or e.g. for pagination?
                let target = nextValidTarget(null, types, allowedOperations, getNextTarget);
                return target ? "move" : "cancel";
            },
            onDropEnter (e, drag) {
                let types = (0, $4620ae0dc40f0031$export$e1d41611756c6326)(drag.items);
                let selectionManager = localState.state.selectionManager;
                let target;
                // Update the drop collection ref tracker for useDroppableItem's getDropOperation isInternal check
                (0, $4620ae0dc40f0031$export$dac8db29d42db9a1)(ref);
                // When entering the droppable collection for the first time, the default drop target
                // is after the focused key.
                let key = selectionManager.focusedKey;
                let dropPosition = "after";
                // If the focused key is a cell, get the parent item instead.
                // For now, we assume that individual cells cannot be dropped on.
                let item = localState.state.collection.getItem(key);
                if ((item === null || item === void 0 ? void 0 : item.type) === "cell") key = item.parentKey;
                // If the focused item is also selected, the default drop target is after the last selected item.
                // But if the focused key is the first selected item, then default to before the first selected item.
                // This is to make reordering lists slightly easier. If you select top down, we assume you want to
                // move the items down. If you select bottom up, we assume you want to move the items up.
                if (selectionManager.isSelected(key)) {
                    if (selectionManager.selectedKeys.size > 1 && selectionManager.firstSelectedKey === key) dropPosition = "before";
                    else key = selectionManager.lastSelectedKey;
                }
                if (key != null) {
                    target = {
                        type: "item",
                        key: key,
                        dropPosition: dropPosition
                    };
                    let { draggingKeys: draggingKeys  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
                    let isInternal = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(ref);
                    var _nextValidTarget;
                    // If the default target is not valid, find the next one that is.
                    if (localState.state.getDropOperation({
                        target: target,
                        types: types,
                        allowedOperations: drag.allowedDropOperations,
                        isInternal: isInternal,
                        draggingKeys: draggingKeys
                    }) === "cancel") target = (_nextValidTarget = nextValidTarget(target, types, drag.allowedDropOperations, getNextTarget, false)) !== null && _nextValidTarget !== void 0 ? _nextValidTarget : nextValidTarget(target, types, drag.allowedDropOperations, getPreviousTarget, false);
                }
                // If no focused key, then start from the root.
                if (!target) target = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
                localState.state.setTarget(target);
            },
            onDropExit () {
                (0, $4620ae0dc40f0031$export$dac8db29d42db9a1)(undefined);
                localState.state.setTarget(null);
            },
            onDropTargetEnter (target) {
                localState.state.setTarget(target);
            },
            onDropActivate (e) {
                var _localState_state_target, _localState_state_target1;
                if (((_localState_state_target = localState.state.target) === null || _localState_state_target === void 0 ? void 0 : _localState_state_target.type) === "item" && ((_localState_state_target1 = localState.state.target) === null || _localState_state_target1 === void 0 ? void 0 : _localState_state_target1.dropPosition) === "on" && typeof localState.props.onDropActivate === "function") localState.props.onDropActivate({
                    type: "dropactivate",
                    x: e.x,
                    y: e.y,
                    target: localState.state.target
                });
            },
            onDrop (e, target) {
                (0, $4620ae0dc40f0031$export$dac8db29d42db9a1)(ref);
                if (localState.state.target) onDrop(e, target || localState.state.target);
            },
            onKeyDown (e, drag) {
                let { keyboardDelegate: keyboardDelegate  } = localState.props;
                let types = (0, $4620ae0dc40f0031$export$e1d41611756c6326)(drag.items);
                switch(e.key){
                    case "ArrowDown":
                        if (keyboardDelegate.getKeyBelow) {
                            let target = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, getNextTarget);
                            localState.state.setTarget(target);
                        }
                        break;
                    case "ArrowUp":
                        if (keyboardDelegate.getKeyAbove) {
                            let target1 = nextValidTarget(localState.state.target, types, drag.allowedDropOperations, getPreviousTarget);
                            localState.state.setTarget(target1);
                        }
                        break;
                    case "Home":
                        if (keyboardDelegate.getFirstKey) {
                            let target2 = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
                            localState.state.setTarget(target2);
                        }
                        break;
                    case "End":
                        if (keyboardDelegate.getLastKey) {
                            let target3 = nextValidTarget(null, types, drag.allowedDropOperations, getPreviousTarget);
                            localState.state.setTarget(target3);
                        }
                        break;
                    case "PageDown":
                        if (keyboardDelegate.getKeyPageBelow) {
                            let target4 = localState.state.target;
                            if (!target4) target4 = nextValidTarget(null, types, drag.allowedDropOperations, getNextTarget);
                            else {
                                // If on the root, go to the item a page below the top. Otherwise a page below the current item.
                                let nextKey = keyboardDelegate.getKeyPageBelow(target4.type === "item" ? target4.key : keyboardDelegate.getFirstKey());
                                let dropPosition = target4.type === "item" ? target4.dropPosition : "after";
                                // If there is no next key, or we are starting on the last key, jump to the last possible position.
                                if (nextKey == null || target4.type === "item" && target4.key === keyboardDelegate.getLastKey()) {
                                    nextKey = keyboardDelegate.getLastKey();
                                    dropPosition = "after";
                                }
                                target4 = {
                                    type: "item",
                                    key: nextKey,
                                    dropPosition: dropPosition
                                };
                                // If the target does not accept the drop, find the next valid target.
                                // If no next valid target, find the previous valid target.
                                let { draggingCollectionRef: draggingCollectionRef , draggingKeys: draggingKeys  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
                                let isInternal = (draggingCollectionRef === null || draggingCollectionRef === void 0 ? void 0 : draggingCollectionRef.current) === (ref === null || ref === void 0 ? void 0 : ref.current);
                                let operation = localState.state.getDropOperation({
                                    target: target4,
                                    types: types,
                                    allowedOperations: drag.allowedDropOperations,
                                    isInternal: isInternal,
                                    draggingKeys: draggingKeys
                                });
                                var _nextValidTarget;
                                if (operation === "cancel") target4 = (_nextValidTarget = nextValidTarget(target4, types, drag.allowedDropOperations, getNextTarget, false)) !== null && _nextValidTarget !== void 0 ? _nextValidTarget : nextValidTarget(target4, types, drag.allowedDropOperations, getPreviousTarget, false);
                            }
                            localState.state.setTarget(target4 !== null && target4 !== void 0 ? target4 : localState.state.target);
                        }
                        break;
                    case "PageUp":
                        {
                            if (!keyboardDelegate.getKeyPageAbove) break;
                            let target5 = localState.state.target;
                            if (!target5) target5 = nextValidTarget(null, types, drag.allowedDropOperations, getPreviousTarget);
                            else if (target5.type === "item") {
                                // If at the top already, switch to the root. Otherwise navigate a page up.
                                if (target5.key === keyboardDelegate.getFirstKey()) target5 = {
                                    type: "root"
                                };
                                else {
                                    let nextKey1 = keyboardDelegate.getKeyPageAbove(target5.key);
                                    let dropPosition1 = target5.dropPosition;
                                    if (nextKey1 == null) {
                                        nextKey1 = keyboardDelegate.getFirstKey();
                                        dropPosition1 = "before";
                                    }
                                    target5 = {
                                        type: "item",
                                        key: nextKey1,
                                        dropPosition: dropPosition1
                                    };
                                }
                                // If the target does not accept the drop, find the previous valid target.
                                // If no next valid target, find the next valid target.
                                let { draggingKeys: draggingKeys1  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
                                let isInternal1 = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(ref);
                                let operation1 = localState.state.getDropOperation({
                                    target: target5,
                                    types: types,
                                    allowedOperations: drag.allowedDropOperations,
                                    isInternal: isInternal1,
                                    draggingKeys: draggingKeys1
                                });
                                var _nextValidTarget1;
                                if (operation1 === "cancel") target5 = (_nextValidTarget1 = nextValidTarget(target5, types, drag.allowedDropOperations, getPreviousTarget, false)) !== null && _nextValidTarget1 !== void 0 ? _nextValidTarget1 : nextValidTarget(target5, types, drag.allowedDropOperations, getNextTarget, false);
                            }
                            localState.state.setTarget(target5 !== null && target5 !== void 0 ? target5 : localState.state.target);
                            break;
                        }
                }
            }
        });
    }, [
        localState,
        ref,
        onDrop
    ]);
    let id = (0, $4vY0V$reactariautils.useId)();
    (0, $4620ae0dc40f0031$export$dfdf5deeaf27473f).set(state, {
        id: id,
        ref: ref
    });
    return {
        collectionProps: (0, $4vY0V$reactariautils.mergeProps)(dropProps, {
            id: id,
            // Remove description from collection element. If dropping on the entire collection,
            // there should be a drop indicator that has this description, so no need to double announce.
            "aria-describedby": null
        })
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



function $fc1876157e07bcec$export$f7b0c5d28b66b6a5(options, state, ref) {
    let { dropProps: dropProps  } = (0, $419982e205c8e8dc$export$62447ad3d2ec7da6)();
    let droppableCollectionRef = (0, $4620ae0dc40f0031$export$7e397efd01d3db27)(state);
    (0, $4vY0V$react.useEffect)(()=>{
        if (ref.current) return $28e10663603f5ea1$export$aef80212ac99c003({
            element: ref.current,
            target: options.target,
            getDropOperation (types, allowedOperations) {
                let { draggingKeys: draggingKeys  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
                let isInternal = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(droppableCollectionRef);
                return state.getDropOperation({
                    target: options.target,
                    types: types,
                    allowedOperations: allowedOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                });
            }
        });
    }, [
        ref,
        options.target,
        state,
        droppableCollectionRef
    ]);
    let dragSession = $28e10663603f5ea1$export$418e185dd3f1b968();
    let { draggingKeys: draggingKeys  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
    let isInternal = (0, $4620ae0dc40f0031$export$78bf638634500fa5)(droppableCollectionRef);
    let isValidDropTarget = dragSession && state.getDropOperation({
        target: options.target,
        types: (0, $4620ae0dc40f0031$export$e1d41611756c6326)(dragSession.dragTarget.items),
        allowedOperations: dragSession.dragTarget.allowedDropOperations,
        isInternal: isInternal,
        draggingKeys: draggingKeys
    }) !== "cancel";
    let isDropTarget = state.isDropTarget(options.target);
    (0, $4vY0V$react.useEffect)(()=>{
        if (dragSession && isDropTarget && ref.current) ref.current.focus();
    }, [
        isDropTarget,
        dragSession,
        ref
    ]);
    return {
        dropProps: {
            ...dropProps,
            "aria-hidden": !dragSession || isValidDropTarget ? undefined : "true"
        },
        isDropTarget: isDropTarget
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





function $c5557edbed563ebf$export$8d0e41d2815afac5(props, state, ref) {
    let { target: target  } = props;
    let { collection: collection  } = state;
    let stringFormatter = (0, $4vY0V$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($d624b4da796f302a$exports))));
    let dragSession = $28e10663603f5ea1$export$418e185dd3f1b968();
    let { dropProps: dropProps  } = (0, $fc1876157e07bcec$export$f7b0c5d28b66b6a5)(props, state, ref);
    let id = (0, $4vY0V$reactariautils.useId)();
    var _collection_getTextValue;
    let getText = (key)=>{
        var _collection_getTextValue1, _collection_getItem;
        return (_collection_getTextValue = (_collection_getTextValue1 = collection.getTextValue) === null || _collection_getTextValue1 === void 0 ? void 0 : _collection_getTextValue1.call(collection, key)) !== null && _collection_getTextValue !== void 0 ? _collection_getTextValue : (_collection_getItem = collection.getItem(key)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.textValue;
    };
    let label = "";
    let labelledBy;
    if (target.type === "root") {
        label = stringFormatter.format("dropOnRoot");
        labelledBy = `${id} ${(0, $4620ae0dc40f0031$export$3093291712f09a77)(state)}`;
    } else if (target.dropPosition === "on") label = stringFormatter.format("dropOnItem", {
        itemText: getText(target.key)
    });
    else {
        let before;
        let after;
        if (collection.getFirstKey() === target.key && target.dropPosition === "before") before = null;
        else before = target.dropPosition === "before" ? collection.getKeyBefore(target.key) : target.key;
        if (collection.getLastKey() === target.key && target.dropPosition === "after") after = null;
        else after = target.dropPosition === "after" ? collection.getKeyAfter(target.key) : target.key;
        if (before && after) label = stringFormatter.format("insertBetween", {
            beforeItemText: getText(before),
            afterItemText: getText(after)
        });
        else if (before) label = stringFormatter.format("insertAfter", {
            itemText: getText(before)
        });
        else if (after) label = stringFormatter.format("insertBefore", {
            itemText: getText(after)
        });
    }
    let isDropTarget = state.isDropTarget(target);
    let ariaHidden = !dragSession ? "true" : dropProps["aria-hidden"];
    return {
        dropIndicatorProps: {
            ...dropProps,
            id: id,
            "aria-roledescription": stringFormatter.format("dropIndicator"),
            "aria-label": label,
            "aria-labelledby": labelledBy,
            "aria-hidden": ariaHidden,
            tabIndex: -1
        },
        isDropTarget: isDropTarget,
        // If aria-hidden, we are either not in a drag session or the drop target is invalid.
        // In that case, there's no need to render anything at all unless we need to show the indicator visually.
        // This can happen when dragging using the native DnD API as opposed to keyboard dragging.
        isHidden: !isDropTarget && !!ariaHidden
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





const $0cbbd00cda972c67$var$MESSAGES = {
    keyboard: {
        selected: "dragSelectedKeyboard",
        notSelected: "dragDescriptionKeyboard"
    },
    touch: {
        selected: "dragSelectedLongPress",
        notSelected: "dragDescriptionLongPress"
    },
    virtual: {
        selected: "dragDescriptionVirtual",
        notSelected: "dragDescriptionVirtual"
    }
};
function $0cbbd00cda972c67$export$b35afafff42da2d9(props, state) {
    let stringFormatter = (0, $4vY0V$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($d624b4da796f302a$exports))));
    let isDisabled = state.selectionManager.isDisabled(props.key);
    let { dragProps: dragProps , dragButtonProps: dragButtonProps  } = (0, $dc204e8ec58447a6$export$7941f8aafa4b6021)({
        getItems () {
            return state.getItems(props.key);
        },
        preview: state.preview,
        getAllowedDropOperations: state.getAllowedDropOperations,
        hasDragButton: props.hasDragButton,
        onDragStart (e) {
            state.startDrag(props.key, e);
            // Track draggingKeys for useDroppableCollection's default onDrop handler and useDroppableCollectionState's default getDropOperation
            (0, $4620ae0dc40f0031$export$72cb63bdda528276)(state.draggingKeys);
        },
        onDragMove (e) {
            state.moveDrag(e);
        },
        onDragEnd (e) {
            let { dropOperation: dropOperation  } = e;
            let isInternal = dropOperation === "cancel" ? false : (0, $4620ae0dc40f0031$export$78bf638634500fa5)();
            state.endDrag({
                ...e,
                keys: state.draggingKeys,
                isInternal: isInternal
            });
            (0, $4620ae0dc40f0031$export$70936501603e6c57)();
        }
    });
    let item = state.collection.getItem(props.key);
    let numKeysForDrag = state.getKeysForDrag(props.key).size;
    let isSelected = numKeysForDrag > 1 && state.selectionManager.isSelected(props.key);
    let dragButtonLabel;
    let description;
    // Override description to include selected item count.
    let modality = (0, $4620ae0dc40f0031$export$49bac5d6d4b352ea)();
    if (!props.hasDragButton && state.selectionManager.selectionMode !== "none") {
        let msg = $0cbbd00cda972c67$var$MESSAGES[modality][isSelected ? "selected" : "notSelected"];
        if (props.hasAction && modality === "keyboard") msg += "Alt";
        if (isSelected) description = stringFormatter.format(msg, {
            count: numKeysForDrag
        });
        else description = stringFormatter.format(msg);
        // Remove the onClick handler from useDrag. Long pressing will be required on touch devices,
        // and NVDA/JAWS are always in forms mode within collection components.
        delete dragProps.onClick;
    } else if (isSelected) dragButtonLabel = stringFormatter.format("dragSelectedItems", {
        count: numKeysForDrag
    });
    else {
        var _state_collection, _state_collection_getTextValue;
        var _state_collection_getTextValue1, _ref;
        let itemText = (_ref = (_state_collection_getTextValue1 = (_state_collection_getTextValue = (_state_collection = state.collection).getTextValue) === null || _state_collection_getTextValue === void 0 ? void 0 : _state_collection_getTextValue.call(_state_collection, props.key)) !== null && _state_collection_getTextValue1 !== void 0 ? _state_collection_getTextValue1 : item === null || item === void 0 ? void 0 : item.textValue) !== null && _ref !== void 0 ? _ref : "";
        dragButtonLabel = stringFormatter.format("dragItem", {
            itemText: itemText
        });
    }
    let descriptionProps = (0, $4vY0V$reactariautils.useDescription)(description);
    if (description) Object.assign(dragProps, descriptionProps);
    if (!props.hasDragButton && props.hasAction) {
        let { onKeyDownCapture: onKeyDownCapture , onKeyUpCapture: onKeyUpCapture  } = dragProps;
        if (modality === "touch") // Remove long press description if an action is present, because in that case long pressing selects the item.
        delete dragProps["aria-describedby"];
        // Require Alt key if there is a conflicting action.
        dragProps.onKeyDownCapture = (e)=>{
            if (e.altKey) onKeyDownCapture(e);
        };
        dragProps.onKeyUpCapture = (e)=>{
            if (e.altKey) onKeyUpCapture(e);
        };
    }
    return {
        dragProps: isDisabled ? {} : dragProps,
        dragButtonProps: {
            ...dragButtonProps,
            isDisabled: isDisabled,
            "aria-label": dragButtonLabel
        }
    };
}


/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $c3e901bab7fcc6ff$export$2962a7984b2f0a80(props, state, ref) {
    // Update global DnD state if this keys within this collection are dragged
    let { draggingCollectionRef: draggingCollectionRef  } = (0, $4620ae0dc40f0031$export$6ca6700462636d0b);
    if (state.draggingKeys.size > 0 && (draggingCollectionRef === null || draggingCollectionRef === void 0 ? void 0 : draggingCollectionRef.current) !== ref.current) (0, $4620ae0dc40f0031$export$f2be18a910c0caa6)(ref);
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



const $74f3dedaa4d234b4$var$globalEvents = new Map();
function $74f3dedaa4d234b4$var$addGlobalEventListener(event, fn) {
    let eventData = $74f3dedaa4d234b4$var$globalEvents.get(event);
    if (!eventData) {
        let handlers = new Set();
        let listener = (e)=>{
            for (let handler of handlers)handler(e);
        };
        eventData = {
            listener: listener,
            handlers: handlers
        };
        $74f3dedaa4d234b4$var$globalEvents.set(event, eventData);
        document.addEventListener(event, listener);
    }
    eventData.handlers.add(fn);
    return ()=>{
        eventData.handlers.delete(fn);
        if (eventData.handlers.size === 0) {
            document.removeEventListener(event, eventData.listener);
            $74f3dedaa4d234b4$var$globalEvents.delete(event);
        }
    };
}
function $74f3dedaa4d234b4$export$2314ca2a3e892862(options) {
    let ref = (0, $4vY0V$react.useRef)(options);
    ref.current = options;
    let isFocusedRef = (0, $4vY0V$react.useRef)(false);
    let { focusProps: focusProps  } = (0, $4vY0V$reactariainteractions.useFocus)({
        onFocusChange: (isFocused)=>{
            isFocusedRef.current = isFocused;
        }
    });
    (0, $4vY0V$react.useEffect)(()=>{
        let onBeforeCopy = (e)=>{
            // Enable the "Copy" menu item in Safari if this element is focused and copying is supported.
            let options = ref.current;
            if (isFocusedRef.current && options.getItems) e.preventDefault();
        };
        let onCopy = (e)=>{
            var _options_onCopy;
            let options = ref.current;
            if (!isFocusedRef.current || !options.getItems) return;
            e.preventDefault();
            (0, $4620ae0dc40f0031$export$f9c1490890ddd063)(e.clipboardData, options.getItems());
            (_options_onCopy = options.onCopy) === null || _options_onCopy === void 0 ? void 0 : _options_onCopy.call(options);
        };
        let onBeforeCut = (e)=>{
            let options = ref.current;
            if (isFocusedRef.current && options.onCut && options.getItems) e.preventDefault();
        };
        let onCut = (e)=>{
            let options = ref.current;
            if (!isFocusedRef.current || !options.onCut || !options.getItems) return;
            e.preventDefault();
            (0, $4620ae0dc40f0031$export$f9c1490890ddd063)(e.clipboardData, options.getItems());
            options.onCut();
        };
        let onBeforePaste = (e)=>{
            let options = ref.current;
            // Unfortunately, e.clipboardData.types is not available in this event so we always
            // have to enable the Paste menu item even if the type of data is unsupported.
            if (isFocusedRef.current && options.onPaste) e.preventDefault();
        };
        let onPaste = (e)=>{
            let options = ref.current;
            if (!isFocusedRef.current || !options.onPaste) return;
            e.preventDefault();
            let items = (0, $4620ae0dc40f0031$export$d9e760437831f8b3)(e.clipboardData);
            options.onPaste(items);
        };
        return (0, $4vY0V$reactariautils.chain)($74f3dedaa4d234b4$var$addGlobalEventListener("beforecopy", onBeforeCopy), $74f3dedaa4d234b4$var$addGlobalEventListener("copy", onCopy), $74f3dedaa4d234b4$var$addGlobalEventListener("beforecut", onBeforeCut), $74f3dedaa4d234b4$var$addGlobalEventListener("cut", onCut), $74f3dedaa4d234b4$var$addGlobalEventListener("beforepaste", onBeforePaste), $74f3dedaa4d234b4$var$addGlobalEventListener("paste", onPaste));
    }, []);
    return {
        clipboardProps: focusProps
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

function $2dccaca1f4baa446$var$DragPreview(props, ref) {
    let render = props.children;
    let [children, setChildren] = (0, $4vY0V$react.useState)(null);
    let domRef = (0, $4vY0V$react.useRef)(null);
    (0, $4vY0V$react.useImperativeHandle)(ref, ()=>(items, callback)=>{
            // This will be called during the onDragStart event by useDrag. We need to render the
            // preview synchronously before this event returns so we can call event.dataTransfer.setDragImage.
            (0, $4vY0V$reactdom.flushSync)(()=>{
                setChildren(render(items));
            });
            // Yield back to useDrag to set the drag image.
            callback(domRef.current);
            // Remove the preview from the DOM after a frame so the browser has time to paint.
            requestAnimationFrame(()=>{
                setChildren(null);
            });
        }, [
        render
    ]);
    if (!children) return null;
    return /*#__PURE__*/ (0, ($parcel$interopDefault($4vY0V$react))).createElement("div", {
        style: {
            zIndex: -100,
            position: "absolute",
            top: 0,
            left: -100000
        },
        ref: domRef
    }, children);
}
let $2dccaca1f4baa446$export$905ab40ac2179daa = /*#__PURE__*/ (0, ($parcel$interopDefault($4vY0V$react))).forwardRef($2dccaca1f4baa446$var$DragPreview);


class $2268795bbb597ecb$export$fbd65d14c79e28cc {
    getDropTargetFromPoint(x, y, isValidDropTarget) {
        if (this.collection.size === 0) return {
            type: "root"
        };
        let rect = this.ref.current.getBoundingClientRect();
        x += rect.x;
        y += rect.y;
        let elements = this.ref.current.querySelectorAll("[data-key]");
        let elementMap = new Map();
        for (let item of elements)if (item instanceof HTMLElement) elementMap.set(item.dataset.key, item);
        let items = [
            ...this.collection
        ];
        let low = 0;
        let high = items.length;
        while(low < high){
            let mid = Math.floor((low + high) / 2);
            let item1 = items[mid];
            let element = elementMap.get(String(item1.key));
            let rect1 = element.getBoundingClientRect();
            if (y < rect1.top) high = mid;
            else if (y > rect1.bottom) low = mid + 1;
            else {
                let target = {
                    type: "item",
                    key: item1.key,
                    dropPosition: "on"
                };
                if (isValidDropTarget(target)) {
                    // Otherwise, if dropping on the item is accepted, try the before/after positions if within 5px
                    // of the top or bottom of the item.
                    if (y <= rect1.top + 5 && isValidDropTarget({
                        ...target,
                        dropPosition: "before"
                    })) target.dropPosition = "before";
                    else if (y >= rect1.bottom - 5 && isValidDropTarget({
                        ...target,
                        dropPosition: "after"
                    })) target.dropPosition = "after";
                } else {
                    // If dropping on the item isn't accepted, try the target before or after depending on the y position.
                    let midY = rect1.top + rect1.height / 2;
                    if (y <= midY && isValidDropTarget({
                        ...target,
                        dropPosition: "before"
                    })) target.dropPosition = "before";
                    else if (y >= midY && isValidDropTarget({
                        ...target,
                        dropPosition: "after"
                    })) target.dropPosition = "after";
                }
                return target;
            }
        }
        let item2 = items[Math.min(low, items.length - 1)];
        let element1 = elementMap.get(String(item2.key));
        rect = element1.getBoundingClientRect();
        if (Math.abs(y - rect.top) < Math.abs(y - rect.bottom)) return {
            type: "item",
            key: item2.key,
            dropPosition: "before"
        };
        return {
            type: "item",
            key: item2.key,
            dropPosition: "after"
        };
    }
    constructor(collection, ref){
        this.collection = collection;
        this.ref = ref;
    }
}






//# sourceMappingURL=main.js.map
