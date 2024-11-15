module.export({useBreadcrumbItem:()=>$dafd15390222438a$export$452b38fce62c9384,useBreadcrumbs:()=>$848231d7a2b3998e$export$8cefe241bd876ca0});let $i081u$useLink;module.link("@react-aria/link",{useLink(v){$i081u$useLink=v}},0);let $i081u$filterDOMProps;module.link("@react-aria/utils",{filterDOMProps(v){$i081u$filterDOMProps=v}},1);let $i081u$useLocalizedStringFormatter;module.link("@react-aria/i18n",{useLocalizedStringFormatter(v){$i081u$useLocalizedStringFormatter=v}},2);



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
function $dafd15390222438a$export$452b38fce62c9384(props, ref) {
    let { isCurrent: isCurrent , isDisabled: isDisabled , "aria-current": ariaCurrent , elementType: elementType = "a" , ...otherProps } = props;
    let { linkProps: linkProps  } = (0, $i081u$useLink)({
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
var $28dc7e2f5ed40c80$exports = {};
var $b91590b2dc47de39$exports = {};
$b91590b2dc47de39$exports = {
    "breadcrumbs": `عناصر الواجهة`
};


var $55b0693b2cf3fe91$exports = {};
$55b0693b2cf3fe91$exports = {
    "breadcrumbs": `Трохи хляб`
};


var $6ec1ed7729e948cc$exports = {};
$6ec1ed7729e948cc$exports = {
    "breadcrumbs": `Popis cesty`
};


var $5a41bb2baa6861e4$exports = {};
$5a41bb2baa6861e4$exports = {
    "breadcrumbs": `Brødkrummer`
};


var $f28bbea439e87eca$exports = {};
$f28bbea439e87eca$exports = {
    "breadcrumbs": `Breadcrumbs`
};


var $b3eca51cb720961a$exports = {};
$b3eca51cb720961a$exports = {
    "breadcrumbs": `Πλοηγήσεις breadcrumb`
};


var $0b39b205118db415$exports = {};
$0b39b205118db415$exports = {
    "breadcrumbs": `Breadcrumbs`
};


var $f467c0ee7bfb0950$exports = {};
$f467c0ee7bfb0950$exports = {
    "breadcrumbs": `Migas de pan`
};


var $ab711d2ffb4cdf3d$exports = {};
$ab711d2ffb4cdf3d$exports = {
    "breadcrumbs": `Lingiread`
};


var $b63105d663e6f9d5$exports = {};
$b63105d663e6f9d5$exports = {
    "breadcrumbs": `Navigointilinkit`
};


var $9d2ed7be7fcdc2a1$exports = {};
$9d2ed7be7fcdc2a1$exports = {
    "breadcrumbs": `Chemin de navigation`
};


var $c5704294d85c7b5d$exports = {};
$c5704294d85c7b5d$exports = {
    "breadcrumbs": `שבילי ניווט`
};


var $20c975671d6bbc63$exports = {};
$20c975671d6bbc63$exports = {
    "breadcrumbs": `Navigacijski putovi`
};


var $2569ca3917233115$exports = {};
$2569ca3917233115$exports = {
    "breadcrumbs": `Morzsamenü`
};


var $caa152f7f8e96c85$exports = {};
$caa152f7f8e96c85$exports = {
    "breadcrumbs": `Breadcrumb`
};


var $cbc6af0cc98fad10$exports = {};
$cbc6af0cc98fad10$exports = {
    "breadcrumbs": `パンくずリスト`
};


var $ad9be5d332b4d607$exports = {};
$ad9be5d332b4d607$exports = {
    "breadcrumbs": `탐색 표시`
};


var $659de19a00ff9617$exports = {};
$659de19a00ff9617$exports = {
    "breadcrumbs": `Naršymo kelias`
};


var $173e9fb4d14fe309$exports = {};
$173e9fb4d14fe309$exports = {
    "breadcrumbs": `Atpakaļceļi`
};


var $d8e2640a066567a9$exports = {};
$d8e2640a066567a9$exports = {
    "breadcrumbs": `Navigasjonsstier`
};


var $d71fd764236c0d12$exports = {};
$d71fd764236c0d12$exports = {
    "breadcrumbs": `Broodkruimels`
};


var $f4ad3faf9f4aaec6$exports = {};
$f4ad3faf9f4aaec6$exports = {
    "breadcrumbs": `Struktura nawigacyjna`
};


var $9703be9d55d8e9c2$exports = {};
$9703be9d55d8e9c2$exports = {
    "breadcrumbs": `Caminho detalhado`
};


var $7e23baec8a14f309$exports = {};
$7e23baec8a14f309$exports = {
    "breadcrumbs": `Categorias`
};


var $568f95594049d56e$exports = {};
$568f95594049d56e$exports = {
    "breadcrumbs": `Miez de pâine`
};


var $625df06cecc70764$exports = {};
$625df06cecc70764$exports = {
    "breadcrumbs": `Навигация`
};


var $b5a67525f3a2f594$exports = {};
$b5a67525f3a2f594$exports = {
    "breadcrumbs": `Navigačné prvky Breadcrumbs`
};


var $16125922964febca$exports = {};
$16125922964febca$exports = {
    "breadcrumbs": `Drobtine`
};


var $de104bf355206bcf$exports = {};
$de104bf355206bcf$exports = {
    "breadcrumbs": `Putanje navigacije`
};


var $d5ab76bcbadc9c07$exports = {};
$d5ab76bcbadc9c07$exports = {
    "breadcrumbs": `Sökvägar`
};


var $a6a1af5968159b55$exports = {};
$a6a1af5968159b55$exports = {
    "breadcrumbs": `İçerik haritaları`
};


var $5204a30f0d17ffec$exports = {};
$5204a30f0d17ffec$exports = {
    "breadcrumbs": `Навігаційна стежка`
};


var $8d15e736e12d3dfd$exports = {};
$8d15e736e12d3dfd$exports = {
    "breadcrumbs": `导航栏`
};


var $f8c49dd804b75140$exports = {};
$f8c49dd804b75140$exports = {
    "breadcrumbs": `導覽列`
};


$28dc7e2f5ed40c80$exports = {
    "ar-AE": $b91590b2dc47de39$exports,
    "bg-BG": $55b0693b2cf3fe91$exports,
    "cs-CZ": $6ec1ed7729e948cc$exports,
    "da-DK": $5a41bb2baa6861e4$exports,
    "de-DE": $f28bbea439e87eca$exports,
    "el-GR": $b3eca51cb720961a$exports,
    "en-US": $0b39b205118db415$exports,
    "es-ES": $f467c0ee7bfb0950$exports,
    "et-EE": $ab711d2ffb4cdf3d$exports,
    "fi-FI": $b63105d663e6f9d5$exports,
    "fr-FR": $9d2ed7be7fcdc2a1$exports,
    "he-IL": $c5704294d85c7b5d$exports,
    "hr-HR": $20c975671d6bbc63$exports,
    "hu-HU": $2569ca3917233115$exports,
    "it-IT": $caa152f7f8e96c85$exports,
    "ja-JP": $cbc6af0cc98fad10$exports,
    "ko-KR": $ad9be5d332b4d607$exports,
    "lt-LT": $659de19a00ff9617$exports,
    "lv-LV": $173e9fb4d14fe309$exports,
    "nb-NO": $d8e2640a066567a9$exports,
    "nl-NL": $d71fd764236c0d12$exports,
    "pl-PL": $f4ad3faf9f4aaec6$exports,
    "pt-BR": $9703be9d55d8e9c2$exports,
    "pt-PT": $7e23baec8a14f309$exports,
    "ro-RO": $568f95594049d56e$exports,
    "ru-RU": $625df06cecc70764$exports,
    "sk-SK": $b5a67525f3a2f594$exports,
    "sl-SI": $16125922964febca$exports,
    "sr-SP": $de104bf355206bcf$exports,
    "sv-SE": $d5ab76bcbadc9c07$exports,
    "tr-TR": $a6a1af5968159b55$exports,
    "uk-UA": $5204a30f0d17ffec$exports,
    "zh-CN": $8d15e736e12d3dfd$exports,
    "zh-TW": $f8c49dd804b75140$exports
};



function $848231d7a2b3998e$export$8cefe241bd876ca0(props) {
    let { "aria-label": ariaLabel , ...otherProps } = props;
    let strings = (0, $i081u$useLocalizedStringFormatter)((0, (/*@__PURE__*/$parcel$interopDefault($28dc7e2f5ed40c80$exports))));
    return {
        navProps: {
            ...(0, $i081u$filterDOMProps)(otherProps, {
                labelable: true
            }),
            "aria-label": ariaLabel || strings.format("breadcrumbs")
        }
    };
}





//# sourceMappingURL=module.js.map
