import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type PhotoSwipe from 'photoswipe';
import PhotoSwipeUIDefault from 'photoswipe/dist/photoswipe-ui-default';

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
	const [{ default: PhotoSwipe }] = await Promise.all([
		import('photoswipe'),
		import('photoswipe/dist/photoswipe.css'),
		import('./photoswipeContent.html'),
	]);

	Blaze.render(Template.photoswipeContent, document.body);

	if (!currentGallery) {
		const container = document.getElementById('pswp');

		if (!container) {
			throw new Error('Photoswipe container element not found');
		}

		currentGallery = new PhotoSwipe(container, PhotoSwipeUIDefault, items, options);

		currentGallery.listen('destroy', () => {
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
	(event: JQuery.ClickEvent): void => {
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
			.reduce(
				(p, curr) =>
					p
						.then(() => curr)
						.then(async (slide) => {
							if (!slide) {
								return;
							}

							if (!currentGallery) {
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
