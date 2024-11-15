var $aB6Cp$reactariautils = require("@react-aria/utils");
var $aB6Cp$react = require("react");
var $aB6Cp$reactariainteractions = require("@react-aria/interactions");
var $aB6Cp$clsx = require("clsx");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "FocusScope", () => $a7a032acae3ddda9$export$20e40289641fbbb6);
$parcel$export(module.exports, "useFocusManager", () => $a7a032acae3ddda9$export$10c5169755ce7bd7);
$parcel$export(module.exports, "getFocusableTreeWalker", () => $a7a032acae3ddda9$export$2d6ec8fc375ceafa);
$parcel$export(module.exports, "createFocusManager", () => $a7a032acae3ddda9$export$c5251b9e124bf29);
$parcel$export(module.exports, "isElementInChildOfActiveScope", () => $a7a032acae3ddda9$export$1258395f99bf9cbf);
$parcel$export(module.exports, "FocusRing", () => $dfd8c70b928eb1b3$export$1a38b4ad7f578e1d);
$parcel$export(module.exports, "FocusableProvider", () => $fb504d83237fd6ac$export$13f3202a3e5ddd5);
$parcel$export(module.exports, "useFocusable", () => $fb504d83237fd6ac$export$4c014de7c8940b4c);
$parcel$export(module.exports, "useFocusRing", () => $581a96d6eb128c1b$export$4e328f61c538687f);
$parcel$export(module.exports, "focusSafely", () => $1c7f9157d722357d$export$80f3e147d781571c);
$parcel$export(module.exports, "useHasTabbableChild", () => $259c6413a286f2e6$export$eac1895992b9f3d6);
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
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $1c7f9157d722357d$export$80f3e147d781571c(element) {
    // If the user is interacting with a virtual cursor, e.g. screen reader, then
    // wait until after any animated transitions that are currently occurring on
    // the page before shifting focus. This avoids issues with VoiceOver on iOS
    // causing the page to scroll when moving focus if the element is transitioning
    // from off the screen.
    const ownerDocument = (0, $aB6Cp$reactariautils.getOwnerDocument)(element);
    if ((0, $aB6Cp$reactariainteractions.getInteractionModality)() === "virtual") {
        let lastFocusedElement = ownerDocument.activeElement;
        (0, $aB6Cp$reactariautils.runAfterTransition)(()=>{
            // If focus did not move and the element is still in the document, focus it.
            if (ownerDocument.activeElement === lastFocusedElement && element.isConnected) (0, $aB6Cp$reactariautils.focusWithoutScrolling)(element);
        });
    } else (0, $aB6Cp$reactariautils.focusWithoutScrolling)(element);
}



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
function $d5156037ad898a4d$var$isStyleVisible(element) {
    const windowObject = (0, $aB6Cp$reactariautils.getOwnerWindow)(element);
    if (!(element instanceof windowObject.HTMLElement) && !(element instanceof windowObject.SVGElement)) return false;
    let { display: display, visibility: visibility } = element.style;
    let isVisible = display !== "none" && visibility !== "hidden" && visibility !== "collapse";
    if (isVisible) {
        const { getComputedStyle: getComputedStyle } = element.ownerDocument.defaultView;
        let { display: computedDisplay, visibility: computedVisibility } = getComputedStyle(element);
        isVisible = computedDisplay !== "none" && computedVisibility !== "hidden" && computedVisibility !== "collapse";
    }
    return isVisible;
}
function $d5156037ad898a4d$var$isAttributeVisible(element, childElement) {
    return !element.hasAttribute("hidden") && (element.nodeName === "DETAILS" && childElement && childElement.nodeName !== "SUMMARY" ? element.hasAttribute("open") : true);
}
function $d5156037ad898a4d$export$e989c0fffaa6b27a(element, childElement) {
    return element.nodeName !== "#comment" && $d5156037ad898a4d$var$isStyleVisible(element) && $d5156037ad898a4d$var$isAttributeVisible(element, childElement) && (!element.parentElement || $d5156037ad898a4d$export$e989c0fffaa6b27a(element.parentElement, element));
}



const $a7a032acae3ddda9$var$FocusContext = /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).createContext(null);
let $a7a032acae3ddda9$var$activeScope = null;
function $a7a032acae3ddda9$export$20e40289641fbbb6(props) {
    let { children: children, contain: contain, restoreFocus: restoreFocus, autoFocus: autoFocus } = props;
    let startRef = (0, $aB6Cp$react.useRef)(null);
    let endRef = (0, $aB6Cp$react.useRef)(null);
    let scopeRef = (0, $aB6Cp$react.useRef)([]);
    let { parentNode: parentNode } = (0, $aB6Cp$react.useContext)($a7a032acae3ddda9$var$FocusContext) || {};
    // Create a tree node here so we can add children to it even before it is added to the tree.
    let node = (0, $aB6Cp$react.useMemo)(()=>new $a7a032acae3ddda9$var$TreeNode({
            scopeRef: scopeRef
        }), [
        scopeRef
    ]);
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        // If a new scope mounts outside the active scope, (e.g. DialogContainer launched from a menu),
        // use the active scope as the parent instead of the parent from context. Layout effects run bottom
        // up, so if the parent is not yet added to the tree, don't do this. Only the outer-most FocusScope
        // that is being added should get the activeScope as its parent.
        let parent = parentNode || $a7a032acae3ddda9$export$d06fae2ee68b101e.root;
        if ($a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(parent.scopeRef) && $a7a032acae3ddda9$var$activeScope && !$a7a032acae3ddda9$var$isAncestorScope($a7a032acae3ddda9$var$activeScope, parent.scopeRef)) {
            let activeNode = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode($a7a032acae3ddda9$var$activeScope);
            if (activeNode) parent = activeNode;
        }
        // Add the node to the parent, and to the tree.
        parent.addChild(node);
        $a7a032acae3ddda9$export$d06fae2ee68b101e.addNode(node);
    }, [
        node,
        parentNode
    ]);
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        let node = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scopeRef);
        if (node) node.contain = !!contain;
    }, [
        contain
    ]);
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        var _startRef_current;
        // Find all rendered nodes between the sentinels and add them to the scope.
        let node = (_startRef_current = startRef.current) === null || _startRef_current === void 0 ? void 0 : _startRef_current.nextSibling;
        let nodes = [];
        while(node && node !== endRef.current){
            nodes.push(node);
            node = node.nextSibling;
        }
        scopeRef.current = nodes;
    }, [
        children
    ]);
    $a7a032acae3ddda9$var$useActiveScopeTracker(scopeRef, restoreFocus, contain);
    $a7a032acae3ddda9$var$useFocusContainment(scopeRef, contain);
    $a7a032acae3ddda9$var$useRestoreFocus(scopeRef, restoreFocus, contain);
    $a7a032acae3ddda9$var$useAutoFocus(scopeRef, autoFocus);
    // This needs to be an effect so that activeScope is updated after the FocusScope tree is complete.
    // It cannot be a useLayoutEffect because the parent of this node hasn't been attached in the tree yet.
    (0, $aB6Cp$react.useEffect)(()=>{
        const activeElement = (0, $aB6Cp$reactariautils.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined).activeElement;
        let scope = null;
        if ($a7a032acae3ddda9$var$isElementInScope(activeElement, scopeRef.current)) {
            // We need to traverse the focusScope tree and find the bottom most scope that
            // contains the active element and set that as the activeScope.
            for (let node of $a7a032acae3ddda9$export$d06fae2ee68b101e.traverse())if (node.scopeRef && $a7a032acae3ddda9$var$isElementInScope(activeElement, node.scopeRef.current)) scope = node;
            if (scope === $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scopeRef)) $a7a032acae3ddda9$var$activeScope = scope.scopeRef;
        }
    }, [
        scopeRef
    ]);
    // This layout effect cleanup is so that the tree node is removed synchronously with react before the RAF
    // in useRestoreFocus cleanup runs.
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        return ()=>{
            var _focusScopeTree_getTreeNode_parent, _focusScopeTree_getTreeNode;
            var _focusScopeTree_getTreeNode_parent_scopeRef;
            // Scope may have been re-parented.
            let parentScope = (_focusScopeTree_getTreeNode_parent_scopeRef = (_focusScopeTree_getTreeNode = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scopeRef)) === null || _focusScopeTree_getTreeNode === void 0 ? void 0 : (_focusScopeTree_getTreeNode_parent = _focusScopeTree_getTreeNode.parent) === null || _focusScopeTree_getTreeNode_parent === void 0 ? void 0 : _focusScopeTree_getTreeNode_parent.scopeRef) !== null && _focusScopeTree_getTreeNode_parent_scopeRef !== void 0 ? _focusScopeTree_getTreeNode_parent_scopeRef : null;
            if ((scopeRef === $a7a032acae3ddda9$var$activeScope || $a7a032acae3ddda9$var$isAncestorScope(scopeRef, $a7a032acae3ddda9$var$activeScope)) && (!parentScope || $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(parentScope))) $a7a032acae3ddda9$var$activeScope = parentScope;
            $a7a032acae3ddda9$export$d06fae2ee68b101e.removeTreeNode(scopeRef);
        };
    }, [
        scopeRef
    ]);
    let focusManager = (0, $aB6Cp$react.useMemo)(()=>$a7a032acae3ddda9$var$createFocusManagerForScope(scopeRef), []);
    let value = (0, $aB6Cp$react.useMemo)(()=>({
            focusManager: focusManager,
            parentNode: node
        }), [
        node,
        focusManager
    ]);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).createElement($a7a032acae3ddda9$var$FocusContext.Provider, {
        value: value
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).createElement("span", {
        "data-focus-scope-start": true,
        hidden: true,
        ref: startRef
    }), children, /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).createElement("span", {
        "data-focus-scope-end": true,
        hidden: true,
        ref: endRef
    }));
}
function $a7a032acae3ddda9$export$10c5169755ce7bd7() {
    var _useContext;
    return (_useContext = (0, $aB6Cp$react.useContext)($a7a032acae3ddda9$var$FocusContext)) === null || _useContext === void 0 ? void 0 : _useContext.focusManager;
}
function $a7a032acae3ddda9$var$createFocusManagerForScope(scopeRef) {
    return {
        focusNext (opts = {}) {
            let scope = scopeRef.current;
            let { from: from, tabbable: tabbable, wrap: wrap, accept: accept } = opts;
            let node = from || (0, $aB6Cp$reactariautils.getOwnerDocument)(scope[0]).activeElement;
            let sentinel = scope[0].previousElementSibling;
            let scopeRoot = $a7a032acae3ddda9$var$getScopeRoot(scope);
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = $a7a032acae3ddda9$var$isElementInScope(node, scope) ? node : sentinel;
            let nextNode = walker.nextNode();
            if (!nextNode && wrap) {
                walker.currentNode = sentinel;
                nextNode = walker.nextNode();
            }
            if (nextNode) $a7a032acae3ddda9$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusPrevious (opts = {}) {
            let scope = scopeRef.current;
            let { from: from, tabbable: tabbable, wrap: wrap, accept: accept } = opts;
            let node = from || (0, $aB6Cp$reactariautils.getOwnerDocument)(scope[0]).activeElement;
            let sentinel = scope[scope.length - 1].nextElementSibling;
            let scopeRoot = $a7a032acae3ddda9$var$getScopeRoot(scope);
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = $a7a032acae3ddda9$var$isElementInScope(node, scope) ? node : sentinel;
            let previousNode = walker.previousNode();
            if (!previousNode && wrap) {
                walker.currentNode = sentinel;
                previousNode = walker.previousNode();
            }
            if (previousNode) $a7a032acae3ddda9$var$focusElement(previousNode, true);
            return previousNode;
        },
        focusFirst (opts = {}) {
            let scope = scopeRef.current;
            let { tabbable: tabbable, accept: accept } = opts;
            let scopeRoot = $a7a032acae3ddda9$var$getScopeRoot(scope);
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = scope[0].previousElementSibling;
            let nextNode = walker.nextNode();
            if (nextNode) $a7a032acae3ddda9$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusLast (opts = {}) {
            let scope = scopeRef.current;
            let { tabbable: tabbable, accept: accept } = opts;
            let scopeRoot = $a7a032acae3ddda9$var$getScopeRoot(scope);
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = scope[scope.length - 1].nextElementSibling;
            let previousNode = walker.previousNode();
            if (previousNode) $a7a032acae3ddda9$var$focusElement(previousNode, true);
            return previousNode;
        }
    };
}
const $a7a032acae3ddda9$var$focusableElements = [
    "input:not([disabled]):not([type=hidden])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    "a[href]",
    "area[href]",
    "summary",
    "iframe",
    "object",
    "embed",
    "audio[controls]",
    "video[controls]",
    "[contenteditable]"
];
const $a7a032acae3ddda9$var$FOCUSABLE_ELEMENT_SELECTOR = $a7a032acae3ddda9$var$focusableElements.join(":not([hidden]),") + ",[tabindex]:not([disabled]):not([hidden])";
$a7a032acae3ddda9$var$focusableElements.push('[tabindex]:not([tabindex="-1"]):not([disabled])');
const $a7a032acae3ddda9$var$TABBABLE_ELEMENT_SELECTOR = $a7a032acae3ddda9$var$focusableElements.join(':not([hidden]):not([tabindex="-1"]),');
function $a7a032acae3ddda9$var$getScopeRoot(scope) {
    return scope[0].parentElement;
}
function $a7a032acae3ddda9$var$shouldContainFocus(scopeRef) {
    let scope = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode($a7a032acae3ddda9$var$activeScope);
    while(scope && scope.scopeRef !== scopeRef){
        if (scope.contain) return false;
        scope = scope.parent;
    }
    return true;
}
function $a7a032acae3ddda9$var$useFocusContainment(scopeRef, contain) {
    let focusedNode = (0, $aB6Cp$react.useRef)();
    let raf = (0, $aB6Cp$react.useRef)();
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        let scope = scopeRef.current;
        if (!contain) {
            // if contain was changed, then we should cancel any ongoing waits to pull focus back into containment
            if (raf.current) {
                cancelAnimationFrame(raf.current);
                raf.current = undefined;
            }
            return;
        }
        const ownerDocument = (0, $aB6Cp$reactariautils.getOwnerDocument)(scope ? scope[0] : undefined);
        // Handle the Tab key to contain focus within the scope
        let onKeyDown = (e)=>{
            if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey || !$a7a032acae3ddda9$var$shouldContainFocus(scopeRef)) return;
            let focusedElement = ownerDocument.activeElement;
            let scope = scopeRef.current;
            if (!scope || !$a7a032acae3ddda9$var$isElementInScope(focusedElement, scope)) return;
            let scopeRoot = $a7a032acae3ddda9$var$getScopeRoot(scope);
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: true
            }, scope);
            if (!focusedElement) return;
            walker.currentNode = focusedElement;
            let nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
            if (!nextElement) {
                walker.currentNode = e.shiftKey ? scope[scope.length - 1].nextElementSibling : scope[0].previousElementSibling;
                nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
            }
            e.preventDefault();
            if (nextElement) $a7a032acae3ddda9$var$focusElement(nextElement, true);
        };
        let onFocus = (e)=>{
            // If focusing an element in a child scope of the currently active scope, the child becomes active.
            // Moving out of the active scope to an ancestor is not allowed.
            if ((!$a7a032acae3ddda9$var$activeScope || $a7a032acae3ddda9$var$isAncestorScope($a7a032acae3ddda9$var$activeScope, scopeRef)) && $a7a032acae3ddda9$var$isElementInScope(e.target, scopeRef.current)) {
                $a7a032acae3ddda9$var$activeScope = scopeRef;
                focusedNode.current = e.target;
            } else if ($a7a032acae3ddda9$var$shouldContainFocus(scopeRef) && !$a7a032acae3ddda9$var$isElementInChildScope(e.target, scopeRef)) {
                // If a focus event occurs outside the active scope (e.g. user tabs from browser location bar),
                // restore focus to the previously focused node or the first tabbable element in the active scope.
                if (focusedNode.current) focusedNode.current.focus();
                else if ($a7a032acae3ddda9$var$activeScope && $a7a032acae3ddda9$var$activeScope.current) $a7a032acae3ddda9$var$focusFirstInScope($a7a032acae3ddda9$var$activeScope.current);
            } else if ($a7a032acae3ddda9$var$shouldContainFocus(scopeRef)) focusedNode.current = e.target;
        };
        let onBlur = (e)=>{
            // Firefox doesn't shift focus back to the Dialog properly without this
            if (raf.current) cancelAnimationFrame(raf.current);
            raf.current = requestAnimationFrame(()=>{
                // Use document.activeElement instead of e.relatedTarget so we can tell if user clicked into iframe
                if (ownerDocument.activeElement && $a7a032acae3ddda9$var$shouldContainFocus(scopeRef) && !$a7a032acae3ddda9$var$isElementInChildScope(ownerDocument.activeElement, scopeRef)) {
                    $a7a032acae3ddda9$var$activeScope = scopeRef;
                    if (ownerDocument.body.contains(e.target)) {
                        var _focusedNode_current;
                        focusedNode.current = e.target;
                        (_focusedNode_current = focusedNode.current) === null || _focusedNode_current === void 0 ? void 0 : _focusedNode_current.focus();
                    } else if ($a7a032acae3ddda9$var$activeScope.current) $a7a032acae3ddda9$var$focusFirstInScope($a7a032acae3ddda9$var$activeScope.current);
                }
            });
        };
        ownerDocument.addEventListener("keydown", onKeyDown, false);
        ownerDocument.addEventListener("focusin", onFocus, false);
        scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.addEventListener("focusin", onFocus, false));
        scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.addEventListener("focusout", onBlur, false));
        return ()=>{
            ownerDocument.removeEventListener("keydown", onKeyDown, false);
            ownerDocument.removeEventListener("focusin", onFocus, false);
            scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.removeEventListener("focusin", onFocus, false));
            scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.removeEventListener("focusout", onBlur, false));
        };
    }, [
        scopeRef,
        contain
    ]);
    // This is a useLayoutEffect so it is guaranteed to run before our async synthetic blur
    // eslint-disable-next-line arrow-body-style
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        return ()=>{
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [
        raf
    ]);
}
function $a7a032acae3ddda9$var$isElementInAnyScope(element) {
    return $a7a032acae3ddda9$var$isElementInChildScope(element);
}
function $a7a032acae3ddda9$var$isElementInScope(element, scope) {
    if (!element) return false;
    if (!scope) return false;
    return scope.some((node)=>node.contains(element));
}
function $a7a032acae3ddda9$var$isElementInChildScope(element, scope = null) {
    // If the element is within a top layer element (e.g. toasts), always allow moving focus there.
    if (element instanceof Element && element.closest("[data-react-aria-top-layer]")) return true;
    // node.contains in isElementInScope covers child scopes that are also DOM children,
    // but does not cover child scopes in portals.
    for (let { scopeRef: s } of $a7a032acae3ddda9$export$d06fae2ee68b101e.traverse($a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scope))){
        if (s && $a7a032acae3ddda9$var$isElementInScope(element, s.current)) return true;
    }
    return false;
}
function $a7a032acae3ddda9$export$1258395f99bf9cbf(element) {
    return $a7a032acae3ddda9$var$isElementInChildScope(element, $a7a032acae3ddda9$var$activeScope);
}
function $a7a032acae3ddda9$var$isAncestorScope(ancestor, scope) {
    var _focusScopeTree_getTreeNode;
    let parent = (_focusScopeTree_getTreeNode = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scope)) === null || _focusScopeTree_getTreeNode === void 0 ? void 0 : _focusScopeTree_getTreeNode.parent;
    while(parent){
        if (parent.scopeRef === ancestor) return true;
        parent = parent.parent;
    }
    return false;
}
function $a7a032acae3ddda9$var$focusElement(element, scroll = false) {
    if (element != null && !scroll) try {
        (0, $1c7f9157d722357d$export$80f3e147d781571c)(element);
    } catch (err) {
    // ignore
    }
    else if (element != null) try {
        element.focus();
    } catch (err) {
    // ignore
    }
}
function $a7a032acae3ddda9$var$focusFirstInScope(scope, tabbable = true) {
    let sentinel = scope[0].previousElementSibling;
    let scopeRoot = $a7a032acae3ddda9$var$getScopeRoot(scope);
    let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(scopeRoot, {
        tabbable: tabbable
    }, scope);
    walker.currentNode = sentinel;
    let nextNode = walker.nextNode();
    // If the scope does not contain a tabbable element, use the first focusable element.
    if (tabbable && !nextNode) {
        scopeRoot = $a7a032acae3ddda9$var$getScopeRoot(scope);
        walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(scopeRoot, {
            tabbable: false
        }, scope);
        walker.currentNode = sentinel;
        nextNode = walker.nextNode();
    }
    $a7a032acae3ddda9$var$focusElement(nextNode);
}
function $a7a032acae3ddda9$var$useAutoFocus(scopeRef, autoFocus) {
    const autoFocusRef = (0, ($parcel$interopDefault($aB6Cp$react))).useRef(autoFocus);
    (0, $aB6Cp$react.useEffect)(()=>{
        if (autoFocusRef.current) {
            $a7a032acae3ddda9$var$activeScope = scopeRef;
            const ownerDocument = (0, $aB6Cp$reactariautils.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined);
            if (!$a7a032acae3ddda9$var$isElementInScope(ownerDocument.activeElement, $a7a032acae3ddda9$var$activeScope.current) && scopeRef.current) $a7a032acae3ddda9$var$focusFirstInScope(scopeRef.current);
        }
        autoFocusRef.current = false;
    }, [
        scopeRef
    ]);
}
function $a7a032acae3ddda9$var$useActiveScopeTracker(scopeRef, restore, contain) {
    // tracks the active scope, in case restore and contain are both false.
    // if either are true, this is tracked in useRestoreFocus or useFocusContainment.
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        if (restore || contain) return;
        let scope = scopeRef.current;
        const ownerDocument = (0, $aB6Cp$reactariautils.getOwnerDocument)(scope ? scope[0] : undefined);
        let onFocus = (e)=>{
            let target = e.target;
            if ($a7a032acae3ddda9$var$isElementInScope(target, scopeRef.current)) $a7a032acae3ddda9$var$activeScope = scopeRef;
            else if (!$a7a032acae3ddda9$var$isElementInAnyScope(target)) $a7a032acae3ddda9$var$activeScope = null;
        };
        ownerDocument.addEventListener("focusin", onFocus, false);
        scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.addEventListener("focusin", onFocus, false));
        return ()=>{
            ownerDocument.removeEventListener("focusin", onFocus, false);
            scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.removeEventListener("focusin", onFocus, false));
        };
    }, [
        scopeRef,
        restore,
        contain
    ]);
}
function $a7a032acae3ddda9$var$shouldRestoreFocus(scopeRef) {
    let scope = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode($a7a032acae3ddda9$var$activeScope);
    while(scope && scope.scopeRef !== scopeRef){
        if (scope.nodeToRestore) return false;
        scope = scope.parent;
    }
    return (scope === null || scope === void 0 ? void 0 : scope.scopeRef) === scopeRef;
}
function $a7a032acae3ddda9$var$useRestoreFocus(scopeRef, restoreFocus, contain) {
    // create a ref during render instead of useLayoutEffect so the active element is saved before a child with autoFocus=true mounts.
    // eslint-disable-next-line no-restricted-globals
    const nodeToRestoreRef = (0, $aB6Cp$react.useRef)(typeof document !== "undefined" ? (0, $aB6Cp$reactariautils.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined).activeElement : null);
    // restoring scopes should all track if they are active regardless of contain, but contain already tracks it plus logic to contain the focus
    // restoring-non-containing scopes should only care if they become active so they can perform the restore
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        let scope = scopeRef.current;
        const ownerDocument = (0, $aB6Cp$reactariautils.getOwnerDocument)(scope ? scope[0] : undefined);
        if (!restoreFocus || contain) return;
        let onFocus = ()=>{
            // If focusing an element in a child scope of the currently active scope, the child becomes active.
            // Moving out of the active scope to an ancestor is not allowed.
            if ((!$a7a032acae3ddda9$var$activeScope || $a7a032acae3ddda9$var$isAncestorScope($a7a032acae3ddda9$var$activeScope, scopeRef)) && $a7a032acae3ddda9$var$isElementInScope(ownerDocument.activeElement, scopeRef.current)) $a7a032acae3ddda9$var$activeScope = scopeRef;
        };
        ownerDocument.addEventListener("focusin", onFocus, false);
        scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.addEventListener("focusin", onFocus, false));
        return ()=>{
            ownerDocument.removeEventListener("focusin", onFocus, false);
            scope === null || scope === void 0 ? void 0 : scope.forEach((element)=>element.removeEventListener("focusin", onFocus, false));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        scopeRef,
        contain
    ]);
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        const ownerDocument = (0, $aB6Cp$reactariautils.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined);
        if (!restoreFocus) return;
        // Handle the Tab key so that tabbing out of the scope goes to the next element
        // after the node that had focus when the scope mounted. This is important when
        // using portals for overlays, so that focus goes to the expected element when
        // tabbing out of the overlay.
        let onKeyDown = (e)=>{
            if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey || !$a7a032acae3ddda9$var$shouldContainFocus(scopeRef)) return;
            let focusedElement = ownerDocument.activeElement;
            if (!$a7a032acae3ddda9$var$isElementInScope(focusedElement, scopeRef.current)) return;
            let treeNode = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scopeRef);
            if (!treeNode) return;
            let nodeToRestore = treeNode.nodeToRestore;
            // Create a DOM tree walker that matches all tabbable elements
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(ownerDocument.body, {
                tabbable: true
            });
            // Find the next tabbable element after the currently focused element
            walker.currentNode = focusedElement;
            let nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
            if (!nodeToRestore || !ownerDocument.body.contains(nodeToRestore) || nodeToRestore === ownerDocument.body) {
                nodeToRestore = undefined;
                treeNode.nodeToRestore = undefined;
            }
            // If there is no next element, or it is outside the current scope, move focus to the
            // next element after the node to restore to instead.
            if ((!nextElement || !$a7a032acae3ddda9$var$isElementInScope(nextElement, scopeRef.current)) && nodeToRestore) {
                walker.currentNode = nodeToRestore;
                // Skip over elements within the scope, in case the scope immediately follows the node to restore.
                do nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
                while ($a7a032acae3ddda9$var$isElementInScope(nextElement, scopeRef.current));
                e.preventDefault();
                e.stopPropagation();
                if (nextElement) $a7a032acae3ddda9$var$focusElement(nextElement, true);
                else // If there is no next element and the nodeToRestore isn't within a FocusScope (i.e. we are leaving the top level focus scope)
                // then move focus to the body.
                // Otherwise restore focus to the nodeToRestore (e.g menu within a popover -> tabbing to close the menu should move focus to menu trigger)
                if (!$a7a032acae3ddda9$var$isElementInAnyScope(nodeToRestore)) focusedElement.blur();
                else $a7a032acae3ddda9$var$focusElement(nodeToRestore, true);
            }
        };
        if (!contain) ownerDocument.addEventListener("keydown", onKeyDown, true);
        return ()=>{
            if (!contain) ownerDocument.removeEventListener("keydown", onKeyDown, true);
        };
    }, [
        scopeRef,
        restoreFocus,
        contain
    ]);
    // useLayoutEffect instead of useEffect so the active element is saved synchronously instead of asynchronously.
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        const ownerDocument = (0, $aB6Cp$reactariautils.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined);
        if (!restoreFocus) return;
        let treeNode = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scopeRef);
        if (!treeNode) return;
        var _nodeToRestoreRef_current;
        treeNode.nodeToRestore = (_nodeToRestoreRef_current = nodeToRestoreRef.current) !== null && _nodeToRestoreRef_current !== void 0 ? _nodeToRestoreRef_current : undefined;
        return ()=>{
            let treeNode = $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(scopeRef);
            if (!treeNode) return;
            let nodeToRestore = treeNode.nodeToRestore;
            // if we already lost focus to the body and this was the active scope, then we should attempt to restore
            if (restoreFocus && nodeToRestore && // eslint-disable-next-line react-hooks/exhaustive-deps
            ($a7a032acae3ddda9$var$isElementInScope(ownerDocument.activeElement, scopeRef.current) || ownerDocument.activeElement === ownerDocument.body && $a7a032acae3ddda9$var$shouldRestoreFocus(scopeRef))) {
                // freeze the focusScopeTree so it persists after the raf, otherwise during unmount nodes are removed from it
                let clonedTree = $a7a032acae3ddda9$export$d06fae2ee68b101e.clone();
                requestAnimationFrame(()=>{
                    // Only restore focus if we've lost focus to the body, the alternative is that focus has been purposefully moved elsewhere
                    if (ownerDocument.activeElement === ownerDocument.body) {
                        // look up the tree starting with our scope to find a nodeToRestore still in the DOM
                        let treeNode = clonedTree.getTreeNode(scopeRef);
                        while(treeNode){
                            if (treeNode.nodeToRestore && treeNode.nodeToRestore.isConnected) {
                                $a7a032acae3ddda9$var$focusElement(treeNode.nodeToRestore);
                                return;
                            }
                            treeNode = treeNode.parent;
                        }
                        // If no nodeToRestore was found, focus the first element in the nearest
                        // ancestor scope that is still in the tree.
                        treeNode = clonedTree.getTreeNode(scopeRef);
                        while(treeNode){
                            if (treeNode.scopeRef && treeNode.scopeRef.current && $a7a032acae3ddda9$export$d06fae2ee68b101e.getTreeNode(treeNode.scopeRef)) {
                                $a7a032acae3ddda9$var$focusFirstInScope(treeNode.scopeRef.current, true);
                                return;
                            }
                            treeNode = treeNode.parent;
                        }
                    }
                });
            }
        };
    }, [
        scopeRef,
        restoreFocus
    ]);
}
function $a7a032acae3ddda9$export$2d6ec8fc375ceafa(root, opts, scope) {
    let selector = (opts === null || opts === void 0 ? void 0 : opts.tabbable) ? $a7a032acae3ddda9$var$TABBABLE_ELEMENT_SELECTOR : $a7a032acae3ddda9$var$FOCUSABLE_ELEMENT_SELECTOR;
    let walker = (0, $aB6Cp$reactariautils.getOwnerDocument)(root).createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode (node) {
            var _opts_from;
            // Skip nodes inside the starting node.
            if (opts === null || opts === void 0 ? void 0 : (_opts_from = opts.from) === null || _opts_from === void 0 ? void 0 : _opts_from.contains(node)) return NodeFilter.FILTER_REJECT;
            if (node.matches(selector) && (0, $d5156037ad898a4d$export$e989c0fffaa6b27a)(node) && (!scope || $a7a032acae3ddda9$var$isElementInScope(node, scope)) && (!(opts === null || opts === void 0 ? void 0 : opts.accept) || opts.accept(node))) return NodeFilter.FILTER_ACCEPT;
            return NodeFilter.FILTER_SKIP;
        }
    });
    if (opts === null || opts === void 0 ? void 0 : opts.from) walker.currentNode = opts.from;
    return walker;
}
function $a7a032acae3ddda9$export$c5251b9e124bf29(ref, defaultOptions = {}) {
    return {
        focusNext (opts = {}) {
            let root = ref.current;
            if (!root) return null;
            let { from: from, tabbable: tabbable = defaultOptions.tabbable, wrap: wrap = defaultOptions.wrap, accept: accept = defaultOptions.accept } = opts;
            let node = from || (0, $aB6Cp$reactariautils.getOwnerDocument)(root).activeElement;
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            if (root.contains(node)) walker.currentNode = node;
            let nextNode = walker.nextNode();
            if (!nextNode && wrap) {
                walker.currentNode = root;
                nextNode = walker.nextNode();
            }
            if (nextNode) $a7a032acae3ddda9$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusPrevious (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { from: from, tabbable: tabbable = defaultOptions.tabbable, wrap: wrap = defaultOptions.wrap, accept: accept = defaultOptions.accept } = opts;
            let node = from || (0, $aB6Cp$reactariautils.getOwnerDocument)(root).activeElement;
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            if (root.contains(node)) walker.currentNode = node;
            else {
                let next = $a7a032acae3ddda9$var$last(walker);
                if (next) $a7a032acae3ddda9$var$focusElement(next, true);
                return next !== null && next !== void 0 ? next : null;
            }
            let previousNode = walker.previousNode();
            if (!previousNode && wrap) {
                walker.currentNode = root;
                let lastNode = $a7a032acae3ddda9$var$last(walker);
                if (!lastNode) // couldn't wrap
                return null;
                previousNode = lastNode;
            }
            if (previousNode) $a7a032acae3ddda9$var$focusElement(previousNode, true);
            return previousNode !== null && previousNode !== void 0 ? previousNode : null;
        },
        focusFirst (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { tabbable: tabbable = defaultOptions.tabbable, accept: accept = defaultOptions.accept } = opts;
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            let nextNode = walker.nextNode();
            if (nextNode) $a7a032acae3ddda9$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusLast (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { tabbable: tabbable = defaultOptions.tabbable, accept: accept = defaultOptions.accept } = opts;
            let walker = $a7a032acae3ddda9$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            let next = $a7a032acae3ddda9$var$last(walker);
            if (next) $a7a032acae3ddda9$var$focusElement(next, true);
            return next !== null && next !== void 0 ? next : null;
        }
    };
}
function $a7a032acae3ddda9$var$last(walker) {
    let next = undefined;
    let last;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}
class $a7a032acae3ddda9$var$Tree {
    get size() {
        return this.fastMap.size;
    }
    getTreeNode(data) {
        return this.fastMap.get(data);
    }
    addTreeNode(scopeRef, parent, nodeToRestore) {
        let parentNode = this.fastMap.get(parent !== null && parent !== void 0 ? parent : null);
        if (!parentNode) return;
        let node = new $a7a032acae3ddda9$var$TreeNode({
            scopeRef: scopeRef
        });
        parentNode.addChild(node);
        node.parent = parentNode;
        this.fastMap.set(scopeRef, node);
        if (nodeToRestore) node.nodeToRestore = nodeToRestore;
    }
    addNode(node) {
        this.fastMap.set(node.scopeRef, node);
    }
    removeTreeNode(scopeRef) {
        // never remove the root
        if (scopeRef === null) return;
        let node = this.fastMap.get(scopeRef);
        if (!node) return;
        let parentNode = node.parent;
        // when we remove a scope, check if any sibling scopes are trying to restore focus to something inside the scope we're removing
        // if we are, then replace the siblings restore with the restore from the scope we're removing
        for (let current of this.traverse())if (current !== node && node.nodeToRestore && current.nodeToRestore && node.scopeRef && node.scopeRef.current && $a7a032acae3ddda9$var$isElementInScope(current.nodeToRestore, node.scopeRef.current)) current.nodeToRestore = node.nodeToRestore;
        let children = node.children;
        if (parentNode) {
            parentNode.removeChild(node);
            if (children.size > 0) children.forEach((child)=>parentNode && parentNode.addChild(child));
        }
        this.fastMap.delete(node.scopeRef);
    }
    // Pre Order Depth First
    *traverse(node = this.root) {
        if (node.scopeRef != null) yield node;
        if (node.children.size > 0) for (let child of node.children)yield* this.traverse(child);
    }
    clone() {
        var _node_parent;
        let newTree = new $a7a032acae3ddda9$var$Tree();
        var _node_parent_scopeRef;
        for (let node of this.traverse())newTree.addTreeNode(node.scopeRef, (_node_parent_scopeRef = (_node_parent = node.parent) === null || _node_parent === void 0 ? void 0 : _node_parent.scopeRef) !== null && _node_parent_scopeRef !== void 0 ? _node_parent_scopeRef : null, node.nodeToRestore);
        return newTree;
    }
    constructor(){
        this.fastMap = new Map();
        this.root = new $a7a032acae3ddda9$var$TreeNode({
            scopeRef: null
        });
        this.fastMap.set(null, this.root);
    }
}
class $a7a032acae3ddda9$var$TreeNode {
    addChild(node) {
        this.children.add(node);
        node.parent = this;
    }
    removeChild(node) {
        this.children.delete(node);
        node.parent = undefined;
    }
    constructor(props){
        this.children = new Set();
        this.contain = false;
        this.scopeRef = props.scopeRef;
    }
}
let $a7a032acae3ddda9$export$d06fae2ee68b101e = new $a7a032acae3ddda9$var$Tree();


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




function $581a96d6eb128c1b$export$4e328f61c538687f(props = {}) {
    let { autoFocus: autoFocus = false, isTextInput: isTextInput, within: within } = props;
    let state = (0, $aB6Cp$react.useRef)({
        isFocused: false,
        isFocusVisible: autoFocus || (0, $aB6Cp$reactariainteractions.isFocusVisible)()
    });
    let [isFocused, setFocused] = (0, $aB6Cp$react.useState)(false);
    let [isFocusVisibleState, setFocusVisible] = (0, $aB6Cp$react.useState)(()=>state.current.isFocused && state.current.isFocusVisible);
    let updateState = (0, $aB6Cp$react.useCallback)(()=>setFocusVisible(state.current.isFocused && state.current.isFocusVisible), []);
    let onFocusChange = (0, $aB6Cp$react.useCallback)((isFocused)=>{
        state.current.isFocused = isFocused;
        setFocused(isFocused);
        updateState();
    }, [
        updateState
    ]);
    (0, $aB6Cp$reactariainteractions.useFocusVisibleListener)((isFocusVisible)=>{
        state.current.isFocusVisible = isFocusVisible;
        updateState();
    }, [], {
        isTextInput: isTextInput
    });
    let { focusProps: focusProps } = (0, $aB6Cp$reactariainteractions.useFocus)({
        isDisabled: within,
        onFocusChange: onFocusChange
    });
    let { focusWithinProps: focusWithinProps } = (0, $aB6Cp$reactariainteractions.useFocusWithin)({
        isDisabled: !within,
        onFocusWithinChange: onFocusChange
    });
    return {
        isFocused: isFocused,
        isFocusVisible: isFocusVisibleState,
        focusProps: within ? focusWithinProps : focusProps
    };
}


function $dfd8c70b928eb1b3$export$1a38b4ad7f578e1d(props) {
    let { children: children, focusClass: focusClass, focusRingClass: focusRingClass } = props;
    let { isFocused: isFocused, isFocusVisible: isFocusVisible, focusProps: focusProps } = (0, $581a96d6eb128c1b$export$4e328f61c538687f)(props);
    let child = (0, ($parcel$interopDefault($aB6Cp$react))).Children.only(children);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).cloneElement(child, (0, $aB6Cp$reactariautils.mergeProps)(child.props, {
        ...focusProps,
        className: (0, ($parcel$interopDefault($aB6Cp$clsx)))({
            [focusClass || ""]: isFocused,
            [focusRingClass || ""]: isFocusVisible
        })
    }));
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



let $fb504d83237fd6ac$var$FocusableContext = /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).createContext(null);
function $fb504d83237fd6ac$var$useFocusableContext(ref) {
    let context = (0, $aB6Cp$react.useContext)($fb504d83237fd6ac$var$FocusableContext) || {};
    (0, $aB6Cp$reactariautils.useSyncRef)(context, ref);
    // eslint-disable-next-line
    let { ref: _, ...otherProps } = context;
    return otherProps;
}
/**
 * Provides DOM props to the nearest focusable child.
 */ function $fb504d83237fd6ac$var$FocusableProvider(props, ref) {
    let { children: children, ...otherProps } = props;
    let objRef = (0, $aB6Cp$reactariautils.useObjectRef)(ref);
    let context = {
        ...otherProps,
        ref: objRef
    };
    return /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).createElement($fb504d83237fd6ac$var$FocusableContext.Provider, {
        value: context
    }, children);
}
let $fb504d83237fd6ac$export$13f3202a3e5ddd5 = /*#__PURE__*/ (0, ($parcel$interopDefault($aB6Cp$react))).forwardRef($fb504d83237fd6ac$var$FocusableProvider);
function $fb504d83237fd6ac$export$4c014de7c8940b4c(props, domRef) {
    let { focusProps: focusProps } = (0, $aB6Cp$reactariainteractions.useFocus)(props);
    let { keyboardProps: keyboardProps } = (0, $aB6Cp$reactariainteractions.useKeyboard)(props);
    let interactions = (0, $aB6Cp$reactariautils.mergeProps)(focusProps, keyboardProps);
    let domProps = $fb504d83237fd6ac$var$useFocusableContext(domRef);
    let interactionProps = props.isDisabled ? {} : domProps;
    let autoFocusRef = (0, $aB6Cp$react.useRef)(props.autoFocus);
    (0, $aB6Cp$react.useEffect)(()=>{
        if (autoFocusRef.current && domRef.current) (0, $1c7f9157d722357d$export$80f3e147d781571c)(domRef.current);
        autoFocusRef.current = false;
    }, [
        domRef
    ]);
    return {
        focusableProps: (0, $aB6Cp$reactariautils.mergeProps)({
            ...interactions,
            tabIndex: props.excludeFromTabOrder && !props.isDisabled ? -1 : undefined
        }, interactionProps)
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


function $259c6413a286f2e6$export$eac1895992b9f3d6(ref, options) {
    let isDisabled = options === null || options === void 0 ? void 0 : options.isDisabled;
    let [hasTabbableChild, setHasTabbableChild] = (0, $aB6Cp$react.useState)(false);
    (0, $aB6Cp$reactariautils.useLayoutEffect)(()=>{
        if ((ref === null || ref === void 0 ? void 0 : ref.current) && !isDisabled) {
            let update = ()=>{
                if (ref.current) {
                    let walker = (0, $a7a032acae3ddda9$export$2d6ec8fc375ceafa)(ref.current, {
                        tabbable: true
                    });
                    setHasTabbableChild(!!walker.nextNode());
                }
            };
            update();
            // Update when new elements are inserted, or the tabIndex/disabled attribute updates.
            let observer = new MutationObserver(update);
            observer.observe(ref.current, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: [
                    "tabIndex",
                    "disabled"
                ]
            });
            return ()=>{
                // Disconnect mutation observer when a React update occurs on the top-level component
                // so we update synchronously after re-rendering. Otherwise React will emit act warnings
                // in tests since mutation observers fire asynchronously. The mutation observer is necessary
                // so we also update if a child component re-renders and adds/removes something tabbable.
                observer.disconnect();
            };
        }
    });
    return isDisabled ? false : hasTabbableChild;
}




//# sourceMappingURL=main.js.map
