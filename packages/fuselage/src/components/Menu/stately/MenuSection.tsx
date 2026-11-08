import type { SectionProps } from '@react-types/shared';
import { Children } from 'react';

import type { PartialNode } from './PartialNode';

export type MenuSectionProps<T> = SectionProps<T>;

function MenuSection<T>(_props: MenuSectionProps<T>) {
	return null;
}

MenuSection.getCollectionNode = function* getCollectionNode<T>(props: MenuSectionProps<T>): Generator<PartialNode<T>> {
	const { children, title, items } = props;
	yield {
		'type': 'section',
		props,
		'hasChildNodes': true,
		'rendered': title,
		'aria-label': props['aria-label'],
		*'childNodes'() {
			if (typeof children === 'function') {
				if (!items) {
					throw new Error('props.children was a function but props.items is missing');
				}

				for (const item of items) {
					yield {
						type: 'item',
						value: item,
						element: children(item),
					};
				}
			} else {
				const items: PartialNode<T>[] = [];
				Children.forEach(children, (child) => {
					items.push({
						type: 'item',
						element: child ?? undefined,
					});
				});

				yield* items;
			}
		},
	};
};

export default MenuSection;
