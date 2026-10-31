import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useMemo } from 'react';

import { ItemGroupContext } from './ItemGroupContext';
import { useIdRegistry } from './useIdRegistry';
import { cx } from '../../helpers/composeClassNames';

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
const ItemGroup = ({ is: Component = 'div', className, children, ...props }: ItemGroupProps) => {
	const [titleIds, registerTitle] = useIdRegistry();

	const contextValue = useMemo(() => ({ registerTitle }), [registerTitle]);

	const hasOwnLabel = !!props['aria-label'] || !!props['aria-labelledby'];
	const ariaLabelledBy = !hasOwnLabel && titleIds.length > 0 ? titleIds.join(' ') : undefined;

	return (
		<ItemGroupContext.Provider value={contextValue}>
			<Component aria-labelledby={ariaLabelledBy} {...props} className={cx('rcx-item-group', className)}>
				{children}
			</Component>
		</ItemGroupContext.Provider>
	);
};

export default ItemGroup;
