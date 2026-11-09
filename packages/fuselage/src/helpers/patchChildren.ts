import type { ReactNode, Attributes } from 'react';
import { cloneElement } from 'react';
import { isElement } from 'react-is';

import { flattenChildren } from './flattenChildren.js';
import { shallowEqual } from './shallowEqual.js';

export const patchChildren = <TProps>(children: ReactNode, patch: (props: TProps) => TProps & Attributes): ReactNode => {
	let dirty = false;

	const newChildren = flattenChildren(children).map((child) => {
		if (!isElement(child)) {
			return child;
		}

		const mergedProps = patch(child.props as TProps);

		if (shallowEqual(child.props, mergedProps)) {
			return child;
		}

		dirty = true;
		return cloneElement(child, mergedProps);
	});

	if (dirty) {
		return newChildren;
	}

	return children;
};
