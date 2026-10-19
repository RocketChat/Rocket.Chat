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

		const Wrapper = options?.wrapper;
		renderToString(Wrapper ? createElement(Wrapper, null, createElement(TestComponent)) : createElement(TestComponent));

		return {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- renderToString runs the hook synchronously, so current is set
			result: { current: current! },
			rerender: () => undefined,
			unmount: () => undefined,
		};
	}

	return _renderHook(render, options);
}

export { act } from '@testing-library/react';
