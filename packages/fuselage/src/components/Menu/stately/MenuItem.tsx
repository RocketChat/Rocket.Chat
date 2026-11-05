import type { ItemProps } from '@react-types/shared';
import type { ReactNode } from 'react';
import { Children } from 'react';

import type { PartialNode } from './PartialNode';

export type MenuItemProps<T> = Omit<ItemProps<T>, 'children'> & {
	children?: ReactNode | ((item: T) => ReactNode);
};

function MenuItem<T>(_props: MenuItemProps<T>) {
	return null;
}

MenuItem.getCollectionNode = function* getCollectionNode<T>(props: MenuItemProps<T>, context: any): Generator<PartialNode<T>> {
	const { childItems, title, children } = props;

	const rendered = props.title || (typeof props.children !== 'function' ? props.children : null);
	const textValue = props.textValue || (typeof rendered === 'string' ? rendered : '') || props['aria-label'] || '';

	if (!textValue && !context?.suppressTextValueWarning) {
		console.warn('<Item> with non-plain text contents is unsupported by type to select for accessibility. Please add a `textValue` prop.');
	}

	yield {
		'type': 'item',
		props,
		rendered,
		textValue,
		'aria-label': props['aria-label'],
		'hasChildNodes': hasChildItems(props),
		*'childNodes'() {
			if (childItems) {
				for (const child of childItems) {
					yield {
						type: 'item',
						value: child,
					};
				}
			} else if (title && typeof children !== 'function') {
				const items: PartialNode<T>[] = [];
				Children.forEach(children, (child) => {
					items.push({
						type: 'item',
						element: child,
					});
				});

				yield* items;
			}
		},
	};
};

function hasChildItems<T>(props: MenuItemProps<T>) {
	if (props.hasChildItems != null) {
		return props.hasChildItems;
	}

	if (props.childItems) {
		return true;
	}

	if (props.title && typeof props.children !== 'function' && Children.count(props.children) > 0) {
		return true;
	}

	return false;
}

export default MenuItem;
