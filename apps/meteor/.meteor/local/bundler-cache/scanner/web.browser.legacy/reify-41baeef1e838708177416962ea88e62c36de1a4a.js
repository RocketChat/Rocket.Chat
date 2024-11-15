var $kJQf8$reactariagrid = require("@react-aria/grid");
var $kJQf8$reactarialiveannouncer = require("@react-aria/live-announcer");
var $kJQf8$reactariautils = require("@react-aria/utils");
var $kJQf8$react = require("react");
var $kJQf8$reactariai18n = require("@react-aria/i18n");
var $kJQf8$reactstatelycollections = require("@react-stately/collections");
var $kJQf8$reactariafocus = require("@react-aria/focus");
var $kJQf8$reactariainteractions = require("@react-aria/interactions");
var $kJQf8$reactariavisuallyhidden = require("@react-aria/visually-hidden");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useTableRowGroup", () => $cd66afe5decb6adb$export$6fb1613bd7b28198);
$parcel$export(module.exports, "useTable", () => $25d14c0f8fad722e$export$25bceaac3c7e4dc7);
$parcel$export(module.exports, "useTableColumnHeader", () => $7669c34a63ef0113$export$9514819a8c81e960);
$parcel$export(module.exports, "useTableRow", () => $10b2115217af7c93$export$7f2f6ae19e707aa5);
$parcel$export(module.exports, "useTableHeaderRow", () => $eb16c38321a72835$export$1b95a7d2d517b841);
$parcel$export(module.exports, "useTableCell", () => $32387a1f2c61cda2$export$49571c903d73624c);
$parcel$export(module.exports, "useTableSelectionCheckbox", () => $0b394e4562ac57c9$export$16ea7f650bd7c1bb);
$parcel$export(module.exports, "useTableSelectAllCheckbox", () => $0b394e4562ac57c9$export$1003db6a7e384b99);
$parcel$export(module.exports, "useTableColumnResize", () => $16d645f9e2153641$export$52994e973806c219);
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
 */ const $6acf696f746f932c$export$552312adfd451dab = new WeakMap();
function $6acf696f746f932c$var$normalizeKey(key) {
    if (typeof key === "string") return key.replace(/\s*/g, "");
    return "" + key;
}
function $6acf696f746f932c$export$37cd4213f2ad742e(state, columnKey) {
    let gridId = $6acf696f746f932c$export$552312adfd451dab.get(state);
    if (!gridId) throw new Error("Unknown grid");
    return `${gridId}-${$6acf696f746f932c$var$normalizeKey(columnKey)}`;
}
function $6acf696f746f932c$export$19baff3266315d44(state, rowKey, columnKey) {
    let gridId = $6acf696f746f932c$export$552312adfd451dab.get(state);
    if (!gridId) throw new Error("Unknown grid");
    return `${gridId}-${$6acf696f746f932c$var$normalizeKey(rowKey)}-${$6acf696f746f932c$var$normalizeKey(columnKey)}`;
}
function $6acf696f746f932c$export$85069b70317f543(state, rowKey) {
    // A row is labelled by it's row headers.
    return [
        ...state.collection.rowHeaderColumnKeys
    ].map((columnKey)=>$6acf696f746f932c$export$19baff3266315d44(state, rowKey, columnKey)).join(" ");
}


var $41fef89bf1034745$exports = {};
var $ca0f93ae476efcee$exports = {};
$ca0f93ae476efcee$exports = {
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


var $8fcf86b24fd399a9$exports = {};
$8fcf86b24fd399a9$exports = {
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


var $146712099a722811$exports = {};
$146712099a722811$exports = {
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


var $2735c96991aebe53$exports = {};
$2735c96991aebe53$exports = {
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


var $d85ed0c826146b1e$exports = {};
$d85ed0c826146b1e$exports = {
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


var $1aecf8df24cd2c6e$exports = {};
$1aecf8df24cd2c6e$exports = {
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


var $8629e38d73986227$exports = {};
$8629e38d73986227$exports = {
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


var $219ef73190fd7b54$exports = {};
$219ef73190fd7b54$exports = {
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


var $28e4d12b64c559fe$exports = {};
$28e4d12b64c559fe$exports = {
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


var $d443cdd0bb14863a$exports = {};
$d443cdd0bb14863a$exports = {
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


var $e7b61bd0e93b97c5$exports = {};
$e7b61bd0e93b97c5$exports = {
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


var $b09d12ffa0a56a3e$exports = {};
$b09d12ffa0a56a3e$exports = {
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


var $c3d9f76f15300329$exports = {};
$c3d9f76f15300329$exports = {
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


var $9904561a995a328e$exports = {};
$9904561a995a328e$exports = {
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


var $b63a88a974650d19$exports = {};
$b63a88a974650d19$exports = {
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


var $f79114b6f7838962$exports = {};
$f79114b6f7838962$exports = {
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


var $305e358db516b233$exports = {};
$305e358db516b233$exports = {
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


var $c37a95c245032ee0$exports = {};
$c37a95c245032ee0$exports = {
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


var $0d99b6662f72a76d$exports = {};
$0d99b6662f72a76d$exports = {
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


var $b350dd154e1c203e$exports = {};
$b350dd154e1c203e$exports = {
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


var $94dcc10598f2ecbe$exports = {};
$94dcc10598f2ecbe$exports = {
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


var $847263ec44d85feb$exports = {};
$847263ec44d85feb$exports = {
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


var $649f25af616381b6$exports = {};
$649f25af616381b6$exports = {
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


var $63863f752f22090b$exports = {};
$63863f752f22090b$exports = {
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


var $1011caef6838d0cf$exports = {};
$1011caef6838d0cf$exports = {
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


var $5c0e71883f016b2f$exports = {};
$5c0e71883f016b2f$exports = {
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


var $9799788df99a536e$exports = {};
$9799788df99a536e$exports = {
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


var $79bf9bea0e0b8579$exports = {};
$79bf9bea0e0b8579$exports = {
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


var $374736afc1a4c11c$exports = {};
$374736afc1a4c11c$exports = {
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


var $948317bce9061901$exports = {};
$948317bce9061901$exports = {
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


var $73e2289d5a9ac4de$exports = {};
$73e2289d5a9ac4de$exports = {
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


var $aca57efccc60ebb1$exports = {};
$aca57efccc60ebb1$exports = {
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


var $ccd86abad329f871$exports = {};
$ccd86abad329f871$exports = {
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


var $ad6eb5efb83fe2f8$exports = {};
$ad6eb5efb83fe2f8$exports = {
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


$41fef89bf1034745$exports = {
    "ar-AE": $ca0f93ae476efcee$exports,
    "bg-BG": $8fcf86b24fd399a9$exports,
    "cs-CZ": $146712099a722811$exports,
    "da-DK": $2735c96991aebe53$exports,
    "de-DE": $d85ed0c826146b1e$exports,
    "el-GR": $1aecf8df24cd2c6e$exports,
    "en-US": $8629e38d73986227$exports,
    "es-ES": $219ef73190fd7b54$exports,
    "et-EE": $28e4d12b64c559fe$exports,
    "fi-FI": $d443cdd0bb14863a$exports,
    "fr-FR": $e7b61bd0e93b97c5$exports,
    "he-IL": $b09d12ffa0a56a3e$exports,
    "hr-HR": $c3d9f76f15300329$exports,
    "hu-HU": $9904561a995a328e$exports,
    "it-IT": $b63a88a974650d19$exports,
    "ja-JP": $f79114b6f7838962$exports,
    "ko-KR": $305e358db516b233$exports,
    "lt-LT": $c37a95c245032ee0$exports,
    "lv-LV": $0d99b6662f72a76d$exports,
    "nb-NO": $b350dd154e1c203e$exports,
    "nl-NL": $94dcc10598f2ecbe$exports,
    "pl-PL": $847263ec44d85feb$exports,
    "pt-BR": $649f25af616381b6$exports,
    "pt-PT": $63863f752f22090b$exports,
    "ro-RO": $1011caef6838d0cf$exports,
    "ru-RU": $5c0e71883f016b2f$exports,
    "sk-SK": $9799788df99a536e$exports,
    "sl-SI": $79bf9bea0e0b8579$exports,
    "sr-SP": $374736afc1a4c11c$exports,
    "sv-SE": $948317bce9061901$exports,
    "tr-TR": $73e2289d5a9ac4de$exports,
    "uk-UA": $aca57efccc60ebb1$exports,
    "zh-CN": $ccd86abad329f871$exports,
    "zh-TW": $ad6eb5efb83fe2f8$exports
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

class $a911ff492b884835$export$da43f8f5cb04028d extends (0, $kJQf8$reactariagrid.GridKeyboardDelegate) {
    isCell(node) {
        return node.type === "cell" || node.type === "rowheader" || node.type === "column";
    }
    getKeyBelow(key) {
        let startItem = this.collection.getItem(key);
        if (!startItem) return;
        // If focus was on a column, then focus the first child column if any,
        // or find the corresponding cell in the first row.
        if (startItem.type === "column") {
            let child = (0, $kJQf8$reactstatelycollections.getFirstItem)((0, $kJQf8$reactstatelycollections.getChildNodes)(startItem, this.collection));
            if (child) return child.key;
            let firstKey = this.getFirstKey();
            if (firstKey == null) return;
            let firstItem = this.collection.getItem(firstKey);
            return (0, $kJQf8$reactstatelycollections.getNthItem)((0, $kJQf8$reactstatelycollections.getChildNodes)(firstItem, this.collection), startItem.index).key;
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
        for (let item of (0, $kJQf8$reactstatelycollections.getChildNodes)(row, this.collection)){
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
            ...(0, $kJQf8$reactstatelycollections.getChildNodes)(row, this.collection)
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
            for (let cell of (0, $kJQf8$reactstatelycollections.getChildNodes)(item, this.collection)){
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




function $25d14c0f8fad722e$export$25bceaac3c7e4dc7(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate , isVirtualized: isVirtualized , layout: layout  } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $kJQf8$reactariai18n.useCollator)({
        usage: "search",
        sensitivity: "base"
    });
    let { direction: direction  } = (0, $kJQf8$reactariai18n.useLocale)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $kJQf8$react.useMemo)(()=>keyboardDelegate || new (0, $a911ff492b884835$export$da43f8f5cb04028d)({
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
    let id = (0, $kJQf8$reactariautils.useId)(props.id);
    (0, $6acf696f746f932c$export$552312adfd451dab).set(state, id);
    let { gridProps: gridProps  } = (0, $kJQf8$reactariagrid.useGrid)({
        ...props,
        id: id,
        keyboardDelegate: delegate
    }, state, ref);
    // Override to include header rows
    if (isVirtualized) gridProps["aria-rowcount"] = state.collection.size + state.collection.headerRows.length;
    let { column: column , direction: sortDirection  } = state.sortDescriptor || {};
    let stringFormatter = (0, $kJQf8$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($41fef89bf1034745$exports))));
    let sortDescription = (0, $kJQf8$react.useMemo)(()=>{
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
    let descriptionProps = (0, $kJQf8$reactariautils.useDescription)(sortDescription);
    // Only announce after initial render, tabbing to the table will tell you the initial sort info already
    (0, $kJQf8$reactariautils.useUpdateEffect)(()=>{
        (0, $kJQf8$reactarialiveannouncer.announce)(sortDescription, "assertive", 500);
    }, [
        sortDescription
    ]);
    return {
        gridProps: (0, $kJQf8$reactariautils.mergeProps)(gridProps, descriptionProps, {
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






function $7669c34a63ef0113$export$9514819a8c81e960(props, state, ref) {
    var _state_sortDescriptor, _state_sortDescriptor1;
    let { node: node  } = props;
    let allowsSorting = node.props.allowsSorting;
    // if there are no focusable children, the column header will focus the cell
    let { gridCellProps: gridCellProps  } = (0, $kJQf8$reactariagrid.useGridCell)({
        ...props,
        focusMode: "child"
    }, state, ref);
    let isSelectionCellDisabled = node.props.isSelectionCell && state.selectionManager.selectionMode === "single";
    let { pressProps: pressProps  } = (0, $kJQf8$reactariainteractions.usePress)({
        isDisabled: !allowsSorting || isSelectionCellDisabled,
        onPress () {
            state.sort(node.key);
        },
        ref: ref
    });
    // Needed to pick up the focusable context, enabling things like Tooltips for example
    let { focusableProps: focusableProps  } = (0, $kJQf8$reactariafocus.useFocusable)({}, ref);
    let ariaSort = null;
    let isSortedColumn = ((_state_sortDescriptor = state.sortDescriptor) === null || _state_sortDescriptor === void 0 ? void 0 : _state_sortDescriptor.column) === node.key;
    let sortDirection = (_state_sortDescriptor1 = state.sortDescriptor) === null || _state_sortDescriptor1 === void 0 ? void 0 : _state_sortDescriptor1.direction;
    // aria-sort not supported in Android Talkback
    if (node.props.allowsSorting && !(0, $kJQf8$reactariautils.isAndroid)()) ariaSort = isSortedColumn ? sortDirection : "none";
    let stringFormatter = (0, $kJQf8$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($41fef89bf1034745$exports))));
    let sortDescription;
    if (allowsSorting) {
        sortDescription = `${stringFormatter.format("sortable")}`;
        // Android Talkback doesn't support aria-sort so we add sort order details to the aria-described by here
        if (isSortedColumn && sortDirection && (0, $kJQf8$reactariautils.isAndroid)()) sortDescription = `${sortDescription}, ${stringFormatter.format(sortDirection)}`;
    }
    let descriptionProps = (0, $kJQf8$reactariautils.useDescription)(sortDescription);
    return {
        columnHeaderProps: {
            ...(0, $kJQf8$reactariautils.mergeProps)(gridCellProps, pressProps, focusableProps, descriptionProps, // If the table is empty, make all column headers untabbable or programatically focusable
            state.collection.size === 0 && {
                tabIndex: null
            }),
            role: "columnheader",
            id: (0, $6acf696f746f932c$export$37cd4213f2ad742e)(state, node.key),
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

function $10b2115217af7c93$export$7f2f6ae19e707aa5(props, state, ref) {
    let { node: node  } = props;
    let { rowProps: rowProps , ...states } = (0, $kJQf8$reactariagrid.useGridRow)(props, state, ref);
    return {
        rowProps: {
            ...rowProps,
            "aria-labelledby": (0, $6acf696f746f932c$export$85069b70317f543)(state, node.key)
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
 */ function $eb16c38321a72835$export$1b95a7d2d517b841(props, state, ref) {
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

function $32387a1f2c61cda2$export$49571c903d73624c(props, state, ref) {
    let { gridCellProps: gridCellProps , isPressed: isPressed  } = (0, $kJQf8$reactariagrid.useGridCell)(props, state, ref);
    let columnKey = props.node.column.key;
    if (state.collection.rowHeaderColumnKeys.has(columnKey)) {
        gridCellProps.role = "rowheader";
        gridCellProps.id = (0, $6acf696f746f932c$export$19baff3266315d44)(state, props.node.parentKey, columnKey);
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



function $0b394e4562ac57c9$export$16ea7f650bd7c1bb(props, state) {
    let { key: key  } = props;
    const { checkboxProps: checkboxProps  } = (0, $kJQf8$reactariagrid.useGridSelectionCheckbox)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            "aria-labelledby": `${checkboxProps.id} ${(0, $6acf696f746f932c$export$85069b70317f543)(state, key)}`
        }
    };
}
function $0b394e4562ac57c9$export$1003db6a7e384b99(state) {
    let { isEmpty: isEmpty , isSelectAll: isSelectAll , selectionMode: selectionMode  } = state.selectionManager;
    const stringFormatter = (0, $kJQf8$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($41fef89bf1034745$exports))));
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







function $16d645f9e2153641$export$52994e973806c219(props, state, ref) {
    let { column: item , triggerRef: triggerRef , isDisabled: isDisabled , onResizeStart: onResizeStart , onResize: onResize , onResizeEnd: onResizeEnd , "aria-label": ariaLabel  } = props;
    const stringFormatter = (0, $kJQf8$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($41fef89bf1034745$exports))));
    let id = (0, $kJQf8$reactariautils.useId)();
    let isResizing = (0, $kJQf8$react.useRef)(false);
    let lastSize = (0, $kJQf8$react.useRef)(null);
    let editModeEnabled = state.tableState.isKeyboardNavigationDisabled;
    let { direction: direction  } = (0, $kJQf8$reactariai18n.useLocale)();
    let { keyboardProps: keyboardProps  } = (0, $kJQf8$reactariainteractions.useKeyboard)({
        onKeyDown: (e)=>{
            let resizeOnFocus = !!(triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current);
            if (editModeEnabled) {
                if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "Tab") {
                    e.preventDefault();
                    if (resizeOnFocus) // switch focus back to the column header on anything that ends edit mode
                    (0, $kJQf8$reactariafocus.focusSafely)(triggerRef.current);
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
    let startResize = (0, $kJQf8$react.useCallback)((item)=>{
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
    let resize = (0, $kJQf8$react.useCallback)((item, newWidth)=>{
        let sizes = state.updateResizedColumns(item.key, newWidth);
        onResize === null || onResize === void 0 ? void 0 : onResize(sizes);
        lastSize.current = sizes;
    }, [
        onResize,
        state
    ]);
    let endResize = (0, $kJQf8$react.useCallback)((item)=>{
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
    const columnResizeWidthRef = (0, $kJQf8$react.useRef)(0);
    const { moveProps: moveProps  } = (0, $kJQf8$reactariainteractions.useMove)({
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
    let onKeyDown = (0, $kJQf8$react.useCallback)((e)=>{
        if (editModeEnabled) moveProps.onKeyDown(e);
    }, [
        editModeEnabled,
        moveProps
    ]);
    let min = Math.floor(state.getColumnMinWidth(item.key));
    let max = Math.floor(state.getColumnMaxWidth(item.key));
    if (max === Infinity) max = Number.MAX_SAFE_INTEGER;
    let value = Math.floor(state.getColumnWidth(item.key));
    let modality = (0, $kJQf8$reactariainteractions.useInteractionModality)();
    if (modality === "virtual" && typeof window !== "undefined" && "ontouchstart" in window) modality = "touch";
    let description = (triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current) == null && (modality === "keyboard" || modality === "virtual") && !isResizing.current ? stringFormatter.format("resizerDescription") : undefined;
    let descriptionProps = (0, $kJQf8$reactariautils.useDescription)(description);
    let ariaProps = {
        "aria-label": ariaLabel,
        "aria-orientation": "horizontal",
        "aria-labelledby": `${id} ${(0, $6acf696f746f932c$export$37cd4213f2ad742e)(state.tableState, item.key)}`,
        "aria-valuetext": stringFormatter.format("columnSize", {
            value: value
        }),
        "type": "range",
        min: min,
        max: max,
        value: value,
        ...descriptionProps
    };
    const focusInput = (0, $kJQf8$react.useCallback)(()=>{
        if (ref.current) (0, $kJQf8$reactariautils.focusWithoutScrolling)(ref.current);
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
    let { pressProps: pressProps  } = (0, $kJQf8$reactariainteractions.usePress)({
        onPressStart: (e)=>{
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || e.pointerType === "keyboard") return;
            if (e.pointerType === "virtual" && state.resizingColumn != null) {
                let resizeOnFocus = !!(triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current);
                endResize(item);
                if (resizeOnFocus) (0, $kJQf8$reactariafocus.focusSafely)(triggerRef.current);
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
    let { visuallyHiddenProps: visuallyHiddenProps  } = (0, $kJQf8$reactariavisuallyhidden.useVisuallyHidden)();
    return {
        resizerProps: (0, $kJQf8$reactariautils.mergeProps)(keyboardProps, {
            ...moveProps,
            onKeyDown: onKeyDown
        }, pressProps),
        inputProps: (0, $kJQf8$reactariautils.mergeProps)(visuallyHiddenProps, {
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



function $cd66afe5decb6adb$export$6fb1613bd7b28198() {
    return (0, $kJQf8$reactariagrid.useGridRowGroup)();
}


//# sourceMappingURL=main.js.map
