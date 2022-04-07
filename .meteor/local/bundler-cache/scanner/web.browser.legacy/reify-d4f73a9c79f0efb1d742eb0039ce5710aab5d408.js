'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var reactUrx = require('@virtuoso.dev/react-urx');
var u = require('@virtuoso.dev/urx');
var React = require('react');
var ResizeObserver = _interopDefault(require('resize-observer-polyfill'));

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it;

  if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      return function () {
        if (i >= o.length) return {
          done: true
        };
        return {
          done: false,
          value: o[i++]
        };
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  it = o[Symbol.iterator]();
  return it.next.bind(it);
}

function useSize(callback, enabled) {
  if (enabled === void 0) {
    enabled = true;
  }

  var ref = React.useRef(null);
  var observer = new ResizeObserver(function (entries) {
    var element = entries[0].target; // if display: none, the element won't have an offsetParent
    // measuring it at this mode is not going to work
    // https://stackoverflow.com/a/21696585/1009797

    if (element.offsetParent !== null) {
      callback(element);
    }
  });

  var callbackRef = function callbackRef(elRef) {
    if (elRef && enabled) {
      observer.observe(elRef);
      ref.current = elRef;
    } else {
      if (ref.current) {
        observer.unobserve(ref.current);
      }

      ref.current = null;
    }
  };

  return callbackRef;
}

function useChangedChildSizes(callback, enabled) {
  return useSize(function (el) {
    var ranges = getChangedChildSizes(el.children, 'offsetHeight');

    if (ranges !== null) {
      callback(ranges);
    }
  }, enabled);
}

function getChangedChildSizes(children, field) {
  var length = children.length;

  if (length === 0) {
    return null;
  }

  var results = [];

  for (var i = 0; i < length; i++) {
    var child = children.item(i);

    if (!child || child.dataset.index === undefined) {
      continue;
    }

    var index = parseInt(child.dataset.index);
    var knownSize = parseInt(child.dataset.knownSize);
    var size = child[field];

    if (size === 0) {
      throw new Error('Zero-sized element, this should not happen');
    }

    if (size === knownSize) {
      continue;
    }

    var lastResult = results[results.length - 1];

    if (results.length === 0 || lastResult.size !== size || lastResult.endIndex !== index - 1) {
      results.push({
        startIndex: index,
        endIndex: index,
        size: size
      });
    } else {
      results[results.length - 1].endIndex++;
    }
  }

  return results;
}

function useScrollTop(scrollTopCallback, smoothScrollTargetReached, scrollerElement) {
  var scrollerRef = React.useRef(null);
  var scrollTopTarget = React.useRef(null);
  var timeoutRef = React.useRef(null);
  var handler = React.useCallback(function (ev) {
    var el = ev.target;
    var scrollTop = el.scrollTop;
    scrollTopCallback(Math.max(scrollTop, 0));

    if (scrollTopTarget.current !== null) {
      if (scrollTop === scrollTopTarget.current || scrollTop <= 0 || scrollTop === el.scrollHeight - el.offsetHeight) {
        scrollTopTarget.current = null;
        smoothScrollTargetReached(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  }, [scrollTopCallback, smoothScrollTargetReached]);
  React.useEffect(function () {
    var localRef = scrollerRef.current;
    handler({
      target: localRef
    });
    localRef.addEventListener('scroll', handler, {
      passive: true
    });
    return function () {
      localRef.removeEventListener('scroll', handler);
    };
  }, [scrollerRef, handler, scrollerElement]);

  function scrollToCallback(location) {
    var scrollerElement = scrollerRef.current;

    if (!scrollerElement) {
      return;
    }

    var isSmooth = location.behavior === 'smooth'; // avoid system hanging because the DOM never called back
    // with the scrollTop
    // scroller is already at this location

    if (scrollerElement.offsetHeight === scrollerElement.scrollHeight || location.top === scrollerElement.scrollTop) {
      scrollTopCallback(scrollerElement.scrollTop);

      if (isSmooth) {
        smoothScrollTargetReached(true);
      }

      return;
    }

    var maxScrollTop = scrollerElement.scrollHeight - scrollerElement.offsetHeight;
    location.top = Math.max(Math.min(maxScrollTop, location.top), 0);

    if (isSmooth) {
      scrollTopTarget.current = location.top;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(function () {
        timeoutRef.current = null;
        scrollTopTarget.current = null;
        smoothScrollTargetReached(true);
      }, 1000);
    } else {
      scrollTopTarget.current = null;
    }

    scrollerElement.scrollTo(location);
  }

  function scrollByCallback(location) {
    if (scrollTopTarget.current === null) {
      scrollerRef.current.scrollBy(location);
    }
  }

  return {
    scrollerRef: scrollerRef,
    scrollByCallback: scrollByCallback,
    scrollToCallback: scrollToCallback
  };
}

var UP = 'up';
var DOWN = 'down';
var domIOSystem = /*#__PURE__*/u.system(function () {
  var scrollTop = u.stream();
  var deviation = u.statefulStream(0);
  var smoothScrollTargetReached = u.stream();
  var statefulScrollTop = u.statefulStream(0);
  var viewportHeight = u.stream();
  var headerHeight = u.statefulStream(0);
  var footerHeight = u.statefulStream(0);
  var scrollTo = u.stream();
  var scrollBy = u.stream();
  u.connect(scrollTop, statefulScrollTop);
  var scrollDirection = u.statefulStream(DOWN);
  u.connect(u.pipe(scrollTop, u.scan(function (acc, scrollTop) {
    return {
      direction: scrollTop < acc.prevScrollTop ? UP : DOWN,
      prevScrollTop: scrollTop
    };
  }, {
    direction: DOWN,
    prevScrollTop: 0
  }), u.map(function (value) {
    return value.direction;
  })), scrollDirection);
  return {
    // input
    scrollTop: scrollTop,
    viewportHeight: viewportHeight,
    headerHeight: headerHeight,
    footerHeight: footerHeight,
    smoothScrollTargetReached: smoothScrollTargetReached,
    // signals
    scrollTo: scrollTo,
    scrollBy: scrollBy,
    // state
    scrollDirection: scrollDirection,
    statefulScrollTop: statefulScrollTop,
    deviation: deviation
  };
}, [], {
  singleton: true
});

var NIL_NODE = {
  lvl: 0
};

function newAANode(k, v, lvl, l, r) {
  if (l === void 0) {
    l = NIL_NODE;
  }

  if (r === void 0) {
    r = NIL_NODE;
  }

  return {
    k: k,
    v: v,
    lvl: lvl,
    l: l,
    r: r
  };
}

function empty(node) {
  return node === NIL_NODE;
}
function newTree() {
  return NIL_NODE;
}
function remove(node, key) {
  if (empty(node)) return NIL_NODE;
  var k = node.k,
      l = node.l,
      r = node.r;

  if (key === k) {
    if (empty(l)) {
      return r;
    } else if (empty(r)) {
      return l;
    } else {
      var _last = last(l),
          lastKey = _last[0],
          lastValue = _last[1];

      return adjust(clone(node, {
        k: lastKey,
        v: lastValue,
        l: deleteLast(l)
      }));
    }
  } else if (key < k) {
    return adjust(clone(node, {
      l: remove(l, key)
    }));
  } else {
    return adjust(clone(node, {
      r: remove(r, key)
    }));
  }
}
function find(node, key) {
  if (empty(node)) {
    return;
  }

  if (key === node.k) {
    return node.v;
  } else if (key < node.k) {
    return find(node.l, key);
  } else {
    return find(node.r, key);
  }
}
function findMaxKeyValue(node, value, field) {
  if (field === void 0) {
    field = 'k';
  }

  if (empty(node)) {
    return [-Infinity, undefined];
  }

  if (node[field] === value) {
    return [node.k, node.v];
  }

  if (node[field] < value) {
    var r = findMaxKeyValue(node.r, value, field);

    if (r[0] === -Infinity) {
      return [node.k, node.v];
    } else {
      return r;
    }
  }

  return findMaxKeyValue(node.l, value, field);
}
function insert(node, k, v) {
  if (empty(node)) {
    return newAANode(k, v, 1);
  }

  if (k === node.k) {
    return clone(node, {
      k: k,
      v: v
    });
  } else if (k < node.k) {
    return rebalance(clone(node, {
      l: insert(node.l, k, v)
    }));
  } else {
    return rebalance(clone(node, {
      r: insert(node.r, k, v)
    }));
  }
}
function walkWithin(node, start, end) {
  if (empty(node)) {
    return [];
  }

  var k = node.k,
      v = node.v,
      l = node.l,
      r = node.r;
  var result = [];

  if (k > start) {
    result = result.concat(walkWithin(l, start, end));
  }

  if (k >= start && k <= end) {
    result.push({
      k: k,
      v: v
    });
  }

  if (k <= end) {
    result = result.concat(walkWithin(r, start, end));
  }

  return result;
}
function walk(node) {
  if (empty(node)) {
    return [];
  }

  return [].concat(walk(node.l), [{
    k: node.k,
    v: node.v
  }], walk(node.r));
}

function last(node) {
  return empty(node.r) ? [node.k, node.v] : last(node.r);
}

function deleteLast(node) {
  return empty(node.r) ? node.l : adjust(clone(node, {
    r: deleteLast(node.r)
  }));
}

function clone(node, args) {
  return newAANode(args.k !== undefined ? args.k : node.k, args.v !== undefined ? args.v : node.v, args.lvl !== undefined ? args.lvl : node.lvl, args.l !== undefined ? args.l : node.l, args.r !== undefined ? args.r : node.r);
}

function isSingle(node) {
  return empty(node) || node.lvl > node.r.lvl;
}

function rebalance(node) {
  return split(skew(node));
}

function adjust(node) {
  var l = node.l,
      r = node.r,
      lvl = node.lvl;

  if (r.lvl >= lvl - 1 && l.lvl >= lvl - 1) {
    return node;
  } else if (lvl > r.lvl + 1) {
    if (isSingle(l)) {
      return skew(clone(node, {
        lvl: lvl - 1
      }));
    } else {
      if (!empty(l) && !empty(l.r)) {
        return clone(l.r, {
          l: clone(l, {
            r: l.r.l
          }),
          r: clone(node, {
            l: l.r.r,
            lvl: lvl - 1
          }),
          lvl: lvl
        });
      } else {
        throw new Error('Unexpected empty nodes');
      }
    }
  } else {
    if (isSingle(node)) {
      return split(clone(node, {
        lvl: lvl - 1
      }));
    } else {
      if (!empty(r) && !empty(r.l)) {
        var rl = r.l;
        var rlvl = isSingle(rl) ? r.lvl - 1 : r.lvl;
        return clone(rl, {
          l: clone(node, {
            r: rl.l,
            lvl: lvl - 1
          }),
          r: split(clone(r, {
            l: rl.r,
            lvl: rlvl
          })),
          lvl: rl.lvl + 1
        });
      } else {
        throw new Error('Unexpected empty nodes');
      }
    }
  }
}
function rangesWithin(node, startIndex, endIndex) {
  if (empty(node)) {
    return [];
  }

  var adjustedStart = findMaxKeyValue(node, startIndex)[0];
  return toRanges(walkWithin(node, adjustedStart, endIndex));
}

function toRanges(nodes) {
  if (nodes.length === 0) {
    return [];
  }

  var first = nodes[0];
  var start = first.k,
      v = first.v;
  var result = [];

  for (var i = 1; i <= nodes.length; i++) {
    var nextNode = nodes[i];
    var end = nextNode ? nextNode.k - 1 : Infinity;
    result.push({
      start: start,
      end: end,
      value: v
    });

    if (nextNode) {
      start = nextNode.k;
      v = nextNode.v;
    }
  }

  return result;
}

function split(node) {
  var r = node.r,
      lvl = node.lvl;
  return !empty(r) && !empty(r.r) && r.lvl === lvl && r.r.lvl === lvl ? clone(r, {
    l: clone(node, {
      r: r.l
    }),
    lvl: lvl + 1
  }) : node;
}

function skew(node) {
  var l = node.l;
  return !empty(l) && l.lvl === node.lvl ? clone(l, {
    r: clone(node, {
      l: l.r
    })
  }) : node;
} // for debugging purposes

function rangeIncludes(refRange) {
  var size = refRange.size,
      startIndex = refRange.startIndex,
      endIndex = refRange.endIndex;
  return function (range) {
    return range.start === startIndex && (range.end === endIndex || range.end === Infinity) && range.value === size;
  };
}

function insertRanges(sizeTree, ranges, onRemove) {
  if (onRemove === void 0) {
    onRemove = function onRemove() {};
  }

  var syncStart = empty(sizeTree) ? 0 : Infinity;

  for (var _iterator = _createForOfIteratorHelperLoose(ranges), _step; !(_step = _iterator()).done;) {
    var range = _step.value;
    var size = range.size,
        startIndex = range.startIndex,
        endIndex = range.endIndex;
    syncStart = Math.min(syncStart, startIndex);

    if (empty(sizeTree)) {
      sizeTree = insert(sizeTree, 0, size);
      continue;
    } // extend the range in both directions, so that we can get adjacent neighbours.
    // if the previous / next ones have the same value as the one we are about to insert,
    // we 'merge' them.


    var overlappingRanges = rangesWithin(sizeTree, startIndex - 1, endIndex + 1);

    if (overlappingRanges.some(rangeIncludes(range))) {
      continue;
    }

    var firstPassDone = false;
    var shouldInsert = false;

    for (var _iterator2 = _createForOfIteratorHelperLoose(overlappingRanges), _step2; !(_step2 = _iterator2()).done;) {
      var _step2$value = _step2.value,
          rangeStart = _step2$value.start,
          rangeEnd = _step2$value.end,
          rangeValue = _step2$value.value;

      // previous range
      if (!firstPassDone) {
        shouldInsert = rangeValue !== size;
        firstPassDone = true;
      } else {
        // remove the range if it starts within the new range OR if
        // it has the same value as it, in order to perfrom a merge
        if (endIndex >= rangeStart || size === rangeValue) {
          sizeTree = remove(sizeTree, rangeStart);
          onRemove(rangeStart);
        }
      } // next range


      if (rangeEnd > endIndex && endIndex >= rangeStart) {
        if (rangeValue !== size) {
          sizeTree = insert(sizeTree, endIndex + 1, rangeValue);
        }
      }
    }

    if (shouldInsert) {
      sizeTree = insert(sizeTree, startIndex, size);
    }
  }

  return [sizeTree, syncStart];
}
function initialSizeState() {
  return {
    offsetTree: newTree(),
    sizeTree: newTree(),
    groupOffsetTree: newTree(),
    lastIndex: 0,
    lastOffset: 0,
    lastSize: 0,
    groupIndices: []
  };
}
function sizeStateReducer(state, _ref) {
  var ranges = _ref[0],
      groupIndices = _ref[1];
  var sizeTree = state.sizeTree,
      offsetTree = state.offsetTree;
  var newSizeTree = sizeTree;
  var syncStart = 0; // We receive probe item results from a group probe,
  // which should always pass an item and a group
  // the results contain two ranges, which we consider to mean that groups and items have different size

  if (groupIndices.length > 0 && empty(sizeTree) && ranges.length === 2) {
    var groupSize = ranges[0].size;
    var itemSize = ranges[1].size;
    newSizeTree = groupIndices.reduce(function (tree, groupIndex) {
      return insert(insert(tree, groupIndex, groupSize), groupIndex + 1, itemSize);
    }, newSizeTree);
  } else {

    var _insertRanges = insertRanges(newSizeTree, ranges, function (index) {
      offsetTree = remove(offsetTree, index);
    });

    newSizeTree = _insertRanges[0];
    syncStart = _insertRanges[1];
  }

  if (newSizeTree === sizeTree) {
    return state;
  }

  var prevOffset = 0;
  var prevIndex = 0;
  var prevSize = 0;

  if (syncStart !== 0) {
    prevOffset = findMaxKeyValue(offsetTree, syncStart - 1)[1];
    var kv = findMaxKeyValue(newSizeTree, syncStart - 1);
    prevIndex = kv[0];
    prevSize = kv[1];
  } else {
    prevSize = find(newSizeTree, 0);
  }

  for (var _iterator3 = _createForOfIteratorHelperLoose(rangesWithin(newSizeTree, syncStart, Infinity)), _step3; !(_step3 = _iterator3()).done;) {
    var _step3$value = _step3.value,
        startIndex = _step3$value.start,
        value = _step3$value.value;
    var offset = (startIndex - prevIndex) * prevSize + prevOffset;
    offsetTree = insert(offsetTree, startIndex, offset);
    prevIndex = startIndex;
    prevOffset = offset;
    prevSize = value;
  }

  return {
    offsetTree: offsetTree,
    sizeTree: newSizeTree,
    groupOffsetTree: groupIndices.reduce(function (tree, index) {
      return insert(tree, index, offsetOf(index, {
        offsetTree: offsetTree,
        sizeTree: newSizeTree
      }));
    }, newTree()),
    lastIndex: prevIndex,
    lastOffset: prevOffset,
    lastSize: prevSize,
    groupIndices: groupIndices
  };
}
function offsetOf(index, state) {

  if (empty(state.offsetTree)) {
    return 0;
  }

  var _findMaxKeyValue = findMaxKeyValue(state.offsetTree, index),
      startIndex = _findMaxKeyValue[0],
      startOffset = _findMaxKeyValue[1];

  var size = findMaxKeyValue(state.sizeTree, index)[1];
  return size * (index - startIndex) + startOffset;
}
function originalIndexFromItemIndex(itemIndex, sizes) {
  if (!hasGroups(sizes)) {
    return itemIndex;
  }

  var groupOffset = 0;

  while (sizes.groupIndices[groupOffset] <= itemIndex + groupOffset) {
    groupOffset++;
  } // we find the real item index, offseting it by the number of group items before it


  return itemIndex + groupOffset;
}
function hasGroups(sizes) {
  return !empty(sizes.groupOffsetTree);
}
var sizeSystem = /*#__PURE__*/u.system(function () {
  var sizeRanges = u.stream();
  var totalCount = u.stream();
  var unshiftWith = u.stream();
  var firstItemIndex = u.statefulStream(0);
  var groupIndices = u.statefulStream([]);
  var fixedItemSize = u.statefulStream(undefined);
  var defaultItemSize = u.statefulStream(undefined);
  var data = u.statefulStream(undefined);
  var initial = initialSizeState();
  var sizes = u.statefulStreamFromEmitter(u.pipe(sizeRanges, u.withLatestFrom(groupIndices), u.scan(sizeStateReducer, initial), u.distinctUntilChanged()), initial);
  u.connect(u.pipe(groupIndices, u.filter(function (indexes) {
    return indexes.length > 0;
  }), u.withLatestFrom(sizes), u.map(function (_ref2) {
    var groupIndices = _ref2[0],
        sizes = _ref2[1];
    var groupOffsetTree = groupIndices.reduce(function (tree, index, idx) {
      return insert(tree, index, offsetOf(index, sizes) || idx);
    }, newTree());
    return _extends({}, sizes, {
      groupIndices: groupIndices,
      groupOffsetTree: groupOffsetTree
    });
  })), sizes);
  u.connect(fixedItemSize, defaultItemSize);
  var trackItemSizes = u.statefulStreamFromEmitter(u.pipe(fixedItemSize, u.map(function (size) {
    return size === undefined;
  })), true);
  u.connect(u.pipe(defaultItemSize, u.filter(function (value) {
    return value !== undefined;
  }), u.map(function (size) {
    return [{
      startIndex: 0,
      endIndex: 0,
      size: size
    }];
  })), sizeRanges);
  var listRefresh = u.streamFromEmitter(u.pipe(sizeRanges, u.withLatestFrom(sizes), u.scan(function (_ref3, _ref4) {
    var oldSizes = _ref3.sizes;
    var newSizes = _ref4[1];
    return {
      changed: newSizes !== oldSizes,
      sizes: newSizes
    };
  }, {
    changed: false,
    sizes: initial
  }), u.map(function (value) {
    return value.changed;
  })));
  u.connect(u.pipe(firstItemIndex, u.scan(function (prev, next) {
    return {
      diff: prev.prev - next,
      prev: next
    };
  }, {
    diff: 0,
    prev: 0
  }), u.map(function (val) {
    return val.diff;
  }), u.filter(function (value) {
    return value > 0;
  })), unshiftWith); // hack to capture the current list top item before the sizes get refreshed
  // :(

  var beforeUnshiftWith = u.streamFromEmitter(unshiftWith);
  u.connect(u.pipe(unshiftWith, u.withLatestFrom(sizes), u.map(function (_ref5) {
    var unshiftWith = _ref5[0],
        sizes = _ref5[1];

    if (sizes.groupIndices.length > 0) {
      throw new Error('Virtuoso: prepending items does not work with groups');
    }

    return walk(sizes.sizeTree).reduce(function (acc, _ref6) {
      var index = _ref6.k,
          size = _ref6.v;
      return {
        ranges: [].concat(acc.ranges, [{
          startIndex: acc.prevIndex,
          endIndex: index + unshiftWith - 1,
          size: acc.prevSize
        }]),
        prevIndex: index + unshiftWith,
        prevSize: size
      };
    }, {
      ranges: [],
      prevIndex: 0,
      prevSize: sizes.lastSize
    }).ranges;
  })), sizeRanges);
  return {
    // input
    data: data,
    totalCount: totalCount,
    sizeRanges: sizeRanges,
    groupIndices: groupIndices,
    defaultItemSize: defaultItemSize,
    fixedItemSize: fixedItemSize,
    unshiftWith: unshiftWith,
    beforeUnshiftWith: beforeUnshiftWith,
    firstItemIndex: firstItemIndex,
    // output
    sizes: sizes,
    listRefresh: listRefresh,
    trackItemSizes: trackItemSizes
  };
}, [], {
  singleton: true
});

function normalizeIndexLocation(location) {
  var result = typeof location === 'number' ? {
    index: location
  } : location;

  if (!result.align) {
    result.align = 'start';
  }

  if (!result.behavior) {
    result.behavior = 'auto';
  }

  return result;
}
var scrollToIndexSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      sizes = _ref$.sizes,
      totalCount = _ref$.totalCount,
      listRefresh = _ref$.listRefresh,
      _ref$2 = _ref[1],
      viewportHeight = _ref$2.viewportHeight,
      scrollTo = _ref$2.scrollTo,
      smoothScrollTargetReached = _ref$2.smoothScrollTargetReached,
      headerHeight = _ref$2.headerHeight;
  var scrollToIndex = u.stream();
  var topListHeight = u.statefulStream(0);
  var unsubscribeNextListRefresh = null;
  var cleartTimeoutRef = null;
  var unsubscribeListRefresh = null;

  var cleanup = function cleanup() {
    if (unsubscribeNextListRefresh) {
      unsubscribeNextListRefresh();
      unsubscribeNextListRefresh = null;
    }

    if (unsubscribeListRefresh) {
      unsubscribeListRefresh();
      unsubscribeListRefresh = null;
    }

    if (cleartTimeoutRef) {
      clearTimeout(cleartTimeoutRef);
      cleartTimeoutRef = null;
    }
  };

  u.connect(u.pipe(scrollToIndex, u.withLatestFrom(sizes, viewportHeight, totalCount, topListHeight, headerHeight), u.map(function (_ref2) {
    var location = _ref2[0],
        sizes = _ref2[1],
        viewportHeight = _ref2[2],
        totalCount = _ref2[3],
        topListHeight = _ref2[4],
        headerHeight = _ref2[5];

    var _normalizeIndexLocati = normalizeIndexLocation(location),
        index = _normalizeIndexLocati.index,
        align = _normalizeIndexLocati.align,
        behavior = _normalizeIndexLocati.behavior;

    index = originalIndexFromItemIndex(index, sizes);
    index = Math.max(0, index, Math.min(totalCount - 1, index));
    var top = offsetOf(index, sizes) + headerHeight;

    if (align === 'end') {
      top = Math.round(top - viewportHeight + findMaxKeyValue(sizes.sizeTree, index)[1]);
    } else if (align === 'center') {
      top = Math.round(top - viewportHeight / 2 + findMaxKeyValue(sizes.sizeTree, index)[1] / 2);
    } else {
      top -= topListHeight;
    }

    var retry = function retry(listChanged) {
      cleanup();

      if (listChanged) {
        u.publish(scrollToIndex, location);
      }
    };

    cleanup();

    if (behavior === 'smooth') {
      var listChanged = false;
      unsubscribeListRefresh = u.subscribe(listRefresh, function (changed) {
        listChanged = listChanged || changed;
      });
      unsubscribeNextListRefresh = u.handleNext(smoothScrollTargetReached, function () {
        retry(listChanged);
      });
    } else {
      unsubscribeNextListRefresh = u.handleNext(listRefresh, retry);
    } // if the scroll jump is too small, the list won't get rerendered.
    // clean this listener


    cleartTimeoutRef = setTimeout(function () {
      cleanup();
    }, 1200);
    return {
      top: top,
      behavior: behavior
    };
  })), scrollTo);
  return {
    scrollToIndex: scrollToIndex,
    topListHeight: topListHeight
  };
}, /*#__PURE__*/u.tup(sizeSystem, domIOSystem), {
  singleton: true
});

var stateFlagsSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      scrollTop = _ref$.scrollTop,
      viewportHeight = _ref$.viewportHeight;
  var isAtBottom = u.statefulStream(false);
  var isAtTop = u.statefulStream(true);
  var atBottomStateChange = u.stream();
  var atTopStateChange = u.stream();
  var listStateListener = u.stream(); // skip 1 to avoid an initial on/off flick

  var isScrolling = u.streamFromEmitter(u.pipe(u.merge(u.pipe(u.duc(scrollTop), u.skip(1), u.mapTo(true)), u.pipe(u.duc(scrollTop), u.skip(1), u.mapTo(false), u.debounceTime(100))), u.distinctUntilChanged()));
  u.connect(u.pipe(u.duc(scrollTop), u.map(function (top) {
    return top === 0;
  }), u.distinctUntilChanged()), isAtTop);
  u.connect(isAtTop, atTopStateChange);
  u.connect(u.pipe(u.combineLatest(listStateListener, u.duc(scrollTop), u.duc(viewportHeight)), u.map(function (_ref2) {
    var _ref2$ = _ref2[0],
        bottom = _ref2$.bottom,
        offsetBottom = _ref2$.offsetBottom,
        scrollTop = _ref2[1],
        viewportHeight = _ref2[2];
    return offsetBottom === 0 && scrollTop + viewportHeight - bottom > -4;
  }), u.distinctUntilChanged()), isAtBottom);
  u.subscribe(isAtBottom, function (value) {
    setTimeout(function () {
      return u.publish(atBottomStateChange, value);
    });
  }); // connect(isAtBottom, atBottomStateChange)

  return {
    isScrolling: isScrolling,
    isAtTop: isAtTop,
    isAtBottom: isAtBottom,
    atTopStateChange: atTopStateChange,
    atBottomStateChange: atBottomStateChange,
    listStateListener: listStateListener
  };
}, /*#__PURE__*/u.tup(domIOSystem));

var propsReadySystem = /*#__PURE__*/u.system(function () {
  var propsReady = u.statefulStream(false);
  var didMount = u.streamFromEmitter(u.pipe(propsReady, u.filter(function (ready) {
    return ready;
  }), u.distinctUntilChanged()));
  return {
    propsReady: propsReady,
    didMount: didMount
  };
}, [], {
  singleton: true
});

var initialTopMostItemIndexSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      sizes = _ref$.sizes,
      listRefresh = _ref$.listRefresh,
      scrollTop = _ref[1].scrollTop,
      scrollToIndex = _ref[2].scrollToIndex,
      didMount = _ref[3].didMount;
  var scrolledToInitialItem = u.statefulStream(true);
  var initialTopMostItemIndex = u.statefulStream(0);
  u.connect(u.pipe(didMount, u.withLatestFrom(initialTopMostItemIndex), u.filter(function (_ref2) {
    var index = _ref2[1];
    return index !== 0;
  }), u.mapTo(false)), scrolledToInitialItem);
  u.subscribe(u.pipe(listRefresh, u.withLatestFrom(scrolledToInitialItem, sizes), u.filter(function (_ref3) {
    var scrolledToInitialItem = _ref3[1],
        sizeTree = _ref3[2].sizeTree;
    return !empty(sizeTree) && !scrolledToInitialItem;
  }), u.withLatestFrom(initialTopMostItemIndex)), function (_ref4) {
    var initialTopMostItemIndex = _ref4[1];
    u.handleNext(scrollTop, function () {
      u.publish(scrolledToInitialItem, true);
    });
    u.publish(scrollToIndex, initialTopMostItemIndex);
  });
  return {
    scrolledToInitialItem: scrolledToInitialItem,
    initialTopMostItemIndex: initialTopMostItemIndex
  };
}, /*#__PURE__*/u.tup(sizeSystem, domIOSystem, scrollToIndexSystem, propsReadySystem), {
  singleton: true
});

var behaviorFromFollowOutput = function behaviorFromFollowOutput(follow) {
  return follow === 'smooth' ? 'smooth' : 'auto';
};

var followOutputSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      totalCount = _ref$.totalCount,
      listRefresh = _ref$.listRefresh,
      isAtBottom = _ref[1].isAtBottom,
      scrollToIndex = _ref[2].scrollToIndex,
      scrolledToInitialItem = _ref[3].scrolledToInitialItem;
  var followOutput = u.statefulStream(false);
  u.subscribe(u.pipe(u.duc(totalCount), u.withLatestFrom(followOutput, isAtBottom, scrolledToInitialItem), u.filter(function (_ref2) {
    var followOutput = _ref2[1],
        isAtBottom = _ref2[2],
        scrolledToInitialItem = _ref2[3];
    return followOutput && isAtBottom && scrolledToInitialItem;
  })), function (_ref3) {
    var totalCount = _ref3[0],
        followOutput = _ref3[1];
    u.handleNext(listRefresh, function () {
      u.publish(scrollToIndex, {
        index: totalCount - 1,
        align: 'end',
        behavior: behaviorFromFollowOutput(followOutput)
      });
    });
  });
  return {
    followOutput: followOutput
  };
}, /*#__PURE__*/u.tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem, initialTopMostItemIndexSystem));

function groupCountsToIndicesAndCount(counts) {
  return counts.reduce(function (acc, groupCount) {
    acc.groupIndices.push(acc.totalCount);
    acc.totalCount += groupCount + 1;
    return acc;
  }, {
    totalCount: 0,
    groupIndices: []
  });
}
var groupedListSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      totalCount = _ref$.totalCount,
      groupIndices = _ref$.groupIndices,
      sizes = _ref$.sizes,
      _ref$2 = _ref[1],
      scrollTop = _ref$2.scrollTop,
      headerHeight = _ref$2.headerHeight;
  var groupCounts = u.stream();
  var topItemsIndexes = u.stream();
  var groupIndicesAndCount = u.streamFromEmitter(u.pipe(groupCounts, u.map(groupCountsToIndicesAndCount)));
  u.connect(u.pipe(groupIndicesAndCount, u.map(u.prop('totalCount'))), totalCount);
  u.connect(u.pipe(groupIndicesAndCount, u.map(u.prop('groupIndices'))), groupIndices);
  u.connect(u.pipe(u.combineLatest(scrollTop, sizes, headerHeight), u.filter(function (_ref2) {
    var sizes = _ref2[1];
    return hasGroups(sizes);
  }), u.map(function (_ref3) {
    var scrollTop = _ref3[0],
        state = _ref3[1],
        headerHeight = _ref3[2];
    return findMaxKeyValue(state.groupOffsetTree, Math.max(scrollTop - headerHeight, 0), 'v')[0];
  }), u.distinctUntilChanged(), u.map(function (index) {
    return [index];
  })), topItemsIndexes);
  return {
    groupCounts: groupCounts,
    topItemsIndexes: topItemsIndexes
  };
}, /*#__PURE__*/u.tup(sizeSystem, domIOSystem));

function tupleComparator(prev, current) {
  return !!(prev && prev[0] === current[0] && prev[1] === current[1]);
}
function rangeComparator(prev, next) {
  return !!(prev && prev.startIndex === next.startIndex && prev.endIndex === next.endIndex);
}

var TOP = 'top';
var BOTTOM = 'bottom';
var NONE = 'none';
var getOverscan = function getOverscan(overscan, end, direction) {
  if (typeof overscan === 'number') {
    return direction === UP && end === TOP || direction === DOWN && end === BOTTOM ? overscan : 0;
  } else {
    if (direction === UP) {
      return end === TOP ? overscan.main : overscan.reverse;
    } else {
      return end === BOTTOM ? overscan.main : overscan.reverse;
    }
  }
};
var sizeRangeSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      scrollTop = _ref$.scrollTop,
      viewportHeight = _ref$.viewportHeight,
      deviation = _ref$.deviation,
      headerHeight = _ref$.headerHeight;
  var listBoundary = u.stream();
  var topListHeight = u.statefulStream(0);
  var overscan = u.statefulStream(0);
  var visibleRange = u.statefulStreamFromEmitter(u.pipe(u.combineLatest(u.duc(scrollTop), u.duc(viewportHeight), u.duc(headerHeight), u.duc(listBoundary, tupleComparator), u.duc(overscan), u.duc(topListHeight), u.duc(deviation)), u.map(function (_ref2) {
    var scrollTop = _ref2[0],
        viewportHeight = _ref2[1],
        headerHeight = _ref2[2],
        _ref2$ = _ref2[3],
        listTop = _ref2$[0],
        listBottom = _ref2$[1],
        overscan = _ref2[4],
        topListHeight = _ref2[5],
        deviation = _ref2[6];
    var top = scrollTop - headerHeight - deviation;
    var direction = NONE;
    listTop -= deviation;
    listBottom -= deviation;

    if (listTop > scrollTop + topListHeight) {
      direction = UP;
    }

    if (listBottom < scrollTop + viewportHeight) {
      direction = DOWN;
    }

    if (direction !== NONE) {
      return [Math.max(top - getOverscan(overscan, TOP, direction), 0), top + viewportHeight + getOverscan(overscan, BOTTOM, direction)];
    }

    return null;
  }), u.filter(function (value) {
    return value != null;
  }), u.distinctUntilChanged(tupleComparator)), [0, 0]);
  return {
    // input
    listBoundary: listBoundary,
    overscan: overscan,
    topListHeight: topListHeight,
    // output
    visibleRange: visibleRange
  };
}, /*#__PURE__*/u.tup(domIOSystem), {
  singleton: true
});

function probeItemSet(index, sizes, data) {
  if (hasGroups(sizes)) {
    var itemIndex = originalIndexFromItemIndex(index, sizes);
    var groupIndex = findMaxKeyValue(sizes.groupOffsetTree, itemIndex)[0];
    return [{
      index: groupIndex,
      size: 0,
      offset: 0
    }, {
      index: itemIndex,
      size: 0,
      offset: 0,
      data: data && data[0]
    }];
  }

  return [{
    index: index,
    size: 0,
    offset: 0,
    data: data && data[0]
  }];
}

var EMPTY_LIST_STATE = {
  items: [],
  topItems: [],
  offsetTop: 0,
  offsetBottom: 0,
  top: 0,
  bottom: 0,
  topListHeight: 0
};

function transposeItems(items, sizes, firstItemIndex) {
  if (items.length === 0) {
    return [];
  }

  if (!hasGroups(sizes)) {
    return items.map(function (item) {
      return _extends({}, item, {
        index: item.index + firstItemIndex,
        originalIndex: item.index
      });
    });
  }

  var startIndex = items[0].index;
  var endIndex = items[items.length - 1].index;
  var transposedItems = [];
  var groupRanges = rangesWithin(sizes.groupOffsetTree, startIndex, endIndex);
  var currentRange = undefined;
  var currentGroupIndex = 0;

  for (var _iterator = _createForOfIteratorHelperLoose(items), _step; !(_step = _iterator()).done;) {
    var item = _step.value;

    if (!currentRange || currentRange.end < item.index) {
      currentRange = groupRanges.shift();
      currentGroupIndex = sizes.groupIndices.indexOf(currentRange.start);
    }

    var transposedItem = void 0;

    if (item.index === currentRange.start) {
      transposedItem = {
        type: 'group',
        index: currentGroupIndex
      };
    } else {
      transposedItem = {
        index: item.index - (currentGroupIndex + 1) + firstItemIndex,
        groupIndex: currentGroupIndex
      };
    }

    transposedItems.push(_extends({}, transposedItem, {
      size: item.size,
      offset: item.offset,
      originalIndex: item.index,
      data: item.data
    }));
  }

  return transposedItems;
}

function buildListState(items, topItems, totalCount, sizes, firstItemIndex) {
  var lastSize = sizes.lastSize,
      lastOffset = sizes.lastOffset,
      lastIndex = sizes.lastIndex;
  var offsetTop = 0;
  var bottom = 0;

  if (items.length > 0) {
    offsetTop = items[0].offset;
    var lastItem = items[items.length - 1];
    bottom = lastItem.offset + lastItem.size;
  }

  var total = lastOffset + (totalCount - lastIndex) * lastSize;
  var top = offsetTop;
  var offsetBottom = total - bottom;
  return {
    items: transposeItems(items, sizes, firstItemIndex),
    topItems: transposeItems(topItems, sizes, firstItemIndex),
    topListHeight: topItems.reduce(function (height, item) {
      return item.size + height;
    }, 0),
    offsetTop: offsetTop,
    offsetBottom: offsetBottom,
    top: top,
    bottom: bottom
  };
}
var listStateSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      statefulScrollTop = _ref$.statefulScrollTop,
      headerHeight = _ref$.headerHeight,
      _ref$2 = _ref[1],
      sizes = _ref$2.sizes,
      totalCount = _ref$2.totalCount,
      data = _ref$2.data,
      firstItemIndex = _ref$2.firstItemIndex,
      groupedListSystem = _ref[2],
      _ref$3 = _ref[3],
      visibleRange = _ref$3.visibleRange,
      listBoundary = _ref$3.listBoundary,
      rangeTopListHeight = _ref$3.topListHeight,
      _ref$4 = _ref[4],
      scrolledToInitialItem = _ref$4.scrolledToInitialItem,
      initialTopMostItemIndex = _ref$4.initialTopMostItemIndex,
      topListHeight = _ref[5].topListHeight,
      stateFlags = _ref[6],
      didMount = _ref[7].didMount;
  var topItemsIndexes = u.statefulStream([]);
  var itemsRendered = u.stream();
  u.connect(groupedListSystem.topItemsIndexes, topItemsIndexes);
  var listState = u.statefulStreamFromEmitter(u.pipe(u.combineLatest(didMount, u.duc(visibleRange), u.duc(totalCount), u.duc(sizes), u.duc(initialTopMostItemIndex), scrolledToInitialItem, u.duc(topItemsIndexes), u.duc(firstItemIndex), data), u.filter(function (_ref2) {
    var mount = _ref2[0];
    return mount;
  }), u.map(function (_ref3) {
    var _ref3$ = _ref3[1],
        startOffset = _ref3$[0],
        endOffset = _ref3$[1],
        totalCount = _ref3[2],
        sizes = _ref3[3],
        initialTopMostItemIndex = _ref3[4],
        scrolledToInitialItem = _ref3[5],
        topItemsIndexes = _ref3[6],
        firstItemIndex = _ref3[7],
        data = _ref3[8];
    var sizesValue = sizes;
    var sizeTree = sizesValue.sizeTree,
        offsetTree = sizesValue.offsetTree;

    if (totalCount === 0 || startOffset === 0 && endOffset === 0) {
      return EMPTY_LIST_STATE;
    }

    if (empty(sizeTree)) {
      return buildListState(probeItemSet(initialTopMostItemIndex, sizesValue, data), [], totalCount, sizesValue, firstItemIndex);
    }

    var topItems = [];

    if (topItemsIndexes.length > 0) {
      var _startIndex = topItemsIndexes[0];
      var _endIndex = topItemsIndexes[topItemsIndexes.length - 1];
      var offset = 0;

      for (var _iterator2 = _createForOfIteratorHelperLoose(rangesWithin(sizeTree, _startIndex, _endIndex)), _step2; !(_step2 = _iterator2()).done;) {
        var range = _step2.value;
        var size = range.value;
        var rangeStartIndex = Math.max(range.start, _startIndex);
        var rangeEndIndex = Math.min(range.end, _endIndex);

        for (var i = rangeStartIndex; i <= rangeEndIndex; i++) {
          topItems.push({
            index: i,
            size: size,
            offset: offset,
            data: data && data[i]
          });
          offset += size;
        }
      }
    } // If the list hasn't scrolled to the initial item because the initial item was set,
    // render empty list.
    //
    // This is a condition to be avaluated past the probe check, do not merge
    // with the totalcount check above


    if (!scrolledToInitialItem) {
      return buildListState([], topItems, totalCount, sizesValue, firstItemIndex);
    } // pull a fresh top group, avoids a bug where
    // scrolling up too fast causes stack overflow


    if (hasGroups(sizesValue)) {
      var scrollTop = Math.max(u.getValue(statefulScrollTop) - u.getValue(headerHeight), 0);
      topItemsIndexes = [findMaxKeyValue(sizesValue.groupOffsetTree, scrollTop, 'v')[0]];
    }

    var minStartIndex = topItemsIndexes.length > 0 ? topItemsIndexes[topItemsIndexes.length - 1] + 1 : 0;
    var startIndex = Math.max(minStartIndex, findMaxKeyValue(offsetTree, startOffset, 'v')[0]);
    var endIndex = findMaxKeyValue(offsetTree, endOffset, 'v')[0];
    var maxIndex = totalCount - 1;
    var items = u.tap([], function (result) {
      for (var _iterator3 = _createForOfIteratorHelperLoose(rangesWithin(offsetTree, startIndex, endIndex)), _step3; !(_step3 = _iterator3()).done;) {
        var _range = _step3.value;
        var _offset = _range.value;
        var _rangeStartIndex = _range.start;

        var _size = find(sizeTree, _rangeStartIndex);

        if (_range.value < startOffset) {
          _rangeStartIndex += Math.floor((startOffset - _range.value) / _size);
          _offset += (_rangeStartIndex - _range.start) * _size;
        }

        if (_rangeStartIndex < minStartIndex) {
          _offset += (minStartIndex - _rangeStartIndex) * _size;
          _rangeStartIndex = minStartIndex;
        }

        var _endIndex2 = Math.min(_range.end, maxIndex);

        for (var _i = _rangeStartIndex; _i <= _endIndex2; _i++) {
          if (_offset >= endOffset) {
            break;
          }

          result.push({
            index: _i,
            size: _size,
            offset: _offset,
            data: data && data[_i]
          });
          _offset += _size;
        }
      }
    });
    return buildListState(items, topItems, totalCount, sizesValue, firstItemIndex);
  }), u.distinctUntilChanged()), EMPTY_LIST_STATE);
  u.connect(u.pipe(data, u.filter(function (data) {
    return data !== undefined;
  }), u.map(function (data) {
    return data.length;
  })), totalCount);
  u.connect(u.pipe(listState, u.map(u.prop('topListHeight'))), topListHeight);
  u.connect(topListHeight, rangeTopListHeight);
  u.connect(listState, stateFlags.listStateListener);
  u.connect(u.pipe(listState, u.map(function (state) {
    return [state.top, state.bottom];
  })), listBoundary);
  u.connect(u.pipe(listState, u.map(function (state) {
    return state.items;
  })), itemsRendered);
  var endReached = u.streamFromEmitter(u.pipe(listState, u.filter(function (_ref4) {
    var items = _ref4.items;
    return items.length > 0;
  }), u.withLatestFrom(totalCount, data), u.filter(function (_ref5) {
    var items = _ref5[0].items,
        totalCount = _ref5[1];
    return items[items.length - 1].originalIndex === totalCount - 1;
  }), u.map(function (_ref6) {
    var totalCount = _ref6[1],
        data = _ref6[2];
    return [totalCount - 1, data];
  }), u.distinctUntilChanged(tupleComparator), u.map(function (_ref7) {
    var count = _ref7[0];
    return count;
  })));
  var startReached = u.streamFromEmitter(u.pipe(listState, u.throttleTime(100), u.filter(function (_ref8) {
    var items = _ref8.items,
        topItems = _ref8.topItems;
    return items.length > 0 && items[0].originalIndex === topItems.length;
  }), u.map(function (_ref9) {
    var items = _ref9.items;
    return items[0].index;
  }), u.distinctUntilChanged()));
  var rangeChanged = u.streamFromEmitter(u.pipe(listState, u.filter(function (_ref10) {
    var items = _ref10.items;
    return items.length > 0;
  }), u.map(function (_ref11) {
    var items = _ref11.items;
    return {
      startIndex: items[0].index,
      endIndex: items[items.length - 1].index
    };
  }), u.distinctUntilChanged(rangeComparator)));
  return _extends({
    listState: listState,
    topItemsIndexes: topItemsIndexes,
    endReached: endReached,
    startReached: startReached,
    rangeChanged: rangeChanged,
    itemsRendered: itemsRendered
  }, stateFlags);
}, /*#__PURE__*/u.tup(domIOSystem, sizeSystem, groupedListSystem, sizeRangeSystem, initialTopMostItemIndexSystem, scrollToIndexSystem, stateFlagsSystem, propsReadySystem), {
  singleton: true
});

var initialItemCountSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      sizes = _ref$.sizes,
      firstItemIndex = _ref$.firstItemIndex,
      listState = _ref[1].listState,
      didMount = _ref[2].didMount;
  var initialItemCount = u.statefulStream(0);
  u.connect(u.pipe(didMount, u.withLatestFrom(initialItemCount), u.filter(function (_ref2) {
    var count = _ref2[1];
    return count !== 0;
  }), u.withLatestFrom(sizes, firstItemIndex), u.map(function (_ref3) {
    var _ref3$ = _ref3[0],
        count = _ref3$[1],
        sizes = _ref3[1],
        firstItemIndex = _ref3[2];
    var includedGroupsCount = 0;

    if (sizes.groupIndices.length > 0) {
      for (var _iterator = _createForOfIteratorHelperLoose(sizes.groupIndices), _step; !(_step = _iterator()).done;) {
        var index = _step.value;

        if (index - includedGroupsCount >= count) {
          break;
        }

        includedGroupsCount++;
      }
    }

    var adjustedCount = count + includedGroupsCount;
    var items = Array.from({
      length: adjustedCount
    }).map(function (_, index) {
      return {
        index: index,
        size: 0,
        offset: 0
      };
    });
    return buildListState(items, [], adjustedCount, sizes, firstItemIndex);
  })), listState);
  return {
    initialItemCount: initialItemCount
  };
}, /*#__PURE__*/u.tup(sizeSystem, listStateSystem, propsReadySystem), {
  singleton: true
});

var scrollSeekSystem = /*#__PURE__*/u.system(function (_ref) {
  var scrollTop = _ref[0].scrollTop,
      isScrolling = _ref[1].isScrolling;
  var scrollVelocity = u.statefulStream(0);
  var isSeeking = u.statefulStream(false);
  var rangeChanged = u.stream();
  var scrollSeekConfiguration = u.statefulStream(false);
  u.connect(u.pipe(isScrolling, u.filter(function (value) {
    return !value;
  }), u.mapTo(0)), scrollVelocity);
  u.connect(u.pipe(scrollTop, u.throttleTime(100), u.scan(function (_ref2, next) {
    var prev = _ref2[1];
    return [prev, next];
  }, [0, 0]), u.map(function (_ref3) {
    var prev = _ref3[0],
        next = _ref3[1];
    return next - prev;
  })), scrollVelocity);
  u.connect(u.pipe(scrollVelocity, u.withLatestFrom(scrollSeekConfiguration, isSeeking, rangeChanged), u.filter(function (_ref4) {
    var config = _ref4[1];
    return !!config;
  }), u.map(function (_ref5) {
    var speed = _ref5[0],
        config = _ref5[1],
        isSeeking = _ref5[2],
        range = _ref5[3];
    var exit = config.exit,
        enter = config.enter;

    if (isSeeking) {
      if (exit(speed, range)) {
        return false;
      }
    } else {
      if (enter(speed, range)) {
        return true;
      }
    }

    return isSeeking;
  }), u.distinctUntilChanged()), isSeeking);
  u.subscribe(u.pipe(u.combineLatest(isSeeking, scrollVelocity, rangeChanged), u.withLatestFrom(scrollSeekConfiguration)), function (_ref6) {
    var _ref6$ = _ref6[0],
        isSeeking = _ref6$[0],
        velocity = _ref6$[1],
        range = _ref6$[2],
        config = _ref6[1];
    return isSeeking && config && config.change && config.change(velocity, range);
  });
  return {
    isSeeking: isSeeking,
    scrollSeekConfiguration: scrollSeekConfiguration,
    scrollVelocity: scrollVelocity,
    scrollSeekRangeChanged: rangeChanged
  };
}, /*#__PURE__*/u.tup(domIOSystem, stateFlagsSystem), {
  singleton: true
});

var topItemCountSystem = /*#__PURE__*/u.system(function (_ref) {
  var topItemsIndexes = _ref[0].topItemsIndexes;
  var topItemCount = u.statefulStream(0);
  u.connect(u.pipe(topItemCount, u.filter(function (length) {
    return length > 0;
  }), u.map(function (length) {
    return Array.from({
      length: length
    }).map(function (_, index) {
      return index;
    });
  })), topItemsIndexes);
  return {
    topItemCount: topItemCount
  };
}, /*#__PURE__*/u.tup(listStateSystem));

var totalListHeightSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      footerHeight = _ref$.footerHeight,
      headerHeight = _ref$.headerHeight,
      listState = _ref[1].listState;
  var totalListHeightChanged = u.stream();
  var totalListHeight = u.statefulStreamFromEmitter(u.pipe(u.combineLatest(footerHeight, headerHeight, listState), u.map(function (_ref2) {
    var footerHeight = _ref2[0],
        headerHeight = _ref2[1],
        listState = _ref2[2];
    return footerHeight + headerHeight + listState.offsetBottom + listState.bottom;
  })), 0);
  u.connect(u.duc(totalListHeight), totalListHeightChanged);
  return {
    totalListHeight: totalListHeight,
    totalListHeightChanged: totalListHeightChanged
  };
}, /*#__PURE__*/u.tup(domIOSystem, listStateSystem), {
  singleton: true
});

var _window, _window$navigator;
var UA = typeof window !== 'undefined' && ((_window = window) === null || _window === void 0 ? void 0 : (_window$navigator = _window.navigator) === null || _window$navigator === void 0 ? void 0 : _window$navigator.userAgent);
var GLITCHY_SCROLL_BY = UA && (!! /*#__PURE__*/UA.match(/iPad/i) || !! /*#__PURE__*/UA.match(/iPhone/i));
/**
 * Fixes upward scrolling by calculating and compensation from changed item heights, using scrollBy.
 */

var upwardScrollFixSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      scrollBy = _ref$.scrollBy,
      scrollTop = _ref$.scrollTop,
      scrollDirection = _ref$.scrollDirection,
      deviation = _ref$.deviation,
      isScrolling = _ref[1].isScrolling,
      listState = _ref[2].listState,
      _ref$2 = _ref[3],
      unshiftWith = _ref$2.unshiftWith,
      beforeUnshiftWith = _ref$2.beforeUnshiftWith,
      sizes = _ref$2.sizes;
  var deviationOffset = u.pipe(listState, u.withLatestFrom(scrollTop, scrollDirection), u.filter(function (_ref2) {
    var scrollTop = _ref2[1],
        scrollDirection = _ref2[2];
    return scrollTop !== 0 && scrollDirection === UP;
  }), u.map(function (_ref3) {
    var state = _ref3[0];
    return state;
  }), u.scan(function (_ref4, _ref5) {
    var prevItems = _ref4[1];
    var items = _ref5.items;
    var newDev = 0;

    if (prevItems.length > 0 && items.length > 0) {
      var atStart = prevItems[0].originalIndex === 0 && items[0].originalIndex === 0;

      if (!atStart) {
        var _loop2 = function _loop2(index) {
          var item = items[index];
          var prevItem = prevItems.find(function (pItem) {
            return pItem.originalIndex === item.originalIndex;
          });

          if (!prevItem) {
            return "continue";
          }

          if (item.offset !== prevItem.offset) {
            newDev = item.offset - prevItem.offset;
            return "break";
          }
        };

        _loop: for (var index = items.length - 1; index >= 0; index--) {
          var _ret = _loop2(index);

          switch (_ret) {
            case "continue":
              continue;

            case "break":
              break _loop;
          }
        }
      }
    }

    return [newDev, items];
  }, [0, []]), u.filter(function (_ref6) {
    var amount = _ref6[0];
    return amount !== 0;
  }), u.map(function (_ref7) {
    var amount = _ref7[0];
    return amount;
  }));

  if (GLITCHY_SCROLL_BY) {
    u.connect(u.pipe(deviationOffset, u.withLatestFrom(deviation), u.map(function (_ref8) {
      var amount = _ref8[0],
          deviation = _ref8[1];
      return deviation - amount;
    })), deviation); // when the browser stops scrolling,
    // restore the position and reset the glitching

    u.subscribe(u.pipe(isScrolling, u.filter(function (is) {
      return !is;
    }), u.withLatestFrom(deviation), u.filter(function (_ref9) {
      var deviation = _ref9[1];
      return deviation !== 0;
    }), u.map(function (_ref10) {
      var deviation = _ref10[1];
      return deviation;
    })), function (offset) {
      u.publish(scrollBy, {
        top: -offset,
        behavior: 'auto'
      });
      u.publish(deviation, 0);
    });
  } else {
    u.connect(u.pipe(deviationOffset, u.map(function (offset) {
      return {
        top: offset,
        behavior: 'auto'
      };
    })), scrollBy);
  }

  var unshiftPayload = u.stream();
  u.connect(u.pipe(beforeUnshiftWith, u.map(function (indexOffset) {
    var currentTopIndex = u.getValue(listState).items[0].originalIndex;
    return {
      index: currentTopIndex + indexOffset,
      offset: offsetOf(currentTopIndex, u.getValue(sizes))
    };
  })), unshiftPayload);
  u.connect(u.pipe(unshiftWith, u.withLatestFrom(unshiftPayload), u.map(function (_ref11) {
    var _ref11$ = _ref11[1],
        index = _ref11$.index,
        offset = _ref11$.offset;
    var newOffset = offsetOf(index, u.getValue(sizes));
    return {
      top: newOffset - offset
    };
  })), scrollBy);
  return {
    deviation: deviation
  };
}, /*#__PURE__*/u.tup(domIOSystem, stateFlagsSystem, listStateSystem, sizeSystem));

var initialScrollTopSystem = /*#__PURE__*/u.system(function (_ref) {
  var totalListHeight = _ref[0].totalListHeight,
      didMount = _ref[1].didMount,
      scrollTo = _ref[2].scrollTo;
  var initialScrollTop = u.statefulStream(0);
  u.subscribe(u.pipe(didMount, u.withLatestFrom(initialScrollTop), u.filter(function (_ref2) {
    var offset = _ref2[1];
    return offset !== 0;
  }), u.map(function (_ref3) {
    var offset = _ref3[1];
    return {
      top: offset
    };
  })), function (location) {
    u.handleNext(u.pipe(totalListHeight, u.filter(function (val) {
      return val !== 0;
    })), function () {
      setTimeout(function () {
        u.publish(scrollTo, location);
      });
    });
  });
  return {
    initialScrollTop: initialScrollTop
  };
}, /*#__PURE__*/u.tup(totalListHeightSystem, propsReadySystem, domIOSystem), {
  singleton: true
});

var alignToBottomSystem = /*#__PURE__*/u.system(function (_ref) {
  var viewportHeight = _ref[0].viewportHeight,
      totalListHeight = _ref[1].totalListHeight;
  var alignToBottom = u.statefulStream(false);
  var paddingTopAddition = u.statefulStreamFromEmitter(u.pipe(u.combineLatest(alignToBottom, viewportHeight, totalListHeight), u.filter(function (_ref2) {
    var enabled = _ref2[0];
    return enabled;
  }), u.map(function (_ref3) {
    var viewportHeight = _ref3[1],
        totalListHeight = _ref3[2];
    return Math.max(0, viewportHeight - totalListHeight);
  }), u.distinctUntilChanged()), 0);
  return {
    alignToBottom: alignToBottom,
    paddingTopAddition: paddingTopAddition
  };
}, /*#__PURE__*/u.tup(domIOSystem, totalListHeightSystem), {
  singleton: true
});

// fix this with 4.1 recursive conditional types

var featureGroup1System = /*#__PURE__*/u.system(function (_ref) {
  var sizeRange = _ref[0],
      initialItemCount = _ref[1],
      propsReady = _ref[2],
      scrollSeek = _ref[3],
      totalListHeight = _ref[4],
      initialScrollTopSystem = _ref[5],
      alignToBottom = _ref[6];
  return _extends({}, sizeRange, initialItemCount, propsReady, scrollSeek, totalListHeight, initialScrollTopSystem, alignToBottom);
}, /*#__PURE__*/u.tup(sizeRangeSystem, initialItemCountSystem, propsReadySystem, scrollSeekSystem, totalListHeightSystem, initialScrollTopSystem, alignToBottomSystem));
var listSystem = /*#__PURE__*/u.system(function (_ref2) {
  var _ref2$ = _ref2[0],
      totalCount = _ref2$.totalCount,
      sizeRanges = _ref2$.sizeRanges,
      fixedItemSize = _ref2$.fixedItemSize,
      defaultItemSize = _ref2$.defaultItemSize,
      trackItemSizes = _ref2$.trackItemSizes,
      data = _ref2$.data,
      firstItemIndex = _ref2$.firstItemIndex,
      groupIndices = _ref2$.groupIndices,
      initialTopMostItemIndex = _ref2[1].initialTopMostItemIndex,
      domIO = _ref2[2],
      followOutput = _ref2[3],
      _ref2$2 = _ref2[4],
      listState = _ref2$2.listState,
      topItemsIndexes = _ref2$2.topItemsIndexes,
      flags = _objectWithoutPropertiesLoose(_ref2$2, ["listState", "topItemsIndexes"]),
      scrollToIndex = _ref2[5].scrollToIndex,
      topItemCount = _ref2[7].topItemCount,
      groupCounts = _ref2[8].groupCounts,
      featureGroup1 = _ref2[9];

  u.connect(flags.rangeChanged, featureGroup1.scrollSeekRangeChanged);
  return _extends({
    // input
    totalCount: totalCount,
    data: data,
    firstItemIndex: firstItemIndex,
    sizeRanges: sizeRanges,
    initialTopMostItemIndex: initialTopMostItemIndex,
    topItemsIndexes: topItemsIndexes,
    topItemCount: topItemCount,
    groupCounts: groupCounts,
    fixedItemHeight: fixedItemSize,
    defaultItemHeight: defaultItemSize,
    followOutput: followOutput.followOutput,
    // output
    listState: listState,
    scrollToIndex: scrollToIndex,
    trackItemSizes: trackItemSizes,
    groupIndices: groupIndices
  }, flags, featureGroup1, domIO);
}, /*#__PURE__*/u.tup(sizeSystem, initialTopMostItemIndexSystem, domIOSystem, followOutputSystem, listStateSystem, scrollToIndexSystem, upwardScrollFixSystem, topItemCountSystem, groupedListSystem, featureGroup1System));

function simpleMemoize(func) {
  var called = false;
  var result;
  return function () {
    if (!called) {
      called = true;
      result = func();
    }

    return result;
  };
}

var WEBKIT_STICKY = '-webkit-sticky';
var STICKY = 'sticky';
var positionStickyCssValue = /*#__PURE__*/simpleMemoize(function () {
  if (typeof document === 'undefined') {
    return STICKY;
  }

  var node = document.createElement('div');
  node.style.position = WEBKIT_STICKY;
  return node.style.position === WEBKIT_STICKY ? WEBKIT_STICKY : STICKY;
});

function identity(value) {
  return value;
}
var listComponentPropsSystem = /*#__PURE__*/u.system(function () {
  var itemContent = u.statefulStream(function (index) {
    return "Item " + index;
  });
  var groupContent = u.statefulStream(function (index) {
    return "Group " + index;
  });
  var components = u.statefulStream({});
  var computeItemKey = u.statefulStream(identity);
  var headerFooterTag = u.statefulStream('div');

  var distinctProp = function distinctProp(propName, defaultValue) {
    if (defaultValue === void 0) {
      defaultValue = null;
    }

    return u.statefulStreamFromEmitter(u.pipe(components, u.map(function (components) {
      return components[propName];
    }), u.distinctUntilChanged()), defaultValue);
  };

  return {
    itemContent: itemContent,
    groupContent: groupContent,
    components: components,
    computeItemKey: computeItemKey,
    headerFooterTag: headerFooterTag,
    FooterComponent: distinctProp('Footer'),
    HeaderComponent: distinctProp('Header'),
    ListComponent: distinctProp('List', 'div'),
    ItemComponent: distinctProp('Item', 'div'),
    GroupComponent: distinctProp('Group', 'div'),
    ScrollerComponent: distinctProp('Scroller', 'div'),
    EmptyPlaceholder: distinctProp('EmptyPlaceholder'),
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder')
  };
});
function addDeprecatedAlias(prop, message) {
  var alias = u.stream();
  u.subscribe(alias, function () {
    return console.warn("react-virtuoso: You are using a deprecated property. " + message, 'color: red;', 'color: inherit;', 'color: blue;');
  });
  u.connect(alias, prop);
  return alias;
}
var combinedSystem = /*#__PURE__*/u.system(function (_ref) {
  var listSystem = _ref[0],
      propsSystem = _ref[1];
  var deprecatedProps = {
    item: addDeprecatedAlias(propsSystem.itemContent, 'Rename the %citem%c prop to %citemContent.'),
    group: addDeprecatedAlias(propsSystem.groupContent, 'Rename the %cgroup%c prop to %cgroupContent.'),
    topItems: addDeprecatedAlias(listSystem.topItemCount, 'Rename the %ctopItems%c prop to %ctopItemCount.'),
    itemHeight: addDeprecatedAlias(listSystem.fixedItemHeight, 'Rename the %citemHeight%c prop to %cfixedItemHeight.'),
    scrollingStateChange: addDeprecatedAlias(listSystem.isScrolling, 'Rename the %cscrollingStateChange%c prop to %cisScrolling.'),
    adjustForPrependedItems: u.stream(),
    maxHeightCacheSize: u.stream(),
    footer: u.stream(),
    header: u.stream(),
    HeaderContainer: u.stream(),
    FooterContainer: u.stream(),
    ItemContainer: u.stream(),
    ScrollContainer: u.stream(),
    GroupContainer: u.stream(),
    ListContainer: u.stream(),
    emptyComponent: u.stream(),
    scrollSeek: u.stream()
  };
  u.subscribe(deprecatedProps.adjustForPrependedItems, function () {
    console.warn("react-virtuoso: adjustForPrependedItems is no longer supported. Use the firstItemIndex property instead - https://virtuoso.dev/prepend-items.", 'color: red;', 'color: inherit;', 'color: blue;');
  });
  u.subscribe(deprecatedProps.maxHeightCacheSize, function () {
    console.warn("react-virtuoso: maxHeightCacheSize is no longer necessary. Setting it has no effect - remove it from your code.");
  });
  u.subscribe(deprecatedProps.HeaderContainer, function () {
    console.warn("react-virtuoso: HeaderContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the header component and pass components.Header to change its contents.");
  });
  u.subscribe(deprecatedProps.FooterContainer, function () {
    console.warn("react-virtuoso: FooterContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the footer component and pass components.Footer to change its contents.");
  });

  function deprecateComponentProp(stream, componentName, propName) {
    u.connect(u.pipe(stream, u.withLatestFrom(propsSystem.components), u.map(function (_ref2) {
      var _extends2;

      var comp = _ref2[0],
          components = _ref2[1];
      console.warn("react-virtuoso: " + propName + " property is deprecated. Pass components." + componentName + " instead.");
      return _extends({}, components, (_extends2 = {}, _extends2[componentName] = comp, _extends2));
    })), propsSystem.components);
  }

  u.subscribe(deprecatedProps.scrollSeek, function (_ref3) {
    var placeholder = _ref3.placeholder,
        config = _objectWithoutPropertiesLoose(_ref3, ["placeholder"]);

    console.warn("react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead.");
    u.publish(propsSystem.components, _extends({}, u.getValue(propsSystem.components), {
      ScrollSeekPlaceholder: placeholder
    }));
    u.publish(listSystem.scrollSeekConfiguration, config);
  });
  deprecateComponentProp(deprecatedProps.footer, 'Footer', 'footer');
  deprecateComponentProp(deprecatedProps.header, 'Header', 'header');
  deprecateComponentProp(deprecatedProps.ItemContainer, 'Item', 'ItemContainer');
  deprecateComponentProp(deprecatedProps.ListContainer, 'List', 'ListContainer');
  deprecateComponentProp(deprecatedProps.ScrollContainer, 'Scroller', 'ScrollContainer');
  deprecateComponentProp(deprecatedProps.emptyComponent, 'EmptyPlaceholder', 'emptyComponent');
  deprecateComponentProp(deprecatedProps.GroupContainer, 'Group', 'GroupContainer');
  return _extends({}, listSystem, propsSystem, deprecatedProps);
}, /*#__PURE__*/u.tup(listSystem, listComponentPropsSystem));

var DefaultScrollSeekPlaceholder = function DefaultScrollSeekPlaceholder(_ref4) {
  var height = _ref4.height;
  return React.createElement("div", {
    style: {
      height: height
    }
  });
};

var GROUP_STYLE = {
  position: /*#__PURE__*/positionStickyCssValue(),
  zIndex: 1
};
var Items = /*#__PURE__*/React.memo(function VirtuosoItems(_ref5) {
  var _ref5$showTopList = _ref5.showTopList,
      showTopList = _ref5$showTopList === void 0 ? false : _ref5$showTopList;
  var listState = useEmitterValue('listState');
  var deviation = useEmitterValue('deviation');
  var sizeRanges = usePublisher('sizeRanges');
  var itemContent = useEmitterValue('itemContent');
  var groupContent = useEmitterValue('groupContent');
  var trackItemSizes = useEmitterValue('trackItemSizes');
  var ref = useChangedChildSizes(sizeRanges, trackItemSizes);
  var EmptyPlaceholder = useEmitterValue('EmptyPlaceholder');
  var ScrollSeekPlaceholder = useEmitterValue('ScrollSeekPlaceholder') || DefaultScrollSeekPlaceholder;
  var ListComponent = useEmitterValue('ListComponent');
  var ItemComponent = useEmitterValue('ItemComponent');
  var GroupComponent = useEmitterValue('GroupComponent');
  var computeItemKey = useEmitterValue('computeItemKey');
  var isSeeking = useEmitterValue('isSeeking');
  var hasGroups = useEmitterValue('groupIndices').length > 0;
  var paddingTopAddition = useEmitterValue('paddingTopAddition');
  var containerStyle = showTopList ? {} : {
    paddingTop: listState.offsetTop + paddingTopAddition,
    paddingBottom: listState.offsetBottom,
    marginTop: deviation
  };

  if (!showTopList && listState.items.length === 0 && EmptyPlaceholder) {
    return React.createElement(EmptyPlaceholder);
  }

  return React.createElement(ListComponent, {
    ref: ref,
    style: containerStyle
  }, (showTopList ? listState.topItems : listState.items).map(function (item) {
    var index = item.originalIndex;
    var key = computeItemKey(index);

    if (isSeeking) {
      return React.createElement(ScrollSeekPlaceholder, {
        key: key,
        index: item.index,
        height: item.size
      });
    }

    if (item.type === 'group') {
      return React.createElement(GroupComponent, {
        key: key,
        'data-index': index,
        'data-known-size': item.size,
        'data-item-index': item.index,
        style: GROUP_STYLE
      }, groupContent(item.index));
    } else {
      return React.createElement(ItemComponent, {
        key: key,
        'data-index': index,
        'data-known-size': item.size,
        'data-item-index': item.index,
        'data-item-group-index': item.groupIndex
      }, itemContent.apply(null, hasGroups ? [item.index, item.groupIndex, item.data] : [item.index, item.data]));
    }
  }));
});
var scrollerStyle = {
  height: '100%',
  outline: 'none',
  overflowY: 'auto',
  position: 'relative',
  WebkitOverflowScrolling: 'touch'
};
var viewportStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0
};
var topItemListStyle = {
  width: '100%',
  position: /*#__PURE__*/positionStickyCssValue(),
  top: 0
};
var Header = /*#__PURE__*/React.memo(function VirtuosoHeader() {
  var Header = useEmitterValue('HeaderComponent');
  var headerHeight = usePublisher('headerHeight');
  var headerFooterTag = useEmitterValue('headerFooterTag');
  var ref = useSize(function (el) {
    return headerHeight(el.offsetHeight);
  });
  return Header ? React.createElement(headerFooterTag, {
    ref: ref
  }, React.createElement(Header)) : null;
});
var Footer = /*#__PURE__*/React.memo(function VirtuosoFooter() {
  var Footer = useEmitterValue('FooterComponent');
  var footerHeight = usePublisher('footerHeight');
  var headerFooterTag = useEmitterValue('headerFooterTag');
  var ref = useSize(function (el) {
    return footerHeight(el.offsetHeight);
  });
  return Footer ? React.createElement(headerFooterTag, {
    ref: ref
  }, React.createElement(Footer)) : null;
});
function buildScroller(_ref6) {
  var usePublisher = _ref6.usePublisher,
      useEmitter = _ref6.useEmitter,
      useEmitterValue = _ref6.useEmitterValue;
  var Scroller = React.memo(function VirtuosoScroller(_ref7) {
    var style = _ref7.style,
        children = _ref7.children,
        props = _objectWithoutPropertiesLoose(_ref7, ["style", "children"]);

    var scrollTopCallback = usePublisher('scrollTop');
    var ScrollerComponent = useEmitterValue('ScrollerComponent');
    var smoothScrollTargetReached = usePublisher('smoothScrollTargetReached');

    var _useScrollTop = useScrollTop(scrollTopCallback, smoothScrollTargetReached, ScrollerComponent),
        scrollerRef = _useScrollTop.scrollerRef,
        scrollByCallback = _useScrollTop.scrollByCallback,
        scrollToCallback = _useScrollTop.scrollToCallback;

    useEmitter('scrollTo', scrollToCallback);
    useEmitter('scrollBy', scrollByCallback);
    return React.createElement(ScrollerComponent, _extends({
      ref: scrollerRef,
      style: _extends({}, scrollerStyle, style),
      tabIndex: 0
    }, props), children);
  });
  return Scroller;
}
var ListRoot = /*#__PURE__*/React.memo(function VirtuosoRoot(_ref8) {
  var props = _extends({}, _ref8);

  var viewportHeight = usePublisher('viewportHeight');
  var viewportRef = useSize(u.compose(viewportHeight, u.prop('offsetHeight')));
  var headerHeight = useEmitterValue('headerHeight');
  return React.createElement(Scroller, Object.assign({}, props), React.createElement("div", {
    style: viewportStyle,
    ref: viewportRef
  }, React.createElement(Header, null), React.createElement(Items, null), React.createElement(Footer, null)), React.createElement("div", {
    style: _extends({}, topItemListStyle, {
      marginTop: headerHeight + "px"
    })
  }, React.createElement(Items, {
    showTopList: true
  })));
});

var _systemToComponent = /*#__PURE__*/reactUrx.systemToComponent(combinedSystem, {
  required: {},
  optional: {
    firstItemIndex: 'firstItemIndex',
    itemContent: 'itemContent',
    groupContent: 'groupContent',
    overscan: 'overscan',
    totalCount: 'totalCount',
    topItemCount: 'topItemCount',
    initialTopMostItemIndex: 'initialTopMostItemIndex',
    components: 'components',
    groupCounts: 'groupCounts',
    computeItemKey: 'computeItemKey',
    defaultItemHeight: 'defaultItemHeight',
    fixedItemHeight: 'fixedItemHeight',
    scrollSeekConfiguration: 'scrollSeekConfiguration',
    followOutput: 'followOutput',
    headerFooterTag: 'headerFooterTag',
    data: 'data',
    initialItemCount: 'initialItemCount',
    initialScrollTop: 'initialScrollTop',
    alignToBottom: 'alignToBottom',
    // deprecated
    item: 'item',
    group: 'group',
    topItems: 'topItems',
    itemHeight: 'itemHeight',
    scrollingStateChange: 'scrollingStateChange',
    maxHeightCacheSize: 'maxHeightCacheSize',
    footer: 'footer',
    header: 'header',
    ItemContainer: 'ItemContainer',
    ScrollContainer: 'ScrollContainer',
    ListContainer: 'ListContainer',
    GroupContainer: 'GroupContainer',
    emptyComponent: 'emptyComponent',
    HeaderContainer: 'HeaderContainer',
    FooterContainer: 'FooterContainer',
    scrollSeek: 'scrollSeek'
  },
  methods: {
    scrollToIndex: 'scrollToIndex',
    scrollTo: 'scrollTo',
    scrollBy: 'scrollBy',
    adjustForPrependedItems: 'adjustForPrependedItems'
  },
  events: {
    isScrolling: 'isScrolling',
    endReached: 'endReached',
    startReached: 'startReached',
    rangeChanged: 'rangeChanged',
    atBottomStateChange: 'atBottomStateChange',
    atTopStateChange: 'atTopStateChange',
    totalListHeightChanged: 'totalListHeightChanged',
    itemsRendered: 'itemsRendered',
    groupIndices: 'groupIndices'
  }
}, ListRoot),
    List = _systemToComponent.Component,
    usePublisher = _systemToComponent.usePublisher,
    useEmitterValue = _systemToComponent.useEmitterValue,
    useEmitter = _systemToComponent.useEmitter;
var Scroller = /*#__PURE__*/buildScroller({
  usePublisher: usePublisher,
  useEmitterValue: useEmitterValue,
  useEmitter: useEmitter
});

var INITIAL_GRID_STATE = {
  items: [],
  offsetBottom: 0,
  offsetTop: 0,
  top: 0,
  bottom: 0,
  itemHeight: 0,
  itemWidth: 0
};
var PROBE_GRID_STATE = {
  items: [{
    index: 0
  }],
  offsetBottom: 0,
  offsetTop: 0,
  top: 0,
  bottom: 0,
  itemHeight: 0,
  itemWidth: 0
};
var ceil = Math.ceil,
    floor = Math.floor,
    min = Math.min,
    max = Math.max;

function hackFloor(val) {
  return ceil(val) - val < 0.03 ? ceil(val) : floor(val);
}

function buildItems(startIndex, endIndex) {
  return Array.from({
    length: endIndex - startIndex + 1
  }).map(function (_, i) {
    return {
      index: i + startIndex
    };
  });
}

var gridSystem = /*#__PURE__*/u.system(function (_ref) {
  var _ref$ = _ref[0],
      overscan = _ref$.overscan,
      visibleRange = _ref$.visibleRange,
      listBoundary = _ref$.listBoundary,
      _ref$2 = _ref[1],
      scrollTop = _ref$2.scrollTop,
      viewportHeight = _ref$2.viewportHeight,
      scrollBy = _ref$2.scrollBy,
      scrollTo = _ref$2.scrollTo,
      stateFlags = _ref[2],
      scrollSeek = _ref[3],
      _ref$3 = _ref[4],
      propsReady = _ref$3.propsReady,
      didMount = _ref$3.didMount;
  var totalCount = u.statefulStream(0);
  var initialItemCount = u.statefulStream(0);
  var gridState = u.statefulStream(INITIAL_GRID_STATE);
  var viewportDimensions = u.statefulStream({
    height: 0,
    width: 0
  });
  var itemDimensions = u.statefulStream({
    height: 0,
    width: 0
  });
  var scrollToIndex = u.stream();
  u.connect(u.pipe(didMount, u.withLatestFrom(initialItemCount), u.filter(function (_ref2) {
    var count = _ref2[1];
    return count !== 0;
  }), u.map(function (_ref3) {
    var count = _ref3[1];
    return {
      items: buildItems(0, count - 1),
      top: 0,
      bottom: 0,
      offsetBottom: 0,
      offsetTop: 0,
      itemHeight: 0,
      itemWidth: 0
    };
  })), gridState);
  u.connect(u.pipe(u.combineLatest(u.duc(totalCount), visibleRange, u.duc(itemDimensions, function (prev, next) {
    return prev && prev.width === next.width && prev.height === next.height;
  })), u.withLatestFrom(viewportDimensions), u.map(function (_ref4) {
    var _ref4$ = _ref4[0],
        totalCount = _ref4$[0],
        _ref4$$ = _ref4$[1],
        startOffset = _ref4$$[0],
        endOffset = _ref4$$[1],
        item = _ref4$[2],
        viewport = _ref4[1];
    var itemHeight = item.height,
        itemWidth = item.width;
    var viewportWidth = viewport.width;

    if (totalCount === 0) {
      return INITIAL_GRID_STATE;
    }

    if (itemWidth === 0) {
      return PROBE_GRID_STATE;
    }

    var perRow = hackFloor(viewportWidth / itemWidth);
    var startIndex = perRow * floor(startOffset / itemHeight);
    var endIndex = perRow * ceil(endOffset / itemHeight) - 1;
    endIndex = min(totalCount - 1, endIndex);
    startIndex = min(endIndex, max(0, startIndex));
    var items = buildItems(startIndex, endIndex);

    var _gridLayout = gridLayout(viewport, item, items),
        top = _gridLayout.top,
        bottom = _gridLayout.bottom;

    var totalHeight = ceil(totalCount / perRow) * itemHeight;
    var offsetBottom = totalHeight - bottom;
    return {
      items: items,
      offsetTop: top,
      offsetBottom: offsetBottom,
      top: top,
      bottom: bottom,
      itemHeight: itemHeight,
      itemWidth: itemWidth
    };
  })), gridState);
  u.connect(u.pipe(viewportDimensions, u.map(function (_ref5) {
    var height = _ref5.height;
    return height;
  })), viewportHeight);
  u.connect(u.pipe(u.combineLatest(viewportDimensions, itemDimensions, gridState), u.map(function (_ref6) {
    var viewport = _ref6[0],
        item = _ref6[1],
        items = _ref6[2].items;

    var _gridLayout2 = gridLayout(viewport, item, items),
        top = _gridLayout2.top,
        bottom = _gridLayout2.bottom;

    return [top, bottom];
  }), u.distinctUntilChanged(tupleComparator)), listBoundary);
  u.connect(u.pipe(listBoundary, u.withLatestFrom(gridState), u.map(function (_ref7) {
    var _ref7$ = _ref7[0],
        bottom = _ref7$[1],
        offsetBottom = _ref7[1].offsetBottom;
    return {
      bottom: bottom,
      offsetBottom: offsetBottom
    };
  })), stateFlags.listStateListener);
  var endReached = u.streamFromEmitter(u.pipe(u.duc(gridState), u.filter(function (_ref8) {
    var items = _ref8.items;
    return items.length > 0;
  }), u.withLatestFrom(totalCount), u.filter(function (_ref9) {
    var items = _ref9[0].items,
        totalCount = _ref9[1];
    return items[items.length - 1].index === totalCount - 1;
  }), u.map(function (_ref10) {
    var totalCount = _ref10[1];
    return totalCount - 1;
  }), u.distinctUntilChanged()));
  var startReached = u.streamFromEmitter(u.pipe(u.duc(gridState), u.filter(function (_ref11) {
    var items = _ref11.items;
    return items.length > 0 && items[0].index === 0;
  }), u.mapTo(0), u.distinctUntilChanged()));
  var rangeChanged = u.streamFromEmitter(u.pipe(u.duc(gridState), u.filter(function (_ref12) {
    var items = _ref12.items;
    return items.length > 0;
  }), u.map(function (_ref13) {
    var items = _ref13.items;
    return {
      startIndex: items[0].index,
      endIndex: items[items.length - 1].index
    };
  }), u.distinctUntilChanged(rangeComparator)));
  u.connect(rangeChanged, scrollSeek.scrollSeekRangeChanged);
  u.connect(u.pipe(scrollToIndex, u.withLatestFrom(viewportDimensions, itemDimensions, totalCount), u.map(function (_ref14) {
    var location = _ref14[0],
        viewport = _ref14[1],
        item = _ref14[2],
        totalCount = _ref14[3];

    var _normalizeIndexLocati = normalizeIndexLocation(location),
        index = _normalizeIndexLocati.index,
        align = _normalizeIndexLocati.align,
        behavior = _normalizeIndexLocati.behavior;

    index = Math.max(0, index, Math.min(totalCount - 1, index));
    var top = itemTop(viewport, item, index);

    if (align === 'end') {
      top = Math.round(top - viewport.height + item.height);
    } else if (align === 'center') {
      top = Math.round(top - viewport.height / 2 + item.height / 2);
    }

    return {
      top: top,
      behavior: behavior
    };
  })), scrollTo);
  return _extends({
    // input
    totalCount: totalCount,
    viewportDimensions: viewportDimensions,
    itemDimensions: itemDimensions,
    scrollTop: scrollTop,
    overscan: overscan,
    scrollBy: scrollBy,
    scrollTo: scrollTo,
    scrollToIndex: scrollToIndex,
    initialItemCount: initialItemCount
  }, scrollSeek, {
    // output
    gridState: gridState
  }, stateFlags, {
    startReached: startReached,
    endReached: endReached,
    rangeChanged: rangeChanged,
    propsReady: propsReady
  });
}, /*#__PURE__*/u.tup(sizeRangeSystem, domIOSystem, stateFlagsSystem, scrollSeekSystem, propsReadySystem));

function gridLayout(viewport, item, items) {
  var itemHeight = item.height;

  if (itemHeight === undefined || items.length === 0) {
    return {
      top: 0,
      bottom: 0
    };
  }

  var top = itemTop(viewport, item, items[0].index);
  var bottom = itemTop(viewport, item, items[items.length - 1].index) + itemHeight;
  return {
    top: top,
    bottom: bottom
  };
}

function itemTop(viewport, item, index) {
  var perRow = itemsPerRow(viewport.width, item.width);
  return floor(index / perRow) * item.height;
}

function itemsPerRow(viewportWidth, itemWidth) {
  return hackFloor(viewportWidth / itemWidth);
}

var gridComponentPropsSystem = /*#__PURE__*/u.system(function () {
  var itemContent = u.statefulStream(function (index) {
    return "Item " + index;
  });
  var components = u.statefulStream({});
  var itemClassName = u.statefulStream('virtuoso-grid-item');
  var listClassName = u.statefulStream('virtuoso-grid-list');
  var computeItemKey = u.statefulStream(identity);

  var distinctProp = function distinctProp(propName, defaultValue) {
    if (defaultValue === void 0) {
      defaultValue = null;
    }

    return u.statefulStreamFromEmitter(u.pipe(components, u.map(function (components) {
      return components[propName];
    }), u.distinctUntilChanged()), defaultValue);
  };

  return {
    itemContent: itemContent,
    components: components,
    computeItemKey: computeItemKey,
    itemClassName: itemClassName,
    listClassName: listClassName,
    ListComponent: distinctProp('List', 'div'),
    ItemComponent: distinctProp('Item', 'div'),
    ScrollerComponent: distinctProp('Scroller', 'div'),
    ScrollSeekPlaceholder: distinctProp('ScrollSeekPlaceholder', 'div')
  };
});
var combinedSystem$1 = /*#__PURE__*/u.system(function (_ref) {
  var gridSystem = _ref[0],
      gridComponentPropsSystem = _ref[1];
  var deprecatedProps = {
    item: addDeprecatedAlias(gridComponentPropsSystem.itemContent, 'Rename the %citem%c prop to %citemContent.'),
    ItemContainer: u.stream(),
    ScrollContainer: u.stream(),
    ListContainer: u.stream(),
    emptyComponent: u.stream(),
    scrollSeek: u.stream()
  };

  function deprecateComponentProp(stream, componentName, propName) {
    u.connect(u.pipe(stream, u.withLatestFrom(gridComponentPropsSystem.components), u.map(function (_ref2) {
      var _extends2;

      var comp = _ref2[0],
          components = _ref2[1];
      console.warn("react-virtuoso: " + propName + " property is deprecated. Pass components." + componentName + " instead.");
      return _extends({}, components, (_extends2 = {}, _extends2[componentName] = comp, _extends2));
    })), gridComponentPropsSystem.components);
  }

  u.subscribe(deprecatedProps.scrollSeek, function (_ref3) {
    var placeholder = _ref3.placeholder,
        config = _objectWithoutPropertiesLoose(_ref3, ["placeholder"]);

    console.warn("react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead.");
    u.publish(gridComponentPropsSystem.components, _extends({}, u.getValue(gridComponentPropsSystem.components), {
      ScrollSeekPlaceholder: placeholder
    }));
    u.publish(gridSystem.scrollSeekConfiguration, config);
  });
  deprecateComponentProp(deprecatedProps.ItemContainer, 'Item', 'ItemContainer');
  deprecateComponentProp(deprecatedProps.ListContainer, 'List', 'ListContainer');
  deprecateComponentProp(deprecatedProps.ScrollContainer, 'Scroller', 'ScrollContainer');
  return _extends({}, gridSystem, gridComponentPropsSystem, deprecatedProps);
}, /*#__PURE__*/u.tup(gridSystem, gridComponentPropsSystem));
var GridItems = /*#__PURE__*/React.memo(function GridItems() {
  var gridState = useEmitterValue$1('gridState');
  var listClassName = useEmitterValue$1('listClassName');
  var itemClassName = useEmitterValue$1('itemClassName');
  var itemContent = useEmitterValue$1('itemContent');
  var computeItemKey = useEmitterValue$1('computeItemKey');
  var isSeeking = useEmitterValue$1('isSeeking');
  var ItemComponent = useEmitterValue$1('ItemComponent');
  var ListComponent = useEmitterValue$1('ListComponent');
  var ScrollSeekPlaceholder = useEmitterValue$1('ScrollSeekPlaceholder');
  var itemDimensions = usePublisher$1('itemDimensions');
  var listRef = useSize(function (el) {
    var firstItem = el.firstChild;

    if (firstItem) {
      itemDimensions({
        width: firstItem.offsetWidth,
        height: firstItem.offsetHeight
      });
    }
  });
  return React.createElement(ListComponent, {
    ref: listRef,
    className: listClassName,
    style: {
      paddingTop: gridState.offsetTop,
      paddingBottom: gridState.offsetBottom
    }
  }, gridState.items.map(function (item) {
    var key = computeItemKey(item.index);
    return isSeeking ? React.createElement(ScrollSeekPlaceholder, {
      key: key,
      style: {
        height: gridState.itemHeight,
        width: gridState.itemWidth
      }
    }) : React.createElement(ItemComponent, {
      className: itemClassName,
      'data-index': item.index,
      key: key
    }, itemContent(item.index));
  }));
});
var GridRoot = /*#__PURE__*/React.memo(function GridRoot(_ref4) {
  var props = _extends({}, _ref4);

  var viewportDimensions = usePublisher$1('viewportDimensions');
  var viewportRef = useSize(function (el) {
    viewportDimensions({
      width: el.offsetWidth,
      height: el.offsetHeight
    });
  });
  return React.createElement(Scroller$1, Object.assign({}, props), React.createElement("div", {
    style: viewportStyle,
    ref: viewportRef
  }, React.createElement(GridItems, null)));
});

var _systemToComponent$1 = /*#__PURE__*/reactUrx.systemToComponent(combinedSystem$1, {
  optional: {
    totalCount: 'totalCount',
    overscan: 'overscan',
    itemContent: 'itemContent',
    components: 'components',
    computeItemKey: 'computeItemKey',
    initialItemCount: 'initialItemCount',
    scrollSeekConfiguration: 'scrollSeekConfiguration',
    // deprecated
    item: 'item',
    ItemContainer: 'ItemContainer',
    ScrollContainer: 'ScrollContainer',
    ListContainer: 'ListContainer',
    scrollSeek: 'scrollSeek'
  },
  methods: {
    scrollTo: 'scrollTo',
    scrollBy: 'scrollBy',
    scrollToIndex: 'scrollToIndex'
  },
  events: {
    isScrolling: 'isScrolling',
    endReached: 'endReached',
    startReached: 'startReached',
    rangeChanged: 'rangeChanged',
    atBottomStateChange: 'atBottomStateChange',
    atTopStateChange: 'atTopStateChange'
  }
}, GridRoot),
    Grid = _systemToComponent$1.Component,
    usePublisher$1 = _systemToComponent$1.usePublisher,
    useEmitterValue$1 = _systemToComponent$1.useEmitterValue,
    useEmitter$1 = _systemToComponent$1.useEmitter;
var Scroller$1 = /*#__PURE__*/buildScroller({
  usePublisher: usePublisher$1,
  useEmitterValue: useEmitterValue$1,
  useEmitter: useEmitter$1
});

var Virtuoso = List;
var GroupedVirtuoso = List;
var VirtuosoGrid = Grid;

exports.GroupedVirtuoso = GroupedVirtuoso;
exports.Virtuoso = Virtuoso;
exports.VirtuosoGrid = VirtuosoGrid;
//# sourceMappingURL=react-virtuoso.cjs.development.js.map
