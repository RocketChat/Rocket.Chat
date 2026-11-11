import type { cssFn } from '@rocket.chat/css-in-js';
import { createClassName, escapeName, transpile, attachRules } from '@rocket.chat/css-in-js';
import { useDebugValue, useInsertionEffect, useMemo } from 'react';

import { useOwnerDocument } from '../contexts';

/** Attaches a `css` style to the document and returns its class name, for a `className` that takes strings only. */
export const useStyle = (cssFn: cssFn | undefined, arg?: unknown) => {
	const content = useMemo(() => (cssFn ? cssFn(arg) : undefined), [arg, cssFn]);

	const className = useMemo(() => {
		if (!content) {
			return;
		}

		return content ? createClassName(content) : undefined;
	}, [content]);

	useDebugValue(className);

	const { document } = useOwnerDocument();

	useInsertionEffect(() => {
		if (!content || !className) {
			return;
		}

		const escapedClassName = escapeName(className);
		const transpiledContent = transpile(`.${escapedClassName}`, content);
		const detach = attachRules(transpiledContent, { document });

		return () => {
			setTimeout(detach, 1000);
		};
	}, [className, content, document]);

	return className;
};
