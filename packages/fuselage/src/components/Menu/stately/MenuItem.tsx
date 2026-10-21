import type { ItemProps } from '@react-types/shared';
import { Children } from 'react';

import type { PartialNode } from './PartialNode';

export type MenuItemProps<T> = ItemProps<T>;

function MenuItem<T>(_props: MenuItemProps<T>) {
	return null;
}

MenuItem.getCollectionNode = function* getCollectionNode<T>(props: MenuItemProps<T>, context: any): Generator<PartialNode<T>> {
	const { childItems, title, children } = props;

	const rendered = props.title || props.children;
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
			} else if (title) {
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

	if (props.title && Children.count(props.children) > 0) {
		return true;
	}

	return false;
}

export default MenuItem;
