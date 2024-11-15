module.export({useGridList:()=>$f47efb0c3a859cf2$export$664f9155035607eb,useGridListItem:()=>$4e8b0456ef72939f$export$9610e69494fadfd2,useGridListSelectionCheckbox:()=>$e52ffc04a4adbd52$export$e29f2573fabbf7b9});let $13Gtr$useId,$13Gtr$filterDOMProps,$13Gtr$mergeProps,$13Gtr$useSlotId,$13Gtr$scrollIntoViewport,$13Gtr$getScrollParent;module.link("@react-aria/utils",{useId(v){$13Gtr$useId=v},filterDOMProps(v){$13Gtr$filterDOMProps=v},mergeProps(v){$13Gtr$mergeProps=v},useSlotId(v){$13Gtr$useSlotId=v},scrollIntoViewport(v){$13Gtr$scrollIntoViewport=v},getScrollParent(v){$13Gtr$getScrollParent=v}},0);let $13Gtr$useHighlightSelectionDescription,$13Gtr$useGridSelectionAnnouncement,$13Gtr$useGridSelectionCheckbox;module.link("@react-aria/grid",{useHighlightSelectionDescription(v){$13Gtr$useHighlightSelectionDescription=v},useGridSelectionAnnouncement(v){$13Gtr$useGridSelectionAnnouncement=v},useGridSelectionCheckbox(v){$13Gtr$useGridSelectionCheckbox=v}},1);let $13Gtr$useHasTabbableChild,$13Gtr$focusSafely,$13Gtr$getFocusableTreeWalker;module.link("@react-aria/focus",{useHasTabbableChild(v){$13Gtr$useHasTabbableChild=v},focusSafely(v){$13Gtr$focusSafely=v},getFocusableTreeWalker(v){$13Gtr$getFocusableTreeWalker=v}},2);let $13Gtr$useSelectableList,$13Gtr$useSelectableItem;module.link("@react-aria/selection",{useSelectableList(v){$13Gtr$useSelectableList=v},useSelectableItem(v){$13Gtr$useSelectableItem=v}},3);let $13Gtr$isFocusVisible;module.link("@react-aria/interactions",{isFocusVisible(v){$13Gtr$isFocusVisible=v}},4);let $13Gtr$useLocale;module.link("@react-aria/i18n",{useLocale(v){$13Gtr$useLocale=v}},5);






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
 */ /*
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
 */ const $ce9b18daab526bbd$export$5b9bb410392e3991 = new WeakMap();
function $ce9b18daab526bbd$export$f45c25170b9a99c2(state, key) {
    let { id: id  } = $ce9b18daab526bbd$export$5b9bb410392e3991.get(state);
    if (!id) throw new Error("Unknown list");
    return `${id}-${$ce9b18daab526bbd$export$e0c709538cb8ae18(key)}`;
}
function $ce9b18daab526bbd$export$e0c709538cb8ae18(key) {
    if (typeof key === "string") return key.replace(/\s*/g, "");
    return "" + key;
}





function $f47efb0c3a859cf2$export$664f9155035607eb(props, state, ref) {
    let { isVirtualized: isVirtualized , keyboardDelegate: keyboardDelegate , onAction: onAction  } = props;
    if (!props["aria-label"] && !props["aria-labelledby"]) console.warn("An aria-label or aria-labelledby prop is required for accessibility.");
    let { listProps: listProps  } = (0, $13Gtr$useSelectableList)({
        selectionManager: state.selectionManager,
        collection: state.collection,
        disabledKeys: state.disabledKeys,
        ref: ref,
        keyboardDelegate: keyboardDelegate,
        isVirtualized: isVirtualized,
        selectOnFocus: state.selectionManager.selectionBehavior === "replace"
    });
    let id = (0, $13Gtr$useId)(props.id);
    (0, $ce9b18daab526bbd$export$5b9bb410392e3991).set(state, {
        id: id,
        onAction: onAction
    });
    let descriptionProps = (0, $13Gtr$useHighlightSelectionDescription)({
        selectionManager: state.selectionManager,
        hasItemActions: !!onAction
    });
    let hasTabbableChild = (0, $13Gtr$useHasTabbableChild)(ref, {
        isDisabled: state.collection.size !== 0
    });
    let domProps = (0, $13Gtr$filterDOMProps)(props, {
        labelable: true
    });
    let gridProps = (0, $13Gtr$mergeProps)(domProps, {
        role: "grid",
        id: id,
        "aria-multiselectable": state.selectionManager.selectionMode === "multiple" ? "true" : undefined
    }, // If collection is empty, make sure the grid is tabbable unless there is a child tabbable element.
    state.collection.size === 0 ? {
        tabIndex: hasTabbableChild ? -1 : 0
    } : listProps, descriptionProps);
    if (isVirtualized) {
        gridProps["aria-rowcount"] = state.collection.size;
        gridProps["aria-colcount"] = 1;
    }
    (0, $13Gtr$useGridSelectionAnnouncement)({}, state);
    return {
        gridProps: gridProps
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





function $4e8b0456ef72939f$export$9610e69494fadfd2(props, state, ref) {
    // Copied from useGridCell + some modifications to make it not so grid specific
    let { node: node , isVirtualized: isVirtualized , shouldSelectOnPressUp: shouldSelectOnPressUp  } = props;
    let { direction: direction  } = (0, $13Gtr$useLocale)();
    let { onAction: onAction  } = (0, $ce9b18daab526bbd$export$5b9bb410392e3991).get(state);
    let descriptionId = (0, $13Gtr$useSlotId)();
    let focus = ()=>{
        // Don't shift focus to the row if the active element is a element within the row already
        // (e.g. clicking on a row button)
        if (!ref.current.contains(document.activeElement)) (0, $13Gtr$focusSafely)(ref.current);
    };
    let { itemProps: itemProps , ...itemStates } = (0, $13Gtr$useSelectableItem)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        onAction: onAction ? ()=>onAction(node.key) : undefined,
        focus: focus
    });
    let onKeyDown = (e)=>{
        if (!e.currentTarget.contains(e.target)) return;
        let walker = (0, $13Gtr$getFocusableTreeWalker)(ref.current);
        walker.currentNode = document.activeElement;
        switch(e.key){
            case "ArrowLeft":
                {
                    // Find the next focusable element within the row.
                    let focusable = direction === "rtl" ? walker.nextNode() : walker.previousNode();
                    if (focusable) {
                        e.preventDefault();
                        e.stopPropagation();
                        (0, $13Gtr$focusSafely)(focusable);
                        (0, $13Gtr$scrollIntoViewport)(focusable, {
                            containingElement: (0, $13Gtr$getScrollParent)(ref.current)
                        });
                    } else {
                        // If there is no next focusable child, then return focus back to the row
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === "rtl") {
                            (0, $13Gtr$focusSafely)(ref.current);
                            (0, $13Gtr$scrollIntoViewport)(ref.current, {
                                containingElement: (0, $13Gtr$getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement = $4e8b0456ef72939f$var$last(walker);
                            if (lastElement) {
                                (0, $13Gtr$focusSafely)(lastElement);
                                (0, $13Gtr$scrollIntoViewport)(lastElement, {
                                    containingElement: (0, $13Gtr$getScrollParent)(ref.current)
                                });
                            }
                        }
                    }
                    break;
                }
            case "ArrowRight":
                {
                    let focusable1 = direction === "rtl" ? walker.previousNode() : walker.nextNode();
                    if (focusable1) {
                        e.preventDefault();
                        e.stopPropagation();
                        (0, $13Gtr$focusSafely)(focusable1);
                        (0, $13Gtr$scrollIntoViewport)(focusable1, {
                            containingElement: (0, $13Gtr$getScrollParent)(ref.current)
                        });
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === "ltr") {
                            (0, $13Gtr$focusSafely)(ref.current);
                            (0, $13Gtr$scrollIntoViewport)(ref.current, {
                                containingElement: (0, $13Gtr$getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement1 = $4e8b0456ef72939f$var$last(walker);
                            if (lastElement1) {
                                (0, $13Gtr$focusSafely)(lastElement1);
                                (0, $13Gtr$scrollIntoViewport)(lastElement1, {
                                    containingElement: (0, $13Gtr$getScrollParent)(ref.current)
                                });
                            }
                        }
                    }
                    break;
                }
            case "ArrowUp":
            case "ArrowDown":
                // Prevent this event from reaching row children, e.g. menu buttons. We want arrow keys to navigate
                // to the row above/below instead. We need to re-dispatch the event from a higher parent so it still
                // bubbles and gets handled by useSelectableCollection.
                if (!e.altKey && ref.current.contains(e.target)) {
                    e.stopPropagation();
                    e.preventDefault();
                    ref.current.parentElement.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                }
                break;
        }
    };
    let onFocus = (e)=>{
        if (e.target !== ref.current) {
            // useSelectableItem only handles setting the focused key when
            // the focused element is the row itself. We also want to
            // set the focused key when a child element receives focus.
            // If focus is currently visible (e.g. the user is navigating with the keyboard),
            // then skip this. We want to restore focus to the previously focused row
            // in that case since the list should act like a single tab stop.
            if (!(0, $13Gtr$isFocusVisible)()) state.selectionManager.setFocusedKey(node.key);
            return;
        }
    };
    let rowProps = (0, $13Gtr$mergeProps)(itemProps, {
        role: "row",
        onKeyDownCapture: onKeyDown,
        onFocus: onFocus,
        "aria-label": node.textValue || undefined,
        "aria-selected": state.selectionManager.canSelectItem(node.key) ? state.selectionManager.isSelected(node.key) : undefined,
        "aria-disabled": state.selectionManager.isDisabled(node.key) || undefined,
        "aria-labelledby": descriptionId && node.textValue ? `${(0, $ce9b18daab526bbd$export$f45c25170b9a99c2)(state, node.key)} ${descriptionId}` : undefined,
        id: (0, $ce9b18daab526bbd$export$f45c25170b9a99c2)(state, node.key)
    });
    if (isVirtualized) rowProps["aria-rowindex"] = node.index + 1;
    let gridCellProps = {
        role: "gridcell",
        "aria-colindex": 1
    };
    return {
        rowProps: rowProps,
        gridCellProps: gridCellProps,
        descriptionProps: {
            id: descriptionId
        },
        ...itemStates
    };
}
function $4e8b0456ef72939f$var$last(walker) {
    let next;
    let last;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
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

function $e52ffc04a4adbd52$export$e29f2573fabbf7b9(props, state) {
    let { key: key  } = props;
    const { checkboxProps: checkboxProps  } = (0, $13Gtr$useGridSelectionCheckbox)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            "aria-labelledby": `${checkboxProps.id} ${(0, $ce9b18daab526bbd$export$f45c25170b9a99c2)(state, key)}`
        }
    };
}





//# sourceMappingURL=module.js.map
