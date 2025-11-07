import type { Badge } from './badge';
import { FaviconProcessor } from './favicon';

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

const getFaviconsWithSize = () => {
	const favicons = getFavicons();
	return favicons.map((favicon) => {
		const size = getFaviconSize(favicon);
		return [favicon, ...size] as const;
	});
};

const getFaviconSize = (favicon: HTMLLinkElement): [number, number] => {
	const sizes = favicon.getAttribute('sizes');

	if (!sizes || sizes === 'any') {
		return [32, 32];
	}

	return sizes?.split(/x/i).filter(Boolean).map(Number) as [number, number];
};

export const manageFavicon = () => {
	let pendingBadge: Badge;

	let updateOrCollect = (badge: Badge) => {
		pendingBadge = badge;
	};

	const init = async () => {
		const favicons = getFaviconsWithSize();
		const [lastFavicon] = favicons[favicons.length - 1];

		const faviconProcessor = new FaviconProcessor(lastFavicon);

		try {
			await faviconProcessor.init();
		} catch (e) {
			console.warn('Unable to initialize favicon processor', e);
		}

		updateOrCollect = (badge) => {
			try {
				for (const [favicon, width, height] of favicons) {
					const url = faviconProcessor.toDataURL(badge, width, height);
					favicon.setAttribute('href', url);
				}
			} catch (e) {
				console.warn('Unable to update favicon with unread badge', e);
			}
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
