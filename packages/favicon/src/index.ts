import type { Badge } from './badge';
import { drawBadge } from './badge';

const getFavicons = () => {
	const favicons = Array.from(document.head.getElementsByTagName('link')).filter((link) =>
		/(^|\s)icon(\s|$)/i.test(link.getAttribute('rel') ?? ''),
	);

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

const fetchFaviconImage = async (url: string | undefined) => {
	const img = new Image();

	if (url) {
		img.crossOrigin = 'anonymous';
		img.src = url;
	} else {
		img.src = '';
		img.width = 32;
		img.height = 32;
	}

	return new Promise<HTMLImageElement>((resolve, reject) => {
		img.onload = () => {
			resolve(img);
		};
		img.onerror = () => {
			reject(new Error('Failed to load image'));
		};
	});
};

const renderAndUpdate = ({
	badge,
	canvas,
	favicons,
	context,
	img,
}: {
	badge: Badge;
	canvas: HTMLCanvasElement;
	favicons: HTMLLinkElement[];
	context: CanvasRenderingContext2D;
	img: HTMLImageElement;
}) => {
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

export const manageFavicon = () => {
	let pendingBadge: Badge;

	let updateOrCollect = (badge: Badge) => {
		pendingBadge = badge;
	};

	const init = async () => {
		const favicons = getFavicons();
		const lastFavicon = favicons[favicons.length - 1];
		const faviconURL = lastFavicon.getAttribute('href') ?? undefined;
		const img = await fetchFaviconImage(faviconURL);
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
	};

	init();

	return (badge: Badge) => {
		updateOrCollect(badge);
	};
};
