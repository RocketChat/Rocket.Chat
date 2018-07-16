import PhotoSwipe from 'photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';
import 'photoswipe/dist/photoswipe.css';
import s from 'underscore.string';

Meteor.startup(() => {

	let currentGallery = null;
	const initGallery = (items, options) => {
		if (!currentGallery) {
			currentGallery = new PhotoSwipe(document.getElementById('pswp'), PhotoSwipeUI_Default, items, options);
			currentGallery.listen('destroy', () => {
				currentGallery = null;
			});
			currentGallery.init();
		}
	};

	const defaultGalleryOptions = {
		bgOpacity: 0.8,
		showHideOpacity: true,
		counterEl: false,
		shareEl: false
	};

	$(document).on('click', '.gallery-item', event => {
		event.preventDefault();
		event.stopPropagation();

		if (currentGallery) {
			return;
		}

		const items = Array.from(document.querySelectorAll('.gallery-item'))
			.map(img => ({
				msrc: img.dataset.src && img.src,
				src: img.dataset.src || img.src,
				w: img.naturalWidth,
				h: img.naturalHeight,
				title: img.dataset.title,
				description: img.dataset.description
			}));

		const galleryOptions = {
			...defaultGalleryOptions,
			index: items.findIndex(item => item.src === (event.target.dataset.src || event.target.src)),
			addCaptionHTMLFn(item, captionEl) {
				captionEl.children[0].innerHTML =
					`${ s.escapeHTML(item.title) }<br/><small>${ s.escapeHTML(item.description) }</small> `;
				return true;
			}
		};

		initGallery(items, galleryOptions);
	});

	$(document).on('click', '.room-files-image', event => {
		event.preventDefault();
		event.stopPropagation();

		if (currentGallery) {
			return;
		}

		const galleryOptions = {
			...defaultGalleryOptions,
			index: 0
		};

		const img = new Image();
		img.src = event.currentTarget.href;
		img.addEventListener('load', () => {
			const item = {
				msrc: null,
				src: img.src,
				w: img.naturalWidth,
				h: img.naturalHeight
			};

			initGallery([ item ], galleryOptions);
		});
	});

});
