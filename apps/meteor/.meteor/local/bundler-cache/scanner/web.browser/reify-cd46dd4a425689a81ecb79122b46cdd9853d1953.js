module.export({manageFavicon:()=>manageFavicon},true);let drawBadge;module.link('./badge',{drawBadge(v){drawBadge=v}},0);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const getFavicons = () => {
    const favicons = Array.from(document.head.getElementsByTagName('link')).filter((link) => { var _a; return /(^|\s)icon(\s|$)/i.test((_a = link.getAttribute('rel')) !== null && _a !== void 0 ? _a : ''); });
    if (favicons.length === 0) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'icon');
        document.head.appendChild(link);
        favicons.push(link);
    }
    for (const favicon of favicons) {
        favicon.setAttribute('type', 'image/png');
    }
    return favicons;
};
const fetchFaviconImage = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const img = new Image();
    if (url) {
        img.crossOrigin = 'anonymous';
        img.src = url;
    }
    else {
        img.src = '';
        img.width = 32;
        img.height = 32;
    }
    return new Promise((resolve, reject) => {
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
    });
});
const renderAndUpdate = ({ badge, canvas, favicons, context, img, }) => {
    context.scale(canvas.width, canvas.height);
    context.clearRect(0, 0, 1, 1);
    context.drawImage(img, 0, 0, 1, 1);
    drawBadge(badge, context);
    context.setTransform(1, 0, 0, 1, 0, 0);
    const url = canvas.toDataURL('image/png');
    for (const icon of favicons) {
        icon.setAttribute('href', url);
    }
};
const manageFavicon = () => {
    let pendingBadge;
    let updateOrCollect = (badge) => {
        pendingBadge = badge;
    };
    const init = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const favicons = getFavicons();
        const lastFavicon = favicons[favicons.length - 1];
        const faviconURL = (_a = lastFavicon.getAttribute('href')) !== null && _a !== void 0 ? _a : undefined;
        const img = yield fetchFaviconImage(faviconURL);
        const canvas = document.createElement('canvas');
        canvas.width = img.width > 0 ? img.width : 32;
        canvas.height = img.height > 0 ? img.height : 32;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to create canvas context');
        }
        updateOrCollect = (badge) => {
            renderAndUpdate({ badge, canvas, favicons, context, img });
        };
        if (pendingBadge) {
            updateOrCollect(pendingBadge);
            pendingBadge = undefined;
        }
    });
    init();
    return (badge) => {
        updateOrCollect(badge);
    };
};
//# sourceMappingURL=index.js.map