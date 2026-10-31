import type { Key, Node } from '@react-types/shared';
import type { RefObject } from 'react';
import { useMenuSection, useSeparator } from 'react-aria';
import type { RootMenuTriggerState, TreeState } from 'react-stately';

import { ItemDivider, ItemGroupHeader, ItemGroupTitle } from '../Item';
import MenuItem from './MenuItem';
import MenuSubmenu from './MenuSubmenu';

type MenuSectionProps<T extends object> = {
	section: Node<T>;
	state: TreeState<unknown>;
	rootMenuTriggerState: RootMenuTriggerState;
	parentMenuRef: RefObject<HTMLElement | null>;
	onAction?: (key: Key) => void;
};

function MenuSection<T extends object>({ section, state, rootMenuTriggerState, parentMenuRef, onAction }: MenuSectionProps<T>) {
	const { itemProps, headingProps, groupProps } = useMenuSection({
		'heading': section.rendered,
		'aria-label': section['aria-label'],
	});

	const { separatorProps } = useSeparator({
		elementType: 'div',
	});

	// If the section is not the first, add a separator element.
	return (
		<>
			{section.key !== state.collection.getFirstKey() && <ItemDivider {...separatorProps} />}
			<div {...itemProps}>
				{section.rendered && (
					<ItemGroupHeader inset='md'>
						<ItemGroupTitle {...headingProps}>{section.rendered}</ItemGroupTitle>
					</ItemGroupHeader>
				)}
				<div {...groupProps}>
					{[...section.childNodes].map((node) =>
						node.hasChildNodes ? (
							<MenuSubmenu
								key={node.key}
								item={node as any}
								state={state}
								rootMenuTriggerState={rootMenuTriggerState}
								parentMenuRef={parentMenuRef}
								onAction={onAction}
							/>
						) : (
							<MenuItem key={node.key} item={node as any} state={state} />
						),
					)}
				</div>
			</div>
		</>
	);
}

export default MenuSection;
