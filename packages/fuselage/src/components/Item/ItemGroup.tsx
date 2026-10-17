import type { AllHTMLAttributes, ElementType, ReactNode, RefAttributes } from 'react';
import { Children, isValidElement, useCallback, useId, useMemo, useRef } from 'react';

import { ItemGroupContext } from './ItemGroupContext';
import ItemGroupTitle from './ItemGroupTitle';
import { useIdRegistry } from './useIdRegistry';
import { cx } from '../../helpers/composeClassNames';

export type ItemGroupProps = {
	/**
	 * The element to render. Use `ul` for a list, or set `role` for a listbox, group or menu.
	 */
	is?: ElementType;
	/**
	 * The id of the title element that labels the group.
	 */
	titleId?: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

const isItemGroup = (child: unknown): boolean =>
	isValidElement(child) && (child.type === ItemGroup || (child.type as { displayName?: string })?.displayName === 'ItemGroup');

const findTitleId = (children: ReactNode): string | boolean | undefined => {
	let result: string | boolean | undefined;

	Children.forEach(children, (child) => {
		if (result !== undefined || !isValidElement(child)) {
			return;
		}

		if (isItemGroup(child)) {
			return;
		}

		if (child.type === ItemGroupTitle || (child.type as { displayName?: string })?.displayName === 'ItemGroupTitle') {
			result = (child.props as { id?: string }).id || true;
			return;
		}

		if ((child.props as { children?: ReactNode }).children) {
			result = findTitleId((child.props as { children?: ReactNode }).children);
		}
	});

	return result;
};

const getInitialTitleId = (propTitleId?: string, detectedTitle?: string | boolean, generatedTitleId?: string) => {
	if (propTitleId) {
		return propTitleId;
	}

	if (typeof detectedTitle === 'string') {
		return detectedTitle;
	}

	if (detectedTitle) {
		return generatedTitleId;
	}

	return undefined;
};

/**
 * A list of `Item` rows. An `ItemGroupTitle` inside it labels the group, and its width drives the narrow layout.
 */
function ItemGroup({ is: Tag = 'div', className, children, titleId: propTitleId, ...props }: ItemGroupProps) {
	const generatedTitleId = useId();
	const detectedTitle = useMemo(() => findTitleId(children), [children]);
	const [titleIds, registerTitle] = useIdRegistry();

	const resolvedTitleId = propTitleId ?? (typeof detectedTitle === 'string' ? detectedTitle : generatedTitleId);
	const initialTitleId = getInitialTitleId(propTitleId, detectedTitle, generatedTitleId);

	const linkedCallerIdRef = useRef<string | null>(null);

	const claimTitleId = useCallback(
		(callerId: string) => {
			if (!initialTitleId) {
				return undefined;
			}

			if (linkedCallerIdRef.current === null || linkedCallerIdRef.current === callerId) {
				linkedCallerIdRef.current = callerId;
				return resolvedTitleId;
			}

			return undefined;
		},
		[initialTitleId, resolvedTitleId],
	);

	const contextValue = useMemo(
		() => ({
			titleId: resolvedTitleId,
			claimTitleId,
			registerTitle,
		}),
		[resolvedTitleId, claimTitleId, registerTitle],
	);

	const hasOwnLabel = !!props['aria-label'] || !!props['aria-labelledby'];
	const activeTitleId = titleIds[0] ?? initialTitleId;
	const ariaLabelledBy = !hasOwnLabel ? activeTitleId : undefined;

	return (
		<ItemGroupContext.Provider value={contextValue}>
			<Tag aria-labelledby={ariaLabelledBy} {...props} className={cx('rcx-item-group', className)}>
				{children}
			</Tag>
		</ItemGroupContext.Provider>
	);
}

ItemGroup.displayName = 'ItemGroup';

export default ItemGroup;
