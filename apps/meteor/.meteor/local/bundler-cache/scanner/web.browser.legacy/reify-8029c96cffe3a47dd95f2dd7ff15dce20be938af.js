var $2oePb$reactstatelycollections = require("@react-stately/collections");
var $2oePb$reactstatelyvirtualizer = require("@react-stately/virtualizer");
var $2oePb$reactariautils = require("@react-aria/utils");
var $2oePb$react = require("react");
var $2oePb$reactariai18n = require("@react-aria/i18n");
var $2oePb$reactariafocus = require("@react-aria/focus");
var $2oePb$reactariaselection = require("@react-aria/selection");
var $2oePb$reactarialiveannouncer = require("@react-aria/live-announcer");
var $2oePb$reactariainteractions = require("@react-aria/interactions");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "GridKeyboardDelegate", () => $3187c0e19200cb16$export$de9feff04fda126e);
$parcel$export(module.exports, "useGrid", () => $11d770dfabe45077$export$f6b86a04e5d66d90);
$parcel$export(module.exports, "useGridRowGroup", () => $c7def85a57100898$export$d3037f5d3f3e51bf);
$parcel$export(module.exports, "useGridRow", () => $eed398987c639831$export$96357d5a73f686fa);
$parcel$export(module.exports, "useGridCell", () => $cf2021be63b01ef4$export$c7e10bfc0c59f67c);
$parcel$export(module.exports, "useGridSelectionCheckbox", () => $d8385f73d3701365$export$70e2eed1a92976ad);
$parcel$export(module.exports, "useHighlightSelectionDescription", () => $340f2fcd0ef9ce8d$export$be42ebdab07ae4c2);
$parcel$export(module.exports, "useGridSelectionAnnouncement", () => $1eb174acfe8a0f16$export$137e594ef3218a10);
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

class $3187c0e19200cb16$export$de9feff04fda126e {
    isCell(node) {
        return node.type === "cell";
    }
    isRow(node) {
        return node.type === "row" || node.type === "item";
    }
    findPreviousKey(fromKey, pred) {
        let key = fromKey != null ? this.collection.getKeyBefore(fromKey) : this.collection.getLastKey();
        while(key != null){
            let item = this.collection.getItem(key);
            if (!this.disabledKeys.has(key) && (!pred || pred(item))) return key;
            key = this.collection.getKeyBefore(key);
        }
    }
    findNextKey(fromKey, pred) {
        let key = fromKey != null ? this.collection.getKeyAfter(fromKey) : this.collection.getFirstKey();
        while(key != null){
            let item = this.collection.getItem(key);
            if (!this.disabledKeys.has(key) && (!pred || pred(item))) return key;
            key = this.collection.getKeyAfter(key);
        }
    }
    getKeyBelow(key) {
        let startItem = this.collection.getItem(key);
        if (!startItem) return;
        // If focus was on a cell, start searching from the parent row
        if (this.isCell(startItem)) key = startItem.parentKey;
        // Find the next item
        key = this.findNextKey(key);
        if (key != null) {
            // If focus was on a cell, focus the cell with the same index in the next row.
            if (this.isCell(startItem)) {
                let item = this.collection.getItem(key);
                return (0, $2oePb$reactstatelycollections.getNthItem)((0, $2oePb$reactstatelycollections.getChildNodes)(item, this.collection), startItem.index).key;
            }
            // Otherwise, focus the next row
            if (this.focusMode === "row") return key;
        }
    }
    getKeyAbove(key) {
        let startItem = this.collection.getItem(key);
        if (!startItem) return;
        // If focus is on a cell, start searching from the parent row
        if (this.isCell(startItem)) key = startItem.parentKey;
        // Find the previous item
        key = this.findPreviousKey(key);
        if (key != null) {
            // If focus was on a cell, focus the cell with the same index in the previous row.
            if (this.isCell(startItem)) {
                let item = this.collection.getItem(key);
                return (0, $2oePb$reactstatelycollections.getNthItem)((0, $2oePb$reactstatelycollections.getChildNodes)(item, this.collection), startItem.index).key;
            }
            // Otherwise, focus the previous row
            if (this.focusMode === "row") return key;
        }
    }
    getKeyRightOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return;
        // If focus is on a row, focus the first child cell.
        if (this.isRow(item)) {
            let children = (0, $2oePb$reactstatelycollections.getChildNodes)(item, this.collection);
            return this.direction === "rtl" ? (0, $2oePb$reactstatelycollections.getLastItem)(children).key : (0, $2oePb$reactstatelycollections.getFirstItem)(children).key;
        }
        // If focus is on a cell, focus the next cell if any,
        // otherwise focus the parent row.
        if (this.isCell(item)) {
            let parent = this.collection.getItem(item.parentKey);
            let children1 = (0, $2oePb$reactstatelycollections.getChildNodes)(parent, this.collection);
            let next = this.direction === "rtl" ? (0, $2oePb$reactstatelycollections.getNthItem)(children1, item.index - 1) : (0, $2oePb$reactstatelycollections.getNthItem)(children1, item.index + 1);
            if (next) return next.key;
            // focus row only if focusMode is set to row
            if (this.focusMode === "row") return item.parentKey;
            return this.direction === "rtl" ? this.getFirstKey(key) : this.getLastKey(key);
        }
    }
    getKeyLeftOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return;
        // If focus is on a row, focus the last child cell.
        if (this.isRow(item)) {
            let children = (0, $2oePb$reactstatelycollections.getChildNodes)(item, this.collection);
            return this.direction === "rtl" ? (0, $2oePb$reactstatelycollections.getFirstItem)(children).key : (0, $2oePb$reactstatelycollections.getLastItem)(children).key;
        }
        // If focus is on a cell, focus the previous cell if any,
        // otherwise focus the parent row.
        if (this.isCell(item)) {
            let parent = this.collection.getItem(item.parentKey);
            let children1 = (0, $2oePb$reactstatelycollections.getChildNodes)(parent, this.collection);
            let prev = this.direction === "rtl" ? (0, $2oePb$reactstatelycollections.getNthItem)(children1, item.index + 1) : (0, $2oePb$reactstatelycollections.getNthItem)(children1, item.index - 1);
            if (prev) return prev.key;
            // focus row only if focusMode is set to row
            if (this.focusMode === "row") return item.parentKey;
            return this.direction === "rtl" ? this.getLastKey(key) : this.getFirstKey(key);
        }
    }
    getFirstKey(key, global) {
        let item;
        if (key != null) {
            item = this.collection.getItem(key);
            if (!item) return;
            // If global flag is not set, and a cell is currently focused,
            // move focus to the first cell in the parent row.
            if (this.isCell(item) && !global) {
                let parent = this.collection.getItem(item.parentKey);
                return (0, $2oePb$reactstatelycollections.getFirstItem)((0, $2oePb$reactstatelycollections.getChildNodes)(parent, this.collection)).key;
            }
        }
        // Find the first row
        key = this.findNextKey();
        // If global flag is set (or if focus mode is cell), focus the first cell in the first row.
        if (key != null && item && this.isCell(item) && global || this.focusMode === "cell") {
            let item1 = this.collection.getItem(key);
            key = (0, $2oePb$reactstatelycollections.getFirstItem)((0, $2oePb$reactstatelycollections.getChildNodes)(item1, this.collection)).key;
        }
        // Otherwise, focus the row itself.
        return key;
    }
    getLastKey(key, global) {
        let item;
        if (key != null) {
            item = this.collection.getItem(key);
            if (!item) return;
            // If global flag is not set, and a cell is currently focused,
            // move focus to the last cell in the parent row.
            if (this.isCell(item) && !global) {
                let parent = this.collection.getItem(item.parentKey);
                let children = (0, $2oePb$reactstatelycollections.getChildNodes)(parent, this.collection);
                return (0, $2oePb$reactstatelycollections.getLastItem)(children).key;
            }
        }
        // Find the last row
        key = this.findPreviousKey();
        // If global flag is set (or if focus mode is cell), focus the last cell in the last row.
        if (key != null && item && this.isCell(item) && global || this.focusMode === "cell") {
            let item1 = this.collection.getItem(key);
            let children1 = (0, $2oePb$reactstatelycollections.getChildNodes)(item1, this.collection);
            key = (0, $2oePb$reactstatelycollections.getLastItem)(children1).key;
        }
        // Otherwise, focus the row itself.
        return key;
    }
    getItem(key) {
        return this.ref.current.querySelector(`[data-key="${key}"]`);
    }
    getItemRect(key) {
        var _this_layout_getLayoutInfo;
        if (this.layout) return (_this_layout_getLayoutInfo = this.layout.getLayoutInfo(key)) === null || _this_layout_getLayoutInfo === void 0 ? void 0 : _this_layout_getLayoutInfo.rect;
        let item = this.getItem(key);
        if (item) return new (0, $2oePb$reactstatelyvirtualizer.Rect)(item.offsetLeft, item.offsetTop, item.offsetWidth, item.offsetHeight);
    }
    getPageHeight() {
        var _this_layout_virtualizer, _this_ref, _this_ref_current;
        if (this.layout) return (_this_layout_virtualizer = this.layout.virtualizer) === null || _this_layout_virtualizer === void 0 ? void 0 : _this_layout_virtualizer.visibleRect.height;
        return (_this_ref = this.ref) === null || _this_ref === void 0 ? void 0 : (_this_ref_current = _this_ref.current) === null || _this_ref_current === void 0 ? void 0 : _this_ref_current.offsetHeight;
    }
    getContentHeight() {
        var _this_ref, _this_ref_current;
        if (this.layout) return this.layout.getContentSize().height;
        return (_this_ref = this.ref) === null || _this_ref === void 0 ? void 0 : (_this_ref_current = _this_ref.current) === null || _this_ref_current === void 0 ? void 0 : _this_ref_current.scrollHeight;
    }
    getKeyPageAbove(key) {
        let itemRect = this.getItemRect(key);
        if (!itemRect) return null;
        let pageY = Math.max(0, itemRect.maxY - this.getPageHeight());
        while(itemRect && itemRect.y > pageY){
            key = this.getKeyAbove(key);
            itemRect = this.getItemRect(key);
        }
        return key;
    }
    getKeyPageBelow(key) {
        let itemRect = this.getItemRect(key);
        if (!itemRect) return null;
        let pageHeight = this.getPageHeight();
        let pageY = Math.min(this.getContentHeight(), itemRect.y + pageHeight);
        while(itemRect && itemRect.maxY < pageY){
            let nextKey = this.getKeyBelow(key);
            itemRect = this.getItemRect(nextKey);
            // Guard against case where maxY of the last key is barely less than pageY due to rounding
            // and thus it attempts to set key to null
            if (nextKey != null) key = nextKey;
        }
        return key;
    }
    getKeyForSearch(search, fromKey) {
        if (!this.collator) return null;
        let collection = this.collection;
        let key = fromKey !== null && fromKey !== void 0 ? fromKey : this.getFirstKey();
        // If the starting key is a cell, search from its parent row.
        let startItem = collection.getItem(key);
        if (startItem.type === "cell") key = startItem.parentKey;
        let hasWrapped = false;
        while(key != null){
            let item = collection.getItem(key);
            // check row text value for match
            if (item.textValue) {
                let substring = item.textValue.slice(0, search.length);
                if (this.collator.compare(substring, search) === 0) {
                    if (this.isRow(item) && this.focusMode === "cell") return (0, $2oePb$reactstatelycollections.getFirstItem)((0, $2oePb$reactstatelycollections.getChildNodes)(item, this.collection)).key;
                    return item.key;
                }
            }
            key = this.findNextKey(key);
            // Wrap around when reaching the end of the collection
            if (key == null && !hasWrapped) {
                key = this.getFirstKey();
                hasWrapped = true;
            }
        }
        return null;
    }
    constructor(options){
        this.collection = options.collection;
        this.disabledKeys = options.disabledKeys;
        this.ref = options.ref;
        this.direction = options.direction;
        this.collator = options.collator;
        this.layout = options.layout;
        this.focusMode = options.focusMode || "row";
    }
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
 */ const $8ee34951196858d0$export$e6235c0d09b995d0 = new WeakMap();




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
var $cba28e4266d77056$exports = {};
var $6f42661ae0214332$exports = {};
$6f42661ae0214332$exports = {
    "deselectedItem": (args)=>`${args.item} غير المحدد`,
    "longPressToSelect": `اضغط مطولًا للدخول إلى وضع التحديد.`,
    "select": `تحديد`,
    "selectedAll": `جميع العناصر المحددة.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `لم يتم تحديد عناصر`,
            one: ()=>`${formatter.number(args.count)} عنصر محدد`,
            other: ()=>`${formatter.number(args.count)} عنصر محدد`
        })}.`,
    "selectedItem": (args)=>`${args.item} المحدد`
};


var $3e5d289b19f0fad9$exports = {};
$3e5d289b19f0fad9$exports = {
    "deselectedItem": (args)=>`${args.item} не е избран.`,
    "longPressToSelect": `Натиснете и задръжте за да влезете в избирателен режим.`,
    "select": `Изберете`,
    "selectedAll": `Всички елементи са избрани.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Няма избрани елементи`,
            one: ()=>`${formatter.number(args.count)} избран елемент`,
            other: ()=>`${formatter.number(args.count)} избрани елементи`
        })}.`,
    "selectedItem": (args)=>`${args.item} избран.`
};


var $786c35956e916979$exports = {};
$786c35956e916979$exports = {
    "deselectedItem": (args)=>`Položka ${args.item} není vybrána.`,
    "longPressToSelect": `Dlouhým stisknutím přejdete do režimu výběru.`,
    "select": `Vybrat`,
    "selectedAll": `Vybrány všechny položky.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nevybrány žádné položky`,
            one: ()=>`Vybrána ${formatter.number(args.count)} položka`,
            other: ()=>`Vybráno ${formatter.number(args.count)} položek`
        })}.`,
    "selectedItem": (args)=>`Vybrána položka ${args.item}.`
};


var $7166f564b8fa3e8a$exports = {};
$7166f564b8fa3e8a$exports = {
    "deselectedItem": (args)=>`${args.item} ikke valgt.`,
    "longPressToSelect": `Lav et langt tryk for at aktivere valgtilstand.`,
    "select": `Vælg`,
    "selectedAll": `Alle elementer valgt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Ingen elementer valgt`,
            one: ()=>`${formatter.number(args.count)} element valgt`,
            other: ()=>`${formatter.number(args.count)} elementer valgt`
        })}.`,
    "selectedItem": (args)=>`${args.item} valgt.`
};


var $12fc5e32bb482de0$exports = {};
$12fc5e32bb482de0$exports = {
    "deselectedItem": (args)=>`${args.item} nicht ausgewählt.`,
    "longPressToSelect": `Gedrückt halten, um Auswahlmodus zu öffnen.`,
    "select": `Auswählen`,
    "selectedAll": `Alle Elemente ausgewählt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Keine Elemente ausgewählt`,
            one: ()=>`${formatter.number(args.count)} Element ausgewählt`,
            other: ()=>`${formatter.number(args.count)} Elemente ausgewählt`
        })}.`,
    "selectedItem": (args)=>`${args.item} ausgewählt.`
};


var $84b67ad15c785b2c$exports = {};
$84b67ad15c785b2c$exports = {
    "deselectedItem": (args)=>`Δεν επιλέχθηκε το στοιχείο ${args.item}.`,
    "longPressToSelect": `Πατήστε παρατεταμένα για να μπείτε σε λειτουργία επιλογής.`,
    "select": `Επιλογή`,
    "selectedAll": `Επιλέχθηκαν όλα τα στοιχεία.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Δεν επιλέχθηκαν στοιχεία`,
            one: ()=>`Επιλέχθηκε ${formatter.number(args.count)} στοιχείο`,
            other: ()=>`Επιλέχθηκαν ${formatter.number(args.count)} στοιχεία`
        })}.`,
    "selectedItem": (args)=>`Επιλέχθηκε το στοιχείο ${args.item}.`
};


var $86f7e6ba2423a35d$exports = {};
$86f7e6ba2423a35d$exports = {
    "deselectedItem": (args)=>`${args.item} not selected.`,
    "select": `Select`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `No items selected`,
            one: ()=>`${formatter.number(args.count)} item selected`,
            other: ()=>`${formatter.number(args.count)} items selected`
        })}.`,
    "selectedAll": `All items selected.`,
    "selectedItem": (args)=>`${args.item} selected.`,
    "longPressToSelect": `Long press to enter selection mode.`
};


var $67f524d2f2545d56$exports = {};
$67f524d2f2545d56$exports = {
    "deselectedItem": (args)=>`${args.item} no seleccionado.`,
    "longPressToSelect": `Mantenga pulsado para abrir el modo de selección.`,
    "select": `Seleccionar`,
    "selectedAll": `Todos los elementos seleccionados.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Ningún elemento seleccionado`,
            one: ()=>`${formatter.number(args.count)} elemento seleccionado`,
            other: ()=>`${formatter.number(args.count)} elementos seleccionados`
        })}.`,
    "selectedItem": (args)=>`${args.item} seleccionado.`
};


var $d8df13f1dbf6e0c4$exports = {};
$d8df13f1dbf6e0c4$exports = {
    "deselectedItem": (args)=>`${args.item} pole valitud.`,
    "longPressToSelect": `Valikurežiimi sisenemiseks vajutage pikalt.`,
    "select": `Vali`,
    "selectedAll": `Kõik üksused valitud.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Üksusi pole valitud`,
            one: ()=>`${formatter.number(args.count)} üksus valitud`,
            other: ()=>`${formatter.number(args.count)} üksust valitud`
        })}.`,
    "selectedItem": (args)=>`${args.item} valitud.`
};


var $e2b4dfe2d4d55739$exports = {};
$e2b4dfe2d4d55739$exports = {
    "deselectedItem": (args)=>`Kohdetta ${args.item} ei valittu.`,
    "longPressToSelect": `Siirry valintatilaan painamalla pitkään.`,
    "select": `Valitse`,
    "selectedAll": `Kaikki kohteet valittu.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Ei yhtään kohdetta valittu`,
            one: ()=>`${formatter.number(args.count)} kohde valittu`,
            other: ()=>`${formatter.number(args.count)} kohdetta valittu`
        })}.`,
    "selectedItem": (args)=>`${args.item} valittu.`
};


var $c06d6698d30993e7$exports = {};
$c06d6698d30993e7$exports = {
    "deselectedItem": (args)=>`${args.item} non sélectionné.`,
    "longPressToSelect": `Appuyez de manière prolongée pour passer en mode de sélection.`,
    "select": `Sélectionner`,
    "selectedAll": `Tous les éléments sélectionnés.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Aucun élément sélectionné`,
            one: ()=>`${formatter.number(args.count)} élément sélectionné`,
            other: ()=>`${formatter.number(args.count)} éléments sélectionnés`
        })}.`,
    "selectedItem": (args)=>`${args.item} sélectionné.`
};


var $e775713aa5566057$exports = {};
$e775713aa5566057$exports = {
    "deselectedItem": (args)=>`${args.item} לא נבחר.`,
    "longPressToSelect": `הקשה ארוכה לכניסה למצב בחירה.`,
    "select": `בחר`,
    "selectedAll": `כל הפריטים נבחרו.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `לא נבחרו פריטים`,
            one: ()=>`פריט ${formatter.number(args.count)} נבחר`,
            other: ()=>`${formatter.number(args.count)} פריטים נבחרו`
        })}.`,
    "selectedItem": (args)=>`${args.item} נבחר.`
};


var $a972cfeb69a51f5b$exports = {};
$a972cfeb69a51f5b$exports = {
    "deselectedItem": (args)=>`Stavka ${args.item} nije odabrana.`,
    "longPressToSelect": `Dugo pritisnite za ulazak u način odabira.`,
    "select": `Odaberite`,
    "selectedAll": `Odabrane su sve stavke.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nije odabrana nijedna stavka`,
            one: ()=>`Odabrana je ${formatter.number(args.count)} stavka`,
            other: ()=>`Odabrano je ${formatter.number(args.count)} stavki`
        })}.`,
    "selectedItem": (args)=>`Stavka ${args.item} je odabrana.`
};


var $a471da6bb87e6cd1$exports = {};
$a471da6bb87e6cd1$exports = {
    "deselectedItem": (args)=>`${args.item} nincs kijelölve.`,
    "longPressToSelect": `Nyomja hosszan a kijelöléshez.`,
    "select": `Kijelölés`,
    "selectedAll": `Az összes elem kijelölve.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Egy elem sincs kijelölve`,
            one: ()=>`${formatter.number(args.count)} elem kijelölve`,
            other: ()=>`${formatter.number(args.count)} elem kijelölve`
        })}.`,
    "selectedItem": (args)=>`${args.item} kijelölve.`
};


var $47879155027d6c95$exports = {};
$47879155027d6c95$exports = {
    "deselectedItem": (args)=>`${args.item} non selezionato.`,
    "longPressToSelect": `Premi a lungo per passare alla modalità di selezione.`,
    "select": `Seleziona`,
    "selectedAll": `Tutti gli elementi selezionati.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nessun elemento selezionato`,
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "selectedItem": (args)=>`${args.item} selezionato.`
};


var $9cd8dc003c2209e6$exports = {};
$9cd8dc003c2209e6$exports = {
    "deselectedItem": (args)=>`${args.item} が選択されていません。`,
    "longPressToSelect": `長押しして選択モードを開きます。`,
    "select": `選択`,
    "selectedAll": `すべての項目を選択しました。`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `項目が選択されていません`,
            one: ()=>`${formatter.number(args.count)} 項目を選択しました`,
            other: ()=>`${formatter.number(args.count)} 項目を選択しました`
        })}。`,
    "selectedItem": (args)=>`${args.item} を選択しました。`
};


var $a490b9448c5f2ded$exports = {};
$a490b9448c5f2ded$exports = {
    "deselectedItem": (args)=>`${args.item}이(가) 선택되지 않았습니다.`,
    "longPressToSelect": `선택 모드로 들어가려면 길게 누르십시오.`,
    "select": `선택`,
    "selectedAll": `모든 항목이 선택되었습니다.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `선택된 항목이 없습니다`,
            one: ()=>`${formatter.number(args.count)}개 항목이 선택되었습니다`,
            other: ()=>`${formatter.number(args.count)}개 항목이 선택되었습니다`
        })}.`,
    "selectedItem": (args)=>`${args.item}이(가) 선택되었습니다.`
};


var $99f69e0597841328$exports = {};
$99f69e0597841328$exports = {
    "deselectedItem": (args)=>`${args.item} nepasirinkta.`,
    "longPressToSelect": `Norėdami įjungti pasirinkimo režimą, paspauskite ir palaikykite.`,
    "select": `Pasirinkti`,
    "selectedAll": `Pasirinkti visi elementai.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nepasirinktas nė vienas elementas`,
            one: ()=>`Pasirinktas ${formatter.number(args.count)} elementas`,
            other: ()=>`Pasirinkta elementų: ${formatter.number(args.count)}`
        })}.`,
    "selectedItem": (args)=>`Pasirinkta: ${args.item}.`
};


var $28ac5b31e47d46d4$exports = {};
$28ac5b31e47d46d4$exports = {
    "deselectedItem": (args)=>`Vienums ${args.item} nav atlasīts.`,
    "longPressToSelect": `Ilgi turiet nospiestu. lai ieslēgtu atlases režīmu.`,
    "select": `Atlasīt`,
    "selectedAll": `Atlasīti visi vienumi.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nav atlasīts neviens vienums`,
            one: ()=>`Atlasīto vienumu skaits: ${formatter.number(args.count)}`,
            other: ()=>`Atlasīto vienumu skaits: ${formatter.number(args.count)}`
        })}.`,
    "selectedItem": (args)=>`Atlasīts vienums ${args.item}.`
};


var $d0ae97c9412add8b$exports = {};
$d0ae97c9412add8b$exports = {
    "deselectedItem": (args)=>`${args.item} er ikke valgt.`,
    "longPressToSelect": `Bruk et langt trykk for å gå inn i valgmodus.`,
    "select": `Velg`,
    "selectedAll": `Alle elementer er valgt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Ingen elementer er valgt`,
            one: ()=>`${formatter.number(args.count)} element er valgt`,
            other: ()=>`${formatter.number(args.count)} elementer er valgt`
        })}.`,
    "selectedItem": (args)=>`${args.item} er valgt.`
};


var $7e5335510891b8c3$exports = {};
$7e5335510891b8c3$exports = {
    "deselectedItem": (args)=>`${args.item} niet geselecteerd.`,
    "longPressToSelect": `Druk lang om de selectiemodus te openen.`,
    "select": `Selecteren`,
    "selectedAll": `Alle items geselecteerd.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Geen items geselecteerd`,
            one: ()=>`${formatter.number(args.count)} item geselecteerd`,
            other: ()=>`${formatter.number(args.count)} items geselecteerd`
        })}.`,
    "selectedItem": (args)=>`${args.item} geselecteerd.`
};


var $455cb5ebd5f6c27d$exports = {};
$455cb5ebd5f6c27d$exports = {
    "deselectedItem": (args)=>`Nie zaznaczono ${args.item}.`,
    "longPressToSelect": `Naciśnij i przytrzymaj, aby wejść do trybu wyboru.`,
    "select": `Zaznacz`,
    "selectedAll": `Wszystkie zaznaczone elementy.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nie zaznaczono żadnych elementów`,
            one: ()=>`${formatter.number(args.count)} zaznaczony element`,
            other: ()=>`${formatter.number(args.count)} zaznaczonych elementów`
        })}.`,
    "selectedItem": (args)=>`Zaznaczono ${args.item}.`
};


var $55020c522ee676a2$exports = {};
$55020c522ee676a2$exports = {
    "deselectedItem": (args)=>`${args.item} não selecionado.`,
    "longPressToSelect": `Mantenha pressionado para entrar no modo de seleção.`,
    "select": `Selecionar`,
    "selectedAll": `Todos os itens selecionados.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nenhum item selecionado`,
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}.`,
    "selectedItem": (args)=>`${args.item} selecionado.`
};


var $cc691e0f35e41c7f$exports = {};
$cc691e0f35e41c7f$exports = {
    "deselectedItem": (args)=>`${args.item} não selecionado.`,
    "longPressToSelect": `Prima continuamente para entrar no modo de seleção.`,
    "select": `Selecionar`,
    "selectedAll": `Todos os itens selecionados.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nenhum item selecionado`,
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}.`,
    "selectedItem": (args)=>`${args.item} selecionado.`
};


var $712b70af9d7e11e9$exports = {};
$712b70af9d7e11e9$exports = {
    "deselectedItem": (args)=>`${args.item} neselectat.`,
    "longPressToSelect": `Apăsați lung pentru a intra în modul de selectare.`,
    "select": `Selectare`,
    "selectedAll": `Toate elementele selectate.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Niciun element selectat`,
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "selectedItem": (args)=>`${args.item} selectat.`
};


var $c483d9d6d4bcff75$exports = {};
$c483d9d6d4bcff75$exports = {
    "deselectedItem": (args)=>`${args.item} не выбрано.`,
    "longPressToSelect": `Нажмите и удерживайте для входа в режим выбора.`,
    "select": `Выбрать`,
    "selectedAll": `Выбраны все элементы.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Нет выбранных элементов`,
            one: ()=>`${formatter.number(args.count)} элемент выбран`,
            other: ()=>`${formatter.number(args.count)} элементов выбрано`
        })}.`,
    "selectedItem": (args)=>`${args.item} выбрано.`
};


var $35bc9f18e7cf9157$exports = {};
$35bc9f18e7cf9157$exports = {
    "deselectedItem": (args)=>`Nevybraté položky: ${args.item}.`,
    "longPressToSelect": `Dlhším stlačením prejdite do režimu výberu.`,
    "select": `Vybrať`,
    "selectedAll": `Všetky vybraté položky.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Žiadne vybraté položky`,
            one: ()=>`${formatter.number(args.count)} vybratá položka`,
            other: ()=>`Počet vybratých položiek:${formatter.number(args.count)}`
        })}.`,
    "selectedItem": (args)=>`Vybraté položky: ${args.item}.`
};


var $e933d1373d8e91e0$exports = {};
$e933d1373d8e91e0$exports = {
    "deselectedItem": (args)=>`Element ${args.item} ni izbran.`,
    "longPressToSelect": `Za izbirni način pritisnite in dlje časa držite.`,
    "select": `Izberite`,
    "selectedAll": `Vsi elementi so izbrani.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Noben element ni izbran`,
            one: ()=>`${formatter.number(args.count)} element je izbran`,
            other: ()=>`${formatter.number(args.count)} elementov je izbranih`
        })}.`,
    "selectedItem": (args)=>`Element ${args.item} je izbran.`
};


var $77463d6521c72512$exports = {};
$77463d6521c72512$exports = {
    "deselectedItem": (args)=>`${args.item} nije izabrano.`,
    "longPressToSelect": `Dugo pritisnite za ulazak u režim biranja.`,
    "select": `Izaberite`,
    "selectedAll": `Izabrane su sve stavke.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nije izabrana nijedna stavka`,
            one: ()=>`Izabrana je ${formatter.number(args.count)} stavka`,
            other: ()=>`Izabrano je ${formatter.number(args.count)} stavki`
        })}.`,
    "selectedItem": (args)=>`${args.item} je izabrano.`
};


var $6380ab044222ca52$exports = {};
$6380ab044222ca52$exports = {
    "deselectedItem": (args)=>`${args.item} ej markerat.`,
    "longPressToSelect": `Tryck länge när du vill öppna väljarläge.`,
    "select": `Markera`,
    "selectedAll": `Alla markerade objekt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Inga markerade objekt`,
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "selectedItem": (args)=>`${args.item} markerat.`
};


var $9cb854f23a6ff322$exports = {};
$9cb854f23a6ff322$exports = {
    "deselectedItem": (args)=>`${args.item} seçilmedi.`,
    "longPressToSelect": `Seçim moduna girmek için uzun basın.`,
    "select": `Seç`,
    "selectedAll": `Tüm ögeler seçildi.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Hiçbir öge seçilmedi`,
            one: ()=>`${formatter.number(args.count)} öge seçildi`,
            other: ()=>`${formatter.number(args.count)} öge seçildi`
        })}.`,
    "selectedItem": (args)=>`${args.item} seçildi.`
};


var $912862d79e063c74$exports = {};
$912862d79e063c74$exports = {
    "deselectedItem": (args)=>`${args.item} не вибрано.`,
    "longPressToSelect": `Виконайте довге натиснення, щоб перейти в режим вибору.`,
    "select": `Вибрати`,
    "selectedAll": `Усі елементи вибрано.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Жодних елементів не вибрано`,
            one: ()=>`${formatter.number(args.count)} елемент вибрано`,
            other: ()=>`Вибрано елементів: ${formatter.number(args.count)}`
        })}.`,
    "selectedItem": (args)=>`${args.item} вибрано.`
};


var $91bb887772fd7ad4$exports = {};
$91bb887772fd7ad4$exports = {
    "deselectedItem": (args)=>`未选择 ${args.item}。`,
    "longPressToSelect": `长按以进入选择模式。`,
    "select": `选择`,
    "selectedAll": `已选择所有项目。`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `未选择项目`,
            one: ()=>`已选择 ${formatter.number(args.count)} 个项目`,
            other: ()=>`已选择 ${formatter.number(args.count)} 个项目`
        })}。`,
    "selectedItem": (args)=>`已选择 ${args.item}。`
};


var $a33ce76c4b030d83$exports = {};
$a33ce76c4b030d83$exports = {
    "deselectedItem": (args)=>`未選取「${args.item}」。`,
    "longPressToSelect": `長按以進入選擇模式。`,
    "select": `選取`,
    "selectedAll": `已選取所有項目。`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `未選取任何項目`,
            one: ()=>`已選取 ${formatter.number(args.count)} 個項目`,
            other: ()=>`已選取 ${formatter.number(args.count)} 個項目`
        })}。`,
    "selectedItem": (args)=>`已選取「${args.item}」。`
};


$cba28e4266d77056$exports = {
    "ar-AE": $6f42661ae0214332$exports,
    "bg-BG": $3e5d289b19f0fad9$exports,
    "cs-CZ": $786c35956e916979$exports,
    "da-DK": $7166f564b8fa3e8a$exports,
    "de-DE": $12fc5e32bb482de0$exports,
    "el-GR": $84b67ad15c785b2c$exports,
    "en-US": $86f7e6ba2423a35d$exports,
    "es-ES": $67f524d2f2545d56$exports,
    "et-EE": $d8df13f1dbf6e0c4$exports,
    "fi-FI": $e2b4dfe2d4d55739$exports,
    "fr-FR": $c06d6698d30993e7$exports,
    "he-IL": $e775713aa5566057$exports,
    "hr-HR": $a972cfeb69a51f5b$exports,
    "hu-HU": $a471da6bb87e6cd1$exports,
    "it-IT": $47879155027d6c95$exports,
    "ja-JP": $9cd8dc003c2209e6$exports,
    "ko-KR": $a490b9448c5f2ded$exports,
    "lt-LT": $99f69e0597841328$exports,
    "lv-LV": $28ac5b31e47d46d4$exports,
    "nb-NO": $d0ae97c9412add8b$exports,
    "nl-NL": $7e5335510891b8c3$exports,
    "pl-PL": $455cb5ebd5f6c27d$exports,
    "pt-BR": $55020c522ee676a2$exports,
    "pt-PT": $cc691e0f35e41c7f$exports,
    "ro-RO": $712b70af9d7e11e9$exports,
    "ru-RU": $c483d9d6d4bcff75$exports,
    "sk-SK": $35bc9f18e7cf9157$exports,
    "sl-SI": $e933d1373d8e91e0$exports,
    "sr-SP": $77463d6521c72512$exports,
    "sv-SE": $6380ab044222ca52$exports,
    "tr-TR": $9cb854f23a6ff322$exports,
    "uk-UA": $912862d79e063c74$exports,
    "zh-CN": $91bb887772fd7ad4$exports,
    "zh-TW": $a33ce76c4b030d83$exports
};





function $1eb174acfe8a0f16$export$137e594ef3218a10(props, state) {
    var _state_collection_getTextValue;
    let { getRowText: getRowText = (key)=>{
        var _state_collection, _state_collection_getTextValue1, _state_collection_getItem;
        return (_state_collection_getTextValue = (_state_collection_getTextValue1 = (_state_collection = state.collection).getTextValue) === null || _state_collection_getTextValue1 === void 0 ? void 0 : _state_collection_getTextValue1.call(_state_collection, key)) !== null && _state_collection_getTextValue !== void 0 ? _state_collection_getTextValue : (_state_collection_getItem = state.collection.getItem(key)) === null || _state_collection_getItem === void 0 ? void 0 : _state_collection_getItem.textValue;
    }  } = props;
    let stringFormatter = (0, $2oePb$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($cba28e4266d77056$exports))));
    // Many screen readers do not announce when items in a grid are selected/deselected.
    // We do this using an ARIA live region.
    let selection = state.selectionManager.rawSelection;
    let lastSelection = (0, $2oePb$react.useRef)(selection);
    (0, $2oePb$reactariautils.useUpdateEffect)(()=>{
        var _lastSelection_current;
        if (!state.selectionManager.isFocused) {
            lastSelection.current = selection;
            return;
        }
        let addedKeys = $1eb174acfe8a0f16$var$diffSelection(selection, lastSelection.current);
        let removedKeys = $1eb174acfe8a0f16$var$diffSelection(lastSelection.current, selection);
        // If adding or removing a single row from the selection, announce the name of that item.
        let isReplace = state.selectionManager.selectionBehavior === "replace";
        let messages = [];
        if (state.selectionManager.selectedKeys.size === 1 && isReplace) {
            if (state.collection.getItem(state.selectionManager.selectedKeys.keys().next().value)) {
                let currentSelectionText = getRowText(state.selectionManager.selectedKeys.keys().next().value);
                if (currentSelectionText) messages.push(stringFormatter.format("selectedItem", {
                    item: currentSelectionText
                }));
            }
        } else if (addedKeys.size === 1 && removedKeys.size === 0) {
            let addedText = getRowText(addedKeys.keys().next().value);
            if (addedText) messages.push(stringFormatter.format("selectedItem", {
                item: addedText
            }));
        } else if (removedKeys.size === 1 && addedKeys.size === 0) {
            if (state.collection.getItem(removedKeys.keys().next().value)) {
                let removedText = getRowText(removedKeys.keys().next().value);
                if (removedText) messages.push(stringFormatter.format("deselectedItem", {
                    item: removedText
                }));
            }
        }
        // Announce how many items are selected, except when selecting the first item.
        if (state.selectionManager.selectionMode === "multiple") {
            if (messages.length === 0 || selection === "all" || selection.size > 1 || lastSelection.current === "all" || ((_lastSelection_current = lastSelection.current) === null || _lastSelection_current === void 0 ? void 0 : _lastSelection_current.size) > 1) messages.push(selection === "all" ? stringFormatter.format("selectedAll") : stringFormatter.format("selectedCount", {
                count: selection.size
            }));
        }
        if (messages.length > 0) (0, $2oePb$reactarialiveannouncer.announce)(messages.join(" "));
        lastSelection.current = selection;
    }, [
        selection
    ]);
}
function $1eb174acfe8a0f16$var$diffSelection(a, b) {
    let res = new Set();
    if (a === "all" || b === "all") return res;
    for (let key of a.keys())if (!b.has(key)) res.add(key);
    return res;
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




function $340f2fcd0ef9ce8d$export$be42ebdab07ae4c2(props) {
    let stringFormatter = (0, $2oePb$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($cba28e4266d77056$exports))));
    let modality = (0, $2oePb$reactariainteractions.useInteractionModality)();
    // null is the default if the user hasn't interacted with the table at all yet or the rest of the page
    let shouldLongPress = (modality === "pointer" || modality === "virtual" || modality == null) && typeof window !== "undefined" && "ontouchstart" in window;
    let interactionDescription = (0, $2oePb$react.useMemo)(()=>{
        let selectionMode = props.selectionManager.selectionMode;
        let selectionBehavior = props.selectionManager.selectionBehavior;
        let message = undefined;
        if (shouldLongPress) message = stringFormatter.format("longPressToSelect");
        return selectionBehavior === "replace" && selectionMode !== "none" && props.hasItemActions ? message : undefined;
    }, [
        props.selectionManager.selectionMode,
        props.selectionManager.selectionBehavior,
        props.hasItemActions,
        stringFormatter,
        shouldLongPress
    ]);
    let descriptionProps = (0, $2oePb$reactariautils.useDescription)(interactionDescription);
    return descriptionProps;
}



function $11d770dfabe45077$export$f6b86a04e5d66d90(props, state, ref) {
    let { isVirtualized: isVirtualized , keyboardDelegate: keyboardDelegate , focusMode: focusMode , scrollRef: scrollRef , getRowText: getRowText , onRowAction: onRowAction , onCellAction: onCellAction  } = props;
    let { selectionManager: manager  } = state;
    if (!props["aria-label"] && !props["aria-labelledby"]) console.warn("An aria-label or aria-labelledby prop is required for accessibility.");
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $2oePb$reactariai18n.useCollator)({
        usage: "search",
        sensitivity: "base"
    });
    let { direction: direction  } = (0, $2oePb$reactariai18n.useLocale)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $2oePb$react.useMemo)(()=>keyboardDelegate || new (0, $3187c0e19200cb16$export$de9feff04fda126e)({
            collection: state.collection,
            disabledKeys: disabledBehavior === "selection" ? new Set() : state.disabledKeys,
            ref: ref,
            direction: direction,
            collator: collator,
            focusMode: focusMode
        }), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        disabledBehavior,
        ref,
        direction,
        collator,
        focusMode
    ]);
    let { collectionProps: collectionProps  } = (0, $2oePb$reactariaselection.useSelectableCollection)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        isVirtualized: isVirtualized,
        scrollRef: scrollRef
    });
    let id = (0, $2oePb$reactariautils.useId)(props.id);
    (0, $8ee34951196858d0$export$e6235c0d09b995d0).set(state, {
        keyboardDelegate: delegate,
        actions: {
            onRowAction: onRowAction,
            onCellAction: onCellAction
        }
    });
    let descriptionProps = (0, $340f2fcd0ef9ce8d$export$be42ebdab07ae4c2)({
        selectionManager: manager,
        hasItemActions: !!(onRowAction || onCellAction)
    });
    let domProps = (0, $2oePb$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    let onFocus = (0, $2oePb$react.useCallback)((e)=>{
        if (manager.isFocused) {
            // If a focus event bubbled through a portal, reset focus state.
            if (!e.currentTarget.contains(e.target)) manager.setFocused(false);
            return;
        }
        // Focus events can bubble through portals. Ignore these events.
        if (!e.currentTarget.contains(e.target)) return;
        manager.setFocused(true);
    }, [
        manager
    ]);
    // Continue to track collection focused state even if keyboard navigation is disabled
    let navDisabledHandlers = (0, $2oePb$react.useMemo)(()=>({
            onBlur: collectionProps.onBlur,
            onFocus: onFocus
        }), [
        onFocus,
        collectionProps.onBlur
    ]);
    let hasTabbableChild = (0, $2oePb$reactariafocus.useHasTabbableChild)(ref, {
        isDisabled: state.collection.size !== 0
    });
    let gridProps = (0, $2oePb$reactariautils.mergeProps)(domProps, {
        role: "grid",
        id: id,
        "aria-multiselectable": manager.selectionMode === "multiple" ? "true" : undefined
    }, state.isKeyboardNavigationDisabled ? navDisabledHandlers : collectionProps, // If collection is empty, make sure the grid is tabbable unless there is a child tabbable element.
    state.collection.size === 0 && {
        tabIndex: hasTabbableChild ? -1 : 0
    }, descriptionProps);
    if (isVirtualized) {
        gridProps["aria-rowcount"] = state.collection.size;
        gridProps["aria-colcount"] = state.collection.columnCount;
    }
    (0, $1eb174acfe8a0f16$export$137e594ef3218a10)({
        getRowText: getRowText
    }, state);
    return {
        gridProps: gridProps
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
 */ function $c7def85a57100898$export$d3037f5d3f3e51bf() {
    return {
        rowGroupProps: {
            role: "rowgroup"
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

function $eed398987c639831$export$96357d5a73f686fa(props, state, ref) {
    let { node: node , isVirtualized: isVirtualized , shouldSelectOnPressUp: shouldSelectOnPressUp , onAction: onAction  } = props;
    let { actions: { onRowAction: onRowAction  }  } = (0, $8ee34951196858d0$export$e6235c0d09b995d0).get(state);
    let { itemProps: itemProps , ...states } = (0, $2oePb$reactariaselection.useSelectableItem)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        onAction: onRowAction ? ()=>onRowAction(node.key) : onAction,
        isDisabled: state.collection.size === 0
    });
    let isSelected = state.selectionManager.isSelected(node.key);
    let rowProps = {
        role: "row",
        "aria-selected": state.selectionManager.selectionMode !== "none" ? isSelected : undefined,
        "aria-disabled": states.isDisabled || undefined,
        ...itemProps
    };
    if (isVirtualized) rowProps["aria-rowindex"] = node.index + 1; // aria-rowindex is 1 based
    return {
        rowProps: rowProps,
        ...states
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





function $cf2021be63b01ef4$export$c7e10bfc0c59f67c(props, state, ref) {
    let { node: node , isVirtualized: isVirtualized , focusMode: focusMode = "child" , shouldSelectOnPressUp: shouldSelectOnPressUp , onAction: onAction  } = props;
    let { direction: direction  } = (0, $2oePb$reactariai18n.useLocale)();
    let { keyboardDelegate: keyboardDelegate , actions: { onCellAction: onCellAction  }  } = (0, $8ee34951196858d0$export$e6235c0d09b995d0).get(state);
    // Handles focusing the cell. If there is a focusable child,
    // it is focused, otherwise the cell itself is focused.
    let focus = ()=>{
        let treeWalker = (0, $2oePb$reactariafocus.getFocusableTreeWalker)(ref.current);
        if (focusMode === "child") {
            // If focus is already on a focusable child within the cell, early return so we don't shift focus
            if (ref.current.contains(document.activeElement) && ref.current !== document.activeElement) return;
            let focusable = state.selectionManager.childFocusStrategy === "last" ? $cf2021be63b01ef4$var$last(treeWalker) : treeWalker.firstChild();
            if (focusable) {
                (0, $2oePb$reactariafocus.focusSafely)(focusable);
                return;
            }
        }
        if (!ref.current.contains(document.activeElement)) (0, $2oePb$reactariafocus.focusSafely)(ref.current);
    };
    let { itemProps: itemProps , isPressed: isPressed  } = (0, $2oePb$reactariaselection.useSelectableItem)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        focus: focus,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        onAction: onCellAction ? ()=>onCellAction(node.key) : onAction,
        isDisabled: state.collection.size === 0
    });
    let onKeyDownCapture = (e)=>{
        if (!e.currentTarget.contains(e.target) || state.isKeyboardNavigationDisabled) return;
        let walker = (0, $2oePb$reactariafocus.getFocusableTreeWalker)(ref.current);
        walker.currentNode = document.activeElement;
        switch(e.key){
            case "ArrowLeft":
                {
                    // Find the next focusable element within the cell.
                    let focusable = direction === "rtl" ? walker.nextNode() : walker.previousNode();
                    // Don't focus the cell itself if focusMode is "child"
                    if (focusMode === "child" && focusable === ref.current) focusable = null;
                    if (focusable) {
                        e.preventDefault();
                        e.stopPropagation();
                        (0, $2oePb$reactariafocus.focusSafely)(focusable);
                        (0, $2oePb$reactariautils.scrollIntoViewport)(focusable, {
                            containingElement: (0, $2oePb$reactariautils.getScrollParent)(ref.current)
                        });
                    } else {
                        // If there is no next focusable child, then move to the next cell to the left of this one.
                        // This will be handled by useSelectableCollection. However, if there is no cell to the left
                        // of this one, only one column, and the grid doesn't focus rows, then the next key will be the
                        // same as this one. In that case we need to handle focusing either the cell or the first/last
                        // child, depending on the focus mode.
                        let prev = keyboardDelegate.getKeyLeftOf(node.key);
                        if (prev !== node.key) break;
                        e.preventDefault();
                        e.stopPropagation();
                        if (focusMode === "cell" && direction === "rtl") {
                            (0, $2oePb$reactariafocus.focusSafely)(ref.current);
                            (0, $2oePb$reactariautils.scrollIntoViewport)(ref.current, {
                                containingElement: (0, $2oePb$reactariautils.getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            focusable = direction === "rtl" ? walker.firstChild() : $cf2021be63b01ef4$var$last(walker);
                            if (focusable) {
                                (0, $2oePb$reactariafocus.focusSafely)(focusable);
                                (0, $2oePb$reactariautils.scrollIntoViewport)(focusable, {
                                    containingElement: (0, $2oePb$reactariautils.getScrollParent)(ref.current)
                                });
                            }
                        }
                    }
                    break;
                }
            case "ArrowRight":
                {
                    let focusable1 = direction === "rtl" ? walker.previousNode() : walker.nextNode();
                    if (focusMode === "child" && focusable1 === ref.current) focusable1 = null;
                    if (focusable1) {
                        e.preventDefault();
                        e.stopPropagation();
                        (0, $2oePb$reactariafocus.focusSafely)(focusable1);
                        (0, $2oePb$reactariautils.scrollIntoViewport)(focusable1, {
                            containingElement: (0, $2oePb$reactariautils.getScrollParent)(ref.current)
                        });
                    } else {
                        let next = keyboardDelegate.getKeyRightOf(node.key);
                        if (next !== node.key) break;
                        e.preventDefault();
                        e.stopPropagation();
                        if (focusMode === "cell" && direction === "ltr") {
                            (0, $2oePb$reactariafocus.focusSafely)(ref.current);
                            (0, $2oePb$reactariautils.scrollIntoViewport)(ref.current, {
                                containingElement: (0, $2oePb$reactariautils.getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            focusable1 = direction === "rtl" ? $cf2021be63b01ef4$var$last(walker) : walker.firstChild();
                            if (focusable1) {
                                (0, $2oePb$reactariafocus.focusSafely)(focusable1);
                                (0, $2oePb$reactariautils.scrollIntoViewport)(focusable1, {
                                    containingElement: (0, $2oePb$reactariautils.getScrollParent)(ref.current)
                                });
                            }
                        }
                    }
                    break;
                }
            case "ArrowUp":
            case "ArrowDown":
                // Prevent this event from reaching cell children, e.g. menu buttons. We want arrow keys to navigate
                // to the cell above/below instead. We need to re-dispatch the event from a higher parent so it still
                // bubbles and gets handled by useSelectableCollection.
                if (!e.altKey && ref.current.contains(e.target)) {
                    e.stopPropagation();
                    e.preventDefault();
                    ref.current.parentElement.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                }
                break;
        }
    };
    // Grid cells can have focusable elements inside them. In this case, focus should
    // be marshalled to that element rather than focusing the cell itself.
    let onFocus = (e)=>{
        if (e.target !== ref.current) {
            // useSelectableItem only handles setting the focused key when
            // the focused element is the gridcell itself. We also want to
            // set the focused key when a child element receives focus.
            // If focus is currently visible (e.g. the user is navigating with the keyboard),
            // then skip this. We want to restore focus to the previously focused row/cell
            // in that case since the table should act like a single tab stop.
            if (!(0, $2oePb$reactariainteractions.isFocusVisible)()) state.selectionManager.setFocusedKey(node.key);
            return;
        }
        // If the cell itself is focused, wait a frame so that focus finishes propagatating
        // up to the tree, and move focus to a focusable child if possible.
        requestAnimationFrame(()=>{
            if (focusMode === "child" && document.activeElement === ref.current) focus();
        });
    };
    let gridCellProps = (0, $2oePb$reactariautils.mergeProps)(itemProps, {
        role: "gridcell",
        onKeyDownCapture: onKeyDownCapture,
        onFocus: onFocus
    });
    var _node_colIndex;
    if (isVirtualized) gridCellProps["aria-colindex"] = ((_node_colIndex = node.colIndex) !== null && _node_colIndex !== void 0 ? _node_colIndex : node.index) + 1; // aria-colindex is 1-based
    // When pressing with a pointer and cell selection is not enabled, usePress will be applied to the
    // row rather than the cell. However, when the row is draggable, usePress cannot preventDefault
    // on pointer down, so the browser will try to focus the cell which has a tabIndex applied.
    // To avoid this, remove the tabIndex from the cell briefly on pointer down.
    if (shouldSelectOnPressUp && gridCellProps.tabIndex != null && gridCellProps.onPointerDown == null) gridCellProps.onPointerDown = (e)=>{
        let el = e.currentTarget;
        let tabindex = el.getAttribute("tabindex");
        el.removeAttribute("tabindex");
        requestAnimationFrame(()=>{
            el.setAttribute("tabindex", tabindex);
        });
    };
    return {
        gridCellProps: gridCellProps,
        isPressed: isPressed
    };
}
function $cf2021be63b01ef4$var$last(walker) {
    let next;
    let last;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}





function $d8385f73d3701365$export$70e2eed1a92976ad(props, state) {
    let { key: key  } = props;
    let manager = state.selectionManager;
    let checkboxId = (0, $2oePb$reactariautils.useId)();
    let isDisabled = !state.selectionManager.canSelectItem(key);
    let isSelected = state.selectionManager.isSelected(key);
    let onChange = ()=>manager.select(key);
    const stringFormatter = (0, $2oePb$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($cba28e4266d77056$exports))));
    return {
        checkboxProps: {
            id: checkboxId,
            "aria-label": stringFormatter.format("select"),
            isSelected: isSelected,
            isDisabled: isDisabled,
            onChange: onChange
        }
    };
}






//# sourceMappingURL=main.js.map
