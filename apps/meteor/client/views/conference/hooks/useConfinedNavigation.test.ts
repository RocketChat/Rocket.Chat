import { afterEach, beforeEach, describe, it } from 'node:test';

import { renderHook, act } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock, MockInstance } from 'jest-mock';
import proxyquire from 'proxyquire';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);

const mockRouter: {
	navigate: Mock<FunctionLike>;
	buildRoutePath: Mock<FunctionLike>;
} = {
	navigate: fn<FunctionLike>(),
	buildRoutePath: fn<FunctionLike>((to) => (typeof to === 'string' ? to : (to?.pathname ?? '/'))),
};

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

const { useConfinedNavigation } = proxyquire.noCallThru().load<typeof import('./useConfinedNavigation')>('./useConfinedNavigation', {
	'@rocket.chat/ui-contexts': {
		...require('@rocket.chat/ui-contexts'),
		useRouter: fn<FunctionLike>(() => mockRouter),
	},
});

describe('useConfinedNavigation', () => {
	let openSpy: MockInstance<FunctionLike>;

	beforeEach(() => {
		mocker.clearAllMocks();
		// Pin the conference window location so origin/pathname comparisons are stable.
		window.history.replaceState({}, '', CONFERENCE_PATH);

		mockRouter.navigate = fn<FunctionLike>();
		mockRouter.buildRoutePath = fn<FunctionLike>((to) => (typeof to === 'string' ? to : (to?.pathname ?? '/')));

		openSpy = spyOn(window, 'open').mockReturnValue(null);
	});

	afterEach(() => {
		openSpy.mockRestore();
		document.body.innerHTML = '';
		window.history.replaceState({}, '', '/');
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

		(
			[
				['a same-path link that only changes the hash', `${CONFERENCE_PATH}#hash`, {}, {}],
				['a same-path link that only changes the query', `${CONFERENCE_PATH}?jump=x`, {}, {}],
				['a link to another conference', '/conference/other', {}, {}],
				['a modifier-key click', '/channel/general', {}, { metaKey: true }],
				['a non-primary button click', '/channel/general', {}, { button: 1 }],
				['an anchor asking for a new tab', '/channel/general', { target: '_blank' }, {}],
				['an anchor asking for a download', '/channel/general', { download: '' }, {}],
				['a mailto: anchor', 'mailto:someone@example.com', {}, {}],
				['a tel: anchor', 'tel:+15551234567', {}, {}],
			] as const
		).forEach(([_case, href, attrs, clickInit]) => {
			it(`leaves ${_case} alone`, () => {
				renderHook(() => useConfinedNavigation());

				const event = clickAnchor(createAnchor(href as string, attrs as Record<string, string>), clickInit as MouseEventInit);

				expect(event.defaultPrevented).toBe(false);
				expect(openSpy).not.toHaveBeenCalled();
			});
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

		(
			[
				['the same path', CONFERENCE_PATH],
				['the conference this window is becoming', '/conference/the-new-call'],
			] as const
		).forEach(([_case, path]) => {
			it(`allows navigation to ${_case} through to the original navigate`, () => {
				const original = mockRouter.navigate;
				mockRouter.buildRoutePath.mockReturnValue(path);

				renderHook(() => useConfinedNavigation());

				act(() => {
					mockRouter.navigate(path as any);
				});

				expect(original).toHaveBeenCalled();
				expect(openSpy).not.toHaveBeenCalled();
			});
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
