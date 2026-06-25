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

describe('useConfinedNavigation', () => {
	let openSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		// Pin the conference window location so origin/pathname comparisons are stable.
		window.history.replaceState({}, '', CONFERENCE_PATH);

		mockRouter.navigate = jest.fn();
		mockRouter.buildRoutePath = jest.fn((to) => (typeof to === 'string' ? to : (to?.pathname ?? '/')));

		openSpy = jest.spyOn(window, 'open').mockReturnValue(null);

		delete (window as any).opener;
		delete (window as any).videoCallWindow;
	});

	afterEach(() => {
		openSpy.mockRestore();
		document.body.innerHTML = '';
		delete (window as any).opener;
		delete (window as any).videoCallWindow;
	});

	describe('anchor click interception', () => {
		it('intercepts a same-origin different-path link and routes via the desktop bridge', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general');
			const event = clickAnchor(anchor);

			expect(event.defaultPrevented).toBe(true);
			expect(openInMainWindow).toHaveBeenCalledWith('/channel/general');
		});

		it('does not intercept a same-origin same-path link (hash change)', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor(`${CONFERENCE_PATH}#hash`);
			const event = clickAnchor(anchor);

			expect(event.defaultPrevented).toBe(false);
			expect(openInMainWindow).not.toHaveBeenCalled();
		});

		it('does not intercept a same-origin same-path link (query change)', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor(`${CONFERENCE_PATH}?jump=x`);
			const event = clickAnchor(anchor);

			expect(event.defaultPrevented).toBe(false);
			expect(openInMainWindow).not.toHaveBeenCalled();
		});

		it('intercepts a cross-origin link via a noopener new tab, not the bridge', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('https://evil.example/x');
			const event = clickAnchor(anchor);

			expect(event.defaultPrevented).toBe(true);
			expect(openInMainWindow).not.toHaveBeenCalled();
			expect(openSpy).toHaveBeenCalledWith('https://evil.example/x', '_blank', 'noopener');
		});

		it('ignores modifier-key clicks', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general');
			const event = clickAnchor(anchor, { metaKey: true });

			expect(event.defaultPrevented).toBe(false);
			expect(openInMainWindow).not.toHaveBeenCalled();
		});

		it('ignores non-primary button clicks', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general');
			const event = clickAnchor(anchor, { button: 1 });

			expect(event.defaultPrevented).toBe(false);
			expect(openInMainWindow).not.toHaveBeenCalled();
		});

		it('ignores anchors with target="_blank"', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general', { target: '_blank' });
			const event = clickAnchor(anchor);

			expect(event.defaultPrevented).toBe(false);
			expect(openInMainWindow).not.toHaveBeenCalled();
		});

		it('ignores anchors with a download attribute', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general', { download: '' });
			const event = clickAnchor(anchor);

			expect(event.defaultPrevented).toBe(false);
			expect(openInMainWindow).not.toHaveBeenCalled();
		});

		it('ignores non-http protocol anchors (mailto/tel)', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };

			renderHook(() => useConfinedNavigation());

			const mailto = createAnchor('mailto:someone@example.com');
			const mailtoEvent = clickAnchor(mailto);

			const tel = createAnchor('tel:+15551234567');
			const telEvent = clickAnchor(tel);

			expect(mailtoEvent.defaultPrevented).toBe(false);
			expect(telEvent.defaultPrevented).toBe(false);
			expect(openInMainWindow).not.toHaveBeenCalled();
		});
	});

	describe('openInOpenerOrTab strategy order', () => {
		it('uses the desktop bridge for internal nav without touching opener or window.open', () => {
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };
			(window as any).opener = { closed: false, name: '', focus: jest.fn() };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general');
			clickAnchor(anchor);

			expect(openInMainWindow).toHaveBeenCalledWith('/channel/general');
			expect(openSpy).not.toHaveBeenCalled();
		});

		it('reuses the opener window by name and focuses it when no bridge is present', () => {
			const focus = jest.fn();
			openSpy.mockReturnValue({ focus } as any);
			(window as any).opener = { closed: false, name: 'rocketchat-main', focus: jest.fn() };

			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general');
			clickAnchor(anchor);

			const expectedHref = new URL('/channel/general', window.location.href).href;
			expect(openSpy).toHaveBeenCalledWith(expectedHref, 'rocketchat-main');
			expect(focus).toHaveBeenCalled();
		});

		it('falls back to a noopener new tab when neither bridge nor opener is available', () => {
			renderHook(() => useConfinedNavigation());

			const anchor = createAnchor('/channel/general');
			clickAnchor(anchor);

			const expectedHref = new URL('/channel/general', window.location.href).href;
			expect(openSpy).toHaveBeenCalledWith(expectedHref, '_blank', 'noopener');
		});
	});

	describe('router.navigate patching', () => {
		it('replaces router.navigate with a wrapper on mount', () => {
			const original = mockRouter.navigate;

			renderHook(() => useConfinedNavigation());

			expect(mockRouter.navigate).not.toBe(original);
		});

		it('routes patched programmatic navigation via openInOpenerOrTab without calling the original', () => {
			const original = mockRouter.navigate;
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };
			mockRouter.buildRoutePath.mockReturnValue('/channel/x');

			renderHook(() => useConfinedNavigation());

			act(() => {
				mockRouter.navigate('/channel/x' as any);
			});

			expect(openInMainWindow).toHaveBeenCalledWith('/channel/x');
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

		it('allows same-pathname navigation through to the original navigate', () => {
			const original = mockRouter.navigate;
			const openInMainWindow = jest.fn();
			(window as any).videoCallWindow = { openInMainWindow };
			mockRouter.buildRoutePath.mockReturnValue(CONFERENCE_PATH);

			renderHook(() => useConfinedNavigation());

			act(() => {
				mockRouter.navigate(CONFERENCE_PATH as any);
			});

			expect(original).toHaveBeenCalled();
			expect(openInMainWindow).not.toHaveBeenCalled();
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
