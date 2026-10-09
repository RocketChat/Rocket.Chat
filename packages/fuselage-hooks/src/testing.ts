import type { queries, Queries, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { renderHook as _renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

type RendererableContainer = Element | Document | DocumentFragment;

export function renderHook<
	Result,
	Props,
	Q extends Queries = typeof queries,
	Container extends RendererableContainer = HTMLElement,
	BaseElement extends RendererableContainer = Container,
>(render: (initialProps: Props) => Result, options?: RenderHookOptions<Props, Q, Container, BaseElement>): RenderHookResult<Result, Props> {
	if (typeof document === 'undefined') {
		let current: Result;
		const TestComponent = () => {
			current = render(options?.initialProps as any);
			return null;
		};

		renderToString(createElement(TestComponent));

		return {
			result: { current: current! },
			rerender: () => undefined,
			unmount: () => undefined,
		};
	}

	return _renderHook(render, options);
}

export { act } from '@testing-library/react';
