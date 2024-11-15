var $8Zqhq$reactarialiveannouncer = require("@react-aria/live-announcer");
var $8Zqhq$reactariaoverlays = require("@react-aria/overlays");
var $8Zqhq$reactarialistbox = require("@react-aria/listbox");
var $8Zqhq$reactariautils = require("@react-aria/utils");
var $8Zqhq$react = require("react");
var $8Zqhq$reactstatelycollections = require("@react-stately/collections");
var $8Zqhq$reactariaselection = require("@react-aria/selection");
var $8Zqhq$reactariai18n = require("@react-aria/i18n");
var $8Zqhq$reactariamenu = require("@react-aria/menu");
var $8Zqhq$reactariatextfield = require("@react-aria/textfield");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useComboBox", () => $242452271d1e4c0e$export$8c18d1b4f7232bbf);
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





var $2da059a9a42f95bf$exports = {};
var $a756282ae45b5180$exports = {};
$a756282ae45b5180$exports = {
    "buttonLabel": `عرض المقترحات`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} خيار`,
            other: ()=>`${formatter.number(args.optionCount)} خيارات`
        })} متاحة.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`المجموعة المدخلة ${args.groupTitle}, مع ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} خيار`,
                    other: ()=>`${formatter.number(args.groupCount)} خيارات`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, محدد`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `مقترحات`,
    "selectedAnnouncement": (args)=>`${args.optionText}، محدد`
};


var $50569559b1387c57$exports = {};
$50569559b1387c57$exports = {
    "buttonLabel": `Покажи предложения`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} опция`,
            other: ()=>`${formatter.number(args.optionCount)} опции`
        })} на разположение.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Въведена група ${args.groupTitle}, с ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} опция`,
                    other: ()=>`${formatter.number(args.groupCount)} опции`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, избрани`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Предложения`,
    "selectedAnnouncement": (args)=>`${args.optionText}, избрани`
};


var $bff243ee21f5616f$exports = {};
$bff243ee21f5616f$exports = {
    "buttonLabel": `Zobrazit doporučení`,
    "countAnnouncement": (args, formatter)=>`K dispozici ${formatter.plural(args.optionCount, {
            one: ()=>`je ${formatter.number(args.optionCount)} možnost`,
            other: ()=>`jsou/je ${formatter.number(args.optionCount)} možnosti/-í`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Zadaná skupina „${args.groupTitle}“ ${formatter.plural(args.groupCount, {
                    one: ()=>`s ${formatter.number(args.groupCount)} možností`,
                    other: ()=>`se ${formatter.number(args.groupCount)} možnostmi`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: ` (vybráno)`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Návrhy`,
    "selectedAnnouncement": (args)=>`${args.optionText}, vybráno`
};


var $1508d10b8eb2180a$exports = {};
$1508d10b8eb2180a$exports = {
    "buttonLabel": `Vis forslag`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} mulighed tilgængelig`,
            other: ()=>`${formatter.number(args.optionCount)} muligheder tilgængelige`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Angivet gruppe ${args.groupTitle}, med ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} mulighed`,
                    other: ()=>`${formatter.number(args.groupCount)} muligheder`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valgt`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Forslag`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valgt`
};


var $aa4e6d422b8a72e9$exports = {};
$aa4e6d422b8a72e9$exports = {
    "buttonLabel": `Empfehlungen anzeigen`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} Option`,
            other: ()=>`${formatter.number(args.optionCount)} Optionen`
        })} verfügbar.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Eingetretene Gruppe ${args.groupTitle}, mit ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} Option`,
                    other: ()=>`${formatter.number(args.groupCount)} Optionen`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, ausgewählt`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Empfehlungen`,
    "selectedAnnouncement": (args)=>`${args.optionText}, ausgewählt`
};


var $b88e038b0dd4dc0a$exports = {};
$b88e038b0dd4dc0a$exports = {
    "buttonLabel": `Προβολή προτάσεων`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} επιλογή`,
            other: ()=>`${formatter.number(args.optionCount)} επιλογές `
        })} διαθέσιμες.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Εισαγμένη ομάδα ${args.groupTitle}, με ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} επιλογή`,
                    other: ()=>`${formatter.number(args.groupCount)} επιλογές`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, επιλεγμένο`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Προτάσεις`,
    "selectedAnnouncement": (args)=>`${args.optionText}, επιλέχθηκε`
};


var $dbcec05b5ddcd323$exports = {};
$dbcec05b5ddcd323$exports = {
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Entered group ${args.groupTitle}, with ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} option`,
                    other: ()=>`${formatter.number(args.groupCount)} options`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, selected`,
            other: ``
        }, args.isSelected)}`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} option`,
            other: ()=>`${formatter.number(args.optionCount)} options`
        })} available.`,
    "selectedAnnouncement": (args)=>`${args.optionText}, selected`,
    "buttonLabel": `Show suggestions`,
    "listboxLabel": `Suggestions`
};


var $3a762c75d410ecfe$exports = {};
$3a762c75d410ecfe$exports = {
    "buttonLabel": `Mostrar sugerencias`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opción`,
            other: ()=>`${formatter.number(args.optionCount)} opciones`
        })} disponible(s).`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Se ha unido al grupo ${args.groupTitle}, con ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opción`,
                    other: ()=>`${formatter.number(args.groupCount)} opciones`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, seleccionado`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugerencias`,
    "selectedAnnouncement": (args)=>`${args.optionText}, seleccionado`
};


var $345540ad7e1ca6bf$exports = {};
$345540ad7e1ca6bf$exports = {
    "buttonLabel": `Kuva soovitused`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} valik`,
            other: ()=>`${formatter.number(args.optionCount)} valikud`
        })} saadaval.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Sisestatud rühm ${args.groupTitle}, valikuga ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} valik`,
                    other: ()=>`${formatter.number(args.groupCount)} valikud`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valitud`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Soovitused`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valitud`
};


var $f314257d456879ad$exports = {};
$f314257d456879ad$exports = {
    "buttonLabel": `Näytä ehdotukset`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} vaihtoehto`,
            other: ()=>`${formatter.number(args.optionCount)} vaihtoehdot`
        })} saatavilla.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Mentiin ryhmään ${args.groupTitle}, ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} vaihtoehdon`,
                    other: ()=>`${formatter.number(args.groupCount)} vaihtoehdon`
                })} kanssa.`,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valittu`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Ehdotukset`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valittu`
};


var $ebebc2f5e8da1157$exports = {};
$ebebc2f5e8da1157$exports = {
    "buttonLabel": `Afficher les suggestions`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} option`,
            other: ()=>`${formatter.number(args.optionCount)} options`
        })} disponible(s).`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Groupe ${args.groupTitle} saisi, avec ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} option`,
                    other: ()=>`${formatter.number(args.groupCount)} options`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, sélectionné(s)`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Suggestions`,
    "selectedAnnouncement": (args)=>`${args.optionText}, sélectionné`
};


var $3dda6220a904406b$exports = {};
$3dda6220a904406b$exports = {
    "buttonLabel": `הצג הצעות`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`אפשרות ${formatter.number(args.optionCount)}`,
            other: ()=>`${formatter.number(args.optionCount)} אפשרויות`
        })} במצב זמין.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`נכנס לקבוצה ${args.groupTitle}, עם ${formatter.plural(args.groupCount, {
                    one: ()=>`אפשרות ${formatter.number(args.groupCount)}`,
                    other: ()=>`${formatter.number(args.groupCount)} אפשרויות`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, נבחר`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `הצעות`,
    "selectedAnnouncement": (args)=>`${args.optionText}, נבחר`
};


var $21178dd033a9f6f2$exports = {};
$21178dd033a9f6f2$exports = {
    "buttonLabel": `Prikaži prijedloge`,
    "countAnnouncement": (args, formatter)=>`Dostupno još: ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcija`,
            other: ()=>`${formatter.number(args.optionCount)} opcije/a`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Unesena skupina ${args.groupTitle}, s ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opcijom`,
                    other: ()=>`${formatter.number(args.groupCount)} opcije/a`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, odabranih`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Prijedlozi`,
    "selectedAnnouncement": (args)=>`${args.optionText}, odabrano`
};


var $f12e9cac54fcde83$exports = {};
$f12e9cac54fcde83$exports = {
    "buttonLabel": `Javaslatok megjelenítése`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} lehetőség`,
            other: ()=>`${formatter.number(args.optionCount)} lehetőség`
        })} áll rendelkezésre.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Belépett a(z) ${args.groupTitle} csoportba, amely ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} lehetőséget`,
                    other: ()=>`${formatter.number(args.groupCount)} lehetőséget`
                })} tartalmaz. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, kijelölve`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Javaslatok`,
    "selectedAnnouncement": (args)=>`${args.optionText}, kijelölve`
};


var $c7ad5d19d847ae9c$exports = {};
$c7ad5d19d847ae9c$exports = {
    "buttonLabel": `Mostra suggerimenti`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opzione disponibile`,
            other: ()=>`${formatter.number(args.optionCount)} opzioni disponibili`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Ingresso nel gruppo ${args.groupTitle}, con ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opzione`,
                    other: ()=>`${formatter.number(args.groupCount)} opzioni`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, selezionato`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Suggerimenti`,
    "selectedAnnouncement": (args)=>`${args.optionText}, selezionato`
};


var $2cd660cb05523578$exports = {};
$2cd660cb05523578$exports = {
    "buttonLabel": `候補を表示`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} 個のオプション`,
            other: ()=>`${formatter.number(args.optionCount)} 個のオプション`
        })}を利用できます。`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`入力されたグループ ${args.groupTitle}、${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} 個のオプション`,
                    other: ()=>`${formatter.number(args.groupCount)} 個のオプション`
                })}を含む。`,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `、選択済み`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `候補`,
    "selectedAnnouncement": (args)=>`${args.optionText}、選択済み`
};


var $854156a4c27f569c$exports = {};
$854156a4c27f569c$exports = {
    "buttonLabel": `제안 사항 표시`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)}개 옵션`,
            other: ()=>`${formatter.number(args.optionCount)}개 옵션`
        })}을 사용할 수 있습니다.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`입력한 그룹 ${args.groupTitle}, ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)}개 옵션`,
                    other: ()=>`${formatter.number(args.groupCount)}개 옵션`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, 선택됨`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `제안`,
    "selectedAnnouncement": (args)=>`${args.optionText}, 선택됨`
};


var $dabe6c727809b774$exports = {};
$dabe6c727809b774$exports = {
    "buttonLabel": `Rodyti pasiūlymus`,
    "countAnnouncement": (args, formatter)=>`Yra ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} parinktis`,
            other: ()=>`${formatter.number(args.optionCount)} parinktys (-ių)`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Įvesta grupė ${args.groupTitle}, su ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} parinktimi`,
                    other: ()=>`${formatter.number(args.groupCount)} parinktimis (-ių)`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, pasirinkta`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Pasiūlymai`,
    "selectedAnnouncement": (args)=>`${args.optionText}, pasirinkta`
};


var $7810eacb77cdba0d$exports = {};
$7810eacb77cdba0d$exports = {
    "buttonLabel": `Rādīt ieteikumus`,
    "countAnnouncement": (args, formatter)=>`Pieejamo opciju skaits: ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcija`,
            other: ()=>`${formatter.number(args.optionCount)} opcijas`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Ievadīta grupa ${args.groupTitle}, ar ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opciju`,
                    other: ()=>`${formatter.number(args.groupCount)} opcijām`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, atlasīta`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Ieteikumi`,
    "selectedAnnouncement": (args)=>`${args.optionText}, atlasīta`
};


var $5e329fda39bb6d70$exports = {};
$5e329fda39bb6d70$exports = {
    "buttonLabel": `Vis forslag`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} alternativ`,
            other: ()=>`${formatter.number(args.optionCount)} alternativer`
        })} finnes.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Angitt gruppe ${args.groupTitle}, med ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} alternativ`,
                    other: ()=>`${formatter.number(args.groupCount)} alternativer`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valgt`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Forslag`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valgt`
};


var $29be2a564837167c$exports = {};
$29be2a564837167c$exports = {
    "buttonLabel": `Suggesties weergeven`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} optie`,
            other: ()=>`${formatter.number(args.optionCount)} opties`
        })} beschikbaar.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Groep ${args.groupTitle} ingevoerd met ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} optie`,
                    other: ()=>`${formatter.number(args.groupCount)} opties`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, geselecteerd`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Suggesties`,
    "selectedAnnouncement": (args)=>`${args.optionText}, geselecteerd`
};


var $7c0ffa214495a56b$exports = {};
$7c0ffa214495a56b$exports = {
    "buttonLabel": `Wyświetlaj sugestie`,
    "countAnnouncement": (args, formatter)=>`dostępna/dostępne(-nych) ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcja`,
            other: ()=>`${formatter.number(args.optionCount)} opcje(-i)`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Dołączono do grupy ${args.groupTitle}, z ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opcją`,
                    other: ()=>`${formatter.number(args.groupCount)} opcjami`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, wybrano`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugestie`,
    "selectedAnnouncement": (args)=>`${args.optionText}, wybrano`
};


var $e8665834548c9563$exports = {};
$e8665834548c9563$exports = {
    "buttonLabel": `Mostrar sugestões`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opção`,
            other: ()=>`${formatter.number(args.optionCount)} opções`
        })} disponível.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Grupo inserido ${args.groupTitle}, com ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opção`,
                    other: ()=>`${formatter.number(args.groupCount)} opções`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, selecionado`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugestões`,
    "selectedAnnouncement": (args)=>`${args.optionText}, selecionado`
};


var $3f614fe48e86ff5a$exports = {};
$3f614fe48e86ff5a$exports = {
    "buttonLabel": `Apresentar sugestões`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opção`,
            other: ()=>`${formatter.number(args.optionCount)} opções`
        })} disponível.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Grupo introduzido ${args.groupTitle}, com ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opção`,
                    other: ()=>`${formatter.number(args.groupCount)} opções`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, selecionado`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugestões`,
    "selectedAnnouncement": (args)=>`${args.optionText}, selecionado`
};


var $e7efe9ced5993d70$exports = {};
$e7efe9ced5993d70$exports = {
    "buttonLabel": `Afișare sugestii`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opțiune`,
            other: ()=>`${formatter.number(args.optionCount)} opțiuni`
        })} disponibile.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Grup ${args.groupTitle} introdus, cu ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opțiune`,
                    other: ()=>`${formatter.number(args.groupCount)} opțiuni`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, selectat`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugestii`,
    "selectedAnnouncement": (args)=>`${args.optionText}, selectat`
};


var $d56743931b3be207$exports = {};
$d56743931b3be207$exports = {
    "buttonLabel": `Показать предложения`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} параметр`,
            other: ()=>`${formatter.number(args.optionCount)} параметров`
        })} доступно.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Введенная группа ${args.groupTitle}, с ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} параметром`,
                    other: ()=>`${formatter.number(args.groupCount)} параметрами`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, выбранными`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Предложения`,
    "selectedAnnouncement": (args)=>`${args.optionText}, выбрано`
};


var $68a40ce74b5b67bf$exports = {};
$68a40ce74b5b67bf$exports = {
    "buttonLabel": `Zobraziť návrhy`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} možnosť`,
            other: ()=>`${formatter.number(args.optionCount)} možnosti/-í`
        })} k dispozícii.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Zadaná skupina ${args.groupTitle}, s ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} možnosťou`,
                    other: ()=>`${formatter.number(args.groupCount)} možnosťami`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, vybraté`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Návrhy`,
    "selectedAnnouncement": (args)=>`${args.optionText}, vybraté`
};


var $58f7d43d88008c7d$exports = {};
$58f7d43d88008c7d$exports = {
    "buttonLabel": `Prikaži predloge`,
    "countAnnouncement": (args, formatter)=>`Na voljo je ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcija`,
            other: ()=>`${formatter.number(args.optionCount)} opcije`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Vnesena skupina ${args.groupTitle}, z ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opcija`,
                    other: ()=>`${formatter.number(args.groupCount)} opcije`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, izbrano`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Predlogi`,
    "selectedAnnouncement": (args)=>`${args.optionText}, izbrano`
};


var $914aa7442fad912d$exports = {};
$914aa7442fad912d$exports = {
    "buttonLabel": `Prikaži predloge`,
    "countAnnouncement": (args, formatter)=>`Dostupno još: ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcija`,
            other: ()=>`${formatter.number(args.optionCount)} opcije/a`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Unesena grupa ${args.groupTitle}, s ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opcijom`,
                    other: ()=>`${formatter.number(args.groupCount)} optione/a`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, izabranih`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Predlozi`,
    "selectedAnnouncement": (args)=>`${args.optionText}, izabrano`
};


var $85af38f91b727899$exports = {};
$85af38f91b727899$exports = {
    "buttonLabel": `Visa förslag`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} alternativ`,
            other: ()=>`${formatter.number(args.optionCount)} alternativ`
        })} tillgängliga.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Ingick i gruppen ${args.groupTitle} med ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} alternativ`,
                    other: ()=>`${formatter.number(args.groupCount)} alternativ`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valda`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Förslag`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valda`
};


var $72a40ca4dde96679$exports = {};
$72a40ca4dde96679$exports = {
    "buttonLabel": `Önerileri göster`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} seçenek`,
            other: ()=>`${formatter.number(args.optionCount)} seçenekler`
        })} kullanılabilir.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Girilen grup ${args.groupTitle}, ile ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} seçenek`,
                    other: ()=>`${formatter.number(args.groupCount)} seçenekler`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, seçildi`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Öneriler`,
    "selectedAnnouncement": (args)=>`${args.optionText}, seçildi`
};


var $300dce19c9e0d13f$exports = {};
$300dce19c9e0d13f$exports = {
    "buttonLabel": `Показати пропозиції`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} параметр`,
            other: ()=>`${formatter.number(args.optionCount)} параметри(-ів)`
        })} доступно.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Введена група ${args.groupTitle}, з ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} параметр`,
                    other: ()=>`${formatter.number(args.groupCount)} параметри(-ів)`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, вибрано`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Пропозиції`,
    "selectedAnnouncement": (args)=>`${args.optionText}, вибрано`
};


var $015ff4188b7f78eb$exports = {};
$015ff4188b7f78eb$exports = {
    "buttonLabel": `显示建议`,
    "countAnnouncement": (args, formatter)=>`有 ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} 个选项`,
            other: ()=>`${formatter.number(args.optionCount)} 个选项`
        })}可用。`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`进入了 ${args.groupTitle} 组，其中有 ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} 个选项`,
                    other: ()=>`${formatter.number(args.groupCount)} 个选项`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, 已选择`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `建议`,
    "selectedAnnouncement": (args)=>`${args.optionText}, 已选择`
};


var $713552ac3e0ac749$exports = {};
$713552ac3e0ac749$exports = {
    "buttonLabel": `顯示建議`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} 選項`,
            other: ()=>`${formatter.number(args.optionCount)} 選項`
        })} 可用。`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`輸入的群組 ${args.groupTitle}, 有 ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} 選項`,
                    other: ()=>`${formatter.number(args.groupCount)} 選項`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, 已選取`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `建議`,
    "selectedAnnouncement": (args)=>`${args.optionText}, 已選取`
};


$2da059a9a42f95bf$exports = {
    "ar-AE": $a756282ae45b5180$exports,
    "bg-BG": $50569559b1387c57$exports,
    "cs-CZ": $bff243ee21f5616f$exports,
    "da-DK": $1508d10b8eb2180a$exports,
    "de-DE": $aa4e6d422b8a72e9$exports,
    "el-GR": $b88e038b0dd4dc0a$exports,
    "en-US": $dbcec05b5ddcd323$exports,
    "es-ES": $3a762c75d410ecfe$exports,
    "et-EE": $345540ad7e1ca6bf$exports,
    "fi-FI": $f314257d456879ad$exports,
    "fr-FR": $ebebc2f5e8da1157$exports,
    "he-IL": $3dda6220a904406b$exports,
    "hr-HR": $21178dd033a9f6f2$exports,
    "hu-HU": $f12e9cac54fcde83$exports,
    "it-IT": $c7ad5d19d847ae9c$exports,
    "ja-JP": $2cd660cb05523578$exports,
    "ko-KR": $854156a4c27f569c$exports,
    "lt-LT": $dabe6c727809b774$exports,
    "lv-LV": $7810eacb77cdba0d$exports,
    "nb-NO": $5e329fda39bb6d70$exports,
    "nl-NL": $29be2a564837167c$exports,
    "pl-PL": $7c0ffa214495a56b$exports,
    "pt-BR": $e8665834548c9563$exports,
    "pt-PT": $3f614fe48e86ff5a$exports,
    "ro-RO": $e7efe9ced5993d70$exports,
    "ru-RU": $d56743931b3be207$exports,
    "sk-SK": $68a40ce74b5b67bf$exports,
    "sl-SI": $58f7d43d88008c7d$exports,
    "sr-SP": $914aa7442fad912d$exports,
    "sv-SE": $85af38f91b727899$exports,
    "tr-TR": $72a40ca4dde96679$exports,
    "uk-UA": $300dce19c9e0d13f$exports,
    "zh-CN": $015ff4188b7f78eb$exports,
    "zh-TW": $713552ac3e0ac749$exports
};






function $242452271d1e4c0e$export$8c18d1b4f7232bbf(props, state) {
    let { buttonRef: buttonRef , popoverRef: popoverRef , inputRef: inputRef , listBoxRef: listBoxRef , keyboardDelegate: keyboardDelegate , shouldFocusWrap: // completionMode = 'suggest',
    shouldFocusWrap , isReadOnly: isReadOnly , isDisabled: isDisabled  } = props;
    let stringFormatter = (0, $8Zqhq$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($2da059a9a42f95bf$exports))));
    let { menuTriggerProps: menuTriggerProps , menuProps: menuProps  } = (0, $8Zqhq$reactariamenu.useMenuTrigger)({
        type: "listbox",
        isDisabled: isDisabled || isReadOnly
    }, state, buttonRef);
    // Set listbox id so it can be used when calling getItemId later
    (0, $8Zqhq$reactarialistbox.listData).set(state, {
        id: menuProps.id
    });
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let delegate = (0, $8Zqhq$react.useMemo)(()=>keyboardDelegate || new (0, $8Zqhq$reactariaselection.ListKeyboardDelegate)(state.collection, state.disabledKeys, listBoxRef), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        listBoxRef
    ]);
    // Use useSelectableCollection to get the keyboard handlers to apply to the textfield
    let { collectionProps: collectionProps  } = (0, $8Zqhq$reactariaselection.useSelectableCollection)({
        selectionManager: state.selectionManager,
        keyboardDelegate: delegate,
        disallowTypeAhead: true,
        disallowEmptySelection: true,
        shouldFocusWrap: shouldFocusWrap,
        ref: inputRef,
        // Prevent item scroll behavior from being applied here, should be handled in the user's Popover + ListBox component
        isVirtualized: true
    });
    // For textfield specific keydown operations
    let onKeyDown = (e)=>{
        switch(e.key){
            case "Enter":
            case "Tab":
                // Prevent form submission if menu is open since we may be selecting a option
                if (state.isOpen && e.key === "Enter") e.preventDefault();
                state.commit();
                break;
            case "Escape":
                if (state.selectedKey !== null || state.inputValue === "" || props.allowsCustomValue) e.continuePropagation();
                state.revert();
                break;
            case "ArrowDown":
                state.open("first", "manual");
                break;
            case "ArrowUp":
                state.open("last", "manual");
                break;
            case "ArrowLeft":
            case "ArrowRight":
                state.selectionManager.setFocusedKey(null);
                break;
        }
    };
    let onBlur = (e)=>{
        var _popoverRef_current;
        // Ignore blur if focused moved to the button or into the popover.
        if (e.relatedTarget === (buttonRef === null || buttonRef === void 0 ? void 0 : buttonRef.current) || ((_popoverRef_current = popoverRef.current) === null || _popoverRef_current === void 0 ? void 0 : _popoverRef_current.contains(e.relatedTarget))) return;
        if (props.onBlur) props.onBlur(e);
        state.setFocused(false);
    };
    let onFocus = (e)=>{
        if (state.isFocused) return;
        if (props.onFocus) props.onFocus(e);
        state.setFocused(true);
    };
    let { labelProps: labelProps , inputProps: inputProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $8Zqhq$reactariatextfield.useTextField)({
        ...props,
        onChange: state.setInputValue,
        onKeyDown: !isReadOnly && (0, $8Zqhq$reactariautils.chain)(state.isOpen && collectionProps.onKeyDown, onKeyDown, props.onKeyDown),
        onBlur: onBlur,
        value: state.inputValue,
        onFocus: onFocus,
        autoComplete: "off"
    }, inputRef);
    // Press handlers for the ComboBox button
    let onPress = (e)=>{
        if (e.pointerType === "touch") {
            // Focus the input field in case it isn't focused yet
            inputRef.current.focus();
            state.toggle(null, "manual");
        }
    };
    let onPressStart = (e)=>{
        if (e.pointerType !== "touch") {
            inputRef.current.focus();
            state.toggle(e.pointerType === "keyboard" || e.pointerType === "virtual" ? "first" : null, "manual");
        }
    };
    let triggerLabelProps = (0, $8Zqhq$reactariautils.useLabels)({
        id: menuTriggerProps.id,
        "aria-label": stringFormatter.format("buttonLabel"),
        "aria-labelledby": props["aria-labelledby"] || labelProps.id
    });
    let listBoxProps = (0, $8Zqhq$reactariautils.useLabels)({
        id: menuProps.id,
        "aria-label": stringFormatter.format("listboxLabel"),
        "aria-labelledby": props["aria-labelledby"] || labelProps.id
    });
    // If a touch happens on direct center of ComboBox input, might be virtual click from iPad so open ComboBox menu
    let lastEventTime = (0, $8Zqhq$react.useRef)(0);
    let onTouchEnd = (e)=>{
        if (isDisabled || isReadOnly) return;
        // Sometimes VoiceOver on iOS fires two touchend events in quick succession. Ignore the second one.
        if (e.timeStamp - lastEventTime.current < 500) {
            e.preventDefault();
            inputRef.current.focus();
            return;
        }
        let rect = e.target.getBoundingClientRect();
        let touch = e.changedTouches[0];
        let centerX = Math.ceil(rect.left + .5 * rect.width);
        let centerY = Math.ceil(rect.top + .5 * rect.height);
        if (touch.clientX === centerX && touch.clientY === centerY) {
            e.preventDefault();
            inputRef.current.focus();
            state.toggle(null, "manual");
            lastEventTime.current = e.timeStamp;
        }
    };
    // VoiceOver has issues with announcing aria-activedescendant properly on change
    // (especially on iOS). We use a live region announcer to announce focus changes
    // manually. In addition, section titles are announced when navigating into a new section.
    let focusedItem = state.selectionManager.focusedKey != null && state.isOpen ? state.collection.getItem(state.selectionManager.focusedKey) : undefined;
    var _focusedItem_parentKey;
    let sectionKey = (_focusedItem_parentKey = focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.parentKey) !== null && _focusedItem_parentKey !== void 0 ? _focusedItem_parentKey : null;
    var _state_selectionManager_focusedKey;
    let itemKey = (_state_selectionManager_focusedKey = state.selectionManager.focusedKey) !== null && _state_selectionManager_focusedKey !== void 0 ? _state_selectionManager_focusedKey : null;
    let lastSection = (0, $8Zqhq$react.useRef)(sectionKey);
    let lastItem = (0, $8Zqhq$react.useRef)(itemKey);
    (0, $8Zqhq$react.useEffect)(()=>{
        if ((0, $8Zqhq$reactariautils.isAppleDevice)() && focusedItem != null && itemKey !== lastItem.current) {
            let isSelected = state.selectionManager.isSelected(itemKey);
            let section = sectionKey != null ? state.collection.getItem(sectionKey) : null;
            let sectionTitle = (section === null || section === void 0 ? void 0 : section["aria-label"]) || (typeof (section === null || section === void 0 ? void 0 : section.rendered) === "string" ? section.rendered : "") || "";
            let announcement = stringFormatter.format("focusAnnouncement", {
                isGroupChange: section && sectionKey !== lastSection.current,
                groupTitle: sectionTitle,
                groupCount: section ? [
                    ...(0, $8Zqhq$reactstatelycollections.getChildNodes)(section, state.collection)
                ].length : 0,
                optionText: focusedItem["aria-label"] || focusedItem.textValue || "",
                isSelected: isSelected
            });
            (0, $8Zqhq$reactarialiveannouncer.announce)(announcement);
        }
        lastSection.current = sectionKey;
        lastItem.current = itemKey;
    });
    // Announce the number of available suggestions when it changes
    let optionCount = (0, $8Zqhq$reactstatelycollections.getItemCount)(state.collection);
    let lastSize = (0, $8Zqhq$react.useRef)(optionCount);
    let lastOpen = (0, $8Zqhq$react.useRef)(state.isOpen);
    (0, $8Zqhq$react.useEffect)(()=>{
        // Only announce the number of options available when the menu opens if there is no
        // focused item, otherwise screen readers will typically read e.g. "1 of 6".
        // The exception is VoiceOver since this isn't included in the message above.
        let didOpenWithoutFocusedItem = state.isOpen !== lastOpen.current && (state.selectionManager.focusedKey == null || (0, $8Zqhq$reactariautils.isAppleDevice)());
        if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
            let announcement = stringFormatter.format("countAnnouncement", {
                optionCount: optionCount
            });
            (0, $8Zqhq$reactarialiveannouncer.announce)(announcement);
        }
        lastSize.current = optionCount;
        lastOpen.current = state.isOpen;
    });
    // Announce when a selection occurs for VoiceOver. Other screen readers typically do this automatically.
    let lastSelectedKey = (0, $8Zqhq$react.useRef)(state.selectedKey);
    (0, $8Zqhq$react.useEffect)(()=>{
        if ((0, $8Zqhq$reactariautils.isAppleDevice)() && state.isFocused && state.selectedItem && state.selectedKey !== lastSelectedKey.current) {
            let optionText = state.selectedItem["aria-label"] || state.selectedItem.textValue || "";
            let announcement = stringFormatter.format("selectedAnnouncement", {
                optionText: optionText
            });
            (0, $8Zqhq$reactarialiveannouncer.announce)(announcement);
        }
        lastSelectedKey.current = state.selectedKey;
    });
    (0, $8Zqhq$react.useEffect)(()=>{
        if (state.isOpen) return (0, $8Zqhq$reactariaoverlays.ariaHideOutside)([
            inputRef.current,
            popoverRef.current
        ]);
    }, [
        state.isOpen,
        inputRef,
        popoverRef
    ]);
    return {
        labelProps: labelProps,
        buttonProps: {
            ...menuTriggerProps,
            ...triggerLabelProps,
            excludeFromTabOrder: true,
            onPress: onPress,
            onPressStart: onPressStart,
            isDisabled: isDisabled || isReadOnly
        },
        inputProps: (0, $8Zqhq$reactariautils.mergeProps)(inputProps, {
            role: "combobox",
            "aria-expanded": menuTriggerProps["aria-expanded"],
            "aria-controls": state.isOpen ? menuProps.id : undefined,
            // TODO: readd proper logic for completionMode = complete (aria-autocomplete: both)
            "aria-autocomplete": "list",
            "aria-activedescendant": focusedItem ? (0, $8Zqhq$reactarialistbox.getItemId)(state, focusedItem.key) : undefined,
            onTouchEnd: onTouchEnd,
            // This disable's iOS's autocorrect suggestions, since the combo box provides its own suggestions.
            autoCorrect: "off",
            // This disable's the macOS Safari spell check auto corrections.
            spellCheck: "false"
        }),
        listBoxProps: (0, $8Zqhq$reactariautils.mergeProps)(menuProps, listBoxProps, {
            autoFocus: state.focusStrategy,
            shouldUseVirtualFocus: true,
            shouldSelectOnPressUp: true,
            shouldFocusOnHover: true
        }),
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
    };
}




//# sourceMappingURL=main.js.map
