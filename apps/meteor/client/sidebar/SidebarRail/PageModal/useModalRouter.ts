import type { RouteName, RouteParameters, RouterContextValue, SearchParameters, To } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useRef } from 'react';

export type ModalLocation = { params: RouteParameters; search: SearchParameters };

type NavigateOptions = { replace?: boolean; state?: unknown; relative?: 'route' | 'path' };

/** Reads the params of a path like `/directory/channels` against a pattern like `/directory/:tab?`. */
export const matchPattern = (pattern: string, pathname: string): RouteParameters | undefined => {
	const patternSegments = pattern.split('/').filter(Boolean);
	const pathSegments = pathname.split('?')[0].split('/').filter(Boolean);

	if (pathSegments.length > patternSegments.length) {
		return undefined;
	}

	const params: RouteParameters = {};

	for (const [index, segment] of patternSegments.entries()) {
		const value = pathSegments[index];

		if (!segment.startsWith(':')) {
			if (value !== segment) {
				return undefined;
			}
			continue;
		}

		if (value === undefined) {
			if (!segment.endsWith('?')) {
				return undefined;
			}
			continue;
		}

		params[segment.replace(/^:|\?$/g, '')] = decodeURIComponent(value);
	}

	return params;
};

/**
 * A router for a page shown in a modal. The page keeps navigating between its own tabs and panels as it does on its
 * route, but those changes stay in the modal and leave the address bar, the open page and the rail as they are.
 *
 * Navigating anywhere else, such as opening a room, closes the modal and goes through the app's router. So does any
 * route change made outside the page's router while the modal is open.
 */
export const useModalRouter = ({
	routeName,
	pattern,
	location,
	onClose,
}: {
	routeName: RouteName;
	pattern: string;
	/** Kept by the caller, so the page comes back where it was when the modal is shown again after a dialog on top. */
	location: { current: ModalLocation };
	onClose: () => void;
}): RouterContextValue => {
	const router = useRouter();
	const listeners = useRef(new Set<() => void>());
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	// The app's router also notifies on every new subscription, so only a different address counts as navigating away.
	useEffect(() => {
		const openedAt = router.getLocationPathname();

		return router.subscribeToRouteChange(() => {
			if (router.getLocationPathname() !== openedAt) {
				onCloseRef.current();
			}
		});
	}, [router]);

	return useMemo<RouterContextValue>(() => {
		const setLocation = (next: ModalLocation) => {
			location.current = next;
			listeners.current.forEach((listener) => listener());
		};

		const resolve = (to: To): ModalLocation | undefined => {
			if (typeof to === 'object' && 'name' in to) {
				return to.name === routeName ? { params: to.params ?? {}, search: to.search ?? {} } : undefined;
			}

			if (typeof to === 'object' && 'pattern' in to && to.pattern === pattern) {
				return { params: to.params ?? {}, search: to.search ?? {} };
			}

			const pathname = typeof to === 'string' ? to : router.buildRoutePath(to);
			const params = matchPattern(pattern, pathname);

			return params && { params, search: typeof to === 'object' && 'search' in to ? (to.search ?? {}) : {} };
		};

		const navigate = ((to: To | number, options?: NavigateOptions) => {
			const next = typeof to === 'number' ? undefined : resolve(to);

			if (next) {
				setLocation(next);
				return;
			}

			onCloseRef.current();

			router.navigate(to as any, options);
		}) as RouterContextValue['navigate'];

		return {
			...router,
			subscribeToRouteChange: (onRouteChange) => {
				listeners.current.add(onRouteChange);
				return () => listeners.current.delete(onRouteChange);
			},
			getRouteName: () => routeName,
			getRouteParameters: () => location.current.params,
			getSearchParameters: () => location.current.search,
			getLocationPathname: () =>
				router.buildRoutePath({ name: routeName, params: location.current.params }) as ReturnType<
					RouterContextValue['getLocationPathname']
				>,
			getLocationSearch: () => new URLSearchParams(location.current.search).toString(),
			getLocationHash: () => '',
			navigate,
		};
	}, [router, routeName, pattern, location]);
};
