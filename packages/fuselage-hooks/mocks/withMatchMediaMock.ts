import { match } from 'css-mediaquery';

type Viewport = {
	'type'?: 'screen' | 'print';
	'width'?: number;
	'prefers-color-scheme'?: 'light' | 'dark' | 'no-preference';
	'prefers-reduced-data'?: 'reduce' | 'no-preference';
	'prefers-reduced-motion'?: 'reduce' | 'no-preference';
};

type ChangeListener = (ev: MediaQueryListEvent) => void;

export const withMatchMediaMock = () => {
	let viewport: Viewport = {
		'type': 'screen',
		'width': 1024,
		'prefers-color-scheme': 'no-preference',
		'prefers-reduced-data': 'no-preference',
		'prefers-reduced-motion': 'no-preference',
	};

	const mediaQueryLists = new Set<MediaQueryListMock>();

	class MediaQueryListMock {
		private _media: string;

		private _onchange: ChangeListener | null = null;

		private changeEventListeners: Set<ChangeListener>;

		constructor(media: string) {
			this._media = media;
			this.changeEventListeners = new Set<ChangeListener>([
				(ev) => {
					this._onchange?.call(this, ev);
				},
			]);
		}

		get matches() {
			return match(this._media, viewport);
		}

		get media() {
			return this._media;
		}

		addEventListener(type: string, fn: ChangeListener) {
			if (type !== 'change') {
				return;
			}

			this.changeEventListeners.add(fn);
			mediaQueryLists.add(this);
		}

		removeEventListener(type: string, fn: ChangeListener) {
			if (type !== 'change') {
				return;
			}

			this.changeEventListeners.delete(fn);
			mediaQueryLists.delete(this);
		}

		get onchange() {
			return this._onchange;
		}

		set onchange(fn) {
			this._onchange = fn;
		}

		addListener(fn: ChangeListener) {
			this.addEventListener('change', fn);
		}

		removeListener(fn: ChangeListener) {
			this.removeEventListener('change', fn);
		}

		dispatchEvent(ev: MediaQueryListEvent) {
			this._media = ev.media;
			this.changeEventListeners.forEach((changeEventListener) => {
				changeEventListener(ev);
			});
			return true;
		}
	}

	const matchMediaMock = jest.fn((media: string) => {
		const mql = new MediaQueryListMock(media);
		jest.spyOn(mql, 'addEventListener');
		jest.spyOn(mql, 'removeEventListener');
		return mql as unknown as MediaQueryList;
	});

	const setViewport = (_viewport: Viewport) => {
		viewport = {
			...viewport,
			..._viewport,
		};

		mediaQueryLists.forEach((mediaQueryList) => {
			const event = Object.assign(new Event('change'), {
				matches: mediaQueryList.matches,
				media: mediaQueryList.media,
			}) as MediaQueryListEvent;
			mediaQueryList.dispatchEvent(event);
		});
	};

	beforeAll(() => {
		window.matchMedia = matchMediaMock;
	});

	beforeEach(() => {
		setViewport({
			type: 'screen',
			width: 1024,
		});
	});

	afterEach(() => {
		matchMediaMock.mockClear();
	});

	return setViewport;
};
