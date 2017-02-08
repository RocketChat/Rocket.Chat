import PhotoSwipe from 'photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';
import 'photoswipe/dist/photoswipe.css';

Meteor.startup(() => {
	const initGallery = (selector, items, options) => {
		const gallery = new PhotoSwipe(selector, PhotoSwipeUI_Default, items, options);
		gallery.init();
	};

	const getItems = (selector, imageSrc) => {
		const results = {
			index: 0,
			items: []
		};

		for (let i = 0, len = selector.length; i < len; i++) {
			results.items.push({
				src: selector[i].src,
				w: selector[i].naturalWidth,
				h: selector[i].naturalHeight,
				title: selector[i].dataset.title,
				description: selector[i].dataset.description
			});

			if (imageSrc === selector[i].src) {
				results.index = i;
			}
		}

		return results;
	};

	const galleryOptions = {
		index: 0,
		bgOpacity: 0.8,
		showHideOpacity: true,
		counterEl: false,
		shareEl: false
	};

	$(document).on('click', '.gallery-item', function() {
		const images = getItems(document.querySelectorAll('.gallery-item'), $(this)[0].src);

		galleryOptions.index = images.index;
		galleryOptions.addCaptionHTMLFn = function(item, captionEl) {
			captionEl.children[0].innerHTML = `${item.title}<br/><small>${item.description}</small> `;
			return true;
		};

		initGallery(document.getElementById('pswp'), images.items, galleryOptions);
	});

	$(document).on('click', '.room-files-image', (e) => {
		e.preventDefault();
		e.stopPropagation();

		const img = new Image();
		img.src = e.currentTarget.href;
		img.addEventListener('load', function() {
			const item = [{
				src: this.src,
				w: this.naturalWidth,
				h: this.naturalHeight
			}];

			initGallery(document.getElementById('pswp'), item, galleryOptions);
		});
	});
});
