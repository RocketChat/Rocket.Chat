module.export({useComboBox:()=>$c350ade66beef0af$export$8c18d1b4f7232bbf});let $3yVy0$announce;module.link("@react-aria/live-announcer",{announce(v){$3yVy0$announce=v}},0);let $3yVy0$ariaHideOutside;module.link("@react-aria/overlays",{ariaHideOutside(v){$3yVy0$ariaHideOutside=v}},1);let $3yVy0$listData,$3yVy0$getItemId;module.link("@react-aria/listbox",{listData(v){$3yVy0$listData=v},getItemId(v){$3yVy0$getItemId=v}},2);let $3yVy0$chain,$3yVy0$useLabels,$3yVy0$isAppleDevice,$3yVy0$mergeProps;module.link("@react-aria/utils",{chain(v){$3yVy0$chain=v},useLabels(v){$3yVy0$useLabels=v},isAppleDevice(v){$3yVy0$isAppleDevice=v},mergeProps(v){$3yVy0$mergeProps=v}},3);let $3yVy0$useMemo,$3yVy0$useRef,$3yVy0$useEffect;module.link("react",{useMemo(v){$3yVy0$useMemo=v},useRef(v){$3yVy0$useRef=v},useEffect(v){$3yVy0$useEffect=v}},4);let $3yVy0$getChildNodes,$3yVy0$getItemCount;module.link("@react-stately/collections",{getChildNodes(v){$3yVy0$getChildNodes=v},getItemCount(v){$3yVy0$getItemCount=v}},5);let $3yVy0$ListKeyboardDelegate,$3yVy0$useSelectableCollection;module.link("@react-aria/selection",{ListKeyboardDelegate(v){$3yVy0$ListKeyboardDelegate=v},useSelectableCollection(v){$3yVy0$useSelectableCollection=v}},6);let $3yVy0$useLocalizedStringFormatter;module.link("@react-aria/i18n",{useLocalizedStringFormatter(v){$3yVy0$useLocalizedStringFormatter=v}},7);let $3yVy0$useMenuTrigger;module.link("@react-aria/menu",{useMenuTrigger(v){$3yVy0$useMenuTrigger=v}},8);let $3yVy0$useTextField;module.link("@react-aria/textfield",{useTextField(v){$3yVy0$useTextField=v}},9);










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





var $2e84e748dc57e459$exports = {};
var $02cb4c75c506befe$exports = {};
$02cb4c75c506befe$exports = {
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


var $568b8163f1e56faf$exports = {};
$568b8163f1e56faf$exports = {
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


var $87581c0202d106b8$exports = {};
$87581c0202d106b8$exports = {
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


var $a10a0369f5433ed1$exports = {};
$a10a0369f5433ed1$exports = {
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


var $bfd288727d5cb166$exports = {};
$bfd288727d5cb166$exports = {
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


var $ca177778f9a74e3c$exports = {};
$ca177778f9a74e3c$exports = {
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


var $9b5aa79ef84beb6c$exports = {};
$9b5aa79ef84beb6c$exports = {
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


var $57968e8209de2557$exports = {};
$57968e8209de2557$exports = {
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


var $60690790bf4c1c6a$exports = {};
$60690790bf4c1c6a$exports = {
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


var $1101246e8c7d9357$exports = {};
$1101246e8c7d9357$exports = {
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


var $6404b5cb5b241730$exports = {};
$6404b5cb5b241730$exports = {
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


var $dfeafa702e92e31f$exports = {};
$dfeafa702e92e31f$exports = {
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


var $2d125e0b34676352$exports = {};
$2d125e0b34676352$exports = {
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


var $ea029611d7634059$exports = {};
$ea029611d7634059$exports = {
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


var $77f075bb86ad7091$exports = {};
$77f075bb86ad7091$exports = {
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


var $6e87462e84907983$exports = {};
$6e87462e84907983$exports = {
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


var $9246f2c6edc6b232$exports = {};
$9246f2c6edc6b232$exports = {
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


var $e587accc6c0a434c$exports = {};
$e587accc6c0a434c$exports = {
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


var $03a1900e7400b5ab$exports = {};
$03a1900e7400b5ab$exports = {
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


var $1387676441be6cf6$exports = {};
$1387676441be6cf6$exports = {
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


var $17e82ebf0f8ab91f$exports = {};
$17e82ebf0f8ab91f$exports = {
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


var $2f5377d3471630e5$exports = {};
$2f5377d3471630e5$exports = {
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


var $dee9868b6fa95ffe$exports = {};
$dee9868b6fa95ffe$exports = {
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


var $f8b2e63637cbb5a6$exports = {};
$f8b2e63637cbb5a6$exports = {
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


var $46a885db3b44ea95$exports = {};
$46a885db3b44ea95$exports = {
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


var $50d8a8f0afa9dee5$exports = {};
$50d8a8f0afa9dee5$exports = {
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


var $2867ee6173245507$exports = {};
$2867ee6173245507$exports = {
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


var $0631b65beeb09b50$exports = {};
$0631b65beeb09b50$exports = {
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


var $65fc749265dcd686$exports = {};
$65fc749265dcd686$exports = {
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


var $69ba655c7853c08e$exports = {};
$69ba655c7853c08e$exports = {
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


var $a79794784d61577c$exports = {};
$a79794784d61577c$exports = {
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


var $c2845791417ebaf4$exports = {};
$c2845791417ebaf4$exports = {
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


var $29b642d0025cc7a4$exports = {};
$29b642d0025cc7a4$exports = {
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


var $cd36dd33f9d46936$exports = {};
$cd36dd33f9d46936$exports = {
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


$2e84e748dc57e459$exports = {
    "ar-AE": $02cb4c75c506befe$exports,
    "bg-BG": $568b8163f1e56faf$exports,
    "cs-CZ": $87581c0202d106b8$exports,
    "da-DK": $a10a0369f5433ed1$exports,
    "de-DE": $bfd288727d5cb166$exports,
    "el-GR": $ca177778f9a74e3c$exports,
    "en-US": $9b5aa79ef84beb6c$exports,
    "es-ES": $57968e8209de2557$exports,
    "et-EE": $60690790bf4c1c6a$exports,
    "fi-FI": $1101246e8c7d9357$exports,
    "fr-FR": $6404b5cb5b241730$exports,
    "he-IL": $dfeafa702e92e31f$exports,
    "hr-HR": $2d125e0b34676352$exports,
    "hu-HU": $ea029611d7634059$exports,
    "it-IT": $77f075bb86ad7091$exports,
    "ja-JP": $6e87462e84907983$exports,
    "ko-KR": $9246f2c6edc6b232$exports,
    "lt-LT": $e587accc6c0a434c$exports,
    "lv-LV": $03a1900e7400b5ab$exports,
    "nb-NO": $1387676441be6cf6$exports,
    "nl-NL": $17e82ebf0f8ab91f$exports,
    "pl-PL": $2f5377d3471630e5$exports,
    "pt-BR": $dee9868b6fa95ffe$exports,
    "pt-PT": $f8b2e63637cbb5a6$exports,
    "ro-RO": $46a885db3b44ea95$exports,
    "ru-RU": $50d8a8f0afa9dee5$exports,
    "sk-SK": $2867ee6173245507$exports,
    "sl-SI": $0631b65beeb09b50$exports,
    "sr-SP": $65fc749265dcd686$exports,
    "sv-SE": $69ba655c7853c08e$exports,
    "tr-TR": $a79794784d61577c$exports,
    "uk-UA": $c2845791417ebaf4$exports,
    "zh-CN": $29b642d0025cc7a4$exports,
    "zh-TW": $cd36dd33f9d46936$exports
};






function $c350ade66beef0af$export$8c18d1b4f7232bbf(props, state) {
    let { buttonRef: buttonRef , popoverRef: popoverRef , inputRef: inputRef , listBoxRef: listBoxRef , keyboardDelegate: keyboardDelegate , shouldFocusWrap: // completionMode = 'suggest',
    shouldFocusWrap , isReadOnly: isReadOnly , isDisabled: isDisabled  } = props;
    let stringFormatter = (0, $3yVy0$useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($2e84e748dc57e459$exports))));
    let { menuTriggerProps: menuTriggerProps , menuProps: menuProps  } = (0, $3yVy0$useMenuTrigger)({
        type: "listbox",
        isDisabled: isDisabled || isReadOnly
    }, state, buttonRef);
    // Set listbox id so it can be used when calling getItemId later
    (0, $3yVy0$listData).set(state, {
        id: menuProps.id
    });
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let delegate = (0, $3yVy0$useMemo)(()=>keyboardDelegate || new (0, $3yVy0$ListKeyboardDelegate)(state.collection, state.disabledKeys, listBoxRef), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        listBoxRef
    ]);
    // Use useSelectableCollection to get the keyboard handlers to apply to the textfield
    let { collectionProps: collectionProps  } = (0, $3yVy0$useSelectableCollection)({
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
    let { labelProps: labelProps , inputProps: inputProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $3yVy0$useTextField)({
        ...props,
        onChange: state.setInputValue,
        onKeyDown: !isReadOnly && (0, $3yVy0$chain)(state.isOpen && collectionProps.onKeyDown, onKeyDown, props.onKeyDown),
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
    let triggerLabelProps = (0, $3yVy0$useLabels)({
        id: menuTriggerProps.id,
        "aria-label": stringFormatter.format("buttonLabel"),
        "aria-labelledby": props["aria-labelledby"] || labelProps.id
    });
    let listBoxProps = (0, $3yVy0$useLabels)({
        id: menuProps.id,
        "aria-label": stringFormatter.format("listboxLabel"),
        "aria-labelledby": props["aria-labelledby"] || labelProps.id
    });
    // If a touch happens on direct center of ComboBox input, might be virtual click from iPad so open ComboBox menu
    let lastEventTime = (0, $3yVy0$useRef)(0);
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
    let lastSection = (0, $3yVy0$useRef)(sectionKey);
    let lastItem = (0, $3yVy0$useRef)(itemKey);
    (0, $3yVy0$useEffect)(()=>{
        if ((0, $3yVy0$isAppleDevice)() && focusedItem != null && itemKey !== lastItem.current) {
            let isSelected = state.selectionManager.isSelected(itemKey);
            let section = sectionKey != null ? state.collection.getItem(sectionKey) : null;
            let sectionTitle = (section === null || section === void 0 ? void 0 : section["aria-label"]) || (typeof (section === null || section === void 0 ? void 0 : section.rendered) === "string" ? section.rendered : "") || "";
            let announcement = stringFormatter.format("focusAnnouncement", {
                isGroupChange: section && sectionKey !== lastSection.current,
                groupTitle: sectionTitle,
                groupCount: section ? [
                    ...(0, $3yVy0$getChildNodes)(section, state.collection)
                ].length : 0,
                optionText: focusedItem["aria-label"] || focusedItem.textValue || "",
                isSelected: isSelected
            });
            (0, $3yVy0$announce)(announcement);
        }
        lastSection.current = sectionKey;
        lastItem.current = itemKey;
    });
    // Announce the number of available suggestions when it changes
    let optionCount = (0, $3yVy0$getItemCount)(state.collection);
    let lastSize = (0, $3yVy0$useRef)(optionCount);
    let lastOpen = (0, $3yVy0$useRef)(state.isOpen);
    (0, $3yVy0$useEffect)(()=>{
        // Only announce the number of options available when the menu opens if there is no
        // focused item, otherwise screen readers will typically read e.g. "1 of 6".
        // The exception is VoiceOver since this isn't included in the message above.
        let didOpenWithoutFocusedItem = state.isOpen !== lastOpen.current && (state.selectionManager.focusedKey == null || (0, $3yVy0$isAppleDevice)());
        if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
            let announcement = stringFormatter.format("countAnnouncement", {
                optionCount: optionCount
            });
            (0, $3yVy0$announce)(announcement);
        }
        lastSize.current = optionCount;
        lastOpen.current = state.isOpen;
    });
    // Announce when a selection occurs for VoiceOver. Other screen readers typically do this automatically.
    let lastSelectedKey = (0, $3yVy0$useRef)(state.selectedKey);
    (0, $3yVy0$useEffect)(()=>{
        if ((0, $3yVy0$isAppleDevice)() && state.isFocused && state.selectedItem && state.selectedKey !== lastSelectedKey.current) {
            let optionText = state.selectedItem["aria-label"] || state.selectedItem.textValue || "";
            let announcement = stringFormatter.format("selectedAnnouncement", {
                optionText: optionText
            });
            (0, $3yVy0$announce)(announcement);
        }
        lastSelectedKey.current = state.selectedKey;
    });
    (0, $3yVy0$useEffect)(()=>{
        if (state.isOpen) return (0, $3yVy0$ariaHideOutside)([
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
        inputProps: (0, $3yVy0$mergeProps)(inputProps, {
            role: "combobox",
            "aria-expanded": menuTriggerProps["aria-expanded"],
            "aria-controls": state.isOpen ? menuProps.id : undefined,
            // TODO: readd proper logic for completionMode = complete (aria-autocomplete: both)
            "aria-autocomplete": "list",
            "aria-activedescendant": focusedItem ? (0, $3yVy0$getItemId)(state, focusedItem.key) : undefined,
            onTouchEnd: onTouchEnd,
            // This disable's iOS's autocorrect suggestions, since the combo box provides its own suggestions.
            autoCorrect: "off",
            // This disable's the macOS Safari spell check auto corrections.
            spellCheck: "false"
        }),
        listBoxProps: (0, $3yVy0$mergeProps)(menuProps, listBoxProps, {
            autoFocus: state.focusStrategy,
            shouldUseVirtualFocus: true,
            shouldSelectOnPressUp: true,
            shouldFocusOnHover: true
        }),
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
    };
}





//# sourceMappingURL=module.js.map
