var $56JBj$reactstatelycollections = require("@react-stately/collections");
var $56JBj$react = require("react");
var $56JBj$swchelperslib_define_propertyjs = require("@swc/helpers/lib/_define_property.js");
var $56JBj$reactstatelygrid = require("@react-stately/grid");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useTableColumnResizeState", () => $7aa22d80cd4ca621$export$cb895dcf85db1319);
$parcel$export(module.exports, "useTableState", () => $e3f7784147dde23d$export$907bcc6c48325fd6);
$parcel$export(module.exports, "TableHeader", () => $f45775f5d6f744fa$export$f850895b287ef28e);
$parcel$export(module.exports, "TableBody", () => $6ec527db6a3a5692$export$76ccd210b9029917);
$parcel$export(module.exports, "Column", () => $714483d9f6ca4c55$export$816b5d811295e6bc);
$parcel$export(module.exports, "Row", () => $9ec6912e32cc0d81$export$b59bdbef9ce70de2);
$parcel$export(module.exports, "Cell", () => $ad4ab0a21c733e1f$export$f6f0c3fe4ec306ea);
$parcel$export(module.exports, "Section", () => $56JBj$reactstatelycollections.Section);
$parcel$export(module.exports, "TableCollection", () => $7f5a58334d8866a5$export$596e1b2e2cf93690);
$parcel$export(module.exports, "buildHeaderRows", () => $7f5a58334d8866a5$export$7c127db850d4e81e);
$parcel$export(module.exports, "TableColumnLayout", () => $2240a72410c17d51$export$7ff77a162970b30e);
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
 */ function $9e5f6a0caf75716e$export$1994a077b98ee0d5(width) {
    return width != null && (!isNaN(width) || String(width).match(/^(\d+)(?=%$)/) !== null);
}
function $9e5f6a0caf75716e$export$9078bad4c3934604(width) {
    if (!width) return 1;
    let match = width.match(/^(.+)(?=fr$)/);
    // if width is the incorrect format, just default it to a 1fr
    if (!match) {
        console.warn(`width: ${width} is not a supported format, width should be a number (ex. 150), percentage (ex. '50%') or fr unit (ex. '2fr')`, "defaulting to '1fr'");
        return 1;
    }
    return parseFloat(match[0]);
}
function $9e5f6a0caf75716e$export$7bbad27896f7ae9f(width, tableWidth) {
    if (typeof width === "string") {
        let match = width.match(/^(\d+)(?=%$)/);
        if (!match) throw new Error("Only percentages or numbers are supported for static column widths");
        return tableWidth * (parseFloat(match[0]) / 100);
    }
    return width;
}
function $9e5f6a0caf75716e$export$59185c62a7544aa0(maxWidth, tableWidth) {
    return maxWidth != null ? $9e5f6a0caf75716e$export$7bbad27896f7ae9f(maxWidth, tableWidth) : Number.MAX_SAFE_INTEGER;
}
function $9e5f6a0caf75716e$export$f556054ce4358701(minWidth, tableWidth) {
    return minWidth != null ? $9e5f6a0caf75716e$export$7bbad27896f7ae9f(minWidth, tableWidth) : 0;
}
function $9e5f6a0caf75716e$export$55d50dc687385491(availableWidth, columns, changedColumns, getDefaultWidth, getDefaultMinWidth) {
    let hasNonFrozenItems = false;
    let flexItems = columns.map((column, index)=>{
        var _column_width, _ref, _ref1;
        let width = changedColumns.get(column.key) != null ? changedColumns.get(column.key) : (_ref1 = (_ref = (_column_width = column.width) !== null && _column_width !== void 0 ? _column_width : column.defaultWidth) !== null && _ref !== void 0 ? _ref : getDefaultWidth === null || getDefaultWidth === void 0 ? void 0 : getDefaultWidth(index)) !== null && _ref1 !== void 0 ? _ref1 : "1fr";
        let frozen = false;
        let baseSize = 0;
        let flex = 0;
        let targetMainSize = null;
        if ($9e5f6a0caf75716e$export$1994a077b98ee0d5(width)) {
            baseSize = $9e5f6a0caf75716e$export$7bbad27896f7ae9f(width, availableWidth);
            frozen = true;
        } else {
            flex = $9e5f6a0caf75716e$export$9078bad4c3934604(width);
            if (flex <= 0) frozen = true;
        }
        var _column_minWidth, _ref2;
        let min = $9e5f6a0caf75716e$export$f556054ce4358701((_ref2 = (_column_minWidth = column.minWidth) !== null && _column_minWidth !== void 0 ? _column_minWidth : getDefaultMinWidth === null || getDefaultMinWidth === void 0 ? void 0 : getDefaultMinWidth(index)) !== null && _ref2 !== void 0 ? _ref2 : 0, availableWidth);
        let max = $9e5f6a0caf75716e$export$59185c62a7544aa0(column.maxWidth, availableWidth);
        let hypotheticalMainSize = Math.max(min, Math.min(baseSize, max));
        // 9.7.1
        // We don't make use of flex basis, it's always 0, so we are always in 'grow' mode.
        // 9.7.2
        if (frozen) targetMainSize = hypotheticalMainSize;
        else if (baseSize > hypotheticalMainSize) {
            frozen = true;
            targetMainSize = hypotheticalMainSize;
        }
        // 9.7.3
        if (!frozen) hasNonFrozenItems = true;
        return {
            frozen: frozen,
            baseSize: baseSize,
            hypotheticalMainSize: hypotheticalMainSize,
            min: min,
            max: max,
            flex: flex,
            targetMainSize: targetMainSize,
            violation: 0
        };
    });
    // 9.7.4
    // 9.7.4.a
    while(hasNonFrozenItems){
        // 9.7.4.b
        /**
     * Calculate the remaining free space as for initial free space,
     * above (9.7.3). If the sum of the unfrozen flex items’ flex factors is
     * less than one, multiply the initial free space by this sum (of flex factors).
     * If the magnitude of this value is less than the magnitude of
     * the remaining free space, use this as the remaining free space.
     */ let usedWidth = 0;
        let flexFactors = 0;
        flexItems.forEach((item)=>{
            if (item.frozen) usedWidth += item.targetMainSize;
            else {
                usedWidth += item.baseSize;
                flexFactors += item.flex;
            }
        });
        let remainingFreeSpace = availableWidth - usedWidth;
        // we only support integer FR's, and because of hasNonFrozenItems, we know that flexFactors > 0
        // so no need to check for flexFactors < 1
        // 9.7.4.c
        /**
     * If the remaining free space is zero
     * - Do nothing.
     * Else // remember, we're always in grow mode
     * - Find the ratio of the item’s flex grow factor to the
     * sum of the flex grow factors of all unfrozen items on
     * the line. Set the item’s target main size to its flex
     * base size plus a fraction of the remaining free space
     * proportional to the ratio.
     */ if (remainingFreeSpace > 0) flexItems.forEach((item)=>{
            if (!item.frozen) {
                let ratio = item.flex / flexFactors;
                item.targetMainSize = item.baseSize + ratio * remainingFreeSpace;
            }
        });
        // 9.7.4.d
        /**
     * Fix min/max violations. Clamp each non-frozen item’s
     * target main size by its used min and max main sizes
     * and floor its content-box size at zero. If the item’s
     * target main size was made smaller by this, it’s a max
     * violation. If the item’s target main size was made
     * larger by this, it’s a min violation.
     */ let totalViolation = 0;
        flexItems.forEach((item)=>{
            item.violation = 0;
            if (!item.frozen) {
                let { min: min , max: max , targetMainSize: targetMainSize  } = item;
                item.targetMainSize = Math.max(min, Math.min(targetMainSize, max));
                item.violation = item.targetMainSize - targetMainSize;
                totalViolation += item.violation;
            }
        });
        // 9.7.4.e
        /**
     * Freeze over-flexed items. The total violation is the
     * sum of the adjustments from the previous step
     * ∑(clamped size - unclamped size). If the total violation is:
     * Zero
     * - Freeze all items.
     *
     * Positive
     * - Freeze all the items with min violations.
     *
     * Negative
     * - Freeze all the items with max violations.
     */ hasNonFrozenItems = false;
        flexItems.forEach((item)=>{
            if (totalViolation === 0 || Math.sign(totalViolation) === Math.sign(item.violation)) item.frozen = true;
            else if (!item.frozen) hasNonFrozenItems = true;
        });
    }
    return $9e5f6a0caf75716e$var$cascadeRounding(flexItems);
}
function $9e5f6a0caf75716e$var$cascadeRounding(flexItems) {
    /*
  Given an array of floats that sum to an integer, this rounds the floats
  and returns an array of integers with the same sum.
  */ let fpTotal = 0;
    let intTotal = 0;
    let roundedArray = [];
    flexItems.forEach(function(item) {
        let float = item.targetMainSize;
        let integer = Math.round(float + fpTotal) - intTotal;
        fpTotal += float;
        intTotal += integer;
        roundedArray.push(integer);
    });
    return roundedArray;
}


class $2240a72410c17d51$export$7ff77a162970b30e {
    /** Takes an array of columns and splits it into 2 maps of columns with controlled and columns with uncontrolled widths. */ splitColumnsIntoControlledAndUncontrolled(columns) {
        return columns.reduce((acc, col)=>{
            if (col.props.width != null) acc[0].set(col.key, col);
            else acc[1].set(col.key, col);
            return acc;
        }, [
            new Map(),
            new Map()
        ]);
    }
    /** Takes uncontrolled and controlled widths and joins them into a single Map. */ recombineColumns(columns, uncontrolledWidths, uncontrolledColumns, controlledColumns) {
        return new Map(columns.map((col)=>{
            if (uncontrolledColumns.has(col.key)) return [
                col.key,
                uncontrolledWidths.get(col.key)
            ];
            else return [
                col.key,
                controlledColumns.get(col.key).props.width
            ];
        }));
    }
    /** Used to make an initial Map of the uncontrolled widths based on default widths. */ getInitialUncontrolledWidths(uncontrolledColumns) {
        var _col_props_defaultWidth, _ref;
        return new Map(Array.from(uncontrolledColumns).map(([key, col])=>{
            var _this, _this_getDefaultWidth;
            return [
                key,
                (_ref = (_col_props_defaultWidth = col.props.defaultWidth) !== null && _col_props_defaultWidth !== void 0 ? _col_props_defaultWidth : (_this_getDefaultWidth = (_this = this).getDefaultWidth) === null || _this_getDefaultWidth === void 0 ? void 0 : _this_getDefaultWidth.call(_this, col)) !== null && _ref !== void 0 ? _ref : "1fr"
            ];
        }));
    }
    getColumnWidth(key) {
        var _this_columnWidths_get;
        return (_this_columnWidths_get = this.columnWidths.get(key)) !== null && _this_columnWidths_get !== void 0 ? _this_columnWidths_get : 0;
    }
    getColumnMinWidth(key) {
        return this.columnMinWidths.get(key);
    }
    getColumnMaxWidth(key) {
        return this.columnMaxWidths.get(key);
    }
    resizeColumnWidth(tableWidth, collection, controlledWidths, uncontrolledWidths, col = null, width) {
        let prevColumnWidths = this.columnWidths;
        // resizing a column
        let resizeIndex = Infinity;
        let resizingChanged = new Map([
            ...controlledWidths,
            ...uncontrolledWidths
        ]);
        let percentKeys = new Map();
        let frKeysToTheRight = new Map();
        let minWidths = new Map();
        // freeze columns to the left to their previous pixel value
        collection.columns.forEach((column, i)=>{
            var _column_column_props_width, _column_column_props_width_endsWith;
            let frKey;
            let frValue;
            minWidths.set(column.key, this.getDefaultMinWidth(collection.columns[i]));
            if (col !== column.key && !column.column.props.width && !(0, $9e5f6a0caf75716e$export$1994a077b98ee0d5)(uncontrolledWidths.get(column.key))) {
                // uncontrolled don't have props.width for us, so instead get from our state
                frKey = column.key;
                frValue = (0, $9e5f6a0caf75716e$export$9078bad4c3934604)(uncontrolledWidths.get(column.key));
            } else if (col !== column.key && !(0, $9e5f6a0caf75716e$export$1994a077b98ee0d5)(column.column.props.width) && !uncontrolledWidths.get(column.key)) {
                // controlledWidths will be the same in the collection
                frKey = column.key;
                frValue = (0, $9e5f6a0caf75716e$export$9078bad4c3934604)(column.column.props.width);
            } else if (col !== column.key && ((_column_column_props_width = column.column.props.width) === null || _column_column_props_width === void 0 ? void 0 : (_column_column_props_width_endsWith = _column_column_props_width.endsWith) === null || _column_column_props_width_endsWith === void 0 ? void 0 : _column_column_props_width_endsWith.call(_column_column_props_width, "%"))) percentKeys.set(column.key, column.column.props.width);
            // don't freeze columns to the right of the resizing one
            if (resizeIndex < i) {
                if (frKey) frKeysToTheRight.set(frKey, frValue);
                return;
            }
            // we already know the new size of the resizing column
            if (column.key === col) {
                resizeIndex = i;
                resizingChanged.set(column.key, Math.floor(width));
                return;
            }
            // freeze column to previous value
            resizingChanged.set(column.key, prevColumnWidths.get(column.key));
        });
        // predict pixels sizes for all columns based on resize
        let columnWidths = (0, $9e5f6a0caf75716e$export$55d50dc687385491)(tableWidth, collection.columns.map((col)=>({
                ...col.column.props,
                key: col.key
            })), resizingChanged, (i)=>this.getDefaultWidth(collection.columns[i]), (i)=>this.getDefaultMinWidth(collection.columns[i]));
        // set all new column widths for onResize event
        // columns going in will be the same order as the columns coming out
        let newWidths = new Map();
        // set all column widths based on calculateColumnSize
        columnWidths.forEach((width, index)=>{
            let key = collection.columns[index].key;
            newWidths.set(key, width);
        });
        // add FR's back as they were to columns to the right
        Array.from(frKeysToTheRight).forEach(([key])=>{
            newWidths.set(key, `${frKeysToTheRight.get(key)}fr`);
        });
        // put back in percents
        Array.from(percentKeys).forEach(([key, width])=>{
            // resizing locks a column to a px width
            if (key === col) return;
            newWidths.set(key, width);
        });
        return newWidths;
    }
    buildColumnWidths(tableWidth, collection, widths) {
        this.columnWidths = new Map();
        this.columnMinWidths = new Map();
        this.columnMaxWidths = new Map();
        // initial layout or table/window resizing
        let columnWidths = (0, $9e5f6a0caf75716e$export$55d50dc687385491)(tableWidth, collection.columns.map((col)=>({
                ...col.column.props,
                key: col.key
            })), widths, (i)=>this.getDefaultWidth(collection.columns[i]), (i)=>this.getDefaultMinWidth(collection.columns[i]));
        // columns going in will be the same order as the columns coming out
        columnWidths.forEach((width, index)=>{
            let key = collection.columns[index].key;
            let column = collection.columns[index];
            this.columnWidths.set(key, width);
            var _column_column_props_minWidth;
            this.columnMinWidths.set(key, (0, $9e5f6a0caf75716e$export$f556054ce4358701)((_column_column_props_minWidth = column.column.props.minWidth) !== null && _column_column_props_minWidth !== void 0 ? _column_column_props_minWidth : this.getDefaultMinWidth(column), tableWidth));
            this.columnMaxWidths.set(key, (0, $9e5f6a0caf75716e$export$59185c62a7544aa0)(column.column.props.maxWidth, tableWidth));
        });
        return this.columnWidths;
    }
    constructor(options){
        (0, ($parcel$interopDefault($56JBj$swchelperslib_define_propertyjs)))(this, "columnWidths", new Map());
        (0, ($parcel$interopDefault($56JBj$swchelperslib_define_propertyjs)))(this, "columnMinWidths", new Map());
        (0, ($parcel$interopDefault($56JBj$swchelperslib_define_propertyjs)))(this, "columnMaxWidths", new Map());
        var _options_getDefaultWidth;
        this.getDefaultWidth = (_options_getDefaultWidth = options === null || options === void 0 ? void 0 : options.getDefaultWidth) !== null && _options_getDefaultWidth !== void 0 ? _options_getDefaultWidth : ()=>"1fr";
        var _options_getDefaultMinWidth;
        this.getDefaultMinWidth = (_options_getDefaultMinWidth = options === null || options === void 0 ? void 0 : options.getDefaultMinWidth) !== null && _options_getDefaultMinWidth !== void 0 ? _options_getDefaultMinWidth : ()=>0;
    }
}


function $7aa22d80cd4ca621$export$cb895dcf85db1319(props, state) {
    let { getDefaultWidth: getDefaultWidth , getDefaultMinWidth: getDefaultMinWidth , tableWidth: tableWidth = 0  } = props;
    let [resizingColumn, setResizingColumn] = (0, $56JBj$react.useState)(null);
    let columnLayout = (0, $56JBj$react.useMemo)(()=>new (0, $2240a72410c17d51$export$7ff77a162970b30e)({
            getDefaultWidth: getDefaultWidth,
            getDefaultMinWidth: getDefaultMinWidth
        }), [
        getDefaultWidth,
        getDefaultMinWidth
    ]);
    let [controlledColumns, uncontrolledColumns] = (0, $56JBj$react.useMemo)(()=>columnLayout.splitColumnsIntoControlledAndUncontrolled(state.collection.columns), [
        state.collection.columns,
        columnLayout
    ]);
    // uncontrolled column widths
    let [uncontrolledWidths, setUncontrolledWidths] = (0, $56JBj$react.useState)(()=>columnLayout.getInitialUncontrolledWidths(uncontrolledColumns));
    // combine columns back into one map that maintains same order as the columns
    let colWidths = (0, $56JBj$react.useMemo)(()=>columnLayout.recombineColumns(state.collection.columns, uncontrolledWidths, uncontrolledColumns, controlledColumns), [
        state.collection.columns,
        uncontrolledWidths,
        uncontrolledColumns,
        controlledColumns,
        columnLayout
    ]);
    let startResize = (0, $56JBj$react.useCallback)((key)=>{
        setResizingColumn(key);
    }, [
        setResizingColumn
    ]);
    let updateResizedColumns = (0, $56JBj$react.useCallback)((key, width)=>{
        let newControlled = new Map(Array.from(controlledColumns).map(([key, entry])=>[
                key,
                entry.props.width
            ]));
        let newSizes = columnLayout.resizeColumnWidth(tableWidth, state.collection, newControlled, uncontrolledWidths, key, width);
        let map = new Map(Array.from(uncontrolledColumns).map(([key])=>[
                key,
                newSizes.get(key)
            ]));
        map.set(key, width);
        setUncontrolledWidths(map);
        return newSizes;
    }, [
        controlledColumns,
        uncontrolledColumns,
        setUncontrolledWidths,
        tableWidth,
        columnLayout,
        state.collection,
        uncontrolledWidths
    ]);
    let endResize = (0, $56JBj$react.useCallback)(()=>{
        setResizingColumn(null);
    }, [
        setResizingColumn
    ]);
    (0, $56JBj$react.useMemo)(()=>columnLayout.buildColumnWidths(tableWidth, state.collection, colWidths), [
        tableWidth,
        state.collection,
        colWidths,
        columnLayout
    ]);
    return (0, $56JBj$react.useMemo)(()=>({
            resizingColumn: resizingColumn,
            updateResizedColumns: updateResizedColumns,
            startResize: startResize,
            endResize: endResize,
            getColumnWidth: (key)=>columnLayout.getColumnWidth(key),
            getColumnMinWidth: (key)=>columnLayout.getColumnMinWidth(key),
            getColumnMaxWidth: (key)=>columnLayout.getColumnMaxWidth(key),
            tableState: state
        }), [
        columnLayout,
        resizingColumn,
        updateResizedColumns,
        startResize,
        endResize,
        state
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


const $7f5a58334d8866a5$var$ROW_HEADER_COLUMN_KEY = "row-header-column-" + Math.random().toString(36).slice(2);
let $7f5a58334d8866a5$var$ROW_HEADER_COLUMN_KEY_DRAG = "row-header-column-" + Math.random().toString(36).slice(2);
while($7f5a58334d8866a5$var$ROW_HEADER_COLUMN_KEY === $7f5a58334d8866a5$var$ROW_HEADER_COLUMN_KEY_DRAG)$7f5a58334d8866a5$var$ROW_HEADER_COLUMN_KEY_DRAG = "row-header-column-" + Math.random().toString(36).slice(2);
function $7f5a58334d8866a5$export$7c127db850d4e81e(keyMap, columnNodes) {
    if (columnNodes.length === 0) return [];
    let columns = [];
    let seen = new Map();
    for (let column of columnNodes){
        let parentKey = column.parentKey;
        let col = [
            column
        ];
        while(parentKey){
            let parent = keyMap.get(parentKey);
            if (!parent) break;
            // If we've already seen this parent, than it is shared
            // with a previous column. If the current column is taller
            // than the previous column, than we need to shift the parent
            // in the previous column so it's level with the current column.
            if (seen.has(parent)) {
                parent.colspan++;
                let { column: column1 , index: index  } = seen.get(parent);
                if (index > col.length) break;
                for(let i = index; i < col.length; i++)column1.splice(i, 0, null);
                // Adjust shifted indices
                for(let i1 = col.length; i1 < column1.length; i1++)// eslint-disable-next-line max-depth
                if (column1[i1] && seen.has(column1[i1])) seen.get(column1[i1]).index = i1;
            } else {
                parent.colspan = 1;
                col.push(parent);
                seen.set(parent, {
                    column: col,
                    index: col.length - 1
                });
            }
            parentKey = parent.parentKey;
        }
        columns.push(col);
        column.index = columns.length - 1;
    }
    let maxLength = Math.max(...columns.map((c)=>c.length));
    let headerRows = Array(maxLength).fill(0).map(()=>[]);
    // Convert columns into rows.
    let colIndex = 0;
    for (let column2 of columns){
        let i2 = maxLength - 1;
        for (let item of column2){
            if (item) {
                // Fill the space up until the current column with a placeholder
                let row = headerRows[i2];
                let rowLength = row.reduce((p, c)=>p + c.colspan, 0);
                if (rowLength < colIndex) {
                    let placeholder = {
                        type: "placeholder",
                        key: "placeholder-" + item.key,
                        colspan: colIndex - rowLength,
                        index: rowLength,
                        value: null,
                        rendered: null,
                        level: i2,
                        hasChildNodes: false,
                        childNodes: [],
                        textValue: null
                    };
                    // eslint-disable-next-line max-depth
                    if (row.length > 0) {
                        row[row.length - 1].nextKey = placeholder.key;
                        placeholder.prevKey = row[row.length - 1].key;
                    }
                    row.push(placeholder);
                }
                if (row.length > 0) {
                    row[row.length - 1].nextKey = item.key;
                    item.prevKey = row[row.length - 1].key;
                }
                item.level = i2;
                item.colIndex = colIndex;
                row.push(item);
            }
            i2--;
        }
        colIndex++;
    }
    // Add placeholders at the end of each row that is shorter than the maximum
    let i3 = 0;
    for (let row1 of headerRows){
        let rowLength1 = row1.reduce((p, c)=>p + c.colspan, 0);
        if (rowLength1 < columnNodes.length) {
            let placeholder1 = {
                type: "placeholder",
                key: "placeholder-" + row1[row1.length - 1].key,
                colspan: columnNodes.length - rowLength1,
                index: rowLength1,
                value: null,
                rendered: null,
                level: i3,
                hasChildNodes: false,
                childNodes: [],
                textValue: null,
                prevKey: row1[row1.length - 1].key
            };
            row1.push(placeholder1);
        }
        i3++;
    }
    return headerRows.map((childNodes, index)=>{
        let row = {
            type: "headerrow",
            key: "headerrow-" + index,
            index: index,
            value: null,
            rendered: null,
            level: 0,
            hasChildNodes: true,
            childNodes: childNodes,
            textValue: null
        };
        return row;
    });
}
let $7f5a58334d8866a5$var$_Symbol_iterator = Symbol.iterator;
class $7f5a58334d8866a5$export$596e1b2e2cf93690 extends (0, $56JBj$reactstatelygrid.GridCollection) {
    *[$7f5a58334d8866a5$var$_Symbol_iterator]() {
        yield* this.body.childNodes;
    }
    get size() {
        return this._size;
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
        var _getFirstItem;
        return (_getFirstItem = (0, $56JBj$reactstatelycollections.getFirstItem)(this.body.childNodes)) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key;
    }
    getLastKey() {
        var _getLastItem;
        return (_getLastItem = (0, $56JBj$reactstatelycollections.getLastItem)(this.body.childNodes)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key;
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
    getTextValue(key) {
        let row = this.getItem(key);
        if (!row) return "";
        // If the row has a textValue, use that.
        if (row.textValue) return row.textValue;
        // Otherwise combine the text of each of the row header columns.
        let rowHeaderColumnKeys = this.rowHeaderColumnKeys;
        if (rowHeaderColumnKeys) {
            let text = [];
            for (let cell of row.childNodes){
                let column = this.columns[cell.index];
                if (rowHeaderColumnKeys.has(column.key) && cell.textValue) text.push(cell.textValue);
                if (text.length === rowHeaderColumnKeys.size) break;
            }
            return text.join(" ");
        }
        return "";
    }
    constructor(nodes, prev, opts){
        let rowHeaderColumnKeys = new Set();
        let body;
        let columns = [];
        // Add cell for selection checkboxes if needed.
        if (opts === null || opts === void 0 ? void 0 : opts.showSelectionCheckboxes) {
            let rowHeaderColumn = {
                type: "column",
                key: $7f5a58334d8866a5$var$ROW_HEADER_COLUMN_KEY,
                value: null,
                textValue: "",
                level: 0,
                index: (opts === null || opts === void 0 ? void 0 : opts.showDragButtons) ? 1 : 0,
                hasChildNodes: false,
                rendered: null,
                childNodes: [],
                props: {
                    isSelectionCell: true
                }
            };
            columns.unshift(rowHeaderColumn);
        }
        // Add cell for drag buttons if needed.
        if (opts === null || opts === void 0 ? void 0 : opts.showDragButtons) {
            let rowHeaderColumn1 = {
                type: "column",
                key: $7f5a58334d8866a5$var$ROW_HEADER_COLUMN_KEY_DRAG,
                value: null,
                textValue: "",
                level: 0,
                index: 0,
                hasChildNodes: false,
                rendered: null,
                childNodes: [],
                props: {
                    isDragButtonCell: true
                }
            };
            columns.unshift(rowHeaderColumn1);
        }
        let rows = [];
        let columnKeyMap = new Map();
        let visit = (node)=>{
            switch(node.type){
                case "body":
                    body = node;
                    break;
                case "column":
                    columnKeyMap.set(node.key, node);
                    if (!node.hasChildNodes) {
                        columns.push(node);
                        if (node.props.isRowHeader) rowHeaderColumnKeys.add(node.key);
                    }
                    break;
                case "item":
                    rows.push(node);
                    return; // do not go into childNodes
            }
            for (let child of node.childNodes)visit(child);
        };
        for (let node of nodes)visit(node);
        let headerRows = $7f5a58334d8866a5$export$7c127db850d4e81e(columnKeyMap, columns);
        headerRows.forEach((row, i)=>rows.splice(i, 0, row));
        super({
            columnCount: columns.length,
            items: rows,
            visitNode: (node)=>{
                node.column = columns[node.index];
                return node;
            }
        });
        (0, ($parcel$interopDefault($56JBj$swchelperslib_define_propertyjs)))(this, "_size", 0);
        this.columns = columns;
        this.rowHeaderColumnKeys = rowHeaderColumnKeys;
        this.body = body;
        this.headerRows = headerRows;
        this._size = [
            ...body.childNodes
        ].length;
        // Default row header column to the first one.
        if (this.rowHeaderColumnKeys.size === 0) {
            if (opts === null || opts === void 0 ? void 0 : opts.showSelectionCheckboxes) {
                if (opts === null || opts === void 0 ? void 0 : opts.showDragButtons) this.rowHeaderColumnKeys.add(this.columns[2].key);
                else this.rowHeaderColumnKeys.add(this.columns[1].key);
            } else this.rowHeaderColumnKeys.add(this.columns[0].key);
        }
    }
}



const $e3f7784147dde23d$var$OPPOSITE_SORT_DIRECTION = {
    ascending: "descending",
    descending: "ascending"
};
function $e3f7784147dde23d$export$907bcc6c48325fd6(props) {
    let [isKeyboardNavigationDisabled, setKeyboardNavigationDisabled] = (0, $56JBj$react.useState)(false);
    let { selectionMode: selectionMode = "none"  } = props;
    let context = (0, $56JBj$react.useMemo)(()=>({
            showSelectionCheckboxes: props.showSelectionCheckboxes && selectionMode !== "none",
            showDragButtons: props.showDragButtons,
            selectionMode: selectionMode,
            columns: []
        }), [
        props.children,
        props.showSelectionCheckboxes,
        selectionMode,
        props.showDragButtons
    ]);
    let collection = (0, $56JBj$reactstatelycollections.useCollection)(props, (nodes, prev)=>new (0, $7f5a58334d8866a5$export$596e1b2e2cf93690)(nodes, prev, context), context);
    let { disabledKeys: disabledKeys , selectionManager: selectionManager  } = (0, $56JBj$reactstatelygrid.useGridState)({
        ...props,
        collection: collection,
        disabledBehavior: props.disabledBehavior || "selection"
    });
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager,
        showSelectionCheckboxes: props.showSelectionCheckboxes || false,
        sortDescriptor: props.sortDescriptor,
        isKeyboardNavigationDisabled: collection.size === 0 || isKeyboardNavigationDisabled,
        setKeyboardNavigationDisabled: setKeyboardNavigationDisabled,
        sort (columnKey, direction) {
            var _props_sortDescriptor;
            props.onSortChange({
                column: columnKey,
                direction: direction !== null && direction !== void 0 ? direction : ((_props_sortDescriptor = props.sortDescriptor) === null || _props_sortDescriptor === void 0 ? void 0 : _props_sortDescriptor.column) === columnKey ? $e3f7784147dde23d$var$OPPOSITE_SORT_DIRECTION[props.sortDescriptor.direction] : "ascending"
            });
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
function $f45775f5d6f744fa$var$TableHeader(props) {
    return null;
}
$f45775f5d6f744fa$var$TableHeader.getCollectionNode = function* getCollectionNode(props) {
    let { children: children , columns: columns  } = props;
    if (typeof children === "function") {
        if (!columns) throw new Error("props.children was a function but props.columns is missing");
        for (let column of columns)yield {
            type: "column",
            value: column,
            renderer: children
        };
    } else {
        let columns1 = [];
        (0, ($parcel$interopDefault($56JBj$react))).Children.forEach(children, (column)=>{
            columns1.push({
                type: "column",
                element: column
            });
        });
        yield* columns1;
    }
};
/**
 * A TableHeader is a container for the Column elements in a Table. Columns can be statically defined
 * as children, or generated dynamically using a function based on the data passed to the `columns` prop.
 */ // We don't want getCollectionNode to show up in the type definition
let $f45775f5d6f744fa$export$f850895b287ef28e = $f45775f5d6f744fa$var$TableHeader;


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
function $6ec527db6a3a5692$var$TableBody(props) {
    return null;
}
$6ec527db6a3a5692$var$TableBody.getCollectionNode = function* getCollectionNode(props) {
    let { children: children , items: items  } = props;
    yield {
        type: "body",
        hasChildNodes: true,
        props: props,
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
                (0, ($parcel$interopDefault($56JBj$react))).Children.forEach(children, (item)=>{
                    items1.push({
                        type: "item",
                        element: item
                    });
                });
                yield* items1;
            }
        }
    };
};
/**
 * A TableBody is a container for the Row elements of a Table. Rows can be statically defined
 * as children, or generated dynamically using a function based on the data passed to the `items` prop.
 */ // We don't want getCollectionNode to show up in the type definition
let $6ec527db6a3a5692$export$76ccd210b9029917 = $6ec527db6a3a5692$var$TableBody;


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
function $714483d9f6ca4c55$var$Column(props) {
    return null;
}
$714483d9f6ca4c55$var$Column.getCollectionNode = function* getCollectionNode(props, context) {
    let { title: title , children: children , childColumns: childColumns  } = props;
    let rendered = title || children;
    let textValue = props.textValue || (typeof rendered === "string" ? rendered : "") || props["aria-label"];
    let fullNodes = yield {
        type: "column",
        hasChildNodes: !!childColumns || title && (0, ($parcel$interopDefault($56JBj$react))).Children.count(children) > 0,
        rendered: rendered,
        textValue: textValue,
        props: props,
        *childNodes () {
            if (childColumns) for (let child of childColumns)yield {
                type: "column",
                value: child
            };
            else if (title) {
                let childColumns1 = [];
                (0, ($parcel$interopDefault($56JBj$react))).Children.forEach(children, (child)=>{
                    childColumns1.push({
                        type: "column",
                        element: child
                    });
                });
                yield* childColumns1;
            }
        },
        shouldInvalidate (newContext) {
            // This is a bit of a hack, but it works.
            // If this method is called, then there's a cached version of this node available.
            // But, we need to keep the list of columns in the new context up to date.
            updateContext(newContext);
            return false;
        }
    };
    let updateContext = (context)=>{
        // register leaf columns on the context so that <Row> can access them
        for (let node of fullNodes)if (!node.hasChildNodes) context.columns.push(node);
    };
    updateContext(context);
};
/**
 * A Column represents a field of each item within a Table. Columns may also contain nested
 * Column elements to represent column groups. Nested columns can be statically defined as
 * children, or dynamically generated using a function based on the `childColumns` prop.
 */ // We don't want getCollectionNode to show up in the type definition
let $714483d9f6ca4c55$export$816b5d811295e6bc = $714483d9f6ca4c55$var$Column;


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
function $9ec6912e32cc0d81$var$Row(props) {
    return null;
}
$9ec6912e32cc0d81$var$Row.getCollectionNode = function* getCollectionNode(props, context) {
    let { children: children , textValue: textValue  } = props;
    yield {
        type: "item",
        props: props,
        textValue: textValue,
        "aria-label": props["aria-label"],
        hasChildNodes: true,
        *childNodes () {
            // Process cells first
            if (context.showDragButtons) yield {
                type: "cell",
                key: "header-drag",
                props: {
                    isDragButtonCell: true
                }
            };
            if (context.showSelectionCheckboxes && context.selectionMode !== "none") yield {
                type: "cell",
                key: "header",
                props: {
                    isSelectionCell: true
                }
            };
            if (typeof children === "function") for (let column of context.columns)yield {
                type: "cell",
                element: children(column.key),
                key: column.key // this is combined with the row key by CollectionBuilder
            };
            else {
                let cells = [];
                (0, ($parcel$interopDefault($56JBj$react))).Children.forEach(children, (cell)=>{
                    cells.push({
                        type: "cell",
                        element: cell
                    });
                });
                if (cells.length !== context.columns.length) throw new Error(`Cell count must match column count. Found ${cells.length} cells and ${context.columns.length} columns.`);
                yield* cells;
            }
        },
        shouldInvalidate (newContext) {
            // Invalidate all rows if the columns changed.
            return newContext.columns.length !== context.columns.length || newContext.columns.some((c, i)=>c.key !== context.columns[i].key) || newContext.showSelectionCheckboxes !== context.showSelectionCheckboxes || newContext.showDragButtons !== context.showDragButtons || newContext.selectionMode !== context.selectionMode;
        }
    };
};
/**
 * A Row represents a single item in a Table and contains Cell elements for each column.
 * Cells can be statically defined as children, or generated dynamically using a function
 * based on the columns defined in the TableHeader.
 */ // We don't want getCollectionNode to show up in the type definition
let $9ec6912e32cc0d81$export$b59bdbef9ce70de2 = $9ec6912e32cc0d81$var$Row;


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
 */ function $ad4ab0a21c733e1f$var$Cell(props) {
    return null;
}
$ad4ab0a21c733e1f$var$Cell.getCollectionNode = function* getCollectionNode(props) {
    let { children: children  } = props;
    let textValue = props.textValue || (typeof children === "string" ? children : "") || props["aria-label"] || "";
    yield {
        type: "cell",
        props: props,
        rendered: children,
        textValue: textValue,
        "aria-label": props["aria-label"],
        hasChildNodes: false
    };
};
/**
 * A Cell represents the value of a single Column within a Table Row.
 */ // We don't want getCollectionNode to show up in the type definition
let $ad4ab0a21c733e1f$export$f6f0c3fe4ec306ea = $ad4ab0a21c733e1f$var$Cell;







//# sourceMappingURL=main.js.map
