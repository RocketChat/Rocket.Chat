import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { escapeHTML } from '@rocket.chat/string-helpers';

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

			// currentGallery.listen('imageLoadComplete', function(index, item) {
			// 	if (item.h < 1 || item.w < 1) {
			//   const img = new Image();
			// 	  img.onload = () => {
			// 		item.w = img.width;
			// 		item.h = img.height;
			// 		gallery.invalidateCurrItems();
			// 		gallery.updateSize(true);
			// 	  }
			// 	  img.src = item.src;
			// 	}
			// });
			currentGallery.init();
		}
	};

	const defaultGalleryOptions = {
		bgOpacity: 0.7,
		// showHideOpacity: true,
		// counterEl: false,
		// shareEl: false,
		scaleMode: 'fit',
		// clickToCloseNonZoomable: false,
		hideAnimationDuration: 0,
		showAnimationDuration: 0,
	};

	const createEventListenerFor = (className) => async (event) => {
		if (typeof event.currentTarget.getAttribute('download') === 'string') {
			return;
		}

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

		const items = await Promise.all(Array.from(document.querySelectorAll(className))
			.map((element, i) => {
				if (element === event.currentTarget) {
					galleryOptions.index = i;
				}

				const item = {
					src: element.dataset.src || element.src || element.href,
					w: element.dataset.width || element.naturalWidth,
					h: element.dataset.height || element.naturalHeight,
					title: element.dataset.title || element.title,
					description: element.dataset.description,
				};

				return item;
			}));
		console.log(items, galleryOptions);

		initGallery(items, galleryOptions);
	};

	$(document).on('click', '.gallery-item', createEventListenerFor('.gallery-item'));
});
