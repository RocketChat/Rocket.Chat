import PhotoSwipe from 'photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';
import 'photoswipe/dist/photoswipe.css';

Meteor.startup(function() {
	const getItems = (imageSrc) => {
		const selector = document.querySelectorAll('.gallery-item');
		let results = {
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

	$(document).on('click', '.gallery-item', function() {
		const pswp = document.getElementById('pswp');
		const images = getItems($(this)[0].src);

		const options = {
			index: images.index,
			bgOpacity: 0.8,
			showHideOpacity: true,
			counterEl: false,
			shareEl: false,
			addCaptionHTMLFn: function(item, captionEl) {
				if (!item.title) {
					captionEl.children[0].innerText = '';
					return false;
				}

				captionEl.children[0].innerHTML = `${item.title}<br/><small>${item.description}</small> `;
				return true;
			}
		};

		const gallery = new PhotoSwipe(pswp, PhotoSwipeUI_Default, images.items, options);
		gallery.init();
	});
});
