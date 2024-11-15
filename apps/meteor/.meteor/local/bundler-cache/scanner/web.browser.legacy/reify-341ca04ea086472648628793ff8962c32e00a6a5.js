var $IwcIq$reactariafocus = require("@react-aria/focus");
var $IwcIq$reactariautils = require("@react-aria/utils");
var $IwcIq$react = require("react");
var $IwcIq$reactarialabel = require("@react-aria/label");
var $IwcIq$reactariainteractions = require("@react-aria/interactions");
var $IwcIq$reactariai18n = require("@react-aria/i18n");
var $IwcIq$internationalizeddate = require("@internationalized/date");
var $IwcIq$internationalizednumber = require("@internationalized/number");
var $IwcIq$reactariaspinbutton = require("@react-aria/spinbutton");
var $IwcIq$internationalizedstring = require("@internationalized/string");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useDatePicker", () => $e90ae7c26a69c6b1$export$42df105a73306d51);
$parcel$export(module.exports, "useDateSegment", () => $5c015c6316d1904d$export$1315d136e6f7581);
$parcel$export(module.exports, "useDateField", () => $4acc2f407c169e55$export$5591b0b878c1a989);
$parcel$export(module.exports, "useTimeField", () => $4acc2f407c169e55$export$4c842f6a241dc825);
$parcel$export(module.exports, "useDateRangePicker", () => $20f695b1b69e6b9e$export$12fd5f0e9f4bb192);
$parcel$export(module.exports, "useDisplayNames", () => $934ac650a0aceb4b$export$d42c60378c8168f8);
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

var $c7d0e80b992ca68a$exports = {};
var $aa344be62785b256$exports = {};
$aa344be62785b256$exports = {
    "calendar": `التقويم`,
    "day": `يوم`,
    "dayPeriod": `ص/م`,
    "endDate": `تاريخ الانتهاء`,
    "era": `العصر`,
    "hour": `الساعات`,
    "minute": `الدقائق`,
    "month": `الشهر`,
    "second": `الثواني`,
    "selectedDateDescription": (args)=>`تاريخ محدد: ${args.date}`,
    "selectedRangeDescription": (args)=>`المدى الزمني المحدد: ${args.startDate} إلى ${args.endDate}`,
    "selectedTimeDescription": (args)=>`الوقت المحدد: ${args.time}`,
    "startDate": `تاريخ البدء`,
    "timeZoneName": `التوقيت`,
    "weekday": `اليوم`,
    "year": `السنة`
};


var $615986c3475e7c8c$exports = {};
$615986c3475e7c8c$exports = {
    "calendar": `Календар`,
    "day": `ден`,
    "dayPeriod": `пр.об./сл.об.`,
    "endDate": `Крайна дата`,
    "era": `ера`,
    "hour": `час`,
    "minute": `минута`,
    "month": `месец`,
    "second": `секунда`,
    "selectedDateDescription": (args)=>`Избрана дата: ${args.date}`,
    "selectedRangeDescription": (args)=>`Избран диапазон: ${args.startDate} до ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Избрано време: ${args.time}`,
    "startDate": `Начална дата`,
    "timeZoneName": `часова зона`,
    "weekday": `ден от седмицата`,
    "year": `година`
};


var $6c6207692f1ab248$exports = {};
$6c6207692f1ab248$exports = {
    "calendar": `Kalendář`,
    "day": `den`,
    "dayPeriod": `část dne`,
    "endDate": `Konečné datum`,
    "era": `letopočet`,
    "hour": `hodina`,
    "minute": `minuta`,
    "month": `měsíc`,
    "second": `sekunda`,
    "selectedDateDescription": (args)=>`Vybrané datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Vybrané období: ${args.startDate} až ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Vybraný čas: ${args.time}`,
    "startDate": `Počáteční datum`,
    "timeZoneName": `časové pásmo`,
    "weekday": `den v týdnu`,
    "year": `rok`
};


var $fb37a9d024dd70f8$exports = {};
$fb37a9d024dd70f8$exports = {
    "calendar": `Kalender`,
    "day": `dag`,
    "dayPeriod": `AM/PM`,
    "endDate": `Slutdato`,
    "era": `æra`,
    "hour": `time`,
    "minute": `minut`,
    "month": `måned`,
    "second": `sekund`,
    "selectedDateDescription": (args)=>`Valgt dato: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valgt interval: ${args.startDate} til ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Valgt tidspunkt: ${args.time}`,
    "startDate": `Startdato`,
    "timeZoneName": `tidszone`,
    "weekday": `ugedag`,
    "year": `år`
};


var $d7780bd4790f7ae9$exports = {};
$d7780bd4790f7ae9$exports = {
    "calendar": `Kalender`,
    "day": `Tag`,
    "dayPeriod": `Tageshälfte`,
    "endDate": `Enddatum`,
    "era": `Epoche`,
    "hour": `Stunde`,
    "minute": `Minute`,
    "month": `Monat`,
    "second": `Sekunde`,
    "selectedDateDescription": (args)=>`Ausgewähltes Datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Ausgewählter Bereich: ${args.startDate} bis ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Ausgewählte Zeit: ${args.time}`,
    "startDate": `Anfangsdatum`,
    "timeZoneName": `Zeitzone`,
    "weekday": `Wochentag`,
    "year": `Jahr`
};


var $9cdf03311f06c4ac$exports = {};
$9cdf03311f06c4ac$exports = {
    "calendar": `Ημερολόγιο`,
    "day": `ημέρα`,
    "dayPeriod": `π.μ./μ.μ.`,
    "endDate": `Ημερομηνία λήξης`,
    "era": `περίοδος`,
    "hour": `ώρα`,
    "minute": `λεπτό`,
    "month": `μήνας`,
    "second": `δευτερόλεπτο`,
    "selectedDateDescription": (args)=>`Επιλεγμένη ημερομηνία: ${args.date}`,
    "selectedRangeDescription": (args)=>`Επιλεγμένο εύρος: ${args.startDate} έως ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Επιλεγμένη ώρα: ${args.time}`,
    "startDate": `Ημερομηνία έναρξης`,
    "timeZoneName": `ζώνη ώρας`,
    "weekday": `καθημερινή`,
    "year": `έτος`
};


var $f93fc9e164ae811c$exports = {};
$f93fc9e164ae811c$exports = {
    "era": `era`,
    "year": `year`,
    "month": `month`,
    "day": `day`,
    "hour": `hour`,
    "minute": `minute`,
    "second": `second`,
    "dayPeriod": `AM/PM`,
    "calendar": `Calendar`,
    "startDate": `Start Date`,
    "endDate": `End Date`,
    "weekday": `day of the week`,
    "timeZoneName": `time zone`,
    "selectedDateDescription": (args)=>`Selected Date: ${args.date}`,
    "selectedRangeDescription": (args)=>`Selected Range: ${args.startDate} to ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Selected Time: ${args.time}`
};


var $7426c3264bf5ffea$exports = {};
$7426c3264bf5ffea$exports = {
    "calendar": `Calendario`,
    "day": `día`,
    "dayPeriod": `a. m./p. m.`,
    "endDate": `Fecha final`,
    "era": `era`,
    "hour": `hora`,
    "minute": `minuto`,
    "month": `mes`,
    "second": `segundo`,
    "selectedDateDescription": (args)=>`Fecha seleccionada: ${args.date}`,
    "selectedRangeDescription": (args)=>`Rango seleccionado: ${args.startDate} a ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Hora seleccionada: ${args.time}`,
    "startDate": `Fecha de inicio`,
    "timeZoneName": `zona horaria`,
    "weekday": `día de la semana`,
    "year": `año`
};


var $1115cc0042de790c$exports = {};
$1115cc0042de790c$exports = {
    "calendar": `Kalender`,
    "day": `päev`,
    "dayPeriod": `enne/pärast lõunat`,
    "endDate": `Lõppkuupäev`,
    "era": `ajastu`,
    "hour": `tund`,
    "minute": `minut`,
    "month": `kuu`,
    "second": `sekund`,
    "selectedDateDescription": (args)=>`Valitud kuupäev: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valitud vahemik: ${args.startDate} kuni ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Valitud aeg: ${args.time}`,
    "startDate": `Alguskuupäev`,
    "timeZoneName": `ajavöönd`,
    "weekday": `nädalapäev`,
    "year": `aasta`
};


var $4e80389dccb9283f$exports = {};
$4e80389dccb9283f$exports = {
    "calendar": `Kalenteri`,
    "day": `päivä`,
    "dayPeriod": `vuorokaudenaika`,
    "endDate": `Päättymispäivä`,
    "era": `aikakausi`,
    "hour": `tunti`,
    "minute": `minuutti`,
    "month": `kuukausi`,
    "second": `sekunti`,
    "selectedDateDescription": (args)=>`Valittu päivämäärä: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valittu aikaväli: ${args.startDate} – ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Valittu aika: ${args.time}`,
    "startDate": `Alkamispäivä`,
    "timeZoneName": `aikavyöhyke`,
    "weekday": `viikonpäivä`,
    "year": `vuosi`
};


var $78ad6f738c1f38d1$exports = {};
$78ad6f738c1f38d1$exports = {
    "calendar": `Calendrier`,
    "day": `jour`,
    "dayPeriod": `cadran`,
    "endDate": `Date de fin`,
    "era": `ère`,
    "hour": `heure`,
    "minute": `minute`,
    "month": `mois`,
    "second": `seconde`,
    "selectedDateDescription": (args)=>`Date sélectionnée : ${args.date}`,
    "selectedRangeDescription": (args)=>`Plage sélectionnée : ${args.startDate} au ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Heure choisie : ${args.time}`,
    "startDate": `Date de début`,
    "timeZoneName": `fuseau horaire`,
    "weekday": `jour de la semaine`,
    "year": `année`
};


var $50fa4716d827cd97$exports = {};
$50fa4716d827cd97$exports = {
    "calendar": `לוח שנה`,
    "day": `יום`,
    "dayPeriod": `לפנה״צ/אחה״צ`,
    "endDate": `תאריך סיום`,
    "era": `תקופה`,
    "hour": `שעה`,
    "minute": `דקה`,
    "month": `חודש`,
    "second": `שנייה`,
    "selectedDateDescription": (args)=>`תאריך נבחר: ${args.date}`,
    "selectedRangeDescription": (args)=>`טווח נבחר: ${args.startDate} עד ${args.endDate}`,
    "selectedTimeDescription": (args)=>`זמן נבחר: ${args.time}`,
    "startDate": `תאריך התחלה`,
    "timeZoneName": `אזור זמן`,
    "weekday": `יום בשבוע`,
    "year": `שנה`
};


var $7297908fac4cf6c2$exports = {};
$7297908fac4cf6c2$exports = {
    "calendar": `Kalendar`,
    "day": `dan`,
    "dayPeriod": `AM/PM`,
    "endDate": `Datum završetka`,
    "era": `era`,
    "hour": `sat`,
    "minute": `minuta`,
    "month": `mjesec`,
    "second": `sekunda`,
    "selectedDateDescription": (args)=>`Odabrani datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Odabrani raspon: ${args.startDate} do ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Odabrano vrijeme: ${args.time}`,
    "startDate": `Datum početka`,
    "timeZoneName": `vremenska zona`,
    "weekday": `dan u tjednu`,
    "year": `godina`
};


var $f95c1b06e1d5ba32$exports = {};
$f95c1b06e1d5ba32$exports = {
    "calendar": `Naptár`,
    "day": `nap`,
    "dayPeriod": `napszak`,
    "endDate": `Befejező dátum`,
    "era": `éra`,
    "hour": `óra`,
    "minute": `perc`,
    "month": `hónap`,
    "second": `másodperc`,
    "selectedDateDescription": (args)=>`Kijelölt dátum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Kijelölt tartomány: ${args.startDate}–${args.endDate}`,
    "selectedTimeDescription": (args)=>`Kijelölt idő: ${args.time}`,
    "startDate": `Kezdő dátum`,
    "timeZoneName": `időzóna`,
    "weekday": `hét napja`,
    "year": `év`
};


var $437a8dc519258a01$exports = {};
$437a8dc519258a01$exports = {
    "calendar": `Calendario`,
    "day": `giorno`,
    "dayPeriod": `AM/PM`,
    "endDate": `Data finale`,
    "era": `era`,
    "hour": `ora`,
    "minute": `minuto`,
    "month": `mese`,
    "second": `secondo`,
    "selectedDateDescription": (args)=>`Data selezionata: ${args.date}`,
    "selectedRangeDescription": (args)=>`Intervallo selezionato: da ${args.startDate} a ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Ora selezionata: ${args.time}`,
    "startDate": `Data iniziale`,
    "timeZoneName": `fuso orario`,
    "weekday": `giorno della settimana`,
    "year": `anno`
};


var $bd0aa2b50092a836$exports = {};
$bd0aa2b50092a836$exports = {
    "calendar": `カレンダー`,
    "day": `日`,
    "dayPeriod": `午前/午後`,
    "endDate": `終了日`,
    "era": `時代`,
    "hour": `時`,
    "minute": `分`,
    "month": `月`,
    "second": `秒`,
    "selectedDateDescription": (args)=>`選択した日付 : ${args.date}`,
    "selectedRangeDescription": (args)=>`選択範囲 : ${args.startDate} から ${args.endDate}`,
    "selectedTimeDescription": (args)=>`選択した時間 : ${args.time}`,
    "startDate": `開始日`,
    "timeZoneName": `タイムゾーン`,
    "weekday": `曜日`,
    "year": `年`
};


var $bbd8176c2e044bc1$exports = {};
$bbd8176c2e044bc1$exports = {
    "calendar": `달력`,
    "day": `일`,
    "dayPeriod": `오전/오후`,
    "endDate": `종료 날짜`,
    "era": `연호`,
    "hour": `시`,
    "minute": `분`,
    "month": `월`,
    "second": `초`,
    "selectedDateDescription": (args)=>`선택 일자: ${args.date}`,
    "selectedRangeDescription": (args)=>`선택 범위: ${args.startDate} ~ ${args.endDate}`,
    "selectedTimeDescription": (args)=>`선택 시간: ${args.time}`,
    "startDate": `시작 날짜`,
    "timeZoneName": `시간대`,
    "weekday": `요일`,
    "year": `년`
};


var $1af703df56ff5180$exports = {};
$1af703df56ff5180$exports = {
    "calendar": `Kalendorius`,
    "day": `diena`,
    "dayPeriod": `iki pietų / po pietų`,
    "endDate": `Pabaigos data`,
    "era": `era`,
    "hour": `valanda`,
    "minute": `minutė`,
    "month": `mėnuo`,
    "second": `sekundė`,
    "selectedDateDescription": (args)=>`Pasirinkta data: ${args.date}`,
    "selectedRangeDescription": (args)=>`Pasirinktas intervalas: nuo ${args.startDate} iki ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Pasirinktas laikas: ${args.time}`,
    "startDate": `Pradžios data`,
    "timeZoneName": `laiko juosta`,
    "weekday": `savaitės diena`,
    "year": `metai`
};


var $9705eb4511dea9f8$exports = {};
$9705eb4511dea9f8$exports = {
    "calendar": `Kalendārs`,
    "day": `diena`,
    "dayPeriod": `priekšpusdienā/pēcpusdienā`,
    "endDate": `Beigu datums`,
    "era": `ēra`,
    "hour": `stundas`,
    "minute": `minūtes`,
    "month": `mēnesis`,
    "second": `sekundes`,
    "selectedDateDescription": (args)=>`Atlasītais datums: ${args.date}`,
    "selectedRangeDescription": (args)=>`Atlasītais diapazons: no ${args.startDate} līdz ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Atlasītais laiks: ${args.time}`,
    "startDate": `Sākuma datums`,
    "timeZoneName": `laika josla`,
    "weekday": `nedēļas diena`,
    "year": `gads`
};


var $8ef984876a7160bc$exports = {};
$8ef984876a7160bc$exports = {
    "calendar": `Kalender`,
    "day": `dag`,
    "dayPeriod": `a.m./p.m.`,
    "endDate": `Sluttdato`,
    "era": `tidsalder`,
    "hour": `time`,
    "minute": `minutt`,
    "month": `måned`,
    "second": `sekund`,
    "selectedDateDescription": (args)=>`Valgt dato: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valgt område: ${args.startDate} til ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Valgt tid: ${args.time}`,
    "startDate": `Startdato`,
    "timeZoneName": `tidssone`,
    "weekday": `ukedag`,
    "year": `år`
};


var $b6e9809e1ecaa25e$exports = {};
$b6e9809e1ecaa25e$exports = {
    "calendar": `Kalender`,
    "day": `dag`,
    "dayPeriod": `a.m./p.m.`,
    "endDate": `Einddatum`,
    "era": `tijdperk`,
    "hour": `uur`,
    "minute": `minuut`,
    "month": `maand`,
    "second": `seconde`,
    "selectedDateDescription": (args)=>`Geselecteerde datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Geselecteerd bereik: ${args.startDate} tot ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Geselecteerde tijd: ${args.time}`,
    "startDate": `Startdatum`,
    "timeZoneName": `tijdzone`,
    "weekday": `dag van de week`,
    "year": `jaar`
};


var $deb2fa609661fe31$exports = {};
$deb2fa609661fe31$exports = {
    "calendar": `Kalendarz`,
    "day": `dzień`,
    "dayPeriod": `rano / po południu / wieczorem`,
    "endDate": `Data końcowa`,
    "era": `era`,
    "hour": `godzina`,
    "minute": `minuta`,
    "month": `miesiąc`,
    "second": `sekunda`,
    "selectedDateDescription": (args)=>`Wybrana data: ${args.date}`,
    "selectedRangeDescription": (args)=>`Wybrany zakres: ${args.startDate} do ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Wybrany czas: ${args.time}`,
    "startDate": `Data początkowa`,
    "timeZoneName": `strefa czasowa`,
    "weekday": `dzień tygodnia`,
    "year": `rok`
};


var $591c8c054c84fa56$exports = {};
$591c8c054c84fa56$exports = {
    "calendar": `Calendário`,
    "day": `dia`,
    "dayPeriod": `AM/PM`,
    "endDate": `Data final`,
    "era": `era`,
    "hour": `hora`,
    "minute": `minuto`,
    "month": `mês`,
    "second": `segundo`,
    "selectedDateDescription": (args)=>`Data selecionada: ${args.date}`,
    "selectedRangeDescription": (args)=>`Intervalo selecionado: ${args.startDate} a ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Hora selecionada: ${args.time}`,
    "startDate": `Data inicial`,
    "timeZoneName": `fuso horário`,
    "weekday": `dia da semana`,
    "year": `ano`
};


var $f1633bd6cbc228e8$exports = {};
$f1633bd6cbc228e8$exports = {
    "calendar": `Calendário`,
    "day": `dia`,
    "dayPeriod": `am/pm`,
    "endDate": `Data de Término`,
    "era": `era`,
    "hour": `hora`,
    "minute": `minuto`,
    "month": `mês`,
    "second": `segundo`,
    "selectedDateDescription": (args)=>`Data selecionada: ${args.date}`,
    "selectedRangeDescription": (args)=>`Intervalo selecionado: ${args.startDate} a ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Hora selecionada: ${args.time}`,
    "startDate": `Data de Início`,
    "timeZoneName": `fuso horário`,
    "weekday": `dia da semana`,
    "year": `ano`
};


var $14e09da03f3d1c5b$exports = {};
$14e09da03f3d1c5b$exports = {
    "calendar": `Calendar`,
    "day": `zi`,
    "dayPeriod": `a.m/p.m.`,
    "endDate": `Dată final`,
    "era": `eră`,
    "hour": `oră`,
    "minute": `minut`,
    "month": `lună`,
    "second": `secundă`,
    "selectedDateDescription": (args)=>`Dată selectată: ${args.date}`,
    "selectedRangeDescription": (args)=>`Interval selectat: de la ${args.startDate} până la ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Ora selectată: ${args.time}`,
    "startDate": `Dată început`,
    "timeZoneName": `fus orar`,
    "weekday": `ziua din săptămână`,
    "year": `an`
};


var $63247a3456bc40d1$exports = {};
$63247a3456bc40d1$exports = {
    "calendar": `Календарь`,
    "day": `день`,
    "dayPeriod": `AM/PM`,
    "endDate": `Дата окончания`,
    "era": `эра`,
    "hour": `час`,
    "minute": `минута`,
    "month": `месяц`,
    "second": `секунда`,
    "selectedDateDescription": (args)=>`Выбранная дата: ${args.date}`,
    "selectedRangeDescription": (args)=>`Выбранный диапазон: с ${args.startDate} по ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Выбранное время: ${args.time}`,
    "startDate": `Дата начала`,
    "timeZoneName": `часовой пояс`,
    "weekday": `день недели`,
    "year": `год`
};


var $22150dd20c353dd4$exports = {};
$22150dd20c353dd4$exports = {
    "calendar": `Kalendár`,
    "day": `deň`,
    "dayPeriod": `AM/PM`,
    "endDate": `Dátum ukončenia`,
    "era": `letopočet`,
    "hour": `hodina`,
    "minute": `minúta`,
    "month": `mesiac`,
    "second": `sekunda`,
    "selectedDateDescription": (args)=>`Vybratý dátum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Vybratý rozsah: od ${args.startDate} do ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Vybratý čas: ${args.time}`,
    "startDate": `Dátum začatia`,
    "timeZoneName": `časové pásmo`,
    "weekday": `deň týždňa`,
    "year": `rok`
};


var $701eb9a0385c55fd$exports = {};
$701eb9a0385c55fd$exports = {
    "calendar": `Koledar`,
    "day": `dan`,
    "dayPeriod": `dop/pop`,
    "endDate": `Datum konca`,
    "era": `doba`,
    "hour": `ura`,
    "minute": `minuta`,
    "month": `mesec`,
    "second": `sekunda`,
    "selectedDateDescription": (args)=>`Izbrani datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Izbrano območje: ${args.startDate} do ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Izbrani čas: ${args.time}`,
    "startDate": `Datum začetka`,
    "timeZoneName": `časovni pas`,
    "weekday": `dan v tednu`,
    "year": `leto`
};


var $54684a4891ca6dc5$exports = {};
$54684a4891ca6dc5$exports = {
    "calendar": `Kalendar`,
    "day": `дан`,
    "dayPeriod": `пре подне/по подне`,
    "endDate": `Datum završetka`,
    "era": `ера`,
    "hour": `сат`,
    "minute": `минут`,
    "month": `месец`,
    "second": `секунд`,
    "selectedDateDescription": (args)=>`Izabrani datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Izabrani opseg: od ${args.startDate} do ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Izabrano vreme: ${args.time}`,
    "startDate": `Datum početka`,
    "timeZoneName": `временска зона`,
    "weekday": `дан у недељи`,
    "year": `година`
};


var $545887f88a5a52db$exports = {};
$545887f88a5a52db$exports = {
    "calendar": `Kalender`,
    "day": `dag`,
    "dayPeriod": `fm/em`,
    "endDate": `Slutdatum`,
    "era": `era`,
    "hour": `timme`,
    "minute": `minut`,
    "month": `månad`,
    "second": `sekund`,
    "selectedDateDescription": (args)=>`Valt datum: ${args.date}`,
    "selectedRangeDescription": (args)=>`Valt intervall: ${args.startDate} till ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Vald tid: ${args.time}`,
    "startDate": `Startdatum`,
    "timeZoneName": `tidszon`,
    "weekday": `veckodag`,
    "year": `år`
};


var $492d49420dd96ff4$exports = {};
$492d49420dd96ff4$exports = {
    "calendar": `Takvim`,
    "day": `gün`,
    "dayPeriod": `ÖÖ/ÖS`,
    "endDate": `Bitiş Tarihi`,
    "era": `çağ`,
    "hour": `saat`,
    "minute": `dakika`,
    "month": `ay`,
    "second": `saniye`,
    "selectedDateDescription": (args)=>`Seçilen Tarih: ${args.date}`,
    "selectedRangeDescription": (args)=>`Seçilen Aralık: ${args.startDate} - ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Seçilen Zaman: ${args.time}`,
    "startDate": `Başlangıç Tarihi`,
    "timeZoneName": `saat dilimi`,
    "weekday": `haftanın günü`,
    "year": `yıl`
};


var $dc85765e85e8f267$exports = {};
$dc85765e85e8f267$exports = {
    "calendar": `Календар`,
    "day": `день`,
    "dayPeriod": `дп/пп`,
    "endDate": `Дата завершення`,
    "era": `ера`,
    "hour": `година`,
    "minute": `хвилина`,
    "month": `місяць`,
    "second": `секунда`,
    "selectedDateDescription": (args)=>`Вибрана дата: ${args.date}`,
    "selectedRangeDescription": (args)=>`Вибраний діапазон: ${args.startDate} — ${args.endDate}`,
    "selectedTimeDescription": (args)=>`Вибраний час: ${args.time}`,
    "startDate": `Дата початку`,
    "timeZoneName": `часовий пояс`,
    "weekday": `день тижня`,
    "year": `рік`
};


var $2157d63cb80c7c63$exports = {};
$2157d63cb80c7c63$exports = {
    "calendar": `日历`,
    "day": `日`,
    "dayPeriod": `上午/下午`,
    "endDate": `结束日期`,
    "era": `纪元`,
    "hour": `小时`,
    "minute": `分钟`,
    "month": `月`,
    "second": `秒`,
    "selectedDateDescription": (args)=>`选定的日期：${args.date}`,
    "selectedRangeDescription": (args)=>`选定的范围：${args.startDate} 至 ${args.endDate}`,
    "selectedTimeDescription": (args)=>`选定的时间：${args.time}`,
    "startDate": `开始日期`,
    "timeZoneName": `时区`,
    "weekday": `工作日`,
    "year": `年`
};


var $0335c3ddb5f70cbe$exports = {};
$0335c3ddb5f70cbe$exports = {
    "calendar": `日曆`,
    "day": `日`,
    "dayPeriod": `上午/下午`,
    "endDate": `結束日期`,
    "era": `纪元`,
    "hour": `小时`,
    "minute": `分钟`,
    "month": `月`,
    "second": `秒`,
    "selectedDateDescription": (args)=>`選定的日期：${args.date}`,
    "selectedRangeDescription": (args)=>`選定的範圍：${args.startDate} 至 ${args.endDate}`,
    "selectedTimeDescription": (args)=>`選定的時間：${args.time}`,
    "startDate": `開始日期`,
    "timeZoneName": `时区`,
    "weekday": `工作日`,
    "year": `年`
};


$c7d0e80b992ca68a$exports = {
    "ar-AE": $aa344be62785b256$exports,
    "bg-BG": $615986c3475e7c8c$exports,
    "cs-CZ": $6c6207692f1ab248$exports,
    "da-DK": $fb37a9d024dd70f8$exports,
    "de-DE": $d7780bd4790f7ae9$exports,
    "el-GR": $9cdf03311f06c4ac$exports,
    "en-US": $f93fc9e164ae811c$exports,
    "es-ES": $7426c3264bf5ffea$exports,
    "et-EE": $1115cc0042de790c$exports,
    "fi-FI": $4e80389dccb9283f$exports,
    "fr-FR": $78ad6f738c1f38d1$exports,
    "he-IL": $50fa4716d827cd97$exports,
    "hr-HR": $7297908fac4cf6c2$exports,
    "hu-HU": $f95c1b06e1d5ba32$exports,
    "it-IT": $437a8dc519258a01$exports,
    "ja-JP": $bd0aa2b50092a836$exports,
    "ko-KR": $bbd8176c2e044bc1$exports,
    "lt-LT": $1af703df56ff5180$exports,
    "lv-LV": $9705eb4511dea9f8$exports,
    "nb-NO": $8ef984876a7160bc$exports,
    "nl-NL": $b6e9809e1ecaa25e$exports,
    "pl-PL": $deb2fa609661fe31$exports,
    "pt-BR": $591c8c054c84fa56$exports,
    "pt-PT": $f1633bd6cbc228e8$exports,
    "ro-RO": $14e09da03f3d1c5b$exports,
    "ru-RU": $63247a3456bc40d1$exports,
    "sk-SK": $22150dd20c353dd4$exports,
    "sl-SI": $701eb9a0385c55fd$exports,
    "sr-SP": $54684a4891ca6dc5$exports,
    "sv-SE": $545887f88a5a52db$exports,
    "tr-TR": $492d49420dd96ff4$exports,
    "uk-UA": $dc85765e85e8f267$exports,
    "zh-CN": $2157d63cb80c7c63$exports,
    "zh-TW": $0335c3ddb5f70cbe$exports
};



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








function $715562ad3b4cced4$export$4a931266a3838b86(state, ref, disableArrowNavigation) {
    let { direction: direction  } = (0, $IwcIq$reactariai18n.useLocale)();
    let focusManager = (0, $IwcIq$react.useMemo)(()=>(0, $IwcIq$reactariafocus.createFocusManager)(ref), [
        ref
    ]);
    // Open the popover on alt + arrow down
    let onKeyDown = (e)=>{
        if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp") && "setOpen" in state) {
            e.preventDefault();
            e.stopPropagation();
            state.setOpen(true);
        }
        if (disableArrowNavigation) return;
        switch(e.key){
            case "ArrowLeft":
                e.preventDefault();
                e.stopPropagation();
                if (direction === "rtl") focusManager.focusNext();
                else focusManager.focusPrevious();
                break;
            case "ArrowRight":
                e.preventDefault();
                e.stopPropagation();
                if (direction === "rtl") focusManager.focusPrevious();
                else focusManager.focusNext();
                break;
        }
    };
    // Focus the first placeholder segment from the end on mouse down/touch up in the field.
    let focusLast = ()=>{
        var _window_event;
        // Try to find the segment prior to the element that was clicked on.
        let target = (_window_event = window.event) === null || _window_event === void 0 ? void 0 : _window_event.target;
        let walker = (0, $IwcIq$reactariafocus.getFocusableTreeWalker)(ref.current, {
            tabbable: true
        });
        if (target) {
            walker.currentNode = target;
            target = walker.previousNode();
        }
        // If no target found, find the last element from the end.
        if (!target) {
            let last;
            do {
                last = walker.lastChild();
                if (last) target = last;
            }while (last);
        }
        // Now go backwards until we find an element that is not a placeholder.
        while(target === null || target === void 0 ? void 0 : target.hasAttribute("data-placeholder")){
            let prev = walker.previousNode();
            if (prev && prev.hasAttribute("data-placeholder")) target = prev;
            else break;
        }
        if (target) target.focus();
    };
    let { pressProps: pressProps  } = (0, $IwcIq$reactariainteractions.usePress)({
        preventFocusOnPress: true,
        allowTextSelectionOnPress: true,
        onPressStart (e) {
            if (e.pointerType === "mouse") focusLast();
        },
        onPress (e) {
            if (e.pointerType !== "mouse") focusLast();
        }
    });
    return (0, $IwcIq$reactariautils.mergeProps)(pressProps, {
        onKeyDown: onKeyDown
    });
}





const $4acc2f407c169e55$export$653eddfc964b0f8a = new WeakMap();
const $4acc2f407c169e55$export$300019f83c56d282 = "__role_" + Date.now();
const $4acc2f407c169e55$export$7b3062cd49e80452 = "__focusManager_" + Date.now();
function $4acc2f407c169e55$export$5591b0b878c1a989(props, state, ref) {
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $IwcIq$reactarialabel.useField)({
        ...props,
        labelElementType: "span"
    });
    let { focusWithinProps: focusWithinProps  } = (0, $IwcIq$reactariainteractions.useFocusWithin)({
        ...props,
        onBlurWithin: (e)=>{
            state.confirmPlaceholder();
            if (props.onBlur) props.onBlur(e);
        },
        onFocusWithin: props.onFocus,
        onFocusWithinChange: props.onFocusChange
    });
    let stringFormatter = (0, $IwcIq$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($c7d0e80b992ca68a$exports))));
    let message = state.maxGranularity === "hour" ? "selectedTimeDescription" : "selectedDateDescription";
    let field = state.maxGranularity === "hour" ? "time" : "date";
    let description = state.value ? stringFormatter.format(message, {
        [field]: state.formatValue({
            month: "long"
        })
    }) : "";
    let descProps = (0, $IwcIq$reactariautils.useDescription)(description);
    // If within a date picker or date range picker, the date field will have role="presentation" and an aria-describedby
    // will be passed in that references the value (e.g. entire range). Otherwise, add the field's value description.
    let describedBy = props[$4acc2f407c169e55$export$300019f83c56d282] === "presentation" ? fieldProps["aria-describedby"] : [
        descProps["aria-describedby"],
        fieldProps["aria-describedby"]
    ].filter(Boolean).join(" ") || undefined;
    let propsFocusManager = props[$4acc2f407c169e55$export$7b3062cd49e80452];
    let focusManager = (0, $IwcIq$react.useMemo)(()=>propsFocusManager || (0, $IwcIq$reactariafocus.createFocusManager)(ref), [
        propsFocusManager,
        ref
    ]);
    let groupProps = (0, $715562ad3b4cced4$export$4a931266a3838b86)(state, ref, props[$4acc2f407c169e55$export$300019f83c56d282] === "presentation");
    // Pass labels and other information to segments.
    $4acc2f407c169e55$export$653eddfc964b0f8a.set(state, {
        ariaLabel: props["aria-label"],
        ariaLabelledBy: [
            props["aria-labelledby"],
            labelProps.id
        ].filter(Boolean).join(" ") || undefined,
        ariaDescribedBy: describedBy,
        focusManager: focusManager
    });
    let autoFocusRef = (0, $IwcIq$react.useRef)(props.autoFocus);
    // When used within a date picker or date range picker, the field gets role="presentation"
    // rather than role="group". Since the date picker/date range picker already has a role="group"
    // with a label and description, and the segments are already labeled by this as well, this
    // avoids very verbose duplicate announcements.
    let fieldDOMProps;
    if (props[$4acc2f407c169e55$export$300019f83c56d282] === "presentation") fieldDOMProps = {
        role: "presentation"
    };
    else fieldDOMProps = (0, $IwcIq$reactariautils.mergeProps)(fieldProps, {
        role: "group",
        "aria-disabled": props.isDisabled || undefined,
        "aria-describedby": describedBy
    });
    (0, $IwcIq$react.useEffect)(()=>{
        if (autoFocusRef.current) focusManager.focusFirst();
        autoFocusRef.current = false;
    }, [
        focusManager
    ]);
    let domProps = (0, $IwcIq$reactariautils.filterDOMProps)(props);
    return {
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                focusManager.focusFirst();
            }
        },
        fieldProps: (0, $IwcIq$reactariautils.mergeProps)(domProps, fieldDOMProps, groupProps, focusWithinProps, {
            onKeyDown (e) {
                if (props.onKeyDown) props.onKeyDown(e);
            },
            onKeyUp (e) {
                if (props.onKeyUp) props.onKeyUp(e);
            }
        }),
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
    };
}
function $4acc2f407c169e55$export$4c842f6a241dc825(props, state, ref) {
    return $4acc2f407c169e55$export$5591b0b878c1a989(props, state, ref);
}






function $e90ae7c26a69c6b1$export$42df105a73306d51(props, state, ref) {
    let buttonId = (0, $IwcIq$reactariautils.useId)();
    let dialogId = (0, $IwcIq$reactariautils.useId)();
    let fieldId = (0, $IwcIq$reactariautils.useId)();
    let stringFormatter = (0, $IwcIq$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($c7d0e80b992ca68a$exports))));
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $IwcIq$reactarialabel.useField)({
        ...props,
        labelElementType: "span"
    });
    let groupProps = (0, $715562ad3b4cced4$export$4a931266a3838b86)(state, ref);
    let labelledBy = fieldProps["aria-labelledby"] || fieldProps.id;
    let { locale: locale  } = (0, $IwcIq$reactariai18n.useLocale)();
    let date = state.formatValue(locale, {
        month: "long"
    });
    let description = date ? stringFormatter.format("selectedDateDescription", {
        date: date
    }) : "";
    let descProps = (0, $IwcIq$reactariautils.useDescription)(description);
    let ariaDescribedBy = [
        descProps["aria-describedby"],
        fieldProps["aria-describedby"]
    ].filter(Boolean).join(" ") || undefined;
    let domProps = (0, $IwcIq$reactariautils.filterDOMProps)(props);
    let focusManager = (0, $IwcIq$react.useMemo)(()=>(0, $IwcIq$reactariafocus.createFocusManager)(ref), [
        ref
    ]);
    let { focusWithinProps: focusWithinProps  } = (0, $IwcIq$reactariainteractions.useFocusWithin)({
        ...props,
        isDisabled: state.isOpen,
        onBlurWithin: props.onBlur,
        onFocusWithin: props.onFocus,
        onFocusWithinChange: props.onFocusChange
    });
    return {
        groupProps: (0, $IwcIq$reactariautils.mergeProps)(domProps, groupProps, fieldProps, descProps, focusWithinProps, {
            role: "group",
            "aria-disabled": props.isDisabled || null,
            "aria-labelledby": labelledBy,
            "aria-describedby": ariaDescribedBy,
            onKeyDown (e) {
                if (state.isOpen) return;
                if (props.onKeyDown) props.onKeyDown(e);
            },
            onKeyUp (e) {
                if (state.isOpen) return;
                if (props.onKeyUp) props.onKeyUp(e);
            }
        }),
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                focusManager.focusFirst();
            }
        },
        fieldProps: {
            ...fieldProps,
            id: fieldId,
            [(0, $4acc2f407c169e55$export$300019f83c56d282)]: "presentation",
            "aria-describedby": ariaDescribedBy,
            value: state.value,
            onChange: state.setValue,
            minValue: props.minValue,
            maxValue: props.maxValue,
            placeholderValue: props.placeholderValue,
            hideTimeZone: props.hideTimeZone,
            hourCycle: props.hourCycle,
            granularity: props.granularity,
            isDisabled: props.isDisabled,
            isReadOnly: props.isReadOnly,
            isRequired: props.isRequired,
            validationState: state.validationState,
            autoFocus: props.autoFocus
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        buttonProps: {
            ...descProps,
            id: buttonId,
            "aria-haspopup": "dialog",
            "aria-label": stringFormatter.format("calendar"),
            "aria-labelledby": `${labelledBy} ${buttonId}`,
            "aria-describedby": ariaDescribedBy,
            "aria-expanded": state.isOpen || undefined,
            onPress: ()=>state.setOpen(true)
        },
        dialogProps: {
            id: dialogId,
            "aria-labelledby": `${labelledBy} ${buttonId}`
        },
        calendarProps: {
            autoFocus: true,
            value: state.dateValue,
            onChange: state.setDateValue,
            minValue: props.minValue,
            maxValue: props.maxValue,
            isDisabled: props.isDisabled,
            isReadOnly: props.isReadOnly,
            isDateUnavailable: props.isDateUnavailable,
            defaultFocusedValue: state.dateValue ? undefined : props.placeholderValue,
            validationState: state.validationState,
            errorMessage: props.errorMessage
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
 */ // @ts-ignore




function $934ac650a0aceb4b$export$d42c60378c8168f8() {
    let { locale: locale  } = (0, $IwcIq$reactariai18n.useLocale)();
    return (0, $IwcIq$react.useMemo)(()=>{
        // Try to use Intl.DisplayNames if possible. It may be supported in browsers, but not support the dateTimeField
        // type as that was only added in v2. https://github.com/tc39/intl-displaynames-v2
        try {
            // @ts-ignore
            return new Intl.DisplayNames(locale, {
                type: "dateTimeField"
            });
        } catch (err) {
            return new $934ac650a0aceb4b$var$DisplayNamesPolyfill(locale);
        }
    }, [
        locale
    ]);
}
class $934ac650a0aceb4b$var$DisplayNamesPolyfill {
    of(field) {
        return this.dictionary.getStringForLocale(field, this.locale);
    }
    constructor(locale){
        this.locale = locale;
        this.dictionary = new (0, $IwcIq$internationalizedstring.LocalizedStringDictionary)((0, (/*@__PURE__*/$parcel$interopDefault($c7d0e80b992ca68a$exports))));
    }
}



function $5c015c6316d1904d$export$1315d136e6f7581(segment, state, ref) {
    let enteredKeys = (0, $IwcIq$react.useRef)("");
    let { locale: locale  } = (0, $IwcIq$reactariai18n.useLocale)();
    let displayNames = (0, $934ac650a0aceb4b$export$d42c60378c8168f8)();
    let { ariaLabel: ariaLabel , ariaLabelledBy: ariaLabelledBy , ariaDescribedBy: ariaDescribedBy , focusManager: focusManager  } = (0, $4acc2f407c169e55$export$653eddfc964b0f8a).get(state);
    let textValue = segment.isPlaceholder ? "" : segment.text;
    let options = (0, $IwcIq$react.useMemo)(()=>state.dateFormatter.resolvedOptions(), [
        state.dateFormatter
    ]);
    let monthDateFormatter = (0, $IwcIq$reactariai18n.useDateFormatter)({
        month: "long",
        timeZone: options.timeZone
    });
    let hourDateFormatter = (0, $IwcIq$reactariai18n.useDateFormatter)({
        hour: "numeric",
        hour12: options.hour12,
        timeZone: options.timeZone
    });
    if (segment.type === "month" && !segment.isPlaceholder) {
        let monthTextValue = monthDateFormatter.format(state.dateValue);
        textValue = monthTextValue !== textValue ? `${textValue} – ${monthTextValue}` : monthTextValue;
    } else if (segment.type === "hour" && !segment.isPlaceholder) textValue = hourDateFormatter.format(state.dateValue);
    let { spinButtonProps: spinButtonProps  } = (0, $IwcIq$reactariaspinbutton.useSpinButton)({
        // The ARIA spec says aria-valuenow is optional if there's no value, but aXe seems to require it.
        // This doesn't seem to have any negative effects with real AT since we also use aria-valuetext.
        // https://github.com/dequelabs/axe-core/issues/3505
        value: segment.value,
        textValue: textValue,
        minValue: segment.minValue,
        maxValue: segment.maxValue,
        isDisabled: state.isDisabled,
        isReadOnly: state.isReadOnly || !segment.isEditable,
        isRequired: state.isRequired,
        onIncrement: ()=>{
            enteredKeys.current = "";
            state.increment(segment.type);
        },
        onDecrement: ()=>{
            enteredKeys.current = "";
            state.decrement(segment.type);
        },
        onIncrementPage: ()=>{
            enteredKeys.current = "";
            state.incrementPage(segment.type);
        },
        onDecrementPage: ()=>{
            enteredKeys.current = "";
            state.decrementPage(segment.type);
        },
        onIncrementToMax: ()=>{
            enteredKeys.current = "";
            state.setSegment(segment.type, segment.maxValue);
        },
        onDecrementToMin: ()=>{
            enteredKeys.current = "";
            state.setSegment(segment.type, segment.minValue);
        }
    });
    let parser = (0, $IwcIq$react.useMemo)(()=>new (0, $IwcIq$internationalizednumber.NumberParser)(locale, {
            maximumFractionDigits: 0
        }), [
        locale
    ]);
    let backspace = ()=>{
        if (parser.isValidPartialNumber(segment.text) && !state.isReadOnly && !segment.isPlaceholder) {
            let newValue = segment.text.slice(0, -1);
            let parsed = parser.parse(newValue);
            if (newValue.length === 0 || parsed === 0) state.clearSegment(segment.type);
            else state.setSegment(segment.type, parsed);
            enteredKeys.current = newValue;
        } else if (segment.type === "dayPeriod") state.clearSegment(segment.type);
    };
    let onKeyDown = (e)=>{
        // Firefox does not fire selectstart for Ctrl/Cmd + A
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1742153
        if (e.key === "a" && ((0, $IwcIq$reactariautils.isMac)() ? e.metaKey : e.ctrlKey)) e.preventDefault();
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        switch(e.key){
            case "Backspace":
            case "Delete":
                // Safari on iOS does not fire beforeinput for the backspace key because the cursor is at the start.
                e.preventDefault();
                e.stopPropagation();
                backspace();
                break;
        }
    };
    // Safari dayPeriod option doesn't work...
    let { startsWith: startsWith  } = (0, $IwcIq$reactariai18n.useFilter)({
        sensitivity: "base"
    });
    let amPmFormatter = (0, $IwcIq$reactariai18n.useDateFormatter)({
        hour: "numeric",
        hour12: true
    });
    let am = (0, $IwcIq$react.useMemo)(()=>{
        let date = new Date();
        date.setHours(0);
        return amPmFormatter.formatToParts(date).find((part)=>part.type === "dayPeriod").value;
    }, [
        amPmFormatter
    ]);
    let pm = (0, $IwcIq$react.useMemo)(()=>{
        let date = new Date();
        date.setHours(12);
        return amPmFormatter.formatToParts(date).find((part)=>part.type === "dayPeriod").value;
    }, [
        amPmFormatter
    ]);
    // Get a list of formatted era names so users can type the first character to choose one.
    let eraFormatter = (0, $IwcIq$reactariai18n.useDateFormatter)({
        year: "numeric",
        era: "narrow",
        timeZone: "UTC"
    });
    let eras = (0, $IwcIq$react.useMemo)(()=>{
        if (segment.type !== "era") return [];
        let date = (0, $IwcIq$internationalizeddate.toCalendar)(new (0, $IwcIq$internationalizeddate.CalendarDate)(1, 1, 1), state.calendar);
        let eras = state.calendar.getEras().map((era)=>{
            let eraDate = date.set({
                year: 1,
                month: 1,
                day: 1,
                era: era
            }).toDate("UTC");
            let parts = eraFormatter.formatToParts(eraDate);
            let formatted = parts.find((p)=>p.type === "era").value;
            return {
                era: era,
                formatted: formatted
            };
        });
        // Remove the common prefix from formatted values. This is so that in calendars with eras like
        // ERA0 and ERA1 (e.g. Ethiopic), users can press "0" and "1" to select an era. In other cases,
        // the first letter is used.
        let prefixLength = $5c015c6316d1904d$var$commonPrefixLength(eras.map((era)=>era.formatted));
        if (prefixLength) for (let era of eras)era.formatted = era.formatted.slice(prefixLength);
        return eras;
    }, [
        eraFormatter,
        state.calendar,
        segment.type
    ]);
    let onInput = (key)=>{
        if (state.isDisabled || state.isReadOnly) return;
        let newValue = enteredKeys.current + key;
        switch(segment.type){
            case "dayPeriod":
                if (startsWith(am, key)) state.setSegment("dayPeriod", 0);
                else if (startsWith(pm, key)) state.setSegment("dayPeriod", 12);
                else break;
                focusManager.focusNext();
                break;
            case "era":
                {
                    let matched = eras.find((e)=>startsWith(e.formatted, key));
                    if (matched) {
                        state.setSegment("era", matched.era);
                        focusManager.focusNext();
                    }
                    break;
                }
            case "day":
            case "hour":
            case "minute":
            case "second":
            case "month":
            case "year":
                {
                    if (!parser.isValidPartialNumber(newValue)) return;
                    let numberValue = parser.parse(newValue);
                    let segmentValue = numberValue;
                    let allowsZero = segment.minValue === 0;
                    if (segment.type === "hour" && state.dateFormatter.resolvedOptions().hour12) {
                        switch(state.dateFormatter.resolvedOptions().hourCycle){
                            case "h11":
                                if (numberValue > 11) segmentValue = parser.parse(key);
                                break;
                            case "h12":
                                allowsZero = false;
                                if (numberValue > 12) segmentValue = parser.parse(key);
                                break;
                        }
                        if (segment.value >= 12 && numberValue > 1) numberValue += 12;
                    } else if (numberValue > segment.maxValue) segmentValue = parser.parse(key);
                    if (isNaN(numberValue)) return;
                    let shouldSetValue = segmentValue !== 0 || allowsZero;
                    if (shouldSetValue) state.setSegment(segment.type, segmentValue);
                    if (Number(numberValue + "0") > segment.maxValue || newValue.length >= String(segment.maxValue).length) {
                        enteredKeys.current = "";
                        if (shouldSetValue) focusManager.focusNext();
                    } else enteredKeys.current = newValue;
                    break;
                }
        }
    };
    let onFocus = ()=>{
        enteredKeys.current = "";
        (0, $IwcIq$reactariautils.scrollIntoViewport)(ref.current, {
            containingElement: (0, $IwcIq$reactariautils.getScrollParent)(ref.current)
        });
        // Collapse selection to start or Chrome won't fire input events.
        let selection = window.getSelection();
        selection.collapse(ref.current);
    };
    let compositionRef = (0, $IwcIq$react.useRef)("");
    // @ts-ignore - TODO: possibly old TS version? doesn't fail in my editor...
    (0, $IwcIq$reactariautils.useEvent)(ref, "beforeinput", (e)=>{
        e.preventDefault();
        switch(e.inputType){
            case "deleteContentBackward":
            case "deleteContentForward":
                if (parser.isValidPartialNumber(segment.text) && !state.isReadOnly) backspace();
                break;
            case "insertCompositionText":
                // insertCompositionText cannot be canceled.
                // Record the current state of the element so we can restore it in the `input` event below.
                compositionRef.current = ref.current.textContent;
                // Safari gets stuck in a composition state unless we also assign to the value here.
                // eslint-disable-next-line no-self-assign
                ref.current.textContent = ref.current.textContent;
                break;
            default:
                if (e.data != null) onInput(e.data);
                break;
        }
    });
    (0, $IwcIq$reactariautils.useEvent)(ref, "input", (e)=>{
        let { inputType: inputType , data: data  } = e;
        switch(inputType){
            case "insertCompositionText":
                // Reset the DOM to how it was in the beforeinput event.
                ref.current.textContent = compositionRef.current;
                // Android sometimes fires key presses of letters as composition events. Need to handle am/pm keys here too.
                // Can also happen e.g. with Pinyin keyboard on iOS.
                if (startsWith(am, data) || startsWith(pm, data)) onInput(data);
                break;
        }
    });
    (0, $IwcIq$reactariautils.useLayoutEffect)(()=>{
        let element = ref.current;
        return ()=>{
            // If the focused segment is removed, focus the previous one, or the next one if there was no previous one.
            if (document.activeElement === element) {
                let prev = focusManager.focusPrevious();
                if (!prev) focusManager.focusNext();
            }
        };
    }, [
        ref,
        focusManager
    ]);
    // spinbuttons cannot be focused with VoiceOver on iOS.
    let touchPropOverrides = (0, $IwcIq$reactariautils.isIOS)() || segment.type === "timeZoneName" ? {
        role: "textbox",
        "aria-valuemax": null,
        "aria-valuemin": null,
        "aria-valuetext": null,
        "aria-valuenow": null
    } : {};
    // Only apply aria-describedby to the first segment, unless the field is invalid. This avoids it being
    // read every time the user navigates to a new segment.
    let firstSegment = (0, $IwcIq$react.useMemo)(()=>state.segments.find((s)=>s.isEditable), [
        state.segments
    ]);
    if (segment !== firstSegment && state.validationState !== "invalid") ariaDescribedBy = undefined;
    let id = (0, $IwcIq$reactariautils.useId)();
    let isEditable = !state.isDisabled && !state.isReadOnly && segment.isEditable;
    // Prepend the label passed from the field to each segment name.
    // This is needed because VoiceOver on iOS does not announce groups.
    let name = segment.type === "literal" ? "" : displayNames.of(segment.type);
    let labelProps = (0, $IwcIq$reactariautils.useLabels)({
        "aria-label": (ariaLabel ? ariaLabel + " " : "") + name,
        "aria-labelledby": ariaLabelledBy
    });
    // Literal segments should not be visible to screen readers. We don't really need any of the above,
    // but the rules of hooks mean hooks cannot be conditional so we have to put this condition here.
    if (segment.type === "literal") return {
        segmentProps: {
            "aria-hidden": true
        }
    };
    return {
        segmentProps: (0, $IwcIq$reactariautils.mergeProps)(spinButtonProps, labelProps, {
            id: id,
            ...touchPropOverrides,
            "aria-invalid": state.validationState === "invalid" ? "true" : undefined,
            "aria-describedby": ariaDescribedBy,
            "aria-readonly": state.isReadOnly || !segment.isEditable ? "true" : undefined,
            "data-placeholder": segment.isPlaceholder || undefined,
            contentEditable: isEditable,
            suppressContentEditableWarning: isEditable,
            spellCheck: isEditable ? "false" : undefined,
            autoCapitalize: isEditable ? "off" : undefined,
            autoCorrect: isEditable ? "off" : undefined,
            // Capitalization was changed in React 17...
            [parseInt((0, ($parcel$interopDefault($IwcIq$react))).version, 10) >= 17 ? "enterKeyHint" : "enterkeyhint"]: isEditable ? "next" : undefined,
            inputMode: state.isDisabled || segment.type === "dayPeriod" || segment.type === "era" || !isEditable ? undefined : "numeric",
            tabIndex: state.isDisabled ? undefined : 0,
            onKeyDown: onKeyDown,
            onFocus: onFocus,
            style: {
                caretColor: "transparent"
            },
            // Prevent pointer events from reaching useDatePickerGroup, and allow native browser behavior to focus the segment.
            onPointerDown (e) {
                e.stopPropagation();
            },
            onMouseDown (e) {
                e.stopPropagation();
            }
        })
    };
}
function $5c015c6316d1904d$var$commonPrefixLength(strings) {
    // Sort the strings, and compare the characters in the first and last to find the common prefix.
    strings.sort();
    let first = strings[0];
    let last = strings[strings.length - 1];
    for(let i = 0; i < first.length; i++){
        if (first[i] !== last[i]) return i;
    }
    return 0;
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








function $20f695b1b69e6b9e$export$12fd5f0e9f4bb192(props, state, ref) {
    var _state_value, _state_value1;
    let stringFormatter = (0, $IwcIq$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($c7d0e80b992ca68a$exports))));
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $IwcIq$reactarialabel.useField)({
        ...props,
        labelElementType: "span"
    });
    let labelledBy = fieldProps["aria-labelledby"] || fieldProps.id;
    let { locale: locale  } = (0, $IwcIq$reactariai18n.useLocale)();
    let range = state.formatValue(locale, {
        month: "long"
    });
    let description = range ? stringFormatter.format("selectedRangeDescription", {
        startDate: range.start,
        endDate: range.end
    }) : "";
    let descProps = (0, $IwcIq$reactariautils.useDescription)(description);
    let startFieldProps = {
        "aria-label": stringFormatter.format("startDate"),
        "aria-labelledby": labelledBy
    };
    let endFieldProps = {
        "aria-label": stringFormatter.format("endDate"),
        "aria-labelledby": labelledBy
    };
    let buttonId = (0, $IwcIq$reactariautils.useId)();
    let dialogId = (0, $IwcIq$reactariautils.useId)();
    let groupProps = (0, $715562ad3b4cced4$export$4a931266a3838b86)(state, ref);
    let ariaDescribedBy = [
        descProps["aria-describedby"],
        fieldProps["aria-describedby"]
    ].filter(Boolean).join(" ") || undefined;
    let focusManager = (0, $IwcIq$react.useMemo)(()=>(0, $IwcIq$reactariafocus.createFocusManager)(ref, {
            // Exclude the button from the focus manager.
            accept: (element)=>element.id !== buttonId
        }), [
        ref,
        buttonId
    ]);
    let commonFieldProps = {
        [(0, $4acc2f407c169e55$export$7b3062cd49e80452)]: focusManager,
        [(0, $4acc2f407c169e55$export$300019f83c56d282)]: "presentation",
        "aria-describedby": ariaDescribedBy,
        minValue: props.minValue,
        maxValue: props.maxValue,
        placeholderValue: props.placeholderValue,
        hideTimeZone: props.hideTimeZone,
        hourCycle: props.hourCycle,
        granularity: props.granularity,
        isDisabled: props.isDisabled,
        isReadOnly: props.isReadOnly,
        isRequired: props.isRequired,
        validationState: state.validationState
    };
    let domProps = (0, $IwcIq$reactariautils.filterDOMProps)(props);
    let { focusWithinProps: focusWithinProps  } = (0, $IwcIq$reactariainteractions.useFocusWithin)({
        ...props,
        isDisabled: state.isOpen,
        onBlurWithin: props.onBlur,
        onFocusWithin: props.onFocus,
        onFocusWithinChange: props.onFocusChange
    });
    return {
        groupProps: (0, $IwcIq$reactariautils.mergeProps)(domProps, groupProps, fieldProps, descProps, focusWithinProps, {
            role: "group",
            "aria-disabled": props.isDisabled || null,
            "aria-describedby": ariaDescribedBy,
            onKeyDown (e) {
                if (state.isOpen) return;
                if (props.onKeyDown) props.onKeyDown(e);
            },
            onKeyUp (e) {
                if (state.isOpen) return;
                if (props.onKeyUp) props.onKeyUp(e);
            }
        }),
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                focusManager.focusFirst();
            }
        },
        buttonProps: {
            ...descProps,
            id: buttonId,
            "aria-haspopup": "dialog",
            "aria-label": stringFormatter.format("calendar"),
            "aria-labelledby": `${labelledBy} ${buttonId}`,
            "aria-describedby": ariaDescribedBy,
            "aria-expanded": state.isOpen || undefined,
            onPress: ()=>state.setOpen(true)
        },
        dialogProps: {
            id: dialogId,
            "aria-labelledby": `${labelledBy} ${buttonId}`
        },
        startFieldProps: {
            ...startFieldProps,
            ...commonFieldProps,
            value: (_state_value = state.value) === null || _state_value === void 0 ? void 0 : _state_value.start,
            onChange: (start)=>state.setDateTime("start", start),
            autoFocus: props.autoFocus
        },
        endFieldProps: {
            ...endFieldProps,
            ...commonFieldProps,
            value: (_state_value1 = state.value) === null || _state_value1 === void 0 ? void 0 : _state_value1.end,
            onChange: (end)=>state.setDateTime("end", end)
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        calendarProps: {
            autoFocus: true,
            value: state.dateRange,
            onChange: state.setDateRange,
            minValue: props.minValue,
            maxValue: props.maxValue,
            isDisabled: props.isDisabled,
            isReadOnly: props.isReadOnly,
            isDateUnavailable: props.isDateUnavailable,
            allowsNonContiguousRanges: props.allowsNonContiguousRanges,
            defaultFocusedValue: state.dateRange ? undefined : props.placeholderValue,
            validationState: state.validationState,
            errorMessage: props.errorMessage
        }
    };
}





//# sourceMappingURL=main.js.map
