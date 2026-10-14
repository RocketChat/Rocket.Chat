import { attachRules, createClassName, css, escapeName, transpile } from '@rocket.chat/css-in-js';
import type { JSX, FunctionComponent } from 'react';
import { createElement, Fragment, useDebugValue, useInsertionEffect } from 'react';

import { useOwnerDocument } from './OwnerDocument';

export const attachClassName = <P extends { className?: string }>(props: P, additionalClassName: string): P => ({
	...props,
	className: props.className ? `${props.className} ${additionalClassName}` : additionalClassName,
});

const styled =
	<K extends keyof JSX.IntrinsicElements, P>(type: K, filter?: (p: JSX.IntrinsicElements[K] & P) => JSX.IntrinsicElements[K]) =>
	(
		slices: TemplateStringsArray,
		...values: readonly (string | ((props: P) => string))[]
	): FunctionComponent<JSX.IntrinsicElements[K] & P> => {
		const cssFn = css(slices, ...values);

		const StyledComponent: FunctionComponent<JSX.IntrinsicElements[K] & P> =
			typeof window === 'undefined'
				? (props) => {
						const content = cssFn(props);
						const computedClassName = createClassName(content);
						const escapedClassName = escapeName(computedClassName);
						const transpiledContent = transpile(`.${escapedClassName}`, content);

						const newProps = attachClassName(props, computedClassName);

						return createElement(
							Fragment,
							{},
							createElement('style', {}, transpiledContent),
							createElement(type, filter ? filter(newProps) : newProps),
						);
					}
				: (props) => {
						const content = cssFn(props);
						const computedClassName = createClassName(content);

						useDebugValue(computedClassName);

						const { document } = useOwnerDocument();
						useInsertionEffect(() => {
							const escapedClassName = escapeName(computedClassName);
							const transpiledContent = transpile(`.${escapedClassName}`, content);
							const detach = attachRules(transpiledContent, { document });

							return () => {
								setTimeout(detach, 1000);
							};
						}, [computedClassName, content, document]);

						const newProps = attachClassName(props, computedClassName);
						return createElement(type, filter ? filter(newProps) : newProps);
					};

		StyledComponent.displayName = `StyledComponent(${type})`;

		return StyledComponent;
	};

export default styled;
