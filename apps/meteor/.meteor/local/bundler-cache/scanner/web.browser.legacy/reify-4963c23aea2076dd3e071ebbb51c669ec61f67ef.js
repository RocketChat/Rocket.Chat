var $jzHdg$reactarialiveannouncer = require("@react-aria/live-announcer");
var $jzHdg$reactariautils = require("@react-aria/utils");
var $jzHdg$reactariai18n = require("@react-aria/i18n");
var $jzHdg$react = require("react");
var $jzHdg$internationalizeddate = require("@internationalized/date");
var $jzHdg$reactariainteractions = require("@react-aria/interactions");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useCalendar", () => $20e845123e697a89$export$3ee915f8151bd4f1);
$parcel$export(module.exports, "useRangeCalendar", () => $c49ada48cbc48220$export$87e0539f600c24e5);
$parcel$export(module.exports, "useCalendarGrid", () => $a07388a797d86b95$export$cb95147730a423f5);
$parcel$export(module.exports, "useCalendarCell", () => $4d833327a32c9193$export$136073280381448e);
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
var $f87cd00fb2ba0f23$exports = {};
var $1fedb39dedbf7c51$exports = {};
$1fedb39dedbf7c51$exports = {
    "dateRange": (args)=>`${args.startDate} إلى ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} المحدد`,
    "finishRangeSelectionPrompt": `انقر لإنهاء عملية تحديد نطاق التاريخ`,
    "maximumDate": `آخر تاريخ متاح`,
    "minimumDate": `أول تاريخ متاح`,
    "next": `التالي`,
    "previous": `السابق`,
    "selectedDateDescription": (args)=>`تاريخ محدد: ${args.date}`,
    "selectedRangeDescription": (args)=>`المدى الزمني المحدد: ${args.dateRange}`,
    "startRangeSelectionPrompt": `انقر لبدء عملية تحديد نطاق التاريخ`,
    "todayDate": (args)=>`اليوم، ${args.date}`,
    "todayDateSelected": (args)=>`اليوم، ${args.date} محدد`
};


var $524ada6153e36bf5$exports = {};
$524ada6153e36bf5$exports = {
    "dateRange": (args)=>`${args.startDate} до ${args.endDate}`,
    "dateSelected": (args)=>`Избрано е ${args.date}`,
    "finishRangeSelectionPrompt": `Натиснете, за да довършите избора на времеви интервал`,
    "maximumDate": `Последна налична дата`,
    "minimumDate": `Първа налична дата`,
    "next": `Напред`,
    "previous": `Назад`,
    "selectedDateDescription": (args)=>`Избрана дата: ${args.date}`,
    "selectedRangeDescription": (args)=>`Избран диапазон: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Натиснете, за да пристъпите към избора на времеви интервал`,
    "todayDate": (args)=>`Днес, ${args.date}`,
    "todayDateSelected": (args)=>`Днес, ${args.date} са избрани`
};


var $181053d31fc585a6$exports = {};
$181053d31fc585a6$exports = {
    "dateRange": (args)=>`${args.startDate} až ${args.endDate}`,
    "dateSelected": (args)=>`Vybráno ${args.date}`,
    "finishRangeSelectionPrompt": `Kliknutím dokončíte výběr rozsahu dat`,
    "maximumDate": `Poslední dostupné datum`,
    "minimumDate": `První dostupné datum`,
    "next": `Další`,
    "previous": `Předchozí`,
    "selectedDateDescription": (args)=>`Vybrané datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Vybrané období: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Kliknutím zahájíte výběr rozsahu dat`,
    "todayDate": (args)=>`Dnes, ${args.date}`,
    "todayDateSelected": (args)=>`Dnes, vybráno ${args.date}`
};


var $87f1f2ee75c25d27$exports = {};
$87f1f2ee75c25d27$exports = {
    "dateRange": (args)=>`${args.startDate} til ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} valgt`,
    "finishRangeSelectionPrompt": `Klik for at fuldføre valg af datoområde`,
    "maximumDate": `Sidste ledige dato`,
    "minimumDate": `Første ledige dato`,
    "next": `Næste`,
    "previous": `Forrige`,
    "selectedDateDescription": (args)=>`Valgt dato: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valgt interval: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Klik for at starte valg af datoområde`,
    "todayDate": (args)=>`I dag, ${args.date}`,
    "todayDateSelected": (args)=>`I dag, ${args.date} valgt`
};


var $3018d278e45fefcf$exports = {};
$3018d278e45fefcf$exports = {
    "dateRange": (args)=>`${args.startDate} bis ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} ausgewählt`,
    "finishRangeSelectionPrompt": `Klicken, um die Auswahl des Datumsbereichs zu beenden`,
    "maximumDate": `Letztes verfügbares Datum`,
    "minimumDate": `Erstes verfügbares Datum`,
    "next": `Weiter`,
    "previous": `Zurück`,
    "selectedDateDescription": (args)=>`Ausgewähltes Datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Ausgewählter Bereich: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Klicken, um die Auswahl des Datumsbereichs zu beginnen`,
    "todayDate": (args)=>`Heute, ${args.date}`,
    "todayDateSelected": (args)=>`Heute, ${args.date} ausgewählt`
};


var $880b624ba6c377b6$exports = {};
$880b624ba6c377b6$exports = {
    "dateRange": (args)=>`${args.startDate} έως ${args.endDate}`,
    "dateSelected": (args)=>`Επιλέχθηκε ${args.date}`,
    "finishRangeSelectionPrompt": `Κάντε κλικ για να ολοκληρώσετε την επιλογή εύρους ημερομηνιών`,
    "maximumDate": `Τελευταία διαθέσιμη ημερομηνία`,
    "minimumDate": `Πρώτη διαθέσιμη ημερομηνία`,
    "next": `Επόμενο`,
    "previous": `Προηγούμενο`,
    "selectedDateDescription": (args)=>`Επιλεγμένη ημερομηνία: ${args.date}`,
    "selectedRangeDescription": (args)=>`Επιλεγμένο εύρος: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Κάντε κλικ για να ξεκινήσετε την επιλογή εύρους ημερομηνιών`,
    "todayDate": (args)=>`Σήμερα, ${args.date}`,
    "todayDateSelected": (args)=>`Σήμερα, επιλέχτηκε ${args.date}`
};


var $6a7e3934431e9523$exports = {};
$6a7e3934431e9523$exports = {
    "previous": `Previous`,
    "next": `Next`,
    "selectedDateDescription": (args)=>`Selected Date: ${args.date}`,
    "selectedRangeDescription": (args)=>`Selected Range: ${args.dateRange}`,
    "todayDate": (args)=>`Today, ${args.date}`,
    "todayDateSelected": (args)=>`Today, ${args.date} selected`,
    "dateSelected": (args)=>`${args.date} selected`,
    "startRangeSelectionPrompt": `Click to start selecting date range`,
    "finishRangeSelectionPrompt": `Click to finish selecting date range`,
    "minimumDate": `First available date`,
    "maximumDate": `Last available date`,
    "dateRange": (args)=>`${args.startDate} to ${args.endDate}`
};


var $4c458303ff44205c$exports = {};
$4c458303ff44205c$exports = {
    "dateRange": (args)=>`${args.startDate} a ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} seleccionado`,
    "finishRangeSelectionPrompt": `Haga clic para terminar de seleccionar rango de fechas`,
    "maximumDate": `Última fecha disponible`,
    "minimumDate": `Primera fecha disponible`,
    "next": `Siguiente`,
    "previous": `Anterior`,
    "selectedDateDescription": (args)=>`Fecha seleccionada: ${args.date}`,
    "selectedRangeDescription": (args)=>`Intervalo seleccionado: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Haga clic para comenzar a seleccionar un rango de fechas`,
    "todayDate": (args)=>`Hoy, ${args.date}`,
    "todayDateSelected": (args)=>`Hoy, ${args.date} seleccionado`
};


var $4b6ec4ab19a96fff$exports = {};
$4b6ec4ab19a96fff$exports = {
    "dateRange": (args)=>`${args.startDate} kuni ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} valitud`,
    "finishRangeSelectionPrompt": `Klõpsake kuupäevavahemiku valimise lõpetamiseks`,
    "maximumDate": `Viimane saadaolev kuupäev`,
    "minimumDate": `Esimene saadaolev kuupäev`,
    "next": `Järgmine`,
    "previous": `Eelmine`,
    "selectedDateDescription": (args)=>`Valitud kuupäev: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valitud vahemik: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Klõpsake kuupäevavahemiku valimiseks`,
    "todayDate": (args)=>`Täna, ${args.date}`,
    "todayDateSelected": (args)=>`Täna, ${args.date} valitud`
};


var $a5184a366ed55e98$exports = {};
$a5184a366ed55e98$exports = {
    "dateRange": (args)=>`${args.startDate} – ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} valittu`,
    "finishRangeSelectionPrompt": `Lopeta päivämääräalueen valinta napsauttamalla tätä.`,
    "maximumDate": `Viimeinen varattavissa oleva päivämäärä`,
    "minimumDate": `Ensimmäinen varattavissa oleva päivämäärä`,
    "next": `Seuraava`,
    "previous": `Edellinen`,
    "selectedDateDescription": (args)=>`Valittu päivämäärä: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valittu aikaväli: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Aloita päivämääräalueen valinta napsauttamalla tätä.`,
    "todayDate": (args)=>`Tänään, ${args.date}`,
    "todayDateSelected": (args)=>`Tänään, ${args.date} valittu`
};


var $094c11f0389b0f6c$exports = {};
$094c11f0389b0f6c$exports = {
    "dateRange": (args)=>`${args.startDate} à ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} sélectionné`,
    "finishRangeSelectionPrompt": `Cliquer pour finir de sélectionner la plage de dates`,
    "maximumDate": `Dernière date disponible`,
    "minimumDate": `Première date disponible`,
    "next": `Suivant`,
    "previous": `Précédent`,
    "selectedDateDescription": (args)=>`Date sélectionnée : ${args.date}`,
    "selectedRangeDescription": (args)=>`Plage sélectionnée : ${args.dateRange}`,
    "startRangeSelectionPrompt": `Cliquer pour commencer à sélectionner la plage de dates`,
    "todayDate": (args)=>`Aujourd'hui, ${args.date}`,
    "todayDateSelected": (args)=>`Aujourd’hui, ${args.date} sélectionné`
};


var $5b28c6b8eb99673e$exports = {};
$5b28c6b8eb99673e$exports = {
    "dateRange": (args)=>`${args.startDate} עד ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} נבחר`,
    "finishRangeSelectionPrompt": `חץ כדי לסיים את בחירת טווח התאריכים`,
    "maximumDate": `תאריך פנוי אחרון`,
    "minimumDate": `תאריך פנוי ראשון`,
    "next": `הבא`,
    "previous": `הקודם`,
    "selectedDateDescription": (args)=>`תאריך נבחר: ${args.date}`,
    "selectedRangeDescription": (args)=>`טווח נבחר: ${args.dateRange}`,
    "startRangeSelectionPrompt": `לחץ כדי להתחיל בבחירת טווח התאריכים`,
    "todayDate": (args)=>`היום, ${args.date}`,
    "todayDateSelected": (args)=>`היום, ${args.date} נבחר`
};


var $519824243c1aad60$exports = {};
$519824243c1aad60$exports = {
    "dateRange": (args)=>`${args.startDate} do ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} odabran`,
    "finishRangeSelectionPrompt": `Kliknite da dovršite raspon odabranih datuma`,
    "maximumDate": `Posljednji raspoloživi datum`,
    "minimumDate": `Prvi raspoloživi datum`,
    "next": `Sljedeći`,
    "previous": `Prethodni`,
    "selectedDateDescription": (args)=>`Odabrani datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Odabrani raspon: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Kliknite da započnete raspon odabranih datuma`,
    "todayDate": (args)=>`Danas, ${args.date}`,
    "todayDateSelected": (args)=>`Danas, odabran ${args.date}`
};


var $2fde332abe847288$exports = {};
$2fde332abe847288$exports = {
    "dateRange": (args)=>`${args.startDate}–${args.endDate}`,
    "dateSelected": (args)=>`${args.date} kiválasztva`,
    "finishRangeSelectionPrompt": `Kattintson a dátumtartomány kijelölésének befejezéséhez`,
    "maximumDate": `Utolsó elérhető dátum`,
    "minimumDate": `Az első elérhető dátum`,
    "next": `Következő`,
    "previous": `Előző`,
    "selectedDateDescription": (args)=>`Kijelölt dátum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Kijelölt tartomány: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Kattintson a dátumtartomány kijelölésének indításához`,
    "todayDate": (args)=>`Ma, ${args.date}`,
    "todayDateSelected": (args)=>`Ma, ${args.date} kijelölve`
};


var $b266f7fa452e8e83$exports = {};
$b266f7fa452e8e83$exports = {
    "dateRange": (args)=>`Da ${args.startDate} a ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} selezionata`,
    "finishRangeSelectionPrompt": `Fai clic per completare la selezione dell’intervallo di date`,
    "maximumDate": `Ultima data disponibile`,
    "minimumDate": `Prima data disponibile`,
    "next": `Successivo`,
    "previous": `Precedente`,
    "selectedDateDescription": (args)=>`Data selezionata: ${args.date}`,
    "selectedRangeDescription": (args)=>`Intervallo selezionato: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Fai clic per selezionare l’intervallo di date`,
    "todayDate": (args)=>`Oggi, ${args.date}`,
    "todayDateSelected": (args)=>`Oggi, ${args.date} selezionata`
};


var $3528fd03237947e3$exports = {};
$3528fd03237947e3$exports = {
    "dateRange": (args)=>`${args.startDate} から ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} を選択`,
    "finishRangeSelectionPrompt": `クリックして日付範囲の選択を終了`,
    "maximumDate": `最終利用可能日`,
    "minimumDate": `最初の利用可能日`,
    "next": `次へ`,
    "previous": `前へ`,
    "selectedDateDescription": (args)=>`選択した日付 : ${args.date}`,
    "selectedRangeDescription": (args)=>`選択範囲 : ${args.dateRange}`,
    "startRangeSelectionPrompt": `クリックして日付範囲の選択を開始`,
    "todayDate": (args)=>`本日、${args.date}`,
    "todayDateSelected": (args)=>`本日、${args.date} を選択`
};


var $398f3b7902d2708f$exports = {};
$398f3b7902d2708f$exports = {
    "dateRange": (args)=>`${args.startDate} ~ ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} 선택됨`,
    "finishRangeSelectionPrompt": `날짜 범위 선택을 완료하려면 클릭하십시오.`,
    "maximumDate": `마지막으로 사용 가능한 일자`,
    "minimumDate": `처음으로 사용 가능한 일자`,
    "next": `다음`,
    "previous": `이전`,
    "selectedDateDescription": (args)=>`선택 일자: ${args.date}`,
    "selectedRangeDescription": (args)=>`선택 범위: ${args.dateRange}`,
    "startRangeSelectionPrompt": `날짜 범위 선택을 시작하려면 클릭하십시오.`,
    "todayDate": (args)=>`오늘, ${args.date}`,
    "todayDateSelected": (args)=>`오늘, ${args.date} 선택됨`
};


var $ebaae1c76687311e$exports = {};
$ebaae1c76687311e$exports = {
    "dateRange": (args)=>`Nuo ${args.startDate} iki ${args.endDate}`,
    "dateSelected": (args)=>`Pasirinkta ${args.date}`,
    "finishRangeSelectionPrompt": `Spustelėkite, kad baigtumėte pasirinkti datų intervalą`,
    "maximumDate": `Paskutinė galima data`,
    "minimumDate": `Pirmoji galima data`,
    "next": `Paskesnis`,
    "previous": `Ankstesnis`,
    "selectedDateDescription": (args)=>`Pasirinkta data: ${args.date}`,
    "selectedRangeDescription": (args)=>`Pasirinktas intervalas: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Spustelėkite, kad pradėtumėte pasirinkti datų intervalą`,
    "todayDate": (args)=>`Šiandien, ${args.date}`,
    "todayDateSelected": (args)=>`Šiandien, pasirinkta ${args.date}`
};


var $3ecb31d6694563f6$exports = {};
$3ecb31d6694563f6$exports = {
    "dateRange": (args)=>`No ${args.startDate} līdz ${args.endDate}`,
    "dateSelected": (args)=>`Atlasīts: ${args.date}`,
    "finishRangeSelectionPrompt": `Noklikšķiniet, lai pabeigtu datumu diapazona atlasi`,
    "maximumDate": `Pēdējais pieejamais datums`,
    "minimumDate": `Pirmais pieejamais datums`,
    "next": `Tālāk`,
    "previous": `Atpakaļ`,
    "selectedDateDescription": (args)=>`Atlasītais datums: ${args.date}`,
    "selectedRangeDescription": (args)=>`Atlasītais diapazons: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Noklikšķiniet, lai sāktu datumu diapazona atlasi`,
    "todayDate": (args)=>`Šodien, ${args.date}`,
    "todayDateSelected": (args)=>`Atlasīta šodiena, ${args.date}`
};


var $26dc2e2c103f178c$exports = {};
$26dc2e2c103f178c$exports = {
    "dateRange": (args)=>`${args.startDate} til ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} valgt`,
    "finishRangeSelectionPrompt": `Klikk for å fullføre valg av datoområde`,
    "maximumDate": `Siste tilgjengelige dato`,
    "minimumDate": `Første tilgjengelige dato`,
    "next": `Neste`,
    "previous": `Forrige`,
    "selectedDateDescription": (args)=>`Valgt dato: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valgt område: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Klikk for å starte valg av datoområde`,
    "todayDate": (args)=>`I dag, ${args.date}`,
    "todayDateSelected": (args)=>`I dag, ${args.date} valgt`
};


var $6bfd45b83a7d37dd$exports = {};
$6bfd45b83a7d37dd$exports = {
    "dateRange": (args)=>`${args.startDate} tot ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} geselecteerd`,
    "finishRangeSelectionPrompt": `Klik om de selectie van het datumbereik te voltooien`,
    "maximumDate": `Laatste beschikbare datum`,
    "minimumDate": `Eerste beschikbare datum`,
    "next": `Volgende`,
    "previous": `Vorige`,
    "selectedDateDescription": (args)=>`Geselecteerde datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Geselecteerd bereik: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Klik om het datumbereik te selecteren`,
    "todayDate": (args)=>`Vandaag, ${args.date}`,
    "todayDateSelected": (args)=>`Vandaag, ${args.date} geselecteerd`
};


var $6f70d036cac4bd46$exports = {};
$6f70d036cac4bd46$exports = {
    "dateRange": (args)=>`${args.startDate} do ${args.endDate}`,
    "dateSelected": (args)=>`Wybrano ${args.date}`,
    "finishRangeSelectionPrompt": `Kliknij, aby zakończyć wybór zakresu dat`,
    "maximumDate": `Ostatnia dostępna data`,
    "minimumDate": `Pierwsza dostępna data`,
    "next": `Dalej`,
    "previous": `Wstecz`,
    "selectedDateDescription": (args)=>`Wybrana data: ${args.date}`,
    "selectedRangeDescription": (args)=>`Wybrany zakres: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Kliknij, aby rozpocząć wybór zakresu dat`,
    "todayDate": (args)=>`Dzisiaj, ${args.date}`,
    "todayDateSelected": (args)=>`Dzisiaj wybrano ${args.date}`
};


var $a227ce57c671783d$exports = {};
$a227ce57c671783d$exports = {
    "dateRange": (args)=>`${args.startDate} a ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} selecionado`,
    "finishRangeSelectionPrompt": `Clique para concluir a seleção do intervalo de datas`,
    "maximumDate": `Última data disponível`,
    "minimumDate": `Primeira data disponível`,
    "next": `Próximo`,
    "previous": `Anterior`,
    "selectedDateDescription": (args)=>`Data selecionada: ${args.date}`,
    "selectedRangeDescription": (args)=>`Intervalo selecionado: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Clique para iniciar a seleção do intervalo de datas`,
    "todayDate": (args)=>`Hoje, ${args.date}`,
    "todayDateSelected": (args)=>`Hoje, ${args.date} selecionado`
};


var $97acad4758696d87$exports = {};
$97acad4758696d87$exports = {
    "dateRange": (args)=>`${args.startDate} a ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} selecionado`,
    "finishRangeSelectionPrompt": `Clique para terminar de selecionar o intervalo de datas`,
    "maximumDate": `Última data disponível`,
    "minimumDate": `Primeira data disponível`,
    "next": `Próximo`,
    "previous": `Anterior`,
    "selectedDateDescription": (args)=>`Data selecionada: ${args.date}`,
    "selectedRangeDescription": (args)=>`Intervalo selecionado: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Clique para começar a selecionar o intervalo de datas`,
    "todayDate": (args)=>`Hoje, ${args.date}`,
    "todayDateSelected": (args)=>`Hoje, ${args.date} selecionado`
};


var $010069c7d7fbbea3$exports = {};
$010069c7d7fbbea3$exports = {
    "dateRange": (args)=>`De la ${args.startDate} până la ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} selectată`,
    "finishRangeSelectionPrompt": `Apăsaţi pentru a finaliza selecţia razei pentru dată`,
    "maximumDate": `Ultima dată disponibilă`,
    "minimumDate": `Prima dată disponibilă`,
    "next": `Următorul`,
    "previous": `Înainte`,
    "selectedDateDescription": (args)=>`Dată selectată: ${args.date}`,
    "selectedRangeDescription": (args)=>`Interval selectat: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Apăsaţi pentru a începe selecţia razei pentru dată`,
    "todayDate": (args)=>`Astăzi, ${args.date}`,
    "todayDateSelected": (args)=>`Azi, ${args.date} selectată`
};


var $0ba9c30c48c8d602$exports = {};
$0ba9c30c48c8d602$exports = {
    "dateRange": (args)=>`С ${args.startDate} по ${args.endDate}`,
    "dateSelected": (args)=>`Выбрано ${args.date}`,
    "finishRangeSelectionPrompt": `Щелкните, чтобы завершить выбор диапазона дат`,
    "maximumDate": `Последняя доступная дата`,
    "minimumDate": `Первая доступная дата`,
    "next": `Далее`,
    "previous": `Назад`,
    "selectedDateDescription": (args)=>`Выбранная дата: ${args.date}`,
    "selectedRangeDescription": (args)=>`Выбранный диапазон: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Щелкните, чтобы начать выбор диапазона дат`,
    "todayDate": (args)=>`Сегодня, ${args.date}`,
    "todayDateSelected": (args)=>`Сегодня, выбрано ${args.date}`
};


var $6873e95bd7af7559$exports = {};
$6873e95bd7af7559$exports = {
    "dateRange": (args)=>`Od ${args.startDate} do ${args.endDate}`,
    "dateSelected": (args)=>`Vybratý dátum ${args.date}`,
    "finishRangeSelectionPrompt": `Kliknutím dokončíte výber rozsahu dátumov`,
    "maximumDate": `Posledný dostupný dátum`,
    "minimumDate": `Prvý dostupný dátum`,
    "next": `Nasledujúce`,
    "previous": `Predchádzajúce`,
    "selectedDateDescription": (args)=>`Vybratý dátum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Vybratý rozsah: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Kliknutím spustíte výber rozsahu dátumov`,
    "todayDate": (args)=>`Dnes ${args.date}`,
    "todayDateSelected": (args)=>`Vybratý dnešný dátum ${args.date}`
};


var $ce3c7852583668e3$exports = {};
$ce3c7852583668e3$exports = {
    "dateRange": (args)=>`${args.startDate} do ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} izbrano`,
    "finishRangeSelectionPrompt": `Kliknite za dokončanje izbire datumskega obsega`,
    "maximumDate": `Zadnji razpoložljivi datum`,
    "minimumDate": `Prvi razpoložljivi datum`,
    "next": `Naprej`,
    "previous": `Nazaj`,
    "selectedDateDescription": (args)=>`Izbrani datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Izbrano območje: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Kliknite za začetek izbire datumskega obsega`,
    "todayDate": (args)=>`Danes, ${args.date}`,
    "todayDateSelected": (args)=>`Danes, ${args.date} izbrano`
};


var $36cbdcce92af5213$exports = {};
$36cbdcce92af5213$exports = {
    "dateRange": (args)=>`${args.startDate} do ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} izabran`,
    "finishRangeSelectionPrompt": `Kliknite da dovršite opseg izabranih datuma`,
    "maximumDate": `Zadnji raspoloživi datum`,
    "minimumDate": `Prvi raspoloživi datum`,
    "next": `Sledeći`,
    "previous": `Prethodni`,
    "selectedDateDescription": (args)=>`Izabrani datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Izabrani period: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Kliknite da započnete opseg izabranih datuma`,
    "todayDate": (args)=>`Danas, ${args.date}`,
    "todayDateSelected": (args)=>`Danas, izabran ${args.date}`
};


var $ce53fa032c8abdc9$exports = {};
$ce53fa032c8abdc9$exports = {
    "dateRange": (args)=>`${args.startDate} till ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} har valts`,
    "finishRangeSelectionPrompt": `Klicka för att avsluta val av datumintervall`,
    "maximumDate": `Sista tillgängliga datum`,
    "minimumDate": `Första tillgängliga datum`,
    "next": `Nästa`,
    "previous": `Föregående`,
    "selectedDateDescription": (args)=>`Valt datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valt intervall: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Klicka för att välja datumintervall`,
    "todayDate": (args)=>`Idag, ${args.date}`,
    "todayDateSelected": (args)=>`Idag, ${args.date} har valts`
};


var $358703e281d51beb$exports = {};
$358703e281d51beb$exports = {
    "dateRange": (args)=>`${args.startDate} - ${args.endDate}`,
    "dateSelected": (args)=>`${args.date} seçildi`,
    "finishRangeSelectionPrompt": `Tarih aralığı seçimini tamamlamak için tıklayın`,
    "maximumDate": `Son müsait tarih`,
    "minimumDate": `İlk müsait tarih`,
    "next": `Sonraki`,
    "previous": `Önceki`,
    "selectedDateDescription": (args)=>`Seçilen Tarih: ${args.date}`,
    "selectedRangeDescription": (args)=>`Seçilen Aralık: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Tarih aralığı seçimini başlatmak için tıklayın`,
    "todayDate": (args)=>`Bugün, ${args.date}`,
    "todayDateSelected": (args)=>`Bugün, ${args.date} seçildi`
};


var $16bef71241a84fd2$exports = {};
$16bef71241a84fd2$exports = {
    "dateRange": (args)=>`${args.startDate} — ${args.endDate}`,
    "dateSelected": (args)=>`Вибрано ${args.date}`,
    "finishRangeSelectionPrompt": `Натисніть, щоб завершити вибір діапазону дат`,
    "maximumDate": `Остання доступна дата`,
    "minimumDate": `Перша доступна дата`,
    "next": `Наступний`,
    "previous": `Попередній`,
    "selectedDateDescription": (args)=>`Вибрана дата: ${args.date}`,
    "selectedRangeDescription": (args)=>`Вибраний діапазон: ${args.dateRange}`,
    "startRangeSelectionPrompt": `Натисніть, щоб почати вибір діапазону дат`,
    "todayDate": (args)=>`Сьогодні, ${args.date}`,
    "todayDateSelected": (args)=>`Сьогодні, вибрано ${args.date}`
};


var $c80940728ad8dc0d$exports = {};
$c80940728ad8dc0d$exports = {
    "dateRange": (args)=>`${args.startDate} 至 ${args.endDate}`,
    "dateSelected": (args)=>`已选定 ${args.date}`,
    "finishRangeSelectionPrompt": `单击以完成选择日期范围`,
    "maximumDate": `最后一个可用日期`,
    "minimumDate": `第一个可用日期`,
    "next": `下一页`,
    "previous": `上一页`,
    "selectedDateDescription": (args)=>`选定的日期：${args.date}`,
    "selectedRangeDescription": (args)=>`选定的范围：${args.dateRange}`,
    "startRangeSelectionPrompt": `单击以开始选择日期范围`,
    "todayDate": (args)=>`今天，即 ${args.date}`,
    "todayDateSelected": (args)=>`已选定今天，即 ${args.date}`
};


var $ec192a5a83cfafeb$exports = {};
$ec192a5a83cfafeb$exports = {
    "dateRange": (args)=>`${args.startDate} 至 ${args.endDate}`,
    "dateSelected": (args)=>`已選取 ${args.date}`,
    "finishRangeSelectionPrompt": `按一下以完成選取日期範圍`,
    "maximumDate": `最後一個可用日期`,
    "minimumDate": `第一個可用日期`,
    "next": `下一頁`,
    "previous": `上一頁`,
    "selectedDateDescription": (args)=>`選定的日期：${args.date}`,
    "selectedRangeDescription": (args)=>`選定的範圍：${args.dateRange}`,
    "startRangeSelectionPrompt": `按一下以開始選取日期範圍`,
    "todayDate": (args)=>`今天，${args.date}`,
    "todayDateSelected": (args)=>`已選取今天，${args.date}`
};


$f87cd00fb2ba0f23$exports = {
    "ar-AE": $1fedb39dedbf7c51$exports,
    "bg-BG": $524ada6153e36bf5$exports,
    "cs-CZ": $181053d31fc585a6$exports,
    "da-DK": $87f1f2ee75c25d27$exports,
    "de-DE": $3018d278e45fefcf$exports,
    "el-GR": $880b624ba6c377b6$exports,
    "en-US": $6a7e3934431e9523$exports,
    "es-ES": $4c458303ff44205c$exports,
    "et-EE": $4b6ec4ab19a96fff$exports,
    "fi-FI": $a5184a366ed55e98$exports,
    "fr-FR": $094c11f0389b0f6c$exports,
    "he-IL": $5b28c6b8eb99673e$exports,
    "hr-HR": $519824243c1aad60$exports,
    "hu-HU": $2fde332abe847288$exports,
    "it-IT": $b266f7fa452e8e83$exports,
    "ja-JP": $3528fd03237947e3$exports,
    "ko-KR": $398f3b7902d2708f$exports,
    "lt-LT": $ebaae1c76687311e$exports,
    "lv-LV": $3ecb31d6694563f6$exports,
    "nb-NO": $26dc2e2c103f178c$exports,
    "nl-NL": $6bfd45b83a7d37dd$exports,
    "pl-PL": $6f70d036cac4bd46$exports,
    "pt-BR": $a227ce57c671783d$exports,
    "pt-PT": $97acad4758696d87$exports,
    "ro-RO": $010069c7d7fbbea3$exports,
    "ru-RU": $0ba9c30c48c8d602$exports,
    "sk-SK": $6873e95bd7af7559$exports,
    "sl-SI": $ce3c7852583668e3$exports,
    "sr-SP": $36cbdcce92af5213$exports,
    "sv-SE": $ce53fa032c8abdc9$exports,
    "tr-TR": $358703e281d51beb$exports,
    "uk-UA": $16bef71241a84fd2$exports,
    "zh-CN": $c80940728ad8dc0d$exports,
    "zh-TW": $ec192a5a83cfafeb$exports
};




const $df1d8e967e73ec8e$export$653eddfc964b0f8a = new WeakMap();
function $df1d8e967e73ec8e$export$134cbb7fb09a9522(date) {
    return (date === null || date === void 0 ? void 0 : date.calendar.identifier) === "gregory" && date.era === "BC" ? "short" : undefined;
}
function $df1d8e967e73ec8e$export$b6df97c887c38e1a(state) {
    let stringFormatter = (0, $jzHdg$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($f87cd00fb2ba0f23$exports))));
    let start, end;
    if ("highlightedRange" in state) ({ start: start , end: end  } = state.highlightedRange || {});
    else start = end = state.value;
    let dateFormatter = (0, $jzHdg$reactariai18n.useDateFormatter)({
        weekday: "long",
        month: "long",
        year: "numeric",
        day: "numeric",
        era: $df1d8e967e73ec8e$export$134cbb7fb09a9522(start) || $df1d8e967e73ec8e$export$134cbb7fb09a9522(end),
        timeZone: state.timeZone
    });
    let anchorDate = "anchorDate" in state ? state.anchorDate : null;
    return (0, $jzHdg$react.useMemo)(()=>{
        // No message if currently selecting a range, or there is nothing highlighted.
        if (!anchorDate && start && end) {
            // Use a single date message if the start and end dates are the same day,
            // otherwise include both dates.
            if ((0, $jzHdg$internationalizeddate.isSameDay)(start, end)) {
                let date = dateFormatter.format(start.toDate(state.timeZone));
                return stringFormatter.format("selectedDateDescription", {
                    date: date
                });
            } else {
                let dateRange = $df1d8e967e73ec8e$var$formatRange(dateFormatter, stringFormatter, start, end, state.timeZone);
                return stringFormatter.format("selectedRangeDescription", {
                    dateRange: dateRange
                });
            }
        }
        return "";
    }, [
        start,
        end,
        anchorDate,
        state.timeZone,
        stringFormatter,
        dateFormatter
    ]);
}
function $df1d8e967e73ec8e$export$31afe65d91ef6e8(startDate, endDate, timeZone, isAria) {
    let stringFormatter = (0, $jzHdg$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($f87cd00fb2ba0f23$exports))));
    let era = $df1d8e967e73ec8e$export$134cbb7fb09a9522(startDate) || $df1d8e967e73ec8e$export$134cbb7fb09a9522(endDate);
    let monthFormatter = (0, $jzHdg$reactariai18n.useDateFormatter)({
        month: "long",
        year: "numeric",
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    let dateFormatter = (0, $jzHdg$reactariai18n.useDateFormatter)({
        month: "long",
        year: "numeric",
        day: "numeric",
        era: era,
        calendar: startDate.calendar.identifier,
        timeZone: timeZone
    });
    return (0, $jzHdg$react.useMemo)(()=>{
        // Special case for month granularity. Format as a single month if only a
        // single month is visible, otherwise format as a range of months.
        if ((0, $jzHdg$internationalizeddate.isSameDay)(startDate, (0, $jzHdg$internationalizeddate.startOfMonth)(startDate))) {
            if ((0, $jzHdg$internationalizeddate.isSameDay)(endDate, (0, $jzHdg$internationalizeddate.endOfMonth)(startDate))) return monthFormatter.format(startDate.toDate(timeZone));
            else if ((0, $jzHdg$internationalizeddate.isSameDay)(endDate, (0, $jzHdg$internationalizeddate.endOfMonth)(endDate))) return isAria ? $df1d8e967e73ec8e$var$formatRange(monthFormatter, stringFormatter, startDate, endDate, timeZone) : monthFormatter.formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
        }
        return isAria ? $df1d8e967e73ec8e$var$formatRange(dateFormatter, stringFormatter, startDate, endDate, timeZone) : dateFormatter.formatRange(startDate.toDate(timeZone), endDate.toDate(timeZone));
    }, [
        startDate,
        endDate,
        monthFormatter,
        dateFormatter,
        stringFormatter,
        timeZone,
        isAria
    ]);
}
function $df1d8e967e73ec8e$var$formatRange(dateFormatter, stringFormatter, start, end, timeZone) {
    let parts = dateFormatter.formatRangeToParts(start.toDate(timeZone), end.toDate(timeZone));
    // Find the separator between the start and end date. This is determined
    // by finding the last shared literal before the end range.
    let separatorIndex = -1;
    for(let i = 0; i < parts.length; i++){
        let part = parts[i];
        if (part.source === "shared" && part.type === "literal") separatorIndex = i;
        else if (part.source === "endRange") break;
    }
    // Now we can combine the parts into start and end strings.
    let startValue = "";
    let endValue = "";
    for(let i1 = 0; i1 < parts.length; i1++){
        if (i1 < separatorIndex) startValue += parts[i1].value;
        else if (i1 > separatorIndex) endValue += parts[i1].value;
    }
    return stringFormatter.format("dateRange", {
        startDate: startValue,
        endDate: endValue
    });
}





function $02ef492a56b91cb2$export$d652b3ea2d672d5b(props, state) {
    let stringFormatter = (0, $jzHdg$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($f87cd00fb2ba0f23$exports))));
    let domProps = (0, $jzHdg$reactariautils.filterDOMProps)(props);
    let title = (0, $df1d8e967e73ec8e$export$31afe65d91ef6e8)(state.visibleRange.start, state.visibleRange.end, state.timeZone, false);
    let visibleRangeDescription = (0, $df1d8e967e73ec8e$export$31afe65d91ef6e8)(state.visibleRange.start, state.visibleRange.end, state.timeZone, true);
    // Announce when the visible date range changes
    (0, $jzHdg$reactariautils.useUpdateEffect)(()=>{
        // only when pressing the Previous or Next button
        if (!state.isFocused) (0, $jzHdg$reactarialiveannouncer.announce)(visibleRangeDescription);
    }, [
        visibleRangeDescription
    ]);
    // Announce when the selected value changes
    let selectedDateDescription = (0, $df1d8e967e73ec8e$export$b6df97c887c38e1a)(state);
    (0, $jzHdg$reactariautils.useUpdateEffect)(()=>{
        if (selectedDateDescription) (0, $jzHdg$reactarialiveannouncer.announce)(selectedDateDescription, "polite", 4000);
    // handle an update to the caption that describes the currently selected range, to announce the new value
    }, [
        selectedDateDescription
    ]);
    let errorMessageId = (0, $jzHdg$reactariautils.useSlotId)([
        Boolean(props.errorMessage),
        props.validationState
    ]);
    // Pass the label to the child grid elements.
    (0, $df1d8e967e73ec8e$export$653eddfc964b0f8a).set(state, {
        ariaLabel: props["aria-label"],
        ariaLabelledBy: props["aria-labelledby"],
        errorMessageId: errorMessageId,
        selectedDateDescription: selectedDateDescription
    });
    // If the next or previous buttons become disabled while they are focused, move focus to the calendar body.
    let nextFocused = (0, $jzHdg$react.useRef)(false);
    let nextDisabled = props.isDisabled || state.isNextVisibleRangeInvalid();
    if (nextDisabled && nextFocused.current) {
        nextFocused.current = false;
        state.setFocused(true);
    }
    let previousFocused = (0, $jzHdg$react.useRef)(false);
    let previousDisabled = props.isDisabled || state.isPreviousVisibleRangeInvalid();
    if (previousDisabled && previousFocused.current) {
        previousFocused.current = false;
        state.setFocused(true);
    }
    let labelProps = (0, $jzHdg$reactariautils.useLabels)({
        id: props["id"],
        "aria-label": [
            props["aria-label"],
            visibleRangeDescription
        ].filter(Boolean).join(", "),
        "aria-labelledby": props["aria-labelledby"]
    });
    return {
        calendarProps: (0, $jzHdg$reactariautils.mergeProps)(domProps, labelProps, {
            role: "group",
            "aria-describedby": props["aria-describedby"] || undefined
        }),
        nextButtonProps: {
            onPress: ()=>state.focusNextPage(),
            "aria-label": stringFormatter.format("next"),
            isDisabled: nextDisabled,
            onFocus: ()=>nextFocused.current = true,
            onBlur: ()=>nextFocused.current = false
        },
        prevButtonProps: {
            onPress: ()=>state.focusPreviousPage(),
            "aria-label": stringFormatter.format("previous"),
            isDisabled: previousDisabled,
            onFocus: ()=>previousFocused.current = true,
            onBlur: ()=>previousFocused.current = false
        },
        errorMessageProps: {
            id: errorMessageId
        },
        title: title
    };
}


function $20e845123e697a89$export$3ee915f8151bd4f1(props, state) {
    return (0, $02ef492a56b91cb2$export$d652b3ea2d672d5b)(props, state);
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


function $c49ada48cbc48220$export$87e0539f600c24e5(props, state, ref) {
    let res = (0, $02ef492a56b91cb2$export$d652b3ea2d672d5b)(props, state);
    // We need to ignore virtual pointer events from VoiceOver due to these bugs.
    // https://bugs.webkit.org/show_bug.cgi?id=222627
    // https://bugs.webkit.org/show_bug.cgi?id=223202
    // usePress also does this and waits for the following click event before firing.
    // We need to match that here otherwise this will fire before the press event in
    // useCalendarCell, causing range selection to not work properly.
    let isVirtualClick = (0, $jzHdg$react.useRef)(false);
    let windowRef = (0, $jzHdg$react.useRef)(typeof window !== "undefined" ? window : null);
    (0, $jzHdg$reactariautils.useEvent)(windowRef, "pointerdown", (e)=>{
        isVirtualClick.current = e.width === 0 && e.height === 0;
    });
    // Stop range selection when pressing or releasing a pointer outside the calendar body,
    // except when pressing the next or previous buttons to switch months.
    let endDragging = (e)=>{
        if (isVirtualClick.current) {
            isVirtualClick.current = false;
            return;
        }
        state.setDragging(false);
        if (!state.anchorDate) return;
        let target = e.target;
        let body = document.getElementById(res.calendarProps.id);
        if (body && body.contains(document.activeElement) && (!body.contains(target) || !target.closest('button, [role="button"]'))) state.selectFocusedDate();
    };
    (0, $jzHdg$reactariautils.useEvent)(windowRef, "pointerup", endDragging);
    (0, $jzHdg$reactariautils.useEvent)(windowRef, "pointercancel", endDragging);
    // Also stop range selection on blur, e.g. tabbing away from the calendar.
    res.calendarProps.onBlur = (e)=>{
        if ((!e.relatedTarget || !ref.current.contains(e.relatedTarget)) && state.anchorDate) state.selectFocusedDate();
    };
    // Prevent touch scrolling while dragging
    (0, $jzHdg$reactariautils.useEvent)(ref, "touchmove", (e)=>{
        if (state.isDragging) e.preventDefault();
    }, {
        passive: false,
        capture: true
    });
    return res;
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




function $a07388a797d86b95$export$cb95147730a423f5(props, state) {
    let { startDate: startDate = state.visibleRange.start , endDate: endDate = state.visibleRange.end  } = props;
    let { direction: direction  } = (0, $jzHdg$reactariai18n.useLocale)();
    let onKeyDown = (e)=>{
        switch(e.key){
            case "Enter":
            case " ":
                e.preventDefault();
                state.selectFocusedDate();
                break;
            case "PageUp":
                e.preventDefault();
                e.stopPropagation();
                state.focusPreviousSection(e.shiftKey);
                break;
            case "PageDown":
                e.preventDefault();
                e.stopPropagation();
                state.focusNextSection(e.shiftKey);
                break;
            case "End":
                e.preventDefault();
                e.stopPropagation();
                state.focusSectionEnd();
                break;
            case "Home":
                e.preventDefault();
                e.stopPropagation();
                state.focusSectionStart();
                break;
            case "ArrowLeft":
                e.preventDefault();
                e.stopPropagation();
                if (direction === "rtl") state.focusNextDay();
                else state.focusPreviousDay();
                break;
            case "ArrowUp":
                e.preventDefault();
                e.stopPropagation();
                state.focusPreviousRow();
                break;
            case "ArrowRight":
                e.preventDefault();
                e.stopPropagation();
                if (direction === "rtl") state.focusPreviousDay();
                else state.focusNextDay();
                break;
            case "ArrowDown":
                e.preventDefault();
                e.stopPropagation();
                state.focusNextRow();
                break;
            case "Escape":
                // Cancel the selection.
                if ("setAnchorDate" in state) {
                    e.preventDefault();
                    state.setAnchorDate(null);
                }
                break;
        }
    };
    let visibleRangeDescription = (0, $df1d8e967e73ec8e$export$31afe65d91ef6e8)(startDate, endDate, state.timeZone, true);
    let { ariaLabel: ariaLabel , ariaLabelledBy: ariaLabelledBy  } = (0, $df1d8e967e73ec8e$export$653eddfc964b0f8a).get(state);
    let labelProps = (0, $jzHdg$reactariautils.useLabels)({
        "aria-label": [
            ariaLabel,
            visibleRangeDescription
        ].filter(Boolean).join(", "),
        "aria-labelledby": ariaLabelledBy
    });
    let dayFormatter = (0, $jzHdg$reactariai18n.useDateFormatter)({
        weekday: "narrow",
        timeZone: state.timeZone
    });
    let { locale: locale  } = (0, $jzHdg$reactariai18n.useLocale)();
    let weekDays = (0, $jzHdg$react.useMemo)(()=>{
        let weekStart = (0, $jzHdg$internationalizeddate.startOfWeek)((0, $jzHdg$internationalizeddate.today)(state.timeZone), locale);
        return [
            ...new Array(7).keys()
        ].map((index)=>{
            let date = weekStart.add({
                days: index
            });
            let dateDay = date.toDate(state.timeZone);
            return dayFormatter.format(dateDay);
        });
    }, [
        locale,
        state.timeZone,
        dayFormatter
    ]);
    return {
        gridProps: (0, $jzHdg$reactariautils.mergeProps)(labelProps, {
            role: "grid",
            "aria-readonly": state.isReadOnly || null,
            "aria-disabled": state.isDisabled || null,
            "aria-multiselectable": "highlightedRange" in state || undefined,
            onKeyDown: onKeyDown,
            onFocus: ()=>state.setFocused(true),
            onBlur: ()=>state.setFocused(false)
        }),
        headerProps: {
            // Column headers are hidden to screen readers to make navigating with a touch screen reader easier.
            // The day names are already included in the label of each cell, so there's no need to announce them twice.
            "aria-hidden": true
        },
        weekDays: weekDays
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







function $4d833327a32c9193$export$136073280381448e(props, state, ref) {
    let { date: date , isDisabled: isDisabled  } = props;
    let { errorMessageId: errorMessageId , selectedDateDescription: selectedDateDescription  } = (0, $df1d8e967e73ec8e$export$653eddfc964b0f8a).get(state);
    let stringFormatter = (0, $jzHdg$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($f87cd00fb2ba0f23$exports))));
    let dateFormatter = (0, $jzHdg$reactariai18n.useDateFormatter)({
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        era: (0, $df1d8e967e73ec8e$export$134cbb7fb09a9522)(date),
        timeZone: state.timeZone
    });
    let isSelected = state.isSelected(date);
    let isFocused = state.isCellFocused(date);
    isDisabled = isDisabled || state.isCellDisabled(date);
    let isUnavailable = state.isCellUnavailable(date);
    let isSelectable = !isDisabled && !isUnavailable;
    let isInvalid = state.validationState === "invalid" && ("highlightedRange" in state ? !state.anchorDate && state.highlightedRange && date.compare(state.highlightedRange.start) >= 0 && date.compare(state.highlightedRange.end) <= 0 : state.value && (0, $jzHdg$internationalizeddate.isSameDay)(state.value, date));
    if (isInvalid) isSelected = true;
    // For performance, reuse the same date object as before if the new date prop is the same.
    // This allows subsequent useMemo results to be reused.
    let lastDate = (0, $jzHdg$react.useRef)(null);
    if (lastDate.current && (0, $jzHdg$internationalizeddate.isEqualDay)(date, lastDate.current)) date = lastDate.current;
    lastDate.current = date;
    let nativeDate = (0, $jzHdg$react.useMemo)(()=>date.toDate(state.timeZone), [
        date,
        state.timeZone
    ]);
    // aria-label should be localize Day of week, Month, Day and Year without Time.
    let isDateToday = (0, $jzHdg$internationalizeddate.isToday)(date, state.timeZone);
    let label = (0, $jzHdg$react.useMemo)(()=>{
        let label = "";
        // If this is a range calendar, add a description of the full selected range
        // to the first and last selected date.
        if ("highlightedRange" in state && state.value && !state.anchorDate && ((0, $jzHdg$internationalizeddate.isSameDay)(date, state.value.start) || (0, $jzHdg$internationalizeddate.isSameDay)(date, state.value.end))) label = selectedDateDescription + ", ";
        label += dateFormatter.format(nativeDate);
        if (isDateToday) // If date is today, set appropriate string depending on selected state:
        label = stringFormatter.format(isSelected ? "todayDateSelected" : "todayDate", {
            date: label
        });
        else if (isSelected) // If date is selected but not today:
        label = stringFormatter.format("dateSelected", {
            date: label
        });
        if (state.minValue && (0, $jzHdg$internationalizeddate.isSameDay)(date, state.minValue)) label += ", " + stringFormatter.format("minimumDate");
        else if (state.maxValue && (0, $jzHdg$internationalizeddate.isSameDay)(date, state.maxValue)) label += ", " + stringFormatter.format("maximumDate");
        return label;
    }, [
        dateFormatter,
        nativeDate,
        stringFormatter,
        isSelected,
        isDateToday,
        date,
        state,
        selectedDateDescription
    ]);
    // When a cell is focused and this is a range calendar, add a prompt to help
    // screenreader users know that they are in a range selection mode.
    let rangeSelectionPrompt = "";
    if ("anchorDate" in state && isFocused && !state.isReadOnly && isSelectable) {
        // If selection has started add "click to finish selecting range"
        if (state.anchorDate) rangeSelectionPrompt = stringFormatter.format("finishRangeSelectionPrompt");
        else rangeSelectionPrompt = stringFormatter.format("startRangeSelectionPrompt");
    }
    let descriptionProps = (0, $jzHdg$reactariautils.useDescription)(rangeSelectionPrompt);
    let isAnchorPressed = (0, $jzHdg$react.useRef)(false);
    let isRangeBoundaryPressed = (0, $jzHdg$react.useRef)(false);
    let touchDragTimerRef = (0, $jzHdg$react.useRef)(null);
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $jzHdg$reactariainteractions.usePress)({
        // When dragging to select a range, we don't want dragging over the original anchor
        // again to trigger onPressStart. Cancel presses immediately when the pointer exits.
        shouldCancelOnPointerExit: "anchorDate" in state && !!state.anchorDate,
        preventFocusOnPress: true,
        isDisabled: !isSelectable || state.isReadOnly,
        onPressStart (e) {
            if (state.isReadOnly) {
                state.setFocusedDate(date);
                return;
            }
            if ("highlightedRange" in state && !state.anchorDate && (e.pointerType === "mouse" || e.pointerType === "touch")) {
                // Allow dragging the start or end date of a range to modify it
                // rather than starting a new selection.
                // Don't allow dragging when invalid, or weird jumping behavior may occur as date ranges
                // are constrained to available dates. The user will need to select a new range in this case.
                if (state.highlightedRange && !isInvalid) {
                    if ((0, $jzHdg$internationalizeddate.isSameDay)(date, state.highlightedRange.start)) {
                        state.setAnchorDate(state.highlightedRange.end);
                        state.setFocusedDate(date);
                        state.setDragging(true);
                        isRangeBoundaryPressed.current = true;
                        return;
                    } else if ((0, $jzHdg$internationalizeddate.isSameDay)(date, state.highlightedRange.end)) {
                        state.setAnchorDate(state.highlightedRange.start);
                        state.setFocusedDate(date);
                        state.setDragging(true);
                        isRangeBoundaryPressed.current = true;
                        return;
                    }
                }
                let startDragging = ()=>{
                    state.setDragging(true);
                    touchDragTimerRef.current = null;
                    state.selectDate(date);
                    state.setFocusedDate(date);
                    isAnchorPressed.current = true;
                };
                // Start selection on mouse/touch down so users can drag to select a range.
                // On touch, delay dragging to determine if the user really meant to scroll.
                if (e.pointerType === "touch") touchDragTimerRef.current = setTimeout(startDragging, 200);
                else startDragging();
            }
        },
        onPressEnd () {
            isRangeBoundaryPressed.current = false;
            isAnchorPressed.current = false;
            clearTimeout(touchDragTimerRef.current);
            touchDragTimerRef.current = null;
        },
        onPress () {
            // For non-range selection, always select on press up.
            if (!("anchorDate" in state) && !state.isReadOnly) {
                state.selectDate(date);
                state.setFocusedDate(date);
            }
        },
        onPressUp (e) {
            if (state.isReadOnly) return;
            // If the user tapped quickly, the date won't be selected yet and the
            // timer will still be in progress. In this case, select the date on touch up.
            // Timer is cleared in onPressEnd.
            if ("anchorDate" in state && touchDragTimerRef.current) {
                state.selectDate(date);
                state.setFocusedDate(date);
            }
            if ("anchorDate" in state) {
                if (isRangeBoundaryPressed.current) // When clicking on the start or end date of an already selected range,
                // start a new selection on press up to also allow dragging the date to
                // change the existing range.
                state.setAnchorDate(date);
                else if (state.anchorDate && !isAnchorPressed.current) {
                    // When releasing a drag or pressing the end date of a range, select it.
                    state.selectDate(date);
                    state.setFocusedDate(date);
                } else if (e.pointerType === "keyboard" && !state.anchorDate) {
                    // For range selection, auto-advance the focused date by one if using keyboard.
                    // This gives an indication that you're selecting a range rather than a single date.
                    // For mouse, this is unnecessary because users will see the indication on hover. For screen readers,
                    // there will be an announcement to "click to finish selecting range" (above).
                    state.selectDate(date);
                    let nextDay = date.add({
                        days: 1
                    });
                    if (state.isInvalid(nextDay)) nextDay = date.subtract({
                        days: 1
                    });
                    if (!state.isInvalid(nextDay)) state.setFocusedDate(nextDay);
                } else if (e.pointerType === "virtual") {
                    // For screen readers, just select the date on click.
                    state.selectDate(date);
                    state.setFocusedDate(date);
                }
            }
        }
    });
    let tabIndex = null;
    if (!isDisabled) tabIndex = (0, $jzHdg$internationalizeddate.isSameDay)(date, state.focusedDate) ? 0 : -1;
    // Focus the button in the DOM when the state updates.
    (0, $jzHdg$react.useEffect)(()=>{
        if (isFocused && ref.current) {
            (0, $jzHdg$reactariautils.focusWithoutScrolling)(ref.current);
            // Scroll into view if navigating with a keyboard, otherwise
            // try not to shift the view under the user's mouse/finger.
            // If in a overlay, scrollIntoViewport will only cause scrolling
            // up to the overlay scroll body to prevent overlay shifting
            if ((0, $jzHdg$reactariainteractions.getInteractionModality)() !== "pointer") (0, $jzHdg$reactariautils.scrollIntoViewport)(ref.current, {
                containingElement: (0, $jzHdg$reactariautils.getScrollParent)(ref.current)
            });
        }
    }, [
        isFocused,
        ref
    ]);
    let cellDateFormatter = (0, $jzHdg$reactariai18n.useDateFormatter)({
        day: "numeric",
        timeZone: state.timeZone,
        calendar: date.calendar.identifier
    });
    let formattedDate = (0, $jzHdg$react.useMemo)(()=>cellDateFormatter.formatToParts(nativeDate).find((part)=>part.type === "day").value, [
        cellDateFormatter,
        nativeDate
    ]);
    return {
        cellProps: {
            role: "gridcell",
            "aria-disabled": !isSelectable || null,
            "aria-selected": isSelected || null,
            "aria-invalid": isInvalid || null
        },
        buttonProps: (0, $jzHdg$reactariautils.mergeProps)(pressProps, {
            onFocus () {
                if (!isDisabled) state.setFocusedDate(date);
            },
            tabIndex: tabIndex,
            role: "button",
            "aria-disabled": !isSelectable || null,
            "aria-label": label,
            "aria-invalid": isInvalid || null,
            "aria-describedby": [
                isInvalid ? errorMessageId : null,
                descriptionProps["aria-describedby"]
            ].filter(Boolean).join(" ") || undefined,
            onPointerEnter (e) {
                // Highlight the date on hover or drag over a date when selecting a range.
                if ("highlightDate" in state && (e.pointerType !== "touch" || state.isDragging) && isSelectable) state.highlightDate(date);
            },
            onPointerDown (e) {
                // This is necessary on touch devices to allow dragging
                // outside the original pressed element.
                // (JSDOM does not support this)
                if ("releasePointerCapture" in e.target) e.target.releasePointerCapture(e.pointerId);
            },
            onContextMenu (e) {
                // Prevent context menu on long press.
                e.preventDefault();
            }
        }),
        isPressed: isPressed,
        isFocused: isFocused,
        isSelected: isSelected,
        isDisabled: isDisabled,
        isUnavailable: isUnavailable,
        isOutsideVisibleRange: date.compare(state.visibleRange.start) < 0 || date.compare(state.visibleRange.end) > 0,
        isInvalid: isInvalid,
        formattedDate: formattedDate
    };
}




//# sourceMappingURL=main.js.map
