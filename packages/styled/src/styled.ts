import { attachRules, createClassName, css, escapeName, transpile } from '@rocket.chat/css-in-js';
import type { JSX, ReactElement } from 'react';
import { createElement, Fragment, useDebugValue, useInsertionEffect } from 'react';

import { useOwnerDocument } from './OwnerDocument';

export const attachClassName = <P extends { className?: string }>(props: P, additionalClassName: string): P => ({
	...props,
	className: props.className ? `${props.className} ${additionalClassName}` : additionalClassName,
});

const styled =
	<K extends keyof JSX.IntrinsicElements, P>(type: K, filter?: (p: JSX.IntrinsicElements[K] & P) => JSX.IntrinsicElements[K]) =>
	(slices: TemplateStringsArray, ...values: readonly (string | ((props: P) => string))[]) => {
		const cssFn = css(slices, ...values);

		const StyledComponent: (props: JSX.IntrinsicElements[K] & P) => ReactElement =
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

		return Object.assign(StyledComponent, { displayName: `StyledComponent(${type})` });
	};

export default styled;
