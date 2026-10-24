import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useMemo } from 'react';

import { ItemGroupContext } from './ItemGroupContext';
import { toRender } from './itemStyles';
import { useIdRegistry } from './useIdRegistry';
import { cx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

// The narrow layout is a container query in `Item.styles.css`, since no breakpoint matches its width
const ItemGroupFrame = styled(View, {
	boxSizing: 'content-box',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	margin: 0,
	padding: 0,
	listStyle: 'none',
});

export type ItemGroupProps = {
	/**
	 * The element to render. Use `ul` for a list, or set `role` for a listbox, group or menu.
	 */
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * A list of `Item` rows. An `ItemGroupTitle` inside it labels the group, and its width drives the narrow layout.
 */
const ItemGroup = ({ is: Tag = 'div', className, children, ...props }: ItemGroupProps) => {
	const [titleIds, registerTitle] = useIdRegistry();

	const contextValue = useMemo(() => ({ registerTitle }), [registerTitle]);

	const hasOwnLabel = !!props['aria-label'] || !!props['aria-labelledby'];
	const ariaLabelledBy = !hasOwnLabel && titleIds.length > 0 ? titleIds.join(' ') : undefined;

	return (
		<ItemGroupContext.Provider value={contextValue}>
			<ItemGroupFrame
				aria-labelledby={ariaLabelledBy}
				{...(props as GetProps<typeof ItemGroupFrame>)}
				render={toRender(Tag)}
				container='rcx-item-group'
				className={cx('rcx-item-group', className)}
			>
				{children}
			</ItemGroupFrame>
		</ItemGroupContext.Provider>
	);
};

export default withFuselageProvider(ItemGroup);
