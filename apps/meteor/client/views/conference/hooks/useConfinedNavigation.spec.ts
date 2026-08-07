import { renderHook, act } from '@testing-library/react';

import { useConfinedNavigation } from './useConfinedNavigation';

const mockRouter: {
	navigate: jest.Mock;
	buildRoutePath: jest.Mock;
} = {
	navigate: jest.fn(),
	buildRoutePath: jest.fn((to) => (typeof to === 'string' ? to : (to?.pathname ?? '/'))),
};

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: jest.fn(() => mockRouter),
}));

const CONFERENCE_PATH = '/conference/abc';

const createAnchor = (href: string, attrs: Record<string, string> = {}): HTMLAnchorElement => {
	const anchor = document.createElement('a');
	anchor.setAttribute('href', href);
	for (const [key, value] of Object.entries(attrs)) {
		anchor.setAttribute(key, value);
	}
	document.body.appendChild(anchor);
	return anchor;
};

const clickAnchor = (anchor: HTMLAnchorElement, init: MouseEventInit = {}): MouseEvent => {
	const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
	act(() => {
		anchor.dispatchEvent(event);
	});
	return event;
};

const tabFor = (path: string) => [new URL(path, window.location.href).href, '_blank', 'noopener'] as const;

describe('useConfinedNavigation', () => {
	let openSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		// Pin the conference window location so origin/pathname comparisons are stable.
		window.history.replaceState({}, '', CONFERENCE_PATH);

		mockRouter.navigate = jest.fn();
		mockRouter.buildRoutePath = jest.fn((to) => (typeof to === 'string' ? to : (to?.pathname ?? '/')));

		openSpy = jest.spyOn(window, 'open').mockReturnValue(null);
	});

	afterEach(() => {
		openSpy.mockRestore();
		document.body.innerHTML = '';
	});

	describe('anchor click interception', () => {
		it('sends a link that would leave the call to a new tab', () => {
			renderHook(() => useConfinedNavigation());

			const event = clickAnchor(createAnchor('/channel/general'));

			expect(event.defaultPrevented).toBe(true);
			expect(openSpy).toHaveBeenCalledWith(...tabFor('/channel/general'));
		});

		it('sends a cross-origin link to a new tab too', () => {
			renderHook(() => useConfinedNavigation());

			const event = clickAnchor(createAnchor('https://evil.example/x'));

			expect(event.defaultPrevented).toBe(true);
			expect(openSpy).toHaveBeenCalledWith('https://evil.example/x', '_blank', 'noopener');
		});

		/**
		 * Everything a plain in-app link is *not*. Each of these is either the user asking for a different
		 * destination (a new tab, a download, a modifier click) or not a navigation at all (a hash, a query, a
		 * `mailto:`) — so the click has to be left exactly as it was found.
		 */
		it.each([
			['a same-path link that only changes the hash', `${CONFERENCE_PATH}#hash`, {}, {}],
			['a same-path link that only changes the query', `${CONFERENCE_PATH}?jump=x`, {}, {}],
			['a link to another conference', '/conference/other', {}, {}],
			['a modifier-key click', '/channel/general', {}, { metaKey: true }],
			['a non-primary button click', '/channel/general', {}, { button: 1 }],
			['an anchor asking for a new tab', '/channel/general', { target: '_blank' }, {}],
			['an anchor asking for a download', '/channel/general', { download: '' }, {}],
			['a mailto: anchor', 'mailto:someone@example.com', {}, {}],
			['a tel: anchor', 'tel:+15551234567', {}, {}],
		])('leaves %s alone', (_case, href, attrs, clickInit) => {
			renderHook(() => useConfinedNavigation());

			const event = clickAnchor(createAnchor(href as string, attrs as Record<string, string>), clickInit as MouseEventInit);

			expect(event.defaultPrevented).toBe(false);
			expect(openSpy).not.toHaveBeenCalled();
		});
	});

	describe('router.navigate patching', () => {
		it('sends a programmatic navigation away from the call to a new tab, not through the router', () => {
			const original = mockRouter.navigate;
			mockRouter.buildRoutePath.mockReturnValue('/channel/x');

			renderHook(() => useConfinedNavigation());

			act(() => {
				mockRouter.navigate('/channel/x' as any);
			});

			expect(openSpy).toHaveBeenCalledWith(...tabFor('/channel/x'));
			expect(original).not.toHaveBeenCalled();
		});

		it('passes through a numeric delta to the original navigate', () => {
			const original = mockRouter.navigate;

			renderHook(() => useConfinedNavigation());

			act(() => {
				mockRouter.navigate(-1 as any);
			});

			expect(original).toHaveBeenCalledWith(-1);
		});

		// The window is *becoming* a conference when it starts one: it opens on `/conference/new` and moves to
		// `/conference/:callId` the moment the call exists. Sending that move away would leave the preflight
		// sitting on a call that had already started, in a window that was not the call's.
		it.each([
			['the same path', CONFERENCE_PATH],
			['the conference this window is becoming', '/conference/the-new-call'],
		])('allows navigation to %s through to the original navigate', (_case, path) => {
			const original = mockRouter.navigate;
			mockRouter.buildRoutePath.mockReturnValue(path);

			renderHook(() => useConfinedNavigation());

			act(() => {
				mockRouter.navigate(path as any);
			});

			expect(original).toHaveBeenCalled();
			expect(openSpy).not.toHaveBeenCalled();
		});

		it('restores the original navigate on unmount', () => {
			const original = mockRouter.navigate;

			const { unmount } = renderHook(() => useConfinedNavigation());
			expect(mockRouter.navigate).not.toBe(original);

			unmount();

			expect(mockRouter.navigate).toBe(original);
		});

		it('does not double-wrap on a second mount and leaves navigate clean after both unmount', () => {
			const original = mockRouter.navigate;

			const first = renderHook(() => useConfinedNavigation());
			const firstWrapper = mockRouter.navigate;
			expect(firstWrapper).not.toBe(original);

			const second = renderHook(() => useConfinedNavigation());
			// Second mount sees an already-wrapped navigate (_confined) and leaves it untouched.
			expect(mockRouter.navigate).toBe(firstWrapper);

			second.unmount();
			first.unmount();

			expect(mockRouter.navigate).toBe(original);
		});
	});
});
