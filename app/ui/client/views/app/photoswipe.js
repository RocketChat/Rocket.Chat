import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { escapeHTML } from '../../../../../lib/escapeHTML';

Meteor.startup(() => {
	let currentGallery = null;
	const initGallery = async (items, options) => {
		Blaze.render(Template.photoswipeContent, document.body);
		const [PhotoSwipeImport, PhotoSwipeUI_DefaultImport] = await Promise.all([import('photoswipe'), import('photoswipe/dist/photoswipe-ui-default'), import('photoswipe/dist/photoswipe.css')]);
		if (!currentGallery) {
			const PhotoSwipe = PhotoSwipeImport.default;
			const PhotoSwipeUI_Default = PhotoSwipeUI_DefaultImport.default;
			currentGallery = await new PhotoSwipe(document.getElementById('pswp'), PhotoSwipeUI_Default, items, options);
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
	};

	const createEventListenerFor = (className) => (event) => {
		event.preventDefault();
		event.stopPropagation();

		const galleryOptions = {
			...defaultGalleryOptions,
			index: 0,
			addCaptionHTMLFn(item, captionEl) {
				captionEl.children[0].innerHTML = `${ escapeHTML(item.title) }<br/><small>${ escapeHTML(item.description) }</small>`;
				return true;
			},
		};

		const items = Array.from(document.querySelectorAll(className))
			.map((element, i) => {
				if (element === event.currentTarget) {
					galleryOptions.index = i;
				}

				if (element.dataset.src || element.href) {
					const img = new Image();

					img.addEventListener('load', () => {
						if (!currentGallery) {
							return;
						}

						delete currentGallery.items[i].html;
						currentGallery.items[i].src = img.src;
						currentGallery.items[i].w = img.naturalWidth;
						currentGallery.items[i].h = img.naturalHeight;
						currentGallery.invalidateCurrItems();
						currentGallery.updateSize(true);
					});

					img.src = element.dataset.src || element.href;

					return {
						html: '',
						title: element.dataset.title || element.title,
						description: element.dataset.description,
					};
				}

				return {
					src: element.src,
					w: element.naturalWidth,
					h: element.naturalHeight,
					title: element.dataset.title || element.title,
					description: element.dataset.description,
				};
			});

		initGallery(items, galleryOptions);
	};

	$(document).on('click', '.gallery-item', createEventListenerFor('.gallery-item'));
});
