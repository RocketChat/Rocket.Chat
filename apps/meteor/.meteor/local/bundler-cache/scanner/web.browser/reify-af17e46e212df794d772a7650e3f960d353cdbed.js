module.export({useTableRowGroup:()=>$0047e6c294ea075f$export$6fb1613bd7b28198,useTable:()=>$6e31608fbba75bab$export$25bceaac3c7e4dc7,useTableColumnHeader:()=>$f329116d8ad0aba0$export$9514819a8c81e960,useTableRow:()=>$b2db214c022798eb$export$7f2f6ae19e707aa5,useTableHeaderRow:()=>$f917ee10f4c32dab$export$1b95a7d2d517b841,useTableCell:()=>$7713593715703b24$export$49571c903d73624c,useTableSelectionCheckbox:()=>$2a795c53a101c542$export$16ea7f650bd7c1bb,useTableSelectAllCheckbox:()=>$2a795c53a101c542$export$1003db6a7e384b99,useTableColumnResize:()=>$e91ef4e5004e3774$export$52994e973806c219});let $lJcFS$useGridRowGroup,$lJcFS$useGrid,$lJcFS$GridKeyboardDelegate,$lJcFS$useGridCell,$lJcFS$useGridRow,$lJcFS$useGridSelectionCheckbox;module.link("@react-aria/grid",{useGridRowGroup(v){$lJcFS$useGridRowGroup=v},useGrid(v){$lJcFS$useGrid=v},GridKeyboardDelegate(v){$lJcFS$GridKeyboardDelegate=v},useGridCell(v){$lJcFS$useGridCell=v},useGridRow(v){$lJcFS$useGridRow=v},useGridSelectionCheckbox(v){$lJcFS$useGridSelectionCheckbox=v}},0);let $lJcFS$announce;module.link("@react-aria/live-announcer",{announce(v){$lJcFS$announce=v}},1);let $lJcFS$useId,$lJcFS$useDescription,$lJcFS$useUpdateEffect,$lJcFS$mergeProps,$lJcFS$isAndroid,$lJcFS$focusWithoutScrolling;module.link("@react-aria/utils",{useId(v){$lJcFS$useId=v},useDescription(v){$lJcFS$useDescription=v},useUpdateEffect(v){$lJcFS$useUpdateEffect=v},mergeProps(v){$lJcFS$mergeProps=v},isAndroid(v){$lJcFS$isAndroid=v},focusWithoutScrolling(v){$lJcFS$focusWithoutScrolling=v}},2);let $lJcFS$useMemo,$lJcFS$useRef,$lJcFS$useCallback;module.link("react",{useMemo(v){$lJcFS$useMemo=v},useRef(v){$lJcFS$useRef=v},useCallback(v){$lJcFS$useCallback=v}},3);let $lJcFS$useCollator,$lJcFS$useLocale,$lJcFS$useLocalizedStringFormatter;module.link("@react-aria/i18n",{useCollator(v){$lJcFS$useCollator=v},useLocale(v){$lJcFS$useLocale=v},useLocalizedStringFormatter(v){$lJcFS$useLocalizedStringFormatter=v}},4);let $lJcFS$getFirstItem,$lJcFS$getChildNodes,$lJcFS$getNthItem;module.link("@react-stately/collections",{getFirstItem(v){$lJcFS$getFirstItem=v},getChildNodes(v){$lJcFS$getChildNodes=v},getNthItem(v){$lJcFS$getNthItem=v}},5);let $lJcFS$useFocusable,$lJcFS$focusSafely;module.link("@react-aria/focus",{useFocusable(v){$lJcFS$useFocusable=v},focusSafely(v){$lJcFS$focusSafely=v}},6);let $lJcFS$usePress,$lJcFS$useKeyboard,$lJcFS$useMove,$lJcFS$useInteractionModality;module.link("@react-aria/interactions",{usePress(v){$lJcFS$usePress=v},useKeyboard(v){$lJcFS$useKeyboard=v},useMove(v){$lJcFS$useMove=v},useInteractionModality(v){$lJcFS$useInteractionModality=v}},7);let $lJcFS$useVisuallyHidden;module.link("@react-aria/visually-hidden",{useVisuallyHidden(v){$lJcFS$useVisuallyHidden=v}},8);









function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
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
 */ const $2140fb2337097f2d$export$552312adfd451dab = new WeakMap();
function $2140fb2337097f2d$var$normalizeKey(key) {
    if (typeof key === "string") return key.replace(/\s*/g, "");
    return "" + key;
}
function $2140fb2337097f2d$export$37cd4213f2ad742e(state, columnKey) {
    let gridId = $2140fb2337097f2d$export$552312adfd451dab.get(state);
    if (!gridId) throw new Error("Unknown grid");
    return `${gridId}-${$2140fb2337097f2d$var$normalizeKey(columnKey)}`;
}
function $2140fb2337097f2d$export$19baff3266315d44(state, rowKey, columnKey) {
    let gridId = $2140fb2337097f2d$export$552312adfd451dab.get(state);
    if (!gridId) throw new Error("Unknown grid");
    return `${gridId}-${$2140fb2337097f2d$var$normalizeKey(rowKey)}-${$2140fb2337097f2d$var$normalizeKey(columnKey)}`;
}
function $2140fb2337097f2d$export$85069b70317f543(state, rowKey) {
    // A row is labelled by it's row headers.
    return [
        ...state.collection.rowHeaderColumnKeys
    ].map((columnKey)=>$2140fb2337097f2d$export$19baff3266315d44(state, rowKey, columnKey)).join(" ");
}


var $ae7e9c471762b4d3$exports = {};
var $ce3de3ff2fd66848$exports = {};
$ce3de3ff2fd66848$exports = {
    "ascending": `تصاعدي`,
    "ascendingSort": (args)=>`ترتيب حسب العمود ${args.columnName} بترتيب تصاعدي`,
    "columnSize": (args)=>`${args.value} بالبكسل`,
    "descending": `تنازلي`,
    "descendingSort": (args)=>`ترتيب حسب العمود ${args.columnName} بترتيب تنازلي`,
    "resizerDescription": `اضغط على مفتاح Enter لبدء تغيير الحجم`,
    "select": `تحديد`,
    "selectAll": `تحديد الكل`,
    "sortable": `عمود قابل للترتيب`
};


var $cb80dcce530985b9$exports = {};
$cb80dcce530985b9$exports = {
    "ascending": `възходящ`,
    "ascendingSort": (args)=>`сортирано по колона ${args.columnName} във възходящ ред`,
    "columnSize": (args)=>`${args.value} пиксела`,
    "descending": `низходящ`,
    "descendingSort": (args)=>`сортирано по колона ${args.columnName} в низходящ ред`,
    "resizerDescription": `Натиснете „Enter“, за да започнете да преоразмерявате`,
    "select": `Изберете`,
    "selectAll": `Изберете всичко`,
    "sortable": `сортираща колона`
};


var $68ac86749db4c0fb$exports = {};
$68ac86749db4c0fb$exports = {
    "ascending": `vzestupně`,
    "ascendingSort": (args)=>`řazeno vzestupně podle sloupce ${args.columnName}`,
    "columnSize": (args)=>`${args.value} pixelů`,
    "descending": `sestupně`,
    "descendingSort": (args)=>`řazeno sestupně podle sloupce ${args.columnName}`,
    "resizerDescription": `Stisknutím klávesy Enter začnete měnit velikost`,
    "select": `Vybrat`,
    "selectAll": `Vybrat vše`,
    "sortable": `sloupec s možností řazení`
};


var $9a6cbac08487e661$exports = {};
$9a6cbac08487e661$exports = {
    "ascending": `stigende`,
    "ascendingSort": (args)=>`sorteret efter kolonne ${args.columnName} i stigende rækkefølge`,
    "columnSize": (args)=>`${args.value} pixels`,
    "descending": `faldende`,
    "descendingSort": (args)=>`sorteret efter kolonne ${args.columnName} i faldende rækkefølge`,
    "resizerDescription": `Tryk på Enter for at ændre størrelse`,
    "select": `Vælg`,
    "selectAll": `Vælg alle`,
    "sortable": `sorterbar kolonne`
};


var $c963661d89486e72$exports = {};
$c963661d89486e72$exports = {
    "ascending": `aufsteigend`,
    "ascendingSort": (args)=>`sortiert nach Spalte ${args.columnName} in aufsteigender Reihenfolge`,
    "columnSize": (args)=>`${args.value} Pixel`,
    "descending": `absteigend`,
    "descendingSort": (args)=>`sortiert nach Spalte ${args.columnName} in absteigender Reihenfolge`,
    "resizerDescription": `Eingabetaste zum Starten der Größenänderung drücken`,
    "select": `Auswählen`,
    "selectAll": `Alles auswählen`,
    "sortable": `sortierbare Spalte`
};


var $ac03861c6e8605f4$exports = {};
$ac03861c6e8605f4$exports = {
    "ascending": `αύξουσα`,
    "ascendingSort": (args)=>`διαλογή ανά στήλη ${args.columnName} σε αύξουσα σειρά`,
    "columnSize": (args)=>`${args.value} pixel`,
    "descending": `φθίνουσα`,
    "descendingSort": (args)=>`διαλογή ανά στήλη ${args.columnName} σε φθίνουσα σειρά`,
    "resizerDescription": `Πατήστε Enter για έναρξη της αλλαγής μεγέθους`,
    "select": `Επιλογή`,
    "selectAll": `Επιλογή όλων`,
    "sortable": `Στήλη διαλογής`
};


var $09e6b82e0d6e466a$exports = {};
$09e6b82e0d6e466a$exports = {
    "select": `Select`,
    "selectAll": `Select All`,
    "sortable": `sortable column`,
    "ascending": `ascending`,
    "descending": `descending`,
    "ascendingSort": (args)=>`sorted by column ${args.columnName} in ascending order`,
    "descendingSort": (args)=>`sorted by column ${args.columnName} in descending order`,
    "columnSize": (args)=>`${args.value} pixels`,
    "resizerDescription": `Press Enter to start resizing`
};


var $8cc39eb66c2bf220$exports = {};
$8cc39eb66c2bf220$exports = {
    "ascending": `de subida`,
    "ascendingSort": (args)=>`ordenado por columna ${args.columnName} en orden de subida`,
    "columnSize": (args)=>`${args.value} píxeles`,
    "descending": `de bajada`,
    "descendingSort": (args)=>`ordenado por columna ${args.columnName} en orden de bajada`,
    "resizerDescription": `Pulse Intro para empezar a redimensionar`,
    "select": `Seleccionar`,
    "selectAll": `Seleccionar todos`,
    "sortable": `columna ordenable`
};


var $4e11db3c25a38112$exports = {};
$4e11db3c25a38112$exports = {
    "ascending": `tõusev järjestus`,
    "ascendingSort": (args)=>`sorditud veeru järgi ${args.columnName} tõusvas järjestuses`,
    "columnSize": (args)=>`${args.value} pikslit`,
    "descending": `laskuv järjestus`,
    "descendingSort": (args)=>`sorditud veeru järgi ${args.columnName} laskuvas järjestuses`,
    "resizerDescription": `Suuruse muutmise alustamiseks vajutage klahvi Enter`,
    "select": `Vali`,
    "selectAll": `Vali kõik`,
    "sortable": `sorditav veerg`
};


var $da1e751a92575e02$exports = {};
$da1e751a92575e02$exports = {
    "ascending": `nouseva`,
    "ascendingSort": (args)=>`lajiteltu sarakkeen ${args.columnName} mukaan nousevassa järjestyksessä`,
    "columnSize": (args)=>`${args.value} pikseliä`,
    "descending": `laskeva`,
    "descendingSort": (args)=>`lajiteltu sarakkeen ${args.columnName} mukaan laskevassa järjestyksessä`,
    "resizerDescription": `Aloita koon muutos painamalla Enter-näppäintä`,
    "select": `Valitse`,
    "selectAll": `Valitse kaikki`,
    "sortable": `lajiteltava sarake`
};


var $1b5d6c6c47d55106$exports = {};
$1b5d6c6c47d55106$exports = {
    "ascending": `croissant`,
    "ascendingSort": (args)=>`trié en fonction de la colonne ${args.columnName} par ordre croissant`,
    "columnSize": (args)=>`${args.value} pixels`,
    "descending": `décroissant`,
    "descendingSort": (args)=>`trié en fonction de la colonne ${args.columnName} par ordre décroissant`,
    "resizerDescription": `Appuyez sur Entrée pour commencer le redimensionnement.`,
    "select": `Sélectionner`,
    "selectAll": `Sélectionner tout`,
    "sortable": `colonne triable`
};


var $7c18ba27b86d3308$exports = {};
$7c18ba27b86d3308$exports = {
    "ascending": `עולה`,
    "ascendingSort": (args)=>`מוין לפי עמודה ${args.columnName} בסדר עולה`,
    "columnSize": (args)=>`${args.value} פיקסלים`,
    "descending": `יורד`,
    "descendingSort": (args)=>`מוין לפי עמודה ${args.columnName} בסדר יורד`,
    "resizerDescription": `הקש Enter כדי לשנות את הגודל`,
    "select": `בחר`,
    "selectAll": `בחר הכול`,
    "sortable": `עמודה שניתן למיין`
};


var $2cb40998e20e8a46$exports = {};
$2cb40998e20e8a46$exports = {
    "ascending": `rastući`,
    "ascendingSort": (args)=>`razvrstano po stupcima ${args.columnName} rastućem redoslijedom`,
    "columnSize": (args)=>`${args.value} piksela`,
    "descending": `padajući`,
    "descendingSort": (args)=>`razvrstano po stupcima ${args.columnName} padajućim redoslijedom`,
    "resizerDescription": `Pritisnite Enter da biste započeli promenu veličine`,
    "select": `Odaberite`,
    "selectAll": `Odaberite sve`,
    "sortable": `stupac koji se može razvrstati`
};


var $189e23eec1d6aa3a$exports = {};
$189e23eec1d6aa3a$exports = {
    "ascending": `növekvő`,
    "ascendingSort": (args)=>`rendezve a(z) ${args.columnName} oszlop szerint, növekvő sorrendben`,
    "columnSize": (args)=>`${args.value} képpont`,
    "descending": `csökkenő`,
    "descendingSort": (args)=>`rendezve a(z) ${args.columnName} oszlop szerint, csökkenő sorrendben`,
    "resizerDescription": `Nyomja le az Enter billentyűt az átméretezés megkezdéséhez`,
    "select": `Kijelölés`,
    "selectAll": `Összes kijelölése`,
    "sortable": `rendezendő oszlop`
};


var $3c5ec8e4f015dfd0$exports = {};
$3c5ec8e4f015dfd0$exports = {
    "ascending": `crescente`,
    "ascendingSort": (args)=>`in ordine crescente in base alla colonna ${args.columnName}`,
    "columnSize": (args)=>`${args.value} pixel`,
    "descending": `decrescente`,
    "descendingSort": (args)=>`in ordine decrescente in base alla colonna ${args.columnName}`,
    "resizerDescription": `Premi Invio per iniziare a ridimensionare`,
    "select": `Seleziona`,
    "selectAll": `Seleziona tutto`,
    "sortable": `colonna ordinabile`
};


var $d021d50e6b315ebb$exports = {};
$d021d50e6b315ebb$exports = {
    "ascending": `昇順`,
    "ascendingSort": (args)=>`列 ${args.columnName} を昇順で並べ替え`,
    "columnSize": (args)=>`${args.value} ピクセル`,
    "descending": `降順`,
    "descendingSort": (args)=>`列 ${args.columnName} を降順で並べ替え`,
    "resizerDescription": `Enter キーを押してサイズ変更を開始`,
    "select": `選択`,
    "selectAll": `すべて選択`,
    "sortable": `並べ替え可能な列`
};


var $52535c35c24ec937$exports = {};
$52535c35c24ec937$exports = {
    "ascending": `오름차순`,
    "ascendingSort": (args)=>`${args.columnName} 열을 기준으로 오름차순으로 정렬됨`,
    "columnSize": (args)=>`${args.value} 픽셀`,
    "descending": `내림차순`,
    "descendingSort": (args)=>`${args.columnName} 열을 기준으로 내림차순으로 정렬됨`,
    "resizerDescription": `크기 조정을 시작하려면 Enter를 누르세요.`,
    "select": `선택`,
    "selectAll": `모두 선택`,
    "sortable": `정렬 가능한 열`
};


var $b37ee03672edfd1d$exports = {};
$b37ee03672edfd1d$exports = {
    "ascending": `didėjančia tvarka`,
    "ascendingSort": (args)=>`surikiuota pagal stulpelį ${args.columnName} didėjančia tvarka`,
    "columnSize": (args)=>`${args.value} piks.`,
    "descending": `mažėjančia tvarka`,
    "descendingSort": (args)=>`surikiuota pagal stulpelį ${args.columnName} mažėjančia tvarka`,
    "resizerDescription": `Paspauskite „Enter“, kad pradėtumėte keisti dydį`,
    "select": `Pasirinkti`,
    "selectAll": `Pasirinkti viską`,
    "sortable": `rikiuojamas stulpelis`
};


var $c7df6686b4189d56$exports = {};
$c7df6686b4189d56$exports = {
    "ascending": `augošā secībā`,
    "ascendingSort": (args)=>`kārtots pēc kolonnas ${args.columnName} augošā secībā`,
    "columnSize": (args)=>`${args.value} pikseļi`,
    "descending": `dilstošā secībā`,
    "descendingSort": (args)=>`kārtots pēc kolonnas ${args.columnName} dilstošā secībā`,
    "resizerDescription": `Nospiediet Enter, lai sāktu izmēru mainīšanu`,
    "select": `Atlasīt`,
    "selectAll": `Atlasīt visu`,
    "sortable": `kārtojamā kolonna`
};


var $da07fe8ec87e6b68$exports = {};
$da07fe8ec87e6b68$exports = {
    "ascending": `stigende`,
    "ascendingSort": (args)=>`sortert etter kolonne ${args.columnName} i stigende rekkefølge`,
    "columnSize": (args)=>`${args.value} piksler`,
    "descending": `synkende`,
    "descendingSort": (args)=>`sortert etter kolonne ${args.columnName} i synkende rekkefølge`,
    "resizerDescription": `Trykk på Enter for å starte størrelsesendring`,
    "select": `Velg`,
    "selectAll": `Velg alle`,
    "sortable": `kolonne som kan sorteres`
};


var $64b7e390f5791490$exports = {};
$64b7e390f5791490$exports = {
    "ascending": `oplopend`,
    "ascendingSort": (args)=>`gesorteerd in oplopende volgorde in kolom ${args.columnName}`,
    "columnSize": (args)=>`${args.value} pixels`,
    "descending": `aflopend`,
    "descendingSort": (args)=>`gesorteerd in aflopende volgorde in kolom ${args.columnName}`,
    "resizerDescription": `Druk op Enter om het formaat te wijzigen`,
    "select": `Selecteren`,
    "selectAll": `Alles selecteren`,
    "sortable": `sorteerbare kolom`
};


var $2a03621e773f1678$exports = {};
$2a03621e773f1678$exports = {
    "ascending": `rosnąco`,
    "ascendingSort": (args)=>`posortowano według kolumny ${args.columnName} w porządku rosnącym`,
    "columnSize": (args)=>`Liczba pikseli: ${args.value}`,
    "descending": `malejąco`,
    "descendingSort": (args)=>`posortowano według kolumny ${args.columnName} w porządku malejącym`,
    "resizerDescription": `Naciśnij Enter, aby rozpocząć zmienianie rozmiaru`,
    "select": `Zaznacz`,
    "selectAll": `Zaznacz wszystko`,
    "sortable": `kolumna z możliwością sortowania`
};


var $0a79c0aba9e5ecc6$exports = {};
$0a79c0aba9e5ecc6$exports = {
    "ascending": `crescente`,
    "ascendingSort": (args)=>`classificado pela coluna ${args.columnName} em ordem crescente`,
    "columnSize": (args)=>`${args.value} pixels`,
    "descending": `decrescente`,
    "descendingSort": (args)=>`classificado pela coluna ${args.columnName} em ordem decrescente`,
    "resizerDescription": `Pressione Enter para começar a redimensionar`,
    "select": `Selecionar`,
    "selectAll": `Selecionar tudo`,
    "sortable": `coluna classificável`
};


var $de7b4d0f7dc86fc8$exports = {};
$de7b4d0f7dc86fc8$exports = {
    "ascending": `ascendente`,
    "ascendingSort": (args)=>`Ordenar por coluna ${args.columnName} em ordem ascendente`,
    "columnSize": (args)=>`${args.value} pixels`,
    "descending": `descendente`,
    "descendingSort": (args)=>`Ordenar por coluna ${args.columnName} em ordem descendente`,
    "resizerDescription": `Prima Enter para iniciar o redimensionamento`,
    "select": `Selecionar`,
    "selectAll": `Selecionar tudo`,
    "sortable": `Coluna ordenável`
};


var $28ea7e849d77bd1c$exports = {};
$28ea7e849d77bd1c$exports = {
    "ascending": `crescătoare`,
    "ascendingSort": (args)=>`sortate după coloana ${args.columnName} în ordine crescătoare`,
    "columnSize": (args)=>`${args.value} pixeli`,
    "descending": `descrescătoare`,
    "descendingSort": (args)=>`sortate după coloana ${args.columnName} în ordine descrescătoare`,
    "resizerDescription": `Apăsați pe Enter pentru a începe redimensionarea`,
    "select": `Selectare`,
    "selectAll": `Selectare totală`,
    "sortable": `coloană sortabilă`
};


var $9a09321cf046b187$exports = {};
$9a09321cf046b187$exports = {
    "ascending": `возрастание`,
    "ascendingSort": (args)=>`сортировать столбец ${args.columnName} в порядке возрастания`,
    "columnSize": (args)=>`${args.value} пикс.`,
    "descending": `убывание`,
    "descendingSort": (args)=>`сортировать столбец ${args.columnName} в порядке убывания`,
    "resizerDescription": `Нажмите клавишу Enter для начала изменения размеров`,
    "select": `Выбрать`,
    "selectAll": `Выбрать все`,
    "sortable": `сортируемый столбец`
};


var $5afe469a63fcac7b$exports = {};
$5afe469a63fcac7b$exports = {
    "ascending": `vzostupne`,
    "ascendingSort": (args)=>`zoradené zostupne podľa stĺpca ${args.columnName}`,
    "columnSize": (args)=>`Počet pixelov: ${args.value}`,
    "descending": `zostupne`,
    "descendingSort": (args)=>`zoradené zostupne podľa stĺpca ${args.columnName}`,
    "resizerDescription": `Stlačením klávesu Enter začnete zmenu veľkosti`,
    "select": `Vybrať`,
    "selectAll": `Vybrať všetko`,
    "sortable": `zoraditeľný stĺpec`
};


var $2956757ac31a7ce2$exports = {};
$2956757ac31a7ce2$exports = {
    "ascending": `naraščajoče`,
    "ascendingSort": (args)=>`razvrščeno po stolpcu ${args.columnName} v naraščajočem vrstnem redu`,
    "columnSize": (args)=>`${args.value} slikovnih pik`,
    "descending": `padajoče`,
    "descendingSort": (args)=>`razvrščeno po stolpcu ${args.columnName} v padajočem vrstnem redu`,
    "resizerDescription": `Pritisnite tipko Enter da začnete spreminjati velikost`,
    "select": `Izberite`,
    "selectAll": `Izberite vse`,
    "sortable": `razvrstljivi stolpec`
};


var $cedee0e66b175529$exports = {};
$cedee0e66b175529$exports = {
    "ascending": `rastući`,
    "ascendingSort": (args)=>`sortirano po kolonama ${args.columnName} padajućim redosledom`,
    "columnSize": (args)=>`${args.value} piksela`,
    "descending": `padajući`,
    "descendingSort": (args)=>`sortirano po kolonama ${args.columnName} padajućim redosledom`,
    "resizerDescription": `Pritisnite Enter da biste započeli promenu veličine`,
    "select": `Izaberite`,
    "selectAll": `Izaberite sve`,
    "sortable": `kolona koja se može sortirati`
};


var $6db19998ba4427da$exports = {};
$6db19998ba4427da$exports = {
    "ascending": `stigande`,
    "ascendingSort": (args)=>`sorterat på kolumn ${args.columnName} i stigande ordning`,
    "columnSize": (args)=>`${args.value} pixlar`,
    "descending": `fallande`,
    "descendingSort": (args)=>`sorterat på kolumn ${args.columnName} i fallande ordning`,
    "resizerDescription": `Tryck på Retur för att börja ändra storlek`,
    "select": `Markera`,
    "selectAll": `Markera allt`,
    "sortable": `sorterbar kolumn`
};


var $166b7c9cc1adb1a1$exports = {};
$166b7c9cc1adb1a1$exports = {
    "ascending": `artan sırada`,
    "ascendingSort": (args)=>`${args.columnName} sütuna göre artan düzende sırala`,
    "columnSize": (args)=>`${args.value} piksel`,
    "descending": `azalan sırada`,
    "descendingSort": (args)=>`${args.columnName} sütuna göre azalan düzende sırala`,
    "resizerDescription": `Yeniden boyutlandırmak için Enter'a basın`,
    "select": `Seç`,
    "selectAll": `Tümünü Seç`,
    "sortable": `Sıralanabilir sütun`
};


var $c7ab180b401e49ff$exports = {};
$c7ab180b401e49ff$exports = {
    "ascending": `висхідний`,
    "ascendingSort": (args)=>`відсортовано за стовпцем ${args.columnName} у висхідному порядку`,
    "columnSize": (args)=>`${args.value} пікс.`,
    "descending": `низхідний`,
    "descendingSort": (args)=>`відсортовано за стовпцем ${args.columnName} у низхідному порядку`,
    "resizerDescription": `Натисніть Enter, щоб почати зміну розміру`,
    "select": `Вибрати`,
    "selectAll": `Вибрати все`,
    "sortable": `сортувальний стовпець`
};


var $1648ec00941567f3$exports = {};
$1648ec00941567f3$exports = {
    "ascending": `升序`,
    "ascendingSort": (args)=>`按列 ${args.columnName} 升序排序`,
    "columnSize": (args)=>`${args.value} 像素`,
    "descending": `降序`,
    "descendingSort": (args)=>`按列 ${args.columnName} 降序排序`,
    "resizerDescription": `按“输入”键开始调整大小。`,
    "select": `选择`,
    "selectAll": `全选`,
    "sortable": `可排序的列`
};


var $b26f22384b3c1526$exports = {};
$b26f22384b3c1526$exports = {
    "ascending": `遞增`,
    "ascendingSort": (args)=>`已依據「${args.columnName}」欄遞增排序`,
    "columnSize": (args)=>`${args.value} 像素`,
    "descending": `遞減`,
    "descendingSort": (args)=>`已依據「${args.columnName}」欄遞減排序`,
    "resizerDescription": `按 Enter 鍵以開始調整大小`,
    "select": `選取`,
    "selectAll": `全選`,
    "sortable": `可排序的欄`
};


$ae7e9c471762b4d3$exports = {
    "ar-AE": $ce3de3ff2fd66848$exports,
    "bg-BG": $cb80dcce530985b9$exports,
    "cs-CZ": $68ac86749db4c0fb$exports,
    "da-DK": $9a6cbac08487e661$exports,
    "de-DE": $c963661d89486e72$exports,
    "el-GR": $ac03861c6e8605f4$exports,
    "en-US": $09e6b82e0d6e466a$exports,
    "es-ES": $8cc39eb66c2bf220$exports,
    "et-EE": $4e11db3c25a38112$exports,
    "fi-FI": $da1e751a92575e02$exports,
    "fr-FR": $1b5d6c6c47d55106$exports,
    "he-IL": $7c18ba27b86d3308$exports,
    "hr-HR": $2cb40998e20e8a46$exports,
    "hu-HU": $189e23eec1d6aa3a$exports,
    "it-IT": $3c5ec8e4f015dfd0$exports,
    "ja-JP": $d021d50e6b315ebb$exports,
    "ko-KR": $52535c35c24ec937$exports,
    "lt-LT": $b37ee03672edfd1d$exports,
    "lv-LV": $c7df6686b4189d56$exports,
    "nb-NO": $da07fe8ec87e6b68$exports,
    "nl-NL": $64b7e390f5791490$exports,
    "pl-PL": $2a03621e773f1678$exports,
    "pt-BR": $0a79c0aba9e5ecc6$exports,
    "pt-PT": $de7b4d0f7dc86fc8$exports,
    "ro-RO": $28ea7e849d77bd1c$exports,
    "ru-RU": $9a09321cf046b187$exports,
    "sk-SK": $5afe469a63fcac7b$exports,
    "sl-SI": $2956757ac31a7ce2$exports,
    "sr-SP": $cedee0e66b175529$exports,
    "sv-SE": $6db19998ba4427da$exports,
    "tr-TR": $166b7c9cc1adb1a1$exports,
    "uk-UA": $c7ab180b401e49ff$exports,
    "zh-CN": $1648ec00941567f3$exports,
    "zh-TW": $b26f22384b3c1526$exports
};




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

class $0ba3c81c7f1caedd$export$da43f8f5cb04028d extends (0, $lJcFS$GridKeyboardDelegate) {
    isCell(node) {
        return node.type === "cell" || node.type === "rowheader" || node.type === "column";
    }
    getKeyBelow(key) {
        let startItem = this.collection.getItem(key);
        if (!startItem) return;
        // If focus was on a column, then focus the first child column if any,
        // or find the corresponding cell in the first row.
        if (startItem.type === "column") {
            let child = (0, $lJcFS$getFirstItem)((0, $lJcFS$getChildNodes)(startItem, this.collection));
            if (child) return child.key;
            let firstKey = this.getFirstKey();
            if (firstKey == null) return;
            let firstItem = this.collection.getItem(firstKey);
            return (0, $lJcFS$getNthItem)((0, $lJcFS$getChildNodes)(firstItem, this.collection), startItem.index).key;
        }
        return super.getKeyBelow(key);
    }
    getKeyAbove(key) {
        let startItem = this.collection.getItem(key);
        if (!startItem) return;
        // If focus was on a column, focus the parent column if any
        if (startItem.type === "column") {
            let parent = this.collection.getItem(startItem.parentKey);
            if (parent && parent.type === "column") return parent.key;
            return;
        }
        // only return above row key if not header row
        let superKey = super.getKeyAbove(key);
        if (superKey != null && this.collection.getItem(superKey).type !== "headerrow") return superKey;
        // If no item was found, and focus was on a cell, then focus the
        // corresponding column header.
        if (this.isCell(startItem)) return this.collection.columns[startItem.index].key;
        // If focus was on a row, then focus the first column header.
        return this.collection.columns[0].key;
    }
    findNextColumnKey(column) {
        // Search following columns
        let key = this.findNextKey(column.key, (item)=>item.type === "column");
        if (key != null) return key;
        // Wrap around to the first column
        let row = this.collection.headerRows[column.level];
        for (let item of (0, $lJcFS$getChildNodes)(row, this.collection)){
            if (item.type === "column") return item.key;
        }
    }
    findPreviousColumnKey(column) {
        // Search previous columns
        let key = this.findPreviousKey(column.key, (item)=>item.type === "column");
        if (key != null) return key;
        // Wrap around to the last column
        let row = this.collection.headerRows[column.level];
        let childNodes = [
            ...(0, $lJcFS$getChildNodes)(row, this.collection)
        ];
        for(let i = childNodes.length - 1; i >= 0; i--){
            let item = childNodes[i];
            if (item.type === "column") return item.key;
        }
    }
    getKeyRightOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return;
        // If focus was on a column, then focus the next column
        if (item.type === "column") return this.direction === "rtl" ? this.findPreviousColumnKey(item) : this.findNextColumnKey(item);
        return super.getKeyRightOf(key);
    }
    getKeyLeftOf(key) {
        let item = this.collection.getItem(key);
        if (!item) return;
        // If focus was on a column, then focus the previous column
        if (item.type === "column") return this.direction === "rtl" ? this.findNextColumnKey(item) : this.findPreviousColumnKey(item);
        return super.getKeyLeftOf(key);
    }
    getKeyForSearch(search, fromKey) {
        if (!this.collator) return null;
        let collection = this.collection;
        let key = fromKey !== null && fromKey !== void 0 ? fromKey : this.getFirstKey();
        if (key == null) return null;
        // If the starting key is a cell, search from its parent row.
        let startItem = collection.getItem(key);
        if (startItem.type === "cell") key = startItem.parentKey;
        let hasWrapped = false;
        while(key != null){
            let item = collection.getItem(key);
            // Check each of the row header cells in this row for a match
            for (let cell of (0, $lJcFS$getChildNodes)(item, this.collection)){
                let column = collection.columns[cell.index];
                if (collection.rowHeaderColumnKeys.has(column.key) && cell.textValue) {
                    let substring = cell.textValue.slice(0, search.length);
                    if (this.collator.compare(substring, search) === 0) {
                        // If we started on a cell, end on the matching cell. Otherwise, end on the row.
                        let fromItem = fromKey != null ? collection.getItem(fromKey) : startItem;
                        return fromItem.type === "cell" ? cell.key : item.key;
                    }
                }
            }
            key = this.getKeyBelow(key);
            // Wrap around when reaching the end of the collection
            if (key == null && !hasWrapped) {
                key = this.getFirstKey();
                hasWrapped = true;
            }
        }
        return null;
    }
}




function $6e31608fbba75bab$export$25bceaac3c7e4dc7(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate , isVirtualized: isVirtualized , layout: layout  } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $lJcFS$useCollator)({
        usage: "search",
        sensitivity: "base"
    });
    let { direction: direction  } = (0, $lJcFS$useLocale)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $lJcFS$useMemo)(()=>keyboardDelegate || new (0, $0ba3c81c7f1caedd$export$da43f8f5cb04028d)({
            collection: state.collection,
            disabledKeys: disabledBehavior === "selection" ? new Set() : state.disabledKeys,
            ref: ref,
            direction: direction,
            collator: collator,
            layout: layout
        }), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        disabledBehavior,
        ref,
        direction,
        collator,
        layout
    ]);
    let id = (0, $lJcFS$useId)(props.id);
    (0, $2140fb2337097f2d$export$552312adfd451dab).set(state, id);
    let { gridProps: gridProps  } = (0, $lJcFS$useGrid)({
        ...props,
        id: id,
        keyboardDelegate: delegate
    }, state, ref);
    // Override to include header rows
    if (isVirtualized) gridProps["aria-rowcount"] = state.collection.size + state.collection.headerRows.length;
    let { column: column , direction: sortDirection  } = state.sortDescriptor || {};
    let stringFormatter = (0, $lJcFS$useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($ae7e9c471762b4d3$exports))));
    let sortDescription = (0, $lJcFS$useMemo)(()=>{
        var _state_collection_columns_find;
        let columnName = (_state_collection_columns_find = state.collection.columns.find((c)=>c.key === column)) === null || _state_collection_columns_find === void 0 ? void 0 : _state_collection_columns_find.textValue;
        return sortDirection && column ? stringFormatter.format(`${sortDirection}Sort`, {
            columnName: columnName
        }) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sortDirection,
        column,
        state.collection.columns
    ]);
    let descriptionProps = (0, $lJcFS$useDescription)(sortDescription);
    // Only announce after initial render, tabbing to the table will tell you the initial sort info already
    (0, $lJcFS$useUpdateEffect)(()=>{
        (0, $lJcFS$announce)(sortDescription, "assertive", 500);
    }, [
        sortDescription
    ]);
    return {
        gridProps: (0, $lJcFS$mergeProps)(gridProps, descriptionProps, {
            // merge sort description with long press information
            "aria-describedby": [
                descriptionProps["aria-describedby"],
                gridProps["aria-describedby"]
            ].filter(Boolean).join(" ")
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






function $f329116d8ad0aba0$export$9514819a8c81e960(props, state, ref) {
    var _state_sortDescriptor, _state_sortDescriptor1;
    let { node: node  } = props;
    let allowsSorting = node.props.allowsSorting;
    // if there are no focusable children, the column header will focus the cell
    let { gridCellProps: gridCellProps  } = (0, $lJcFS$useGridCell)({
        ...props,
        focusMode: "child"
    }, state, ref);
    let isSelectionCellDisabled = node.props.isSelectionCell && state.selectionManager.selectionMode === "single";
    let { pressProps: pressProps  } = (0, $lJcFS$usePress)({
        isDisabled: !allowsSorting || isSelectionCellDisabled,
        onPress () {
            state.sort(node.key);
        },
        ref: ref
    });
    // Needed to pick up the focusable context, enabling things like Tooltips for example
    let { focusableProps: focusableProps  } = (0, $lJcFS$useFocusable)({}, ref);
    let ariaSort = null;
    let isSortedColumn = ((_state_sortDescriptor = state.sortDescriptor) === null || _state_sortDescriptor === void 0 ? void 0 : _state_sortDescriptor.column) === node.key;
    let sortDirection = (_state_sortDescriptor1 = state.sortDescriptor) === null || _state_sortDescriptor1 === void 0 ? void 0 : _state_sortDescriptor1.direction;
    // aria-sort not supported in Android Talkback
    if (node.props.allowsSorting && !(0, $lJcFS$isAndroid)()) ariaSort = isSortedColumn ? sortDirection : "none";
    let stringFormatter = (0, $lJcFS$useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($ae7e9c471762b4d3$exports))));
    let sortDescription;
    if (allowsSorting) {
        sortDescription = `${stringFormatter.format("sortable")}`;
        // Android Talkback doesn't support aria-sort so we add sort order details to the aria-described by here
        if (isSortedColumn && sortDirection && (0, $lJcFS$isAndroid)()) sortDescription = `${sortDescription}, ${stringFormatter.format(sortDirection)}`;
    }
    let descriptionProps = (0, $lJcFS$useDescription)(sortDescription);
    return {
        columnHeaderProps: {
            ...(0, $lJcFS$mergeProps)(gridCellProps, pressProps, focusableProps, descriptionProps, // If the table is empty, make all column headers untabbable or programatically focusable
            state.collection.size === 0 && {
                tabIndex: null
            }),
            role: "columnheader",
            id: (0, $2140fb2337097f2d$export$37cd4213f2ad742e)(state, node.key),
            "aria-colspan": node.colspan && node.colspan > 1 ? node.colspan : null,
            "aria-sort": ariaSort
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

function $b2db214c022798eb$export$7f2f6ae19e707aa5(props, state, ref) {
    let { node: node  } = props;
    let { rowProps: rowProps , ...states } = (0, $lJcFS$useGridRow)(props, state, ref);
    return {
        rowProps: {
            ...rowProps,
            "aria-labelledby": (0, $2140fb2337097f2d$export$85069b70317f543)(state, node.key)
        },
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
 */ function $f917ee10f4c32dab$export$1b95a7d2d517b841(props, state, ref) {
    let { node: node , isVirtualized: isVirtualized  } = props;
    let rowProps = {
        role: "row"
    };
    if (isVirtualized) rowProps["aria-rowindex"] = node.index + 1; // aria-rowindex is 1 based
    return {
        rowProps: rowProps
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

function $7713593715703b24$export$49571c903d73624c(props, state, ref) {
    let { gridCellProps: gridCellProps , isPressed: isPressed  } = (0, $lJcFS$useGridCell)(props, state, ref);
    let columnKey = props.node.column.key;
    if (state.collection.rowHeaderColumnKeys.has(columnKey)) {
        gridCellProps.role = "rowheader";
        gridCellProps.id = (0, $2140fb2337097f2d$export$19baff3266315d44)(state, props.node.parentKey, columnKey);
    }
    return {
        gridCellProps: gridCellProps,
        isPressed: isPressed
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



function $2a795c53a101c542$export$16ea7f650bd7c1bb(props, state) {
    let { key: key  } = props;
    const { checkboxProps: checkboxProps  } = (0, $lJcFS$useGridSelectionCheckbox)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            "aria-labelledby": `${checkboxProps.id} ${(0, $2140fb2337097f2d$export$85069b70317f543)(state, key)}`
        }
    };
}
function $2a795c53a101c542$export$1003db6a7e384b99(state) {
    let { isEmpty: isEmpty , isSelectAll: isSelectAll , selectionMode: selectionMode  } = state.selectionManager;
    const stringFormatter = (0, $lJcFS$useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($ae7e9c471762b4d3$exports))));
    return {
        checkboxProps: {
            "aria-label": stringFormatter.format(selectionMode === "single" ? "select" : "selectAll"),
            isSelected: isSelectAll,
            isDisabled: selectionMode !== "multiple" || state.collection.size === 0,
            isIndeterminate: !isEmpty && !isSelectAll,
            onChange: ()=>state.selectionManager.toggleSelectAll()
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







function $e91ef4e5004e3774$export$52994e973806c219(props, state, ref) {
    let { column: item , triggerRef: triggerRef , isDisabled: isDisabled , onResizeStart: onResizeStart , onResize: onResize , onResizeEnd: onResizeEnd , "aria-label": ariaLabel  } = props;
    const stringFormatter = (0, $lJcFS$useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($ae7e9c471762b4d3$exports))));
    let id = (0, $lJcFS$useId)();
    let isResizing = (0, $lJcFS$useRef)(false);
    let lastSize = (0, $lJcFS$useRef)(null);
    let editModeEnabled = state.tableState.isKeyboardNavigationDisabled;
    let { direction: direction  } = (0, $lJcFS$useLocale)();
    let { keyboardProps: keyboardProps  } = (0, $lJcFS$useKeyboard)({
        onKeyDown: (e)=>{
            let resizeOnFocus = !!(triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current);
            if (editModeEnabled) {
                if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "Tab") {
                    e.preventDefault();
                    if (resizeOnFocus) // switch focus back to the column header on anything that ends edit mode
                    (0, $lJcFS$focusSafely)(triggerRef.current);
                    else {
                        endResize(item);
                        state.tableState.setKeyboardNavigationDisabled(false);
                    }
                }
            } else if (!resizeOnFocus) {
                // Continue propagation on keydown events so they still bubbles to useSelectableCollection and are handled there
                e.continuePropagation();
                if (e.key === "Enter") {
                    startResize(item);
                    state.tableState.setKeyboardNavigationDisabled(true);
                }
            }
        }
    });
    let startResize = (0, $lJcFS$useCallback)((item)=>{
        if (!isResizing.current) {
            lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
            state.startResize(item.key);
            onResizeStart === null || onResizeStart === void 0 ? void 0 : onResizeStart(lastSize.current);
        }
        isResizing.current = true;
    }, [
        isResizing,
        onResizeStart,
        state
    ]);
    let resize = (0, $lJcFS$useCallback)((item, newWidth)=>{
        let sizes = state.updateResizedColumns(item.key, newWidth);
        onResize === null || onResize === void 0 ? void 0 : onResize(sizes);
        lastSize.current = sizes;
    }, [
        onResize,
        state
    ]);
    let endResize = (0, $lJcFS$useCallback)((item)=>{
        if (isResizing.current) {
            if (lastSize.current == null) lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
            state.endResize();
            onResizeEnd === null || onResizeEnd === void 0 ? void 0 : onResizeEnd(lastSize.current);
        }
        isResizing.current = false;
        lastSize.current = null;
    }, [
        isResizing,
        onResizeEnd,
        state
    ]);
    const columnResizeWidthRef = (0, $lJcFS$useRef)(0);
    const { moveProps: moveProps  } = (0, $lJcFS$useMove)({
        onMoveStart () {
            columnResizeWidthRef.current = state.getColumnWidth(item.key);
            startResize(item);
        },
        onMove (e) {
            let { deltaX: deltaX , deltaY: deltaY , pointerType: pointerType  } = e;
            if (direction === "rtl") deltaX *= -1;
            if (pointerType === "keyboard") {
                if (deltaY !== 0 && deltaX === 0) deltaX = deltaY * -1;
                deltaX *= 10;
            }
            // if moving up/down only, no need to resize
            if (deltaX !== 0) {
                columnResizeWidthRef.current += deltaX;
                resize(item, columnResizeWidthRef.current);
            }
        },
        onMoveEnd (e) {
            let resizeOnFocus = !!(triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current);
            let { pointerType: pointerType  } = e;
            columnResizeWidthRef.current = 0;
            if (pointerType === "mouse" || pointerType === "touch" && !resizeOnFocus) endResize(item);
        }
    });
    let onKeyDown = (0, $lJcFS$useCallback)((e)=>{
        if (editModeEnabled) moveProps.onKeyDown(e);
    }, [
        editModeEnabled,
        moveProps
    ]);
    let min = Math.floor(state.getColumnMinWidth(item.key));
    let max = Math.floor(state.getColumnMaxWidth(item.key));
    if (max === Infinity) max = Number.MAX_SAFE_INTEGER;
    let value = Math.floor(state.getColumnWidth(item.key));
    let modality = (0, $lJcFS$useInteractionModality)();
    if (modality === "virtual" && typeof window !== "undefined" && "ontouchstart" in window) modality = "touch";
    let description = (triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current) == null && (modality === "keyboard" || modality === "virtual") && !isResizing.current ? stringFormatter.format("resizerDescription") : undefined;
    let descriptionProps = (0, $lJcFS$useDescription)(description);
    let ariaProps = {
        "aria-label": ariaLabel,
        "aria-orientation": "horizontal",
        "aria-labelledby": `${id} ${(0, $2140fb2337097f2d$export$37cd4213f2ad742e)(state.tableState, item.key)}`,
        "aria-valuetext": stringFormatter.format("columnSize", {
            value: value
        }),
        "type": "range",
        min: min,
        max: max,
        value: value,
        ...descriptionProps
    };
    const focusInput = (0, $lJcFS$useCallback)(()=>{
        if (ref.current) (0, $lJcFS$focusWithoutScrolling)(ref.current);
    }, [
        ref
    ]);
    let onChange = (e)=>{
        let currentWidth = state.getColumnWidth(item.key);
        let nextValue = parseFloat(e.target.value);
        if (nextValue > currentWidth) nextValue = currentWidth + 10;
        else nextValue = currentWidth - 10;
        resize(item, nextValue);
    };
    let { pressProps: pressProps  } = (0, $lJcFS$usePress)({
        onPressStart: (e)=>{
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || e.pointerType === "keyboard") return;
            if (e.pointerType === "virtual" && state.resizingColumn != null) {
                let resizeOnFocus = !!(triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current);
                endResize(item);
                if (resizeOnFocus) (0, $lJcFS$focusSafely)(triggerRef.current);
                return;
            }
            // Sometimes onPress won't trigger for quick taps on mobile so we want to focus the input so blurring away
            // can cancel resize mode for us.
            focusInput();
            // If resizer is always visible, mobile screenreader user can access the visually hidden resizer directly and thus we don't need
            // to handle a virtual click to start the resizer.
            if (e.pointerType !== "virtual") startResize(item);
        },
        onPress: (e)=>{
            let resizeOnFocus = !!(triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current);
            if ((e.pointerType === "touch" && !resizeOnFocus || e.pointerType === "mouse") && state.resizingColumn != null) endResize(item);
        }
    });
    let { visuallyHiddenProps: visuallyHiddenProps  } = (0, $lJcFS$useVisuallyHidden)();
    return {
        resizerProps: (0, $lJcFS$mergeProps)(keyboardProps, {
            ...moveProps,
            onKeyDown: onKeyDown
        }, pressProps),
        inputProps: (0, $lJcFS$mergeProps)(visuallyHiddenProps, {
            id: id,
            onFocus: ()=>{
                let resizeOnFocus = !!(triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current);
                if (resizeOnFocus) {
                    // useMove calls onMoveStart for every keypress, but we want resize start to only be called when we start resize mode
                    // call instead during focus and blur
                    startResize(item);
                    state.tableState.setKeyboardNavigationDisabled(true);
                }
            },
            onBlur: ()=>{
                endResize(item);
                state.tableState.setKeyboardNavigationDisabled(false);
            },
            onChange: onChange,
            disabled: isDisabled
        }, ariaProps),
        isResizing: state.resizingColumn === item.key
    };
}



function $0047e6c294ea075f$export$6fb1613bd7b28198() {
    return (0, $lJcFS$useGridRowGroup)();
}



//# sourceMappingURL=module.js.map
