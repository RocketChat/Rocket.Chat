import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import type PhotoSwipe from 'photoswipe';
import PhotoSwipeUIDefault from 'photoswipe/dist/photoswipe-ui-default';

import { createAnchor } from '../../../../../client/lib/utils/createAnchor';

const parseLength = (x: unknown): number | undefined => {
	const length = typeof x === 'string' ? parseInt(x, 10) : undefined;
	return Number.isFinite(length) ? length : undefined;
};

const getImageSize = (src: string): Promise<[w: number, h: number]> =>
	new Promise((resolve, reject) => {
		const img = new Image();

		img.addEventListener('load', () => {
			resolve([img.naturalWidth, img.naturalHeight]);
		});

		img.addEventListener('error', (error) => {
			reject(error.error);
		});

		img.src = src;
	});

type Slide = PhotoSwipe.Item & { description?: string; title?: string };

const fromElementToSlide = async (element: Element): Promise<Slide | null> => {
	if (!(element instanceof HTMLElement)) {
		return null;
	}

	const title = element.dataset.title || element.title;
	const { description } = element.dataset;

	if (element instanceof HTMLAnchorElement) {
		const src = element.dataset.src || element.href;
		let w = parseLength(element.dataset.width);
		let h = parseLength(element.dataset.height);

		if (w === undefined || h === undefined) {
			[w, h] = await getImageSize(src);
		}

		return { src, w, h, title, description };
	}

	if (element instanceof HTMLImageElement) {
		let msrc: string | undefined;
		let { src } = element;
		let w: number | undefined = element.naturalWidth;
		let h: number | undefined = element.naturalHeight;

		if (element.dataset.src) {
			msrc = element.src;
			src = element.dataset.src;
			w = parseLength(element.dataset.width);
			h = parseLength(element.dataset.height);

			if (w === undefined || h === undefined) {
				[w, h] = await getImageSize(src);
			}
		}

		return { msrc, src, w, h, title, description };
	}

	return null;
};

let currentGallery: PhotoSwipe<PhotoSwipe.Options> | null = null;

const initGallery = async (items: Slide[], options: PhotoSwipe.Options): Promise<void> => {
	const anchor = createAnchor('photoswipe-root');

	anchor.innerHTML = `<div class="pswp" id="pswp" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="pswp__bg"></div>
	<div class="pswp__scroll-wrap">
		<div class="pswp__container">
			<div class="pswp__item"></div>
			<div class="pswp__item"></div>
			<div class="pswp__item"></div>
		</div>

		<div class="pswp__ui pswp__ui--hidden">
			<div class="pswp__top-bar">

				<button class="pswp__button pswp__button--close" title="Close (Esc)"></button>
				<button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
				<button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>

				<div class="pswp__preloader">
					<div class="pswp__preloader__icn">
					<div class="pswp__preloader__cut">
						<div class="pswp__preloader__donut"></div>
					</div>
					</div>
				</div>
			</div>

			<button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>

			<button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>

			<div class="pswp__caption">
				<div class="pswp__caption__center"></div>
			</div>
		</div>
	</div>
</div>`;
	const [{ default: PhotoSwipe }] = await Promise.all([import('photoswipe'), import('photoswipe/dist/photoswipe.css')]);

	if (!currentGallery) {
		const container = document.getElementById('pswp');

		if (!container) {
			throw new Error('Photoswipe container element not found');
		}

		currentGallery = new PhotoSwipe(container, PhotoSwipeUIDefault, items, options);

		currentGallery.listen('destroy', () => {
			anchor.innerHTML = '';
			currentGallery = null;
		});

		currentGallery.init();
	}
};

const defaultGalleryOptions = {
	bgOpacity: 0.7,
	counterEl: false,
	index: 0,
	wheelToZoom: true,
	padding: { top: 20, bottom: 40, left: 100, right: 100 },
	addCaptionHTMLFn(item: Slide, captionEl: HTMLElement): boolean {
		captionEl.children[0].innerHTML = `
			${escapeHTML(item.title ?? '')}<br/>
			<small>${escapeHTML(item.description ?? '')}</small>
		`;
		return true;
	},
};

const createEventListenerFor =
	(className: string) =>
	(event: Event): void => {
		event.preventDefault();
		event.stopPropagation();

		const { currentTarget } = event;

		const galleryItems = Array.from(document.querySelectorAll(className));

		const sortedElements = galleryItems.sort((a, b) => {
			if (a === currentTarget) {
				return -1;
			}

			if (b === currentTarget) {
				return 1;
			}

			return 0;
		});

		const slidePromises = sortedElements.map((element) => fromElementToSlide(element));

		let hasOpenedGallery = false;

		void slidePromises.reduce(
			(p, curr) =>
				p
					.then(() => curr)
					.then(async (slide) => {
						if (!slide) {
							return;
						}

						if (!currentGallery) {
							// If the gallery doesn't exist and has been opened this run the user closed it before all promises ran.
							// This means it shouldn't be opened again.
							if (hasOpenedGallery) {
								return;
							}
							hasOpenedGallery = true;
							return initGallery([slide], defaultGalleryOptions);
						}

						currentGallery.items.push(slide);
						currentGallery.invalidateCurrItems();
						currentGallery.updateSize(true);
					}),
			Promise.resolve(),
		);
	};

Meteor.startup(() => {
	$(document).on('click', '.gallery-item', createEventListenerFor('.gallery-item'));
});
