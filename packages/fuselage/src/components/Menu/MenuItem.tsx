import type { Node } from '@react-types/shared';
import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { mergeProps, useFocusVisible, useMenuItem } from 'react-aria';
import type { TreeState } from 'react-stately';

import { textIconColors } from '../../Theme';
import { fontScale } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Item, ItemContent, ItemTitle } from '../Item';
import type { OptionProps } from '../Option';

const MenuItemDescription = styled(Text, {
	render: 'div',
	display: 'block',
	flexBasis: '100%',
	whiteSpace: 'normal',
	wordWrap: 'inherit',
	wordBreak: 'break-word',
	color: String(textIconColors['font-secondary-info']),
	// the token's numeric `fontWeight` is wider than Tamagui's weight union
	...(fontScale('p2') as object),
});

type MenuItemProps = {
	item: Node<{
		description?: ReactNode;
		variant?: OptionProps['variant'];
	}>;
	state: TreeState<unknown>;
};

/**
 * Renders a menu item as an `Item` row, so its content is composed from `Item` parts.
 */
function MenuItem({ item, state }: MenuItemProps) {
	const ref = useRef<HTMLLabelElement>(null);
	const { isFocusVisible } = useFocusVisible();
	const {
		menuItemProps: { onPointerUp, ...menuItemProps },
		isFocused,
		isDisabled,
	} = useMenuItem({ key: item.key }, state, ref);

	const description = item.value?.description;

	// There's an issue caused by conflicting event handlers. The popover opens on onPointerDown and the selection event for both, the menu (listbox), happens on onPointerUp.
	// As a workaround, we are overwriting `onPointerDown` event with `onPointerUp`

	return (
		<Item
			{...mergeProps(menuItemProps, { onPointerDown: onPointerUp })}
			ref={ref}
			is='label'
			inset='md'
			focused={isFocused}
			focusVisible={isFocused && isFocusVisible}
			disabled={isDisabled}
			variant={item.value?.variant === 'danger' ? 'danger' : undefined}
			className={description ? 'rcx-menu-item--with-description' : undefined}
		>
			{typeof item.rendered === 'string' ? (
				<ItemContent>
					<ItemTitle>{item.rendered}</ItemTitle>
				</ItemContent>
			) : (
				item.rendered
			)}
			{description && <MenuItemDescription className='rcx-menu-item__description'>{description}</MenuItemDescription>}
		</Item>
	);
}

export default withFuselageProvider(MenuItem);
