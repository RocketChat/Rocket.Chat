import type { ItemProps, MultipleSelection } from '@react-types/shared';
import type { ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';

import type { PartialNode } from './PartialNode';

export type MenuSubmenuTriggerProps<T> = Omit<ItemProps<T>, 'title' | 'children'> & {
	/**
	 * The trigger item followed by the submenu items.
	 *
	 * The **first** child is rendered as the entry in the parent menu — it may
	 * use the rich `MenuItem*` sub-components (`MenuItemIcon`, `MenuItemContent`,
	 * …). The **remaining** children populate the submenu that opens beside it.
	 */
	children: ReactNode;
	variant?: 'danger' | 'success' | 'warning' | 'primary';
} & Pick<MultipleSelection, 'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange' | 'disallowEmptySelection'>;
// The selection props above are react-stately's own, for the submenu this trigger opens: with `selectionMode='single'`
// its items are radio items and with `'multiple'` checkbox items, each announcing whether it is checked from
// `selectedKeys`. The parent menu's selection mode does not reach them, since the submenu has its own tree state.

function MenuSubmenuTrigger<T>(_props: MenuSubmenuTriggerProps<T>) {
	return null;
}

const toElementArray = (children: ReactNode): ReactElement<any>[] => {
	const result: ReactElement<any>[] = [];

	const visit = (node: ReactNode) => {
		if (Array.isArray(node)) {
			node.forEach(visit);
			return;
		}
		if (isValidElement(node)) {
			result.push(node);
		}
	};

	visit(children);
	return result;
};

MenuSubmenuTrigger.getCollectionNode = function* getCollectionNode<T>(
	props: MenuSubmenuTriggerProps<T>,
	context: any,
): Generator<PartialNode<T>> {
	const [trigger, ...submenuItems] = toElementArray(props.children);

	if (!trigger || submenuItems.length === 0) {
		throw new Error('A <MenuSubmenuTrigger> must have at least two children: the trigger item followed by one or more submenu items.');
	}

	const rendered = trigger.props.children;
	const textValue =
		props.textValue ||
		trigger.props.textValue ||
		(typeof rendered === 'string' ? rendered : '') ||
		props['aria-label'] ||
		trigger.props['aria-label'] ||
		'';

	if (!textValue && !context?.suppressTextValueWarning) {
		console.warn(
			'<MenuSubmenuTrigger> with non-plain text contents is unsupported by type to select for accessibility. Please add a `textValue` prop.',
		);
	}

	yield {
		'type': 'item',
		// Only the submenu items are forwarded as children — the trigger element is
		// consumed here and rendered separately by `MenuSubmenu`.
		'props': { ...props, children: submenuItems },
		rendered,
		textValue,
		'aria-label': props['aria-label'] || trigger.props['aria-label'],
		'value': (props.variant ? { variant: props.variant } : undefined) as unknown as T,
		'hasChildNodes': true,
		*'childNodes'() {
			for (const item of submenuItems) {
				yield {
					type: 'item',
					element: item,
				};
			}
		},
	};
};

export default MenuSubmenuTrigger;
