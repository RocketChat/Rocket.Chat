import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { escapeHTML } from '@rocket.chat/string-helpers';

import './photoswipeContent.html';

const parseLength = (x) => {
	const length = typeof x === 'string' ? parseInt(x, 10) : undefined;
	return Number.isFinite(length) ? length : undefined;
};

const getImageSize = (src) => new Promise((resolve, reject) => {
	const img = new Image();

	img.addEventListener('load', () => {
		resolve([img.naturalWidth, img.naturalHeight]);
	});

	img.addEventListener('error', (error) => {
		reject(error.error);
	});

	img.src = src;
});

const fromElementToSlide = async (element) => {
	if (element instanceof HTMLAnchorElement) {
		const item = {
			src: element.dataset.src || element.href,
			w: parseLength(element.dataset.width),
			h: parseLength(element.dataset.height),
			title: element.dataset.title || element.title,
			description: element.dataset.description,
		};

		if (!Number.isFinite(item.w) || !Number.isFinite(item.h)) {
			[item.w, item.h] = await getImageSize(item.src);
		}

		return item;
	}

	if (element instanceof HTMLImageElement) {
		const item = {
			src: element.src,
			w: element.naturalWidth,
			h: element.naturalHeight,
			title: element.dataset.title || element.title,
			description: element.dataset.description,
		};

		if (element.dataset.src) {
			item.msrc = element.src;
			item.src = element.dataset.src;
			item.w = parseLength(element.dataset.width);
			item.h = parseLength(element.dataset.height);

			if (!Number.isFinite(item.w) || !Number.isFinite(item.h)) {
				[item.w, item.h] = await getImageSize(item.src);
			}
		}

		return item;
	}

	return null;
};

Meteor.startup(() => {
	let currentGallery = null;
	const initGallery = async (items, options) => {
		Blaze.render(Template.photoswipeContent, document.body);
		const [PhotoSwipeImport, PhotoSwipeUI_DefaultImport] = await Promise.all([import('photoswipe'), import('photoswipe/dist/photoswipe-ui-default'), import('photoswipe/dist/photoswipe.css')]);
		if (!currentGallery) {
			const PhotoSwipe = PhotoSwipeImport.default;
			const PhotoSwipeUI_Default = PhotoSwipeUI_DefaultImport.default;

			currentGallery = new PhotoSwipe(document.getElementById('pswp'), PhotoSwipeUI_Default, items, options);

			currentGallery.listen('destroy', () => {
				currentGallery = null;
			});

			currentGallery.init();
		}
	};

	const defaultGalleryOptions = {
		bgOpacity: 0.7,
		showHideOpacity: true,
		counterEl: false,
		shareEl: false,
		clickToCloseNonZoomable: false,
		index: 0,
		addCaptionHTMLFn(item, captionEl) {
			captionEl.children[0].innerHTML = `
				${ escapeHTML(item.title) }<br/>
				<small>${ escapeHTML(item.description) }</small>
			`;
			return true;
		},
	};

	const createEventListenerFor = (className) => (event) => {
		event.preventDefault();
		event.stopPropagation();

		const { currentTarget } = event;

		Array.from(document.querySelectorAll(className))
			.sort((a, b) => {
				if (a === currentTarget) {
					return -1;
				}

				if (b === currentTarget) {
					return 1;
				}

				return 0;
			})
			.map((element) => fromElementToSlide(element))
			.reduce((p, curr) => p.then(() => curr).then((slide) => {
				if (!slide) {
					return;
				}

				if (!currentGallery) {
					return initGallery([slide], defaultGalleryOptions);
				}

				currentGallery.items.push(slide);
				currentGallery.invalidateCurrItems();
				currentGallery.updateSize(true);
			}), Promise.resolve());
	};

	$(document).on('click', '.gallery-item', createEventListenerFor('.gallery-item'));
});
