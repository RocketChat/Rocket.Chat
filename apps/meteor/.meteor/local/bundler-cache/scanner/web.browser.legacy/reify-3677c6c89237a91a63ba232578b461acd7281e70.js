var $6Zb2x$react = require("react");
var $6Zb2x$reactariautils = require("@react-aria/utils");
var $6Zb2x$reactariai18n = require("@react-aria/i18n");
var $6Zb2x$reactariafocus = require("@react-aria/focus");
var $6Zb2x$reactariainteractions = require("@react-aria/interactions");
var $6Zb2x$reactdom = require("react-dom");
var $6Zb2x$reactariassr = require("@react-aria/ssr");
var $6Zb2x$reactariavisuallyhidden = require("@react-aria/visually-hidden");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useOverlayPosition", () => $cd94b4896dd97759$export$d39e1813b3bdd0e1);
$parcel$export(module.exports, "useOverlay", () => $82711f9cb668ecdb$export$ea8f71083e90600f);
$parcel$export(module.exports, "useOverlayTrigger", () => $b4878eb6316f670a$export$f9d5c8beee7d008d);
$parcel$export(module.exports, "usePreventScroll", () => $5c2f5cd01815d369$export$ee0f7cc6afcd1c18);
$parcel$export(module.exports, "ModalProvider", () => $0775ea8ea6a0565e$export$178405afcd8c5eb);
$parcel$export(module.exports, "useModalProvider", () => $0775ea8ea6a0565e$export$d9aaed4c3ece1bc0);
$parcel$export(module.exports, "OverlayProvider", () => $0775ea8ea6a0565e$export$bf688221f59024e5);
$parcel$export(module.exports, "OverlayContainer", () => $0775ea8ea6a0565e$export$b47c3594eab58386);
$parcel$export(module.exports, "useModal", () => $0775ea8ea6a0565e$export$33ffd74ebf07f060);
$parcel$export(module.exports, "DismissButton", () => $f69bb3e6457495cc$export$2317d149ed6f78c4);
$parcel$export(module.exports, "ariaHideOutside", () => $08ef1685902b6011$export$1c3ebcada18427bf);
$parcel$export(module.exports, "usePopover", () => $6c2dfcdee3e15e20$export$542a6fd13ac93354);
$parcel$export(module.exports, "useModalOverlay", () => $11b7e0b04b421e95$export$dbc0f175b25fb0fb);
$parcel$export(module.exports, "Overlay", () => $745edbb83ab4296f$export$c6fdb837b070b4ff);
$parcel$export(module.exports, "useOverlayFocusContain", () => $745edbb83ab4296f$export$14c98a7594375490);
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
 */ 
const $5935ba4d7da2c103$var$AXIS = {
    top: "top",
    bottom: "top",
    left: "left",
    right: "left"
};
const $5935ba4d7da2c103$var$FLIPPED_DIRECTION = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left"
};
const $5935ba4d7da2c103$var$CROSS_AXIS = {
    top: "left",
    left: "top"
};
const $5935ba4d7da2c103$var$AXIS_SIZE = {
    top: "height",
    left: "width"
};
const $5935ba4d7da2c103$var$TOTAL_SIZE = {
    width: "totalWidth",
    height: "totalHeight"
};
const $5935ba4d7da2c103$var$PARSED_PLACEMENT_CACHE = {};
// @ts-ignore
let $5935ba4d7da2c103$var$visualViewport = typeof window !== "undefined" && window.visualViewport;
function $5935ba4d7da2c103$var$getContainerDimensions(containerNode) {
    let width = 0, height = 0, totalWidth = 0, totalHeight = 0, top = 0, left = 0;
    let scroll = {};
    if (containerNode.tagName === "BODY") {
        let documentElement = document.documentElement;
        totalWidth = documentElement.clientWidth;
        totalHeight = documentElement.clientHeight;
        var _visualViewport_width;
        width = (_visualViewport_width = $5935ba4d7da2c103$var$visualViewport === null || $5935ba4d7da2c103$var$visualViewport === void 0 ? void 0 : $5935ba4d7da2c103$var$visualViewport.width) !== null && _visualViewport_width !== void 0 ? _visualViewport_width : totalWidth;
        var _visualViewport_height;
        height = (_visualViewport_height = $5935ba4d7da2c103$var$visualViewport === null || $5935ba4d7da2c103$var$visualViewport === void 0 ? void 0 : $5935ba4d7da2c103$var$visualViewport.height) !== null && _visualViewport_height !== void 0 ? _visualViewport_height : totalHeight;
        scroll.top = documentElement.scrollTop || containerNode.scrollTop;
        scroll.left = documentElement.scrollLeft || containerNode.scrollLeft;
    } else {
        ({ width: width , height: height , top: top , left: left  } = $5935ba4d7da2c103$var$getOffset(containerNode));
        scroll.top = containerNode.scrollTop;
        scroll.left = containerNode.scrollLeft;
        totalWidth = width;
        totalHeight = height;
    }
    return {
        width: width,
        height: height,
        totalWidth: totalWidth,
        totalHeight: totalHeight,
        scroll: scroll,
        top: top,
        left: left
    };
}
function $5935ba4d7da2c103$var$getScroll(node) {
    return {
        top: node.scrollTop,
        left: node.scrollLeft,
        width: node.scrollWidth,
        height: node.scrollHeight
    };
}
function $5935ba4d7da2c103$var$getDelta(axis, offset, size, containerDimensions, padding) {
    let containerScroll = containerDimensions.scroll[axis];
    let containerHeight = containerDimensions[$5935ba4d7da2c103$var$AXIS_SIZE[axis]];
    let startEdgeOffset = offset - padding - containerScroll;
    let endEdgeOffset = offset + padding - containerScroll + size;
    if (startEdgeOffset < 0) return -startEdgeOffset;
    else if (endEdgeOffset > containerHeight) return Math.max(containerHeight - endEdgeOffset, -startEdgeOffset);
    else return 0;
}
function $5935ba4d7da2c103$var$getMargins(node) {
    let style = window.getComputedStyle(node);
    return {
        top: parseInt(style.marginTop, 10) || 0,
        bottom: parseInt(style.marginBottom, 10) || 0,
        left: parseInt(style.marginLeft, 10) || 0,
        right: parseInt(style.marginRight, 10) || 0
    };
}
function $5935ba4d7da2c103$var$parsePlacement(input) {
    if ($5935ba4d7da2c103$var$PARSED_PLACEMENT_CACHE[input]) return $5935ba4d7da2c103$var$PARSED_PLACEMENT_CACHE[input];
    let [placement, crossPlacement] = input.split(" ");
    let axis = $5935ba4d7da2c103$var$AXIS[placement] || "right";
    let crossAxis = $5935ba4d7da2c103$var$CROSS_AXIS[axis];
    if (!$5935ba4d7da2c103$var$AXIS[crossPlacement]) crossPlacement = "center";
    let size = $5935ba4d7da2c103$var$AXIS_SIZE[axis];
    let crossSize = $5935ba4d7da2c103$var$AXIS_SIZE[crossAxis];
    $5935ba4d7da2c103$var$PARSED_PLACEMENT_CACHE[input] = {
        placement: placement,
        crossPlacement: crossPlacement,
        axis: axis,
        crossAxis: crossAxis,
        size: size,
        crossSize: crossSize
    };
    return $5935ba4d7da2c103$var$PARSED_PLACEMENT_CACHE[input];
}
function $5935ba4d7da2c103$var$computePosition(childOffset, boundaryDimensions, overlaySize, placementInfo, offset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset) {
    let { placement: placement , crossPlacement: crossPlacement , axis: axis , crossAxis: crossAxis , size: size , crossSize: crossSize  } = placementInfo;
    let position = {};
    // button position
    position[crossAxis] = childOffset[crossAxis];
    if (crossPlacement === "center") //  + (button size / 2) - (overlay size / 2)
    // at this point the overlay center should match the button center
    position[crossAxis] += (childOffset[crossSize] - overlaySize[crossSize]) / 2;
    else if (crossPlacement !== crossAxis) //  + (button size) - (overlay size)
    // at this point the overlay bottom should match the button bottom
    position[crossAxis] += childOffset[crossSize] - overlaySize[crossSize];
     /* else {
    the overlay top should match the button top
  } */ 
    // add the crossOffset from props
    position[crossAxis] += crossOffset;
    // overlay top overlapping arrow with button bottom
    const minPosition = childOffset[crossAxis] - overlaySize[crossSize] + arrowSize + arrowBoundaryOffset;
    // overlay bottom overlapping arrow with button top
    const maxPosition = childOffset[crossAxis] + childOffset[crossSize] - arrowSize - arrowBoundaryOffset;
    position[crossAxis] = (0, $6Zb2x$reactariautils.clamp)(position[crossAxis], minPosition, maxPosition);
    // Floor these so the position isn't placed on a partial pixel, only whole pixels. Shouldn't matter if it was floored or ceiled, so chose one.
    if (placement === axis) {
        // If the container is positioned (non-static), then we use the container's actual
        // height, as `bottom` will be relative to this height.  But if the container is static,
        // then it can only be the `document.body`, and `bottom` will be relative to _its_
        // container, which should be as large as boundaryDimensions.
        const containerHeight = isContainerPositioned ? containerOffsetWithBoundary[size] : boundaryDimensions[$5935ba4d7da2c103$var$TOTAL_SIZE[size]];
        position[$5935ba4d7da2c103$var$FLIPPED_DIRECTION[axis]] = Math.floor(containerHeight - childOffset[axis] + offset);
    } else position[axis] = Math.floor(childOffset[axis] + childOffset[size] + offset);
    return position;
}
function $5935ba4d7da2c103$var$getMaxHeight(position, boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding) {
    return position.top != null ? Math.max(0, boundaryDimensions.height + boundaryDimensions.top + boundaryDimensions.scroll.top // this is the bottom of the boundary
     - (containerOffsetWithBoundary.top + position.top // this is the top of the overlay
    ) - (margins.top + margins.bottom + padding // save additional space for margin and padding
    )) : Math.max(0, childOffset.top + containerOffsetWithBoundary.top // this is the top of the trigger
     - (boundaryDimensions.top + boundaryDimensions.scroll.top // this is the top of the boundary
    ) - (margins.top + margins.bottom + padding // save additional space for margin and padding
    ));
}
function $5935ba4d7da2c103$var$getAvailableSpace(boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding, placementInfo) {
    let { placement: placement , axis: axis , size: size  } = placementInfo;
    if (placement === axis) return Math.max(0, childOffset[axis] - boundaryDimensions[axis] - boundaryDimensions.scroll[axis] + containerOffsetWithBoundary[axis] - margins[axis] - margins[$5935ba4d7da2c103$var$FLIPPED_DIRECTION[axis]] - padding);
    return Math.max(0, boundaryDimensions[size] + boundaryDimensions[axis] + boundaryDimensions.scroll[axis] - containerOffsetWithBoundary[axis] - childOffset[axis] - childOffset[size] - margins[axis] - margins[$5935ba4d7da2c103$var$FLIPPED_DIRECTION[axis]] - padding);
}
function $5935ba4d7da2c103$export$6839422d1f33cee9(placementInput, childOffset, overlaySize, scrollSize, margins, padding, flip, boundaryDimensions, containerOffsetWithBoundary, offset, crossOffset, isContainerPositioned, userSetMaxHeight, arrowSize, arrowBoundaryOffset) {
    let placementInfo = $5935ba4d7da2c103$var$parsePlacement(placementInput);
    let { size: size , crossAxis: crossAxis , crossSize: crossSize , placement: placement , crossPlacement: crossPlacement  } = placementInfo;
    let position = $5935ba4d7da2c103$var$computePosition(childOffset, boundaryDimensions, overlaySize, placementInfo, offset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset);
    let normalizedOffset = offset;
    let space = $5935ba4d7da2c103$var$getAvailableSpace(boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding + offset, placementInfo);
    // Check if the scroll size of the overlay is greater than the available space to determine if we need to flip
    if (flip && scrollSize[size] > space) {
        let flippedPlacementInfo = $5935ba4d7da2c103$var$parsePlacement(`${$5935ba4d7da2c103$var$FLIPPED_DIRECTION[placement]} ${crossPlacement}`);
        let flippedPosition = $5935ba4d7da2c103$var$computePosition(childOffset, boundaryDimensions, overlaySize, flippedPlacementInfo, offset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset);
        let flippedSpace = $5935ba4d7da2c103$var$getAvailableSpace(boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding + offset, flippedPlacementInfo);
        // If the available space for the flipped position is greater than the original available space, flip.
        if (flippedSpace > space) {
            placementInfo = flippedPlacementInfo;
            position = flippedPosition;
            normalizedOffset = offset;
        }
    }
    let delta = $5935ba4d7da2c103$var$getDelta(crossAxis, position[crossAxis], overlaySize[crossSize], boundaryDimensions, padding);
    position[crossAxis] += delta;
    let maxHeight = $5935ba4d7da2c103$var$getMaxHeight(position, boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding);
    if (userSetMaxHeight && userSetMaxHeight < maxHeight) maxHeight = userSetMaxHeight;
    overlaySize.height = Math.min(overlaySize.height, maxHeight);
    position = $5935ba4d7da2c103$var$computePosition(childOffset, boundaryDimensions, overlaySize, placementInfo, normalizedOffset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset);
    delta = $5935ba4d7da2c103$var$getDelta(crossAxis, position[crossAxis], overlaySize[crossSize], boundaryDimensions, padding);
    position[crossAxis] += delta;
    let arrowPosition = {};
    // All values are transformed so that 0 is at the top/left of the overlay depending on the orientation
    // Prefer the arrow being in the center of the trigger/overlay anchor element
    let preferredArrowPosition = childOffset[crossAxis] + .5 * childOffset[crossSize] - overlaySize[crossAxis];
    // Min/Max position limits for the arrow with respect to the overlay
    const arrowMinPosition = arrowSize / 2 + arrowBoundaryOffset;
    const arrowMaxPosition = overlaySize[crossSize] - arrowSize / 2 - arrowBoundaryOffset;
    // Min/Max position limits for the arrow with respect to the trigger/overlay anchor element
    const arrowOverlappingChildMinEdge = childOffset[crossAxis] - overlaySize[crossAxis] + arrowSize / 2;
    const arrowOverlappingChildMaxEdge = childOffset[crossAxis] + childOffset[crossSize] - overlaySize[crossAxis] - arrowSize / 2;
    // Clamp the arrow positioning so that it always is within the bounds of the anchor and the overlay
    const arrowPositionOverlappingChild = (0, $6Zb2x$reactariautils.clamp)(preferredArrowPosition, arrowOverlappingChildMinEdge, arrowOverlappingChildMaxEdge);
    arrowPosition[crossAxis] = (0, $6Zb2x$reactariautils.clamp)(arrowPositionOverlappingChild, arrowMinPosition, arrowMaxPosition);
    return {
        position: position,
        maxHeight: maxHeight,
        arrowOffsetLeft: arrowPosition.left,
        arrowOffsetTop: arrowPosition.top,
        placement: placementInfo.placement
    };
}
function $5935ba4d7da2c103$export$b3ceb0cbf1056d98(opts) {
    let { placement: placement , targetNode: targetNode , overlayNode: overlayNode , scrollNode: scrollNode , padding: padding , shouldFlip: shouldFlip , boundaryElement: boundaryElement , offset: offset , crossOffset: crossOffset , maxHeight: maxHeight , arrowSize: arrowSize , arrowBoundaryOffset: arrowBoundaryOffset = 0  } = opts;
    let container = overlayNode instanceof HTMLElement ? $5935ba4d7da2c103$var$getContainingBlock(overlayNode) : document.documentElement;
    let isViewportContainer = container === document.documentElement;
    const containerPositionStyle = window.getComputedStyle(container).position;
    let isContainerPositioned = !!containerPositionStyle && containerPositionStyle !== "static";
    let childOffset = isViewportContainer ? $5935ba4d7da2c103$var$getOffset(targetNode) : $5935ba4d7da2c103$var$getPosition(targetNode, container);
    if (!isViewportContainer) {
        let { marginTop: marginTop , marginLeft: marginLeft  } = window.getComputedStyle(targetNode);
        childOffset.top += parseInt(marginTop, 10) || 0;
        childOffset.left += parseInt(marginLeft, 10) || 0;
    }
    let overlaySize = $5935ba4d7da2c103$var$getOffset(overlayNode);
    let margins = $5935ba4d7da2c103$var$getMargins(overlayNode);
    overlaySize.width += margins.left + margins.right;
    overlaySize.height += margins.top + margins.bottom;
    let scrollSize = $5935ba4d7da2c103$var$getScroll(scrollNode);
    let boundaryDimensions = $5935ba4d7da2c103$var$getContainerDimensions(boundaryElement);
    let containerOffsetWithBoundary = boundaryElement.tagName === "BODY" ? $5935ba4d7da2c103$var$getOffset(container) : $5935ba4d7da2c103$var$getPosition(container, boundaryElement);
    return $5935ba4d7da2c103$export$6839422d1f33cee9(placement, childOffset, overlaySize, scrollSize, margins, padding, shouldFlip, boundaryDimensions, containerOffsetWithBoundary, offset, crossOffset, isContainerPositioned, maxHeight, arrowSize, arrowBoundaryOffset);
}
function $5935ba4d7da2c103$var$getOffset(node) {
    let { top: top , left: left , width: width , height: height  } = node.getBoundingClientRect();
    let { scrollTop: scrollTop , scrollLeft: scrollLeft , clientTop: clientTop , clientLeft: clientLeft  } = document.documentElement;
    return {
        top: top + scrollTop - clientTop,
        left: left + scrollLeft - clientLeft,
        width: width,
        height: height
    };
}
function $5935ba4d7da2c103$var$getPosition(node, parent) {
    let style = window.getComputedStyle(node);
    let offset;
    if (style.position === "fixed") {
        let { top: top , left: left , width: width , height: height  } = node.getBoundingClientRect();
        offset = {
            top: top,
            left: left,
            width: width,
            height: height
        };
    } else {
        offset = $5935ba4d7da2c103$var$getOffset(node);
        let parentOffset = $5935ba4d7da2c103$var$getOffset(parent);
        let parentStyle = window.getComputedStyle(parent);
        parentOffset.top += (parseInt(parentStyle.borderTopWidth, 10) || 0) - parent.scrollTop;
        parentOffset.left += (parseInt(parentStyle.borderLeftWidth, 10) || 0) - parent.scrollLeft;
        offset.top -= parentOffset.top;
        offset.left -= parentOffset.left;
    }
    offset.top -= parseInt(style.marginTop, 10) || 0;
    offset.left -= parseInt(style.marginLeft, 10) || 0;
    return offset;
}
// Returns the containing block of an element, which is the element that
// this element will be positioned relative to.
// https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block
function $5935ba4d7da2c103$var$getContainingBlock(node) {
    // The offsetParent of an element in most cases equals the containing block.
    // https://w3c.github.io/csswg-drafts/cssom-view/#dom-htmlelement-offsetparent
    let offsetParent = node.offsetParent;
    // The offsetParent algorithm terminates at the document body,
    // even if the body is not a containing block. Double check that
    // and use the documentElement if so.
    if (offsetParent && offsetParent === document.body && window.getComputedStyle(offsetParent).position === "static" && !$5935ba4d7da2c103$var$isContainingBlock(offsetParent)) offsetParent = document.documentElement;
    // TODO(later): handle table elements?
    // The offsetParent can be null if the element has position: fixed, or a few other cases.
    // We have to walk up the tree manually in this case because fixed positioned elements
    // are still positioned relative to their containing block, which is not always the viewport.
    if (offsetParent == null) {
        offsetParent = node.parentElement;
        while(offsetParent && !$5935ba4d7da2c103$var$isContainingBlock(offsetParent))offsetParent = offsetParent.parentElement;
    }
    // Fall back to the viewport.
    return offsetParent || document.documentElement;
}
// https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
function $5935ba4d7da2c103$var$isContainingBlock(node) {
    let style = window.getComputedStyle(node);
    return style.transform !== "none" || /transform|perspective/.test(style.willChange) || style.filter !== "none" || style.contain === "paint" || // @ts-ignore
    "backdropFilter" in style && style.backdropFilter !== "none" || // @ts-ignore
    "WebkitBackdropFilter" in style && style.WebkitBackdropFilter !== "none";
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
const $9a8aa1b0b336ea3a$export$f6211563215e3b37 = new WeakMap();
function $9a8aa1b0b336ea3a$export$18fc8428861184da(opts) {
    let { triggerRef: triggerRef , isOpen: isOpen , onClose: onClose  } = opts;
    (0, $6Zb2x$react.useEffect)(()=>{
        if (!isOpen || onClose === null) return;
        let onScroll = (e)=>{
            // Ignore if scrolling an scrollable region outside the trigger's tree.
            let target = e.target;
            // window is not a Node and doesn't have contain, but window contains everything
            if (!triggerRef.current || target instanceof Node && !target.contains(triggerRef.current)) return;
            let onCloseHandler = onClose || $9a8aa1b0b336ea3a$export$f6211563215e3b37.get(triggerRef.current);
            if (onCloseHandler) onCloseHandler();
        };
        window.addEventListener("scroll", onScroll, true);
        return ()=>{
            window.removeEventListener("scroll", onScroll, true);
        };
    }, [
        isOpen,
        onClose,
        triggerRef
    ]);
}




// @ts-ignore
let $cd94b4896dd97759$var$visualViewport = typeof window !== "undefined" && window.visualViewport;
function $cd94b4896dd97759$export$d39e1813b3bdd0e1(props) {
    let { direction: direction  } = (0, $6Zb2x$reactariai18n.useLocale)();
    let { arrowSize: arrowSize = 0 , targetRef: targetRef , overlayRef: overlayRef , scrollRef: scrollRef = overlayRef , placement: placement = "bottom" , containerPadding: containerPadding = 12 , shouldFlip: shouldFlip = true , boundaryElement: boundaryElement = typeof document !== "undefined" ? document.body : null , offset: offset = 0 , crossOffset: crossOffset = 0 , shouldUpdatePosition: shouldUpdatePosition = true , isOpen: isOpen = true , onClose: onClose , maxHeight: maxHeight , arrowBoundaryOffset: arrowBoundaryOffset = 0  } = props;
    let [position, setPosition] = (0, $6Zb2x$react.useState)({
        position: {},
        arrowOffsetLeft: undefined,
        arrowOffsetTop: undefined,
        maxHeight: undefined,
        placement: undefined
    });
    let deps = [
        shouldUpdatePosition,
        placement,
        overlayRef.current,
        targetRef.current,
        scrollRef.current,
        containerPadding,
        shouldFlip,
        boundaryElement,
        offset,
        crossOffset,
        isOpen,
        direction,
        maxHeight,
        arrowBoundaryOffset,
        arrowSize
    ];
    let updatePosition = (0, $6Zb2x$react.useCallback)(()=>{
        if (shouldUpdatePosition === false || !isOpen || !overlayRef.current || !targetRef.current || !scrollRef.current || !boundaryElement) return;
        let position = (0, $5935ba4d7da2c103$export$b3ceb0cbf1056d98)({
            placement: $cd94b4896dd97759$var$translateRTL(placement, direction),
            overlayNode: overlayRef.current,
            targetNode: targetRef.current,
            scrollNode: scrollRef.current,
            padding: containerPadding,
            shouldFlip: shouldFlip,
            boundaryElement: boundaryElement,
            offset: offset,
            crossOffset: crossOffset,
            maxHeight: maxHeight,
            arrowSize: arrowSize,
            arrowBoundaryOffset: arrowBoundaryOffset
        });
        // Modify overlay styles directly so positioning happens immediately without the need of a second render
        // This is so we don't have to delay autoFocus scrolling or delay applying preventScroll for popovers
        Object.keys(position.position).forEach((key)=>overlayRef.current.style[key] = position.position[key] + "px");
        overlayRef.current.style.maxHeight = position.maxHeight != null ? position.maxHeight + "px" : undefined;
        // Trigger a set state for a second render anyway for arrow positioning
        setPosition(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    // Update position when anything changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $6Zb2x$reactariautils.useLayoutEffect)(updatePosition, deps);
    // Update position on window resize
    $cd94b4896dd97759$var$useResize(updatePosition);
    // Update position when the overlay changes size (might need to flip).
    (0, $6Zb2x$reactariautils.useResizeObserver)({
        ref: overlayRef,
        onResize: updatePosition
    });
    // Reposition the overlay and do not close on scroll while the visual viewport is resizing.
    // This will ensure that overlays adjust their positioning when the iOS virtual keyboard appears.
    let isResizing = (0, $6Zb2x$react.useRef)(false);
    (0, $6Zb2x$reactariautils.useLayoutEffect)(()=>{
        let timeout;
        let onResize = ()=>{
            isResizing.current = true;
            clearTimeout(timeout);
            timeout = setTimeout(()=>{
                isResizing.current = false;
            }, 500);
            updatePosition();
        };
        $cd94b4896dd97759$var$visualViewport === null || $cd94b4896dd97759$var$visualViewport === void 0 ? void 0 : $cd94b4896dd97759$var$visualViewport.addEventListener("resize", onResize);
        $cd94b4896dd97759$var$visualViewport === null || $cd94b4896dd97759$var$visualViewport === void 0 ? void 0 : $cd94b4896dd97759$var$visualViewport.addEventListener("scroll", onResize);
        return ()=>{
            $cd94b4896dd97759$var$visualViewport === null || $cd94b4896dd97759$var$visualViewport === void 0 ? void 0 : $cd94b4896dd97759$var$visualViewport.removeEventListener("resize", onResize);
            $cd94b4896dd97759$var$visualViewport === null || $cd94b4896dd97759$var$visualViewport === void 0 ? void 0 : $cd94b4896dd97759$var$visualViewport.removeEventListener("scroll", onResize);
        };
    }, [
        updatePosition
    ]);
    let close = (0, $6Zb2x$react.useCallback)(()=>{
        if (!isResizing.current) onClose();
    }, [
        onClose,
        isResizing
    ]);
    // When scrolling a parent scrollable region of the trigger (other than the body),
    // we hide the popover. Otherwise, its position would be incorrect.
    (0, $9a8aa1b0b336ea3a$export$18fc8428861184da)({
        triggerRef: targetRef,
        isOpen: isOpen,
        onClose: onClose && close
    });
    return {
        overlayProps: {
            style: {
                position: "absolute",
                zIndex: 100000,
                ...position.position,
                maxHeight: position.maxHeight
            }
        },
        placement: position.placement,
        arrowProps: {
            style: {
                left: position.arrowOffsetLeft,
                top: position.arrowOffsetTop
            }
        },
        updatePosition: updatePosition
    };
}
function $cd94b4896dd97759$var$useResize(onResize) {
    (0, $6Zb2x$reactariautils.useLayoutEffect)(()=>{
        window.addEventListener("resize", onResize, false);
        return ()=>{
            window.removeEventListener("resize", onResize, false);
        };
    }, [
        onResize
    ]);
}
function $cd94b4896dd97759$var$translateRTL(position, direction) {
    if (direction === "rtl") return position.replace("start", "right").replace("end", "left");
    return position.replace("start", "left").replace("end", "right");
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


const $82711f9cb668ecdb$var$visibleOverlays = [];
function $82711f9cb668ecdb$export$ea8f71083e90600f(props, ref) {
    let { onClose: onClose , shouldCloseOnBlur: shouldCloseOnBlur , isOpen: isOpen , isDismissable: isDismissable = false , isKeyboardDismissDisabled: isKeyboardDismissDisabled = false , shouldCloseOnInteractOutside: shouldCloseOnInteractOutside  } = props;
    // Add the overlay ref to the stack of visible overlays on mount, and remove on unmount.
    (0, $6Zb2x$react.useEffect)(()=>{
        if (isOpen) $82711f9cb668ecdb$var$visibleOverlays.push(ref);
        return ()=>{
            let index = $82711f9cb668ecdb$var$visibleOverlays.indexOf(ref);
            if (index >= 0) $82711f9cb668ecdb$var$visibleOverlays.splice(index, 1);
        };
    }, [
        isOpen,
        ref
    ]);
    // Only hide the overlay when it is the topmost visible overlay in the stack.
    let onHide = ()=>{
        if ($82711f9cb668ecdb$var$visibleOverlays[$82711f9cb668ecdb$var$visibleOverlays.length - 1] === ref && onClose) onClose();
    };
    let onInteractOutsideStart = (e)=>{
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside(e.target)) {
            if ($82711f9cb668ecdb$var$visibleOverlays[$82711f9cb668ecdb$var$visibleOverlays.length - 1] === ref) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    };
    let onInteractOutside = (e)=>{
        if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside(e.target)) {
            if ($82711f9cb668ecdb$var$visibleOverlays[$82711f9cb668ecdb$var$visibleOverlays.length - 1] === ref) {
                e.stopPropagation();
                e.preventDefault();
            }
            onHide();
        }
    };
    // Handle the escape key
    let onKeyDown = (e)=>{
        if (e.key === "Escape" && !isKeyboardDismissDisabled) {
            e.stopPropagation();
            e.preventDefault();
            onHide();
        }
    };
    // Handle clicking outside the overlay to close it
    (0, $6Zb2x$reactariainteractions.useInteractOutside)({
        ref: ref,
        onInteractOutside: isDismissable ? onInteractOutside : null,
        onInteractOutsideStart: onInteractOutsideStart
    });
    let { focusWithinProps: focusWithinProps  } = (0, $6Zb2x$reactariainteractions.useFocusWithin)({
        isDisabled: !shouldCloseOnBlur,
        onBlurWithin: (e)=>{
            // If focus is moving into a child focus scope (e.g. menu inside a dialog),
            // do not close the outer overlay. At this point, the active scope should
            // still be the outer overlay, since blur events run before focus.
            if (e.relatedTarget && (0, $6Zb2x$reactariafocus.isElementInChildOfActiveScope)(e.relatedTarget)) return;
            if (!shouldCloseOnInteractOutside || shouldCloseOnInteractOutside(e.relatedTarget)) onClose();
        }
    });
    let onPointerDownUnderlay = (e)=>{
        // fixes a firefox issue that starts text selection https://bugzilla.mozilla.org/show_bug.cgi?id=1675846
        if (e.target === e.currentTarget) e.preventDefault();
    };
    return {
        overlayProps: {
            onKeyDown: onKeyDown,
            ...focusWithinProps
        },
        underlayProps: {
            onPointerDown: onPointerDownUnderlay
        }
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


function $b4878eb6316f670a$export$f9d5c8beee7d008d(props, state, ref) {
    let { type: type  } = props;
    let { isOpen: isOpen  } = state;
    // Backward compatibility. Share state close function with useOverlayPosition so it can close on scroll
    // without forcing users to pass onClose.
    (0, $6Zb2x$react.useEffect)(()=>{
        if (ref && ref.current) (0, $9a8aa1b0b336ea3a$export$f6211563215e3b37).set(ref.current, state.close);
    });
    // Aria 1.1 supports multiple values for aria-haspopup other than just menus.
    // https://www.w3.org/TR/wai-aria-1.1/#aria-haspopup
    // However, we only add it for menus for now because screen readers often
    // announce it as a menu even for other values.
    let ariaHasPopup = undefined;
    if (type === "menu") ariaHasPopup = true;
    else if (type === "listbox") ariaHasPopup = "listbox";
    let overlayId = (0, $6Zb2x$reactariautils.useId)();
    return {
        triggerProps: {
            "aria-haspopup": ariaHasPopup,
            "aria-expanded": isOpen,
            "aria-controls": isOpen ? overlayId : null,
            onPress: state.toggle
        },
        overlayProps: {
            id: overlayId
        }
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
// @ts-ignore
const $5c2f5cd01815d369$var$visualViewport = typeof window !== "undefined" && window.visualViewport;
// HTML input types that do not cause the software keyboard to appear.
const $5c2f5cd01815d369$var$nonTextInputTypes = new Set([
    "checkbox",
    "radio",
    "range",
    "color",
    "file",
    "image",
    "button",
    "submit",
    "reset"
]);
// The number of active usePreventScroll calls. Used to determine whether to revert back to the original page style/scroll position
let $5c2f5cd01815d369$var$preventScrollCount = 0;
let $5c2f5cd01815d369$var$restore;
function $5c2f5cd01815d369$export$ee0f7cc6afcd1c18(options = {}) {
    let { isDisabled: isDisabled  } = options;
    (0, $6Zb2x$reactariautils.useLayoutEffect)(()=>{
        if (isDisabled) return;
        $5c2f5cd01815d369$var$preventScrollCount++;
        if ($5c2f5cd01815d369$var$preventScrollCount === 1) {
            if ((0, $6Zb2x$reactariautils.isIOS)()) $5c2f5cd01815d369$var$restore = $5c2f5cd01815d369$var$preventScrollMobileSafari();
            else $5c2f5cd01815d369$var$restore = $5c2f5cd01815d369$var$preventScrollStandard();
        }
        return ()=>{
            $5c2f5cd01815d369$var$preventScrollCount--;
            if ($5c2f5cd01815d369$var$preventScrollCount === 0) $5c2f5cd01815d369$var$restore();
        };
    }, [
        isDisabled
    ]);
}
// For most browsers, all we need to do is set `overflow: hidden` on the root element, and
// add some padding to prevent the page from shifting when the scrollbar is hidden.
function $5c2f5cd01815d369$var$preventScrollStandard() {
    return (0, $6Zb2x$reactariautils.chain)($5c2f5cd01815d369$var$setStyle(document.documentElement, "paddingRight", `${window.innerWidth - document.documentElement.clientWidth}px`), $5c2f5cd01815d369$var$setStyle(document.documentElement, "overflow", "hidden"));
}
// Mobile Safari is a whole different beast. Even with overflow: hidden,
// it still scrolls the page in many situations:
//
// 1. When the bottom toolbar and address bar are collapsed, page scrolling is always allowed.
// 2. When the keyboard is visible, the viewport does not resize. Instead, the keyboard covers part of
//    it, so it becomes scrollable.
// 3. When tapping on an input, the page always scrolls so that the input is centered in the visual viewport.
//    This may cause even fixed position elements to scroll off the screen.
// 4. When using the next/previous buttons in the keyboard to navigate between inputs, the whole page always
//    scrolls, even if the input is inside a nested scrollable element that could be scrolled instead.
//
// In order to work around these cases, and prevent scrolling without jankiness, we do a few things:
//
// 1. Prevent default on `touchmove` events that are not in a scrollable element. This prevents touch scrolling
//    on the window.
// 2. Prevent default on `touchmove` events inside a scrollable element when the scroll position is at the
//    top or bottom. This avoids the whole page scrolling instead, but does prevent overscrolling.
// 3. Prevent default on `touchend` events on input elements and handle focusing the element ourselves.
// 4. When focusing an input, apply a transform to trick Safari into thinking the input is at the top
//    of the page, which prevents it from scrolling the page. After the input is focused, scroll the element
//    into view ourselves, without scrolling the whole page.
// 5. Offset the body by the scroll position using a negative margin and scroll to the top. This should appear the
//    same visually, but makes the actual scroll position always zero. This is required to make all of the
//    above work or Safari will still try to scroll the page when focusing an input.
// 6. As a last resort, handle window scroll events, and scroll back to the top. This can happen when attempting
//    to navigate to an input with the next/previous buttons that's outside a modal.
function $5c2f5cd01815d369$var$preventScrollMobileSafari() {
    let scrollable;
    let lastY = 0;
    let onTouchStart = (e)=>{
        // Store the nearest scrollable parent element from the element that the user touched.
        scrollable = (0, $6Zb2x$reactariautils.getScrollParent)(e.target);
        if (scrollable === document.documentElement && scrollable === document.body) return;
        lastY = e.changedTouches[0].pageY;
    };
    let onTouchMove = (e)=>{
        // Prevent scrolling the window.
        if (scrollable === document.documentElement || scrollable === document.body) {
            e.preventDefault();
            return;
        }
        // Prevent scrolling up when at the top and scrolling down when at the bottom
        // of a nested scrollable area, otherwise mobile Safari will start scrolling
        // the window instead. Unfortunately, this disables bounce scrolling when at
        // the top but it's the best we can do.
        let y = e.changedTouches[0].pageY;
        let scrollTop = scrollable.scrollTop;
        let bottom = scrollable.scrollHeight - scrollable.clientHeight;
        if (scrollTop <= 0 && y > lastY || scrollTop >= bottom && y < lastY) e.preventDefault();
        lastY = y;
    };
    let onTouchEnd = (e)=>{
        let target = e.target;
        // Apply this change if we're not already focused on the target element
        if ($5c2f5cd01815d369$var$willOpenKeyboard(target) && target !== document.activeElement) {
            e.preventDefault();
            // Apply a transform to trick Safari into thinking the input is at the top of the page
            // so it doesn't try to scroll it into view. When tapping on an input, this needs to
            // be done before the "focus" event, so we have to focus the element ourselves.
            target.style.transform = "translateY(-2000px)";
            target.focus();
            requestAnimationFrame(()=>{
                target.style.transform = "";
            });
        }
    };
    let onFocus = (e)=>{
        let target = e.target;
        if ($5c2f5cd01815d369$var$willOpenKeyboard(target)) {
            // Transform also needs to be applied in the focus event in cases where focus moves
            // other than tapping on an input directly, e.g. the next/previous buttons in the
            // software keyboard. In these cases, it seems applying the transform in the focus event
            // is good enough, whereas when tapping an input, it must be done before the focus event. 🤷‍♂️
            target.style.transform = "translateY(-2000px)";
            requestAnimationFrame(()=>{
                target.style.transform = "";
                // This will have prevented the browser from scrolling the focused element into view,
                // so we need to do this ourselves in a way that doesn't cause the whole page to scroll.
                if ($5c2f5cd01815d369$var$visualViewport) {
                    if ($5c2f5cd01815d369$var$visualViewport.height < window.innerHeight) // If the keyboard is already visible, do this after one additional frame
                    // to wait for the transform to be removed.
                    requestAnimationFrame(()=>{
                        $5c2f5cd01815d369$var$scrollIntoView(target);
                    });
                    else // Otherwise, wait for the visual viewport to resize before scrolling so we can
                    // measure the correct position to scroll to.
                    $5c2f5cd01815d369$var$visualViewport.addEventListener("resize", ()=>$5c2f5cd01815d369$var$scrollIntoView(target), {
                        once: true
                    });
                }
            });
        }
    };
    let onWindowScroll = ()=>{
        // Last resort. If the window scrolled, scroll it back to the top.
        // It should always be at the top because the body will have a negative margin (see below).
        window.scrollTo(0, 0);
    };
    // Record the original scroll position so we can restore it.
    // Then apply a negative margin to the body to offset it by the scroll position. This will
    // enable us to scroll the window to the top, which is required for the rest of this to work.
    let scrollX = window.pageXOffset;
    let scrollY = window.pageYOffset;
    let restoreStyles = (0, $6Zb2x$reactariautils.chain)($5c2f5cd01815d369$var$setStyle(document.documentElement, "paddingRight", `${window.innerWidth - document.documentElement.clientWidth}px`), $5c2f5cd01815d369$var$setStyle(document.documentElement, "overflow", "hidden"), $5c2f5cd01815d369$var$setStyle(document.body, "marginTop", `-${scrollY}px`));
    // Scroll to the top. The negative margin on the body will make this appear the same.
    window.scrollTo(0, 0);
    let removeEvents = (0, $6Zb2x$reactariautils.chain)($5c2f5cd01815d369$var$addEvent(document, "touchstart", onTouchStart, {
        passive: false,
        capture: true
    }), $5c2f5cd01815d369$var$addEvent(document, "touchmove", onTouchMove, {
        passive: false,
        capture: true
    }), $5c2f5cd01815d369$var$addEvent(document, "touchend", onTouchEnd, {
        passive: false,
        capture: true
    }), $5c2f5cd01815d369$var$addEvent(document, "focus", onFocus, true), $5c2f5cd01815d369$var$addEvent(window, "scroll", onWindowScroll));
    return ()=>{
        // Restore styles and scroll the page back to where it was.
        restoreStyles();
        removeEvents();
        window.scrollTo(scrollX, scrollY);
    };
}
// Sets a CSS property on an element, and returns a function to revert it to the previous value.
function $5c2f5cd01815d369$var$setStyle(element, style, value) {
    let cur = element.style[style];
    element.style[style] = value;
    return ()=>{
        element.style[style] = cur;
    };
}
// Adds an event listener to an element, and returns a function to remove it.
function $5c2f5cd01815d369$var$addEvent(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    return ()=>{
        target.removeEventListener(event, handler, options);
    };
}
function $5c2f5cd01815d369$var$scrollIntoView(target) {
    let root = document.scrollingElement || document.documentElement;
    while(target && target !== root){
        // Find the parent scrollable element and adjust the scroll position if the target is not already in view.
        let scrollable = (0, $6Zb2x$reactariautils.getScrollParent)(target);
        if (scrollable !== document.documentElement && scrollable !== document.body && scrollable !== target) {
            let scrollableTop = scrollable.getBoundingClientRect().top;
            let targetTop = target.getBoundingClientRect().top;
            if (targetTop > scrollableTop + target.clientHeight) scrollable.scrollTop += targetTop - scrollableTop;
        }
        target = scrollable.parentElement;
    }
}
function $5c2f5cd01815d369$var$willOpenKeyboard(target) {
    return target instanceof HTMLInputElement && !$5c2f5cd01815d369$var$nonTextInputTypes.has(target.type) || target instanceof HTMLTextAreaElement || target instanceof HTMLElement && target.isContentEditable;
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


const $0775ea8ea6a0565e$var$Context = /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createContext(null);
function $0775ea8ea6a0565e$export$178405afcd8c5eb(props) {
    let { children: children  } = props;
    let parent = (0, $6Zb2x$react.useContext)($0775ea8ea6a0565e$var$Context);
    let [modalCount, setModalCount] = (0, $6Zb2x$react.useState)(0);
    let context = (0, $6Zb2x$react.useMemo)(()=>({
            parent: parent,
            modalCount: modalCount,
            addModal () {
                setModalCount((count)=>count + 1);
                if (parent) parent.addModal();
            },
            removeModal () {
                setModalCount((count)=>count - 1);
                if (parent) parent.removeModal();
            }
        }), [
        parent,
        modalCount
    ]);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement($0775ea8ea6a0565e$var$Context.Provider, {
        value: context
    }, children);
}
function $0775ea8ea6a0565e$export$d9aaed4c3ece1bc0() {
    let context = (0, $6Zb2x$react.useContext)($0775ea8ea6a0565e$var$Context);
    return {
        modalProviderProps: {
            "aria-hidden": context && context.modalCount > 0 ? true : null
        }
    };
}
/**
 * Creates a root node that will be aria-hidden if there are other modals open.
 */ function $0775ea8ea6a0565e$var$OverlayContainerDOM(props) {
    let { modalProviderProps: modalProviderProps  } = $0775ea8ea6a0565e$export$d9aaed4c3ece1bc0();
    return /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement("div", {
        "data-overlay-container": true,
        ...props,
        ...modalProviderProps
    });
}
function $0775ea8ea6a0565e$export$bf688221f59024e5(props) {
    return /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement($0775ea8ea6a0565e$export$178405afcd8c5eb, null, /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement($0775ea8ea6a0565e$var$OverlayContainerDOM, props));
}
function $0775ea8ea6a0565e$export$b47c3594eab58386(props) {
    let isSSR = (0, $6Zb2x$reactariassr.useIsSSR)();
    let { portalContainer: portalContainer = isSSR ? null : document.body , ...rest } = props;
    (0, ($parcel$interopDefault($6Zb2x$react))).useEffect(()=>{
        if (portalContainer === null || portalContainer === void 0 ? void 0 : portalContainer.closest("[data-overlay-container]")) throw new Error("An OverlayContainer must not be inside another container. Please change the portalContainer prop.");
    }, [
        portalContainer
    ]);
    if (!portalContainer) return null;
    let contents = /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement($0775ea8ea6a0565e$export$bf688221f59024e5, rest);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$reactdom))).createPortal(contents, portalContainer);
}
function $0775ea8ea6a0565e$export$33ffd74ebf07f060(options) {
    // Add aria-hidden to all parent providers on mount, and restore on unmount.
    let context = (0, $6Zb2x$react.useContext)($0775ea8ea6a0565e$var$Context);
    if (!context) throw new Error("Modal is not contained within a provider");
    (0, $6Zb2x$react.useEffect)(()=>{
        if ((options === null || options === void 0 ? void 0 : options.isDisabled) || !context || !context.parent) return;
        // The immediate context is from the provider containing this modal, so we only
        // want to trigger aria-hidden on its parents not on the modal provider itself.
        context.parent.addModal();
        return ()=>{
            if (context && context.parent) context.parent.removeModal();
        };
    }, [
        context,
        context.parent,
        options === null || options === void 0 ? void 0 : options.isDisabled
    ]);
    return {
        modalProps: {
            "data-ismodal": !(options === null || options === void 0 ? void 0 : options.isDisabled)
        }
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
 */ var $18d014414048a7ba$exports = {};
var $4393d9b86d3ad278$exports = {};
$4393d9b86d3ad278$exports = {
    "dismiss": `تجاهل`
};


var $254224013ae06959$exports = {};
$254224013ae06959$exports = {
    "dismiss": `Отхвърляне`
};


var $55d3567b59d09782$exports = {};
$55d3567b59d09782$exports = {
    "dismiss": `Odstranit`
};


var $0e419a7be7773c16$exports = {};
$0e419a7be7773c16$exports = {
    "dismiss": `Luk`
};


var $be606513c8356c34$exports = {};
$be606513c8356c34$exports = {
    "dismiss": `Schließen`
};


var $7d99787e5bd26f87$exports = {};
$7d99787e5bd26f87$exports = {
    "dismiss": `Απόρριψη`
};


var $0360f2a6534752c1$exports = {};
$0360f2a6534752c1$exports = {
    "dismiss": `Dismiss`
};


var $92bf4fdecfeb6a61$exports = {};
$92bf4fdecfeb6a61$exports = {
    "dismiss": `Descartar`
};


var $7c02fa9b9c598043$exports = {};
$7c02fa9b9c598043$exports = {
    "dismiss": `Lõpeta`
};


var $ba53535dcca59343$exports = {};
$ba53535dcca59343$exports = {
    "dismiss": `Hylkää`
};


var $2fbbcddf7d252cb7$exports = {};
$2fbbcddf7d252cb7$exports = {
    "dismiss": `Rejeter`
};


var $0a1f0520e07d3596$exports = {};
$0a1f0520e07d3596$exports = {
    "dismiss": `התעלם`
};


var $f7be5df1487823a9$exports = {};
$f7be5df1487823a9$exports = {
    "dismiss": `Odbaci`
};


var $8dbe4363bfbba3f9$exports = {};
$8dbe4363bfbba3f9$exports = {
    "dismiss": `Elutasítás`
};


var $90a445da1ad273e7$exports = {};
$90a445da1ad273e7$exports = {
    "dismiss": `Ignora`
};


var $e1ebf18259c9b1ee$exports = {};
$e1ebf18259c9b1ee$exports = {
    "dismiss": `閉じる`
};


var $765893642f3b4f72$exports = {};
$765893642f3b4f72$exports = {
    "dismiss": `무시`
};


var $af73ba24f63febd1$exports = {};
$af73ba24f63febd1$exports = {
    "dismiss": `Atmesti`
};


var $97aac9f6740ee412$exports = {};
$97aac9f6740ee412$exports = {
    "dismiss": `Nerādīt`
};


var $92fbe76e196d7e0a$exports = {};
$92fbe76e196d7e0a$exports = {
    "dismiss": `Lukk`
};


var $44399897afb701ce$exports = {};
$44399897afb701ce$exports = {
    "dismiss": `Negeren`
};


var $d679e258664d7384$exports = {};
$d679e258664d7384$exports = {
    "dismiss": `Zignoruj`
};


var $b51fc2992648966b$exports = {};
$b51fc2992648966b$exports = {
    "dismiss": `Descartar`
};


var $6abbc540dcd5f78c$exports = {};
$6abbc540dcd5f78c$exports = {
    "dismiss": `Dispensar`
};


var $6cbc0c9bf574473b$exports = {};
$6cbc0c9bf574473b$exports = {
    "dismiss": `Revocare`
};


var $009edbe58be6525b$exports = {};
$009edbe58be6525b$exports = {
    "dismiss": `Пропустить`
};


var $01cf6095489e78f7$exports = {};
$01cf6095489e78f7$exports = {
    "dismiss": `Zrušiť`
};


var $33fd5a1a3753e83f$exports = {};
$33fd5a1a3753e83f$exports = {
    "dismiss": `Opusti`
};


var $6b9373a558e74e84$exports = {};
$6b9373a558e74e84$exports = {
    "dismiss": `Odbaci`
};


var $90008194c3db7fce$exports = {};
$90008194c3db7fce$exports = {
    "dismiss": `Avvisa`
};


var $e29d21290b4ce15c$exports = {};
$e29d21290b4ce15c$exports = {
    "dismiss": `Kapat`
};


var $96139c59e8ba3f85$exports = {};
$96139c59e8ba3f85$exports = {
    "dismiss": `Скасувати`
};


var $052554192ea8e826$exports = {};
$052554192ea8e826$exports = {
    "dismiss": `取消`
};


var $3f3b5d798a5abdbc$exports = {};
$3f3b5d798a5abdbc$exports = {
    "dismiss": `關閉`
};


$18d014414048a7ba$exports = {
    "ar-AE": $4393d9b86d3ad278$exports,
    "bg-BG": $254224013ae06959$exports,
    "cs-CZ": $55d3567b59d09782$exports,
    "da-DK": $0e419a7be7773c16$exports,
    "de-DE": $be606513c8356c34$exports,
    "el-GR": $7d99787e5bd26f87$exports,
    "en-US": $0360f2a6534752c1$exports,
    "es-ES": $92bf4fdecfeb6a61$exports,
    "et-EE": $7c02fa9b9c598043$exports,
    "fi-FI": $ba53535dcca59343$exports,
    "fr-FR": $2fbbcddf7d252cb7$exports,
    "he-IL": $0a1f0520e07d3596$exports,
    "hr-HR": $f7be5df1487823a9$exports,
    "hu-HU": $8dbe4363bfbba3f9$exports,
    "it-IT": $90a445da1ad273e7$exports,
    "ja-JP": $e1ebf18259c9b1ee$exports,
    "ko-KR": $765893642f3b4f72$exports,
    "lt-LT": $af73ba24f63febd1$exports,
    "lv-LV": $97aac9f6740ee412$exports,
    "nb-NO": $92fbe76e196d7e0a$exports,
    "nl-NL": $44399897afb701ce$exports,
    "pl-PL": $d679e258664d7384$exports,
    "pt-BR": $b51fc2992648966b$exports,
    "pt-PT": $6abbc540dcd5f78c$exports,
    "ro-RO": $6cbc0c9bf574473b$exports,
    "ru-RU": $009edbe58be6525b$exports,
    "sk-SK": $01cf6095489e78f7$exports,
    "sl-SI": $33fd5a1a3753e83f$exports,
    "sr-SP": $6b9373a558e74e84$exports,
    "sv-SE": $90008194c3db7fce$exports,
    "tr-TR": $e29d21290b4ce15c$exports,
    "uk-UA": $96139c59e8ba3f85$exports,
    "zh-CN": $052554192ea8e826$exports,
    "zh-TW": $3f3b5d798a5abdbc$exports
};






function $f69bb3e6457495cc$export$2317d149ed6f78c4(props) {
    let { onDismiss: onDismiss , ...otherProps } = props;
    let stringFormatter = (0, $6Zb2x$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($18d014414048a7ba$exports))));
    let labels = (0, $6Zb2x$reactariautils.useLabels)(otherProps, stringFormatter.format("dismiss"));
    let onClick = ()=>{
        if (onDismiss) onDismiss();
    };
    return /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement((0, $6Zb2x$reactariavisuallyhidden.VisuallyHidden), null, /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement("button", {
        ...labels,
        tabIndex: -1,
        onClick: onClick
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
 */ // Keeps a ref count of all hidden elements. Added to when hiding an element, and
// subtracted from when showing it again. When it reaches zero, aria-hidden is removed.
let $08ef1685902b6011$var$refCountMap = new WeakMap();
let $08ef1685902b6011$var$observerStack = [];
function $08ef1685902b6011$export$1c3ebcada18427bf(targets, root = document.body) {
    let visibleNodes = new Set(targets);
    let hiddenNodes = new Set();
    let walk = (root)=>{
        // Keep live announcer and top layer elements (e.g. toasts) visible.
        for (let element of root.querySelectorAll("[data-live-announcer], [data-react-aria-top-layer]"))visibleNodes.add(element);
        let acceptNode = (node)=>{
            // Skip this node and its children if it is one of the target nodes, or a live announcer.
            // Also skip children of already hidden nodes, as aria-hidden is recursive. An exception is
            // made for elements with role="row" since VoiceOver on iOS has issues hiding elements with role="row".
            // For that case we want to hide the cells inside as well (https://bugs.webkit.org/show_bug.cgi?id=222623).
            if (visibleNodes.has(node) || hiddenNodes.has(node.parentElement) && node.parentElement.getAttribute("role") !== "row") return NodeFilter.FILTER_REJECT;
            // Skip this node but continue to children if one of the targets is inside the node.
            for (let target of visibleNodes){
                if (node.contains(target)) return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
        };
        let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
            acceptNode: acceptNode
        });
        // TreeWalker does not include the root.
        let acceptRoot = acceptNode(root);
        if (acceptRoot === NodeFilter.FILTER_ACCEPT) hide(root);
        if (acceptRoot !== NodeFilter.FILTER_REJECT) {
            let node = walker.nextNode();
            while(node != null){
                hide(node);
                node = walker.nextNode();
            }
        }
    };
    let hide = (node)=>{
        var _refCountMap_get;
        let refCount = (_refCountMap_get = $08ef1685902b6011$var$refCountMap.get(node)) !== null && _refCountMap_get !== void 0 ? _refCountMap_get : 0;
        // If already aria-hidden, and the ref count is zero, then this element
        // was already hidden and there's nothing for us to do.
        if (node.getAttribute("aria-hidden") === "true" && refCount === 0) return;
        if (refCount === 0) node.setAttribute("aria-hidden", "true");
        hiddenNodes.add(node);
        $08ef1685902b6011$var$refCountMap.set(node, refCount + 1);
    };
    // If there is already a MutationObserver listening from a previous call,
    // disconnect it so the new on takes over.
    if ($08ef1685902b6011$var$observerStack.length) $08ef1685902b6011$var$observerStack[$08ef1685902b6011$var$observerStack.length - 1].disconnect();
    walk(root);
    let observer = new MutationObserver((changes)=>{
        for (let change of changes){
            if (change.type !== "childList" || change.addedNodes.length === 0) continue;
            // If the parent element of the added nodes is not within one of the targets,
            // and not already inside a hidden node, hide all of the new children.
            if (![
                ...visibleNodes,
                ...hiddenNodes
            ].some((node)=>node.contains(change.target))) {
                for (let node of change.removedNodes)if (node instanceof Element) {
                    visibleNodes.delete(node);
                    hiddenNodes.delete(node);
                }
                for (let node1 of change.addedNodes){
                    if ((node1 instanceof HTMLElement || node1 instanceof SVGElement) && (node1.dataset.liveAnnouncer === "true" || node1.dataset.reactAriaTopLayer === "true")) visibleNodes.add(node1);
                    else if (node1 instanceof Element) walk(node1);
                }
            }
        }
    });
    observer.observe(root, {
        childList: true,
        subtree: true
    });
    let observerWrapper = {
        observe () {
            observer.observe(root, {
                childList: true,
                subtree: true
            });
        },
        disconnect () {
            observer.disconnect();
        }
    };
    $08ef1685902b6011$var$observerStack.push(observerWrapper);
    return ()=>{
        observer.disconnect();
        for (let node of hiddenNodes){
            let count = $08ef1685902b6011$var$refCountMap.get(node);
            if (count === 1) {
                node.removeAttribute("aria-hidden");
                $08ef1685902b6011$var$refCountMap.delete(node);
            } else $08ef1685902b6011$var$refCountMap.set(node, count - 1);
        }
        // Remove this observer from the stack, and start the previous one.
        if (observerWrapper === $08ef1685902b6011$var$observerStack[$08ef1685902b6011$var$observerStack.length - 1]) {
            $08ef1685902b6011$var$observerStack.pop();
            if ($08ef1685902b6011$var$observerStack.length) $08ef1685902b6011$var$observerStack[$08ef1685902b6011$var$observerStack.length - 1].observe();
        } else $08ef1685902b6011$var$observerStack.splice($08ef1685902b6011$var$observerStack.indexOf(observerWrapper), 1);
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




function $6c2dfcdee3e15e20$export$542a6fd13ac93354(props, state) {
    let { triggerRef: triggerRef , popoverRef: popoverRef , isNonModal: isNonModal , isKeyboardDismissDisabled: isKeyboardDismissDisabled , ...otherProps } = props;
    let { overlayProps: overlayProps , underlayProps: underlayProps  } = (0, $82711f9cb668ecdb$export$ea8f71083e90600f)({
        isOpen: state.isOpen,
        onClose: state.close,
        shouldCloseOnBlur: true,
        isDismissable: !isNonModal,
        isKeyboardDismissDisabled: isKeyboardDismissDisabled
    }, popoverRef);
    let { overlayProps: positionProps , arrowProps: arrowProps , placement: placement  } = (0, $cd94b4896dd97759$export$d39e1813b3bdd0e1)({
        ...otherProps,
        targetRef: triggerRef,
        overlayRef: popoverRef,
        isOpen: state.isOpen,
        onClose: null
    });
    (0, $5c2f5cd01815d369$export$ee0f7cc6afcd1c18)({
        isDisabled: isNonModal
    });
    (0, $6Zb2x$reactariautils.useLayoutEffect)(()=>{
        if (state.isOpen && !isNonModal && popoverRef.current) return (0, $08ef1685902b6011$export$1c3ebcada18427bf)([
            popoverRef.current
        ]);
    }, [
        isNonModal,
        state.isOpen,
        popoverRef
    ]);
    return {
        popoverProps: (0, $6Zb2x$reactariautils.mergeProps)(overlayProps, positionProps),
        arrowProps: arrowProps,
        underlayProps: underlayProps,
        placement: placement
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




const $745edbb83ab4296f$export$a2200b96afd16271 = /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createContext(null);
function $745edbb83ab4296f$export$c6fdb837b070b4ff(props) {
    let isSSR = (0, $6Zb2x$reactariassr.useIsSSR)();
    let { portalContainer: portalContainer = isSSR ? null : document.body  } = props;
    let [contain, setContain] = (0, $6Zb2x$react.useState)(false);
    let contextValue = (0, $6Zb2x$react.useMemo)(()=>({
            contain: contain,
            setContain: setContain
        }), [
        contain,
        setContain
    ]);
    if (!portalContainer) return null;
    let contents = /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement($745edbb83ab4296f$export$a2200b96afd16271.Provider, {
        value: contextValue
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$react))).createElement((0, $6Zb2x$reactariafocus.FocusScope), {
        restoreFocus: true,
        contain: contain
    }, props.children));
    return /*#__PURE__*/ (0, ($parcel$interopDefault($6Zb2x$reactdom))).createPortal(contents, portalContainer);
}
function $745edbb83ab4296f$export$14c98a7594375490() {
    let ctx = (0, $6Zb2x$react.useContext)($745edbb83ab4296f$export$a2200b96afd16271);
    let setContain = ctx === null || ctx === void 0 ? void 0 : ctx.setContain;
    (0, $6Zb2x$reactariautils.useLayoutEffect)(()=>{
        setContain === null || setContain === void 0 ? void 0 : setContain(true);
    }, [
        setContain
    ]);
}



function $11b7e0b04b421e95$export$dbc0f175b25fb0fb(props, state, ref) {
    let { overlayProps: overlayProps , underlayProps: underlayProps  } = (0, $82711f9cb668ecdb$export$ea8f71083e90600f)({
        ...props,
        isOpen: state.isOpen,
        onClose: state.close
    }, ref);
    (0, $5c2f5cd01815d369$export$ee0f7cc6afcd1c18)({
        isDisabled: !state.isOpen
    });
    (0, $745edbb83ab4296f$export$14c98a7594375490)();
    (0, $6Zb2x$react.useEffect)(()=>{
        if (state.isOpen) return (0, $08ef1685902b6011$export$1c3ebcada18427bf)([
            ref.current
        ]);
    }, [
        state.isOpen,
        ref
    ]);
    return {
        modalProps: (0, $6Zb2x$reactariautils.mergeProps)(overlayProps),
        underlayProps: underlayProps
    };
}





//# sourceMappingURL=main.js.map
