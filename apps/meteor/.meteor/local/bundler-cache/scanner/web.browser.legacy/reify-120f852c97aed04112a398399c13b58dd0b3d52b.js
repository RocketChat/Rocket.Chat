var $ceFFG$reactarialink = require("@react-aria/link");
var $ceFFG$reactariautils = require("@react-aria/utils");
var $ceFFG$reactariai18n = require("@react-aria/i18n");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useBreadcrumbItem", () => $a993edba0f043554$export$452b38fce62c9384);
$parcel$export(module.exports, "useBreadcrumbs", () => $2b6c6844f922ad13$export$8cefe241bd876ca0);
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
function $a993edba0f043554$export$452b38fce62c9384(props, ref) {
    let { isCurrent: isCurrent , isDisabled: isDisabled , "aria-current": ariaCurrent , elementType: elementType = "a" , ...otherProps } = props;
    let { linkProps: linkProps  } = (0, $ceFFG$reactarialink.useLink)({
        isDisabled: isDisabled || isCurrent,
        elementType: elementType,
        ...otherProps
    }, ref);
    let isHeading = /^h[1-6]$/.test(elementType);
    let itemProps = {};
    if (!isHeading) itemProps = linkProps;
    if (isCurrent) {
        itemProps["aria-current"] = ariaCurrent || "page";
        // isCurrent sets isDisabled === true for the current item,
        // so we have to restore the tabIndex in order to support autoFocus.
        itemProps.tabIndex = props.autoFocus ? -1 : undefined;
    }
    return {
        itemProps: {
            "aria-disabled": isDisabled,
            ...itemProps
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
var $449b1f30fd791578$exports = {};
var $9f815b0e65822168$exports = {};
$9f815b0e65822168$exports = {
    "breadcrumbs": `عناصر الواجهة`
};


var $340712f3db10d7a4$exports = {};
$340712f3db10d7a4$exports = {
    "breadcrumbs": `Трохи хляб`
};


var $e48681b1dc80258f$exports = {};
$e48681b1dc80258f$exports = {
    "breadcrumbs": `Popis cesty`
};


var $526eff8a033de63f$exports = {};
$526eff8a033de63f$exports = {
    "breadcrumbs": `Brødkrummer`
};


var $7f7267bb8a1d1662$exports = {};
$7f7267bb8a1d1662$exports = {
    "breadcrumbs": `Breadcrumbs`
};


var $0b3e72b767c9c5b3$exports = {};
$0b3e72b767c9c5b3$exports = {
    "breadcrumbs": `Πλοηγήσεις breadcrumb`
};


var $8013ecad7b80bc6e$exports = {};
$8013ecad7b80bc6e$exports = {
    "breadcrumbs": `Breadcrumbs`
};


var $8193bd3309f169ce$exports = {};
$8193bd3309f169ce$exports = {
    "breadcrumbs": `Migas de pan`
};


var $7f47590ede0d21d1$exports = {};
$7f47590ede0d21d1$exports = {
    "breadcrumbs": `Lingiread`
};


var $fedbf3ad45bbd615$exports = {};
$fedbf3ad45bbd615$exports = {
    "breadcrumbs": `Navigointilinkit`
};


var $6383f908645d7728$exports = {};
$6383f908645d7728$exports = {
    "breadcrumbs": `Chemin de navigation`
};


var $299c10c6ab4bac38$exports = {};
$299c10c6ab4bac38$exports = {
    "breadcrumbs": `שבילי ניווט`
};


var $592de6075df6565f$exports = {};
$592de6075df6565f$exports = {
    "breadcrumbs": `Navigacijski putovi`
};


var $3254f62b1e6ffcdf$exports = {};
$3254f62b1e6ffcdf$exports = {
    "breadcrumbs": `Morzsamenü`
};


var $af79bd6e06d0bafc$exports = {};
$af79bd6e06d0bafc$exports = {
    "breadcrumbs": `Breadcrumb`
};


var $ed35043e56c9ef04$exports = {};
$ed35043e56c9ef04$exports = {
    "breadcrumbs": `パンくずリスト`
};


var $f58ec35afca1f567$exports = {};
$f58ec35afca1f567$exports = {
    "breadcrumbs": `탐색 표시`
};


var $3307b3bb9c99bd7d$exports = {};
$3307b3bb9c99bd7d$exports = {
    "breadcrumbs": `Naršymo kelias`
};


var $9d434ee576a846f1$exports = {};
$9d434ee576a846f1$exports = {
    "breadcrumbs": `Atpakaļceļi`
};


var $443fe4201b655279$exports = {};
$443fe4201b655279$exports = {
    "breadcrumbs": `Navigasjonsstier`
};


var $c71565b8a4b2e14c$exports = {};
$c71565b8a4b2e14c$exports = {
    "breadcrumbs": `Broodkruimels`
};


var $fd06abc31ca2d9f9$exports = {};
$fd06abc31ca2d9f9$exports = {
    "breadcrumbs": `Struktura nawigacyjna`
};


var $edac5269f16efde1$exports = {};
$edac5269f16efde1$exports = {
    "breadcrumbs": `Caminho detalhado`
};


var $3e3bf6af9d6c8c74$exports = {};
$3e3bf6af9d6c8c74$exports = {
    "breadcrumbs": `Categorias`
};


var $9d34b5bd98d02fb7$exports = {};
$9d34b5bd98d02fb7$exports = {
    "breadcrumbs": `Miez de pâine`
};


var $e7e947d72b4d0249$exports = {};
$e7e947d72b4d0249$exports = {
    "breadcrumbs": `Навигация`
};


var $d609946db34cbe1a$exports = {};
$d609946db34cbe1a$exports = {
    "breadcrumbs": `Navigačné prvky Breadcrumbs`
};


var $c1ca8f5a39bf35b7$exports = {};
$c1ca8f5a39bf35b7$exports = {
    "breadcrumbs": `Drobtine`
};


var $67542feabb08cdf6$exports = {};
$67542feabb08cdf6$exports = {
    "breadcrumbs": `Putanje navigacije`
};


var $aa3bbc636c202880$exports = {};
$aa3bbc636c202880$exports = {
    "breadcrumbs": `Sökvägar`
};


var $c1fa2374ad960a0b$exports = {};
$c1fa2374ad960a0b$exports = {
    "breadcrumbs": `İçerik haritaları`
};


var $b6a913e54307774b$exports = {};
$b6a913e54307774b$exports = {
    "breadcrumbs": `Навігаційна стежка`
};


var $d246de3cea90219f$exports = {};
$d246de3cea90219f$exports = {
    "breadcrumbs": `导航栏`
};


var $de04860896c81313$exports = {};
$de04860896c81313$exports = {
    "breadcrumbs": `導覽列`
};


$449b1f30fd791578$exports = {
    "ar-AE": $9f815b0e65822168$exports,
    "bg-BG": $340712f3db10d7a4$exports,
    "cs-CZ": $e48681b1dc80258f$exports,
    "da-DK": $526eff8a033de63f$exports,
    "de-DE": $7f7267bb8a1d1662$exports,
    "el-GR": $0b3e72b767c9c5b3$exports,
    "en-US": $8013ecad7b80bc6e$exports,
    "es-ES": $8193bd3309f169ce$exports,
    "et-EE": $7f47590ede0d21d1$exports,
    "fi-FI": $fedbf3ad45bbd615$exports,
    "fr-FR": $6383f908645d7728$exports,
    "he-IL": $299c10c6ab4bac38$exports,
    "hr-HR": $592de6075df6565f$exports,
    "hu-HU": $3254f62b1e6ffcdf$exports,
    "it-IT": $af79bd6e06d0bafc$exports,
    "ja-JP": $ed35043e56c9ef04$exports,
    "ko-KR": $f58ec35afca1f567$exports,
    "lt-LT": $3307b3bb9c99bd7d$exports,
    "lv-LV": $9d434ee576a846f1$exports,
    "nb-NO": $443fe4201b655279$exports,
    "nl-NL": $c71565b8a4b2e14c$exports,
    "pl-PL": $fd06abc31ca2d9f9$exports,
    "pt-BR": $edac5269f16efde1$exports,
    "pt-PT": $3e3bf6af9d6c8c74$exports,
    "ro-RO": $9d34b5bd98d02fb7$exports,
    "ru-RU": $e7e947d72b4d0249$exports,
    "sk-SK": $d609946db34cbe1a$exports,
    "sl-SI": $c1ca8f5a39bf35b7$exports,
    "sr-SP": $67542feabb08cdf6$exports,
    "sv-SE": $aa3bbc636c202880$exports,
    "tr-TR": $c1fa2374ad960a0b$exports,
    "uk-UA": $b6a913e54307774b$exports,
    "zh-CN": $d246de3cea90219f$exports,
    "zh-TW": $de04860896c81313$exports
};



function $2b6c6844f922ad13$export$8cefe241bd876ca0(props) {
    let { "aria-label": ariaLabel , ...otherProps } = props;
    let strings = (0, $ceFFG$reactariai18n.useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($449b1f30fd791578$exports))));
    return {
        navProps: {
            ...(0, $ceFFG$reactariautils.filterDOMProps)(otherProps, {
                labelable: true
            }),
            "aria-label": ariaLabel || strings.format("breadcrumbs")
        }
    };
}




//# sourceMappingURL=main.js.map
