import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, MouseEvent, RefAttributes } from 'react';
import { useMemo } from 'react';

import { ItemContext, skipRegistration, ItemHighlightContext, ItemParentContext, type ItemParent } from './ItemContext';
import {
	focusRing,
	inState,
	itemColorFontDanger,
	itemColorFontDisabled,
	itemColorSurfaceHover,
	itemColorSurfaceSelected,
	itemRowStyle,
	toRender,
	textStyle,
} from './itemStyles';
import type { ItemInset } from './types';
import { useIdRegistry } from './useIdRegistry';
import { textIconColors } from '../../Theme';
import { cx, cxx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const ItemFrame = styled(Text, {
	...itemRowStyle,
	textAlign: 'start',
	textDecorationLine: 'none',
	color: toCSSValue('--rcx-item-color-font-default', textIconColors['font-default']),
	...textStyle('p2'),

	variants: {
		gap: {
			x4: { gap: spacing('x4') },
			x8: { gap: spacing('x8') },
		},
		// One variant, so a state surface always replaces the hover one instead of competing with it
		surface: {
			none: {},
			interactive: { backgroundColor: { hover: itemColorSurfaceHover } },
			focused: { backgroundColor: itemColorSurfaceHover },
			selected: { backgroundColor: itemColorSurfaceSelected },
			disabled: { backgroundColor: 'transparent' },
		},
		pointer: {
			default: {},
			interactive: { cursor: 'pointer' },
			disabled: { cursor: 'not-allowed' },
		},
		tone: {
			default: {},
			danger: { color: itemColorFontDanger },
			disabled: { color: itemColorFontDisabled },
		},
		focusRing: {
			native: inState('focus-visible', focusRing),
			managed: { outlineStyle: { focus: 'none' } },
			visible: { ...focusRing, outlineStyle: { default: 'solid', focus: 'none' } },
		},
	} as const,
});

export type ItemProps = {
	/**
	 * The element to render. Use `li` inside a list; set `role` for listbox options or menu items.
	 */
	is?: ElementType;
	/**
	 * Adds space between the row edge and its first and last slots.
	 */
	inset?: ItemInset;
	selected?: boolean;
	/**
	 * Emphasizes the title, icon, description and meta, as for unread rooms.
	 */
	highlighted?: boolean;
	/**
	 * Shows the hover surface for a virtual cursor, such as a listbox's active descendant.
	 */
	focused?: boolean;
	/**
	 * Shows the focus ring for focus a script moves, such as a menu's, where the browser's `:focus-visible` also matches on hover.
	 * Once set, it replaces `:focus-visible` for the row.
	 */
	focusVisible?: boolean;
	/**
	 * Dims the row and ignores clicks. Set the matching ARIA state through props.
	 */
	disabled?: boolean;
	variant?: 'danger';
	/**
	 * Whether the content takes two lines, which widens the gap. Left out, the row counts its content's lines after it
	 * mounts, at the cost of a second render.
	 */
	multiline?: boolean;
	/**
	 * Whether the row reacts to the pointer. Left out, the row is interactive when it is a link, a button, an option or a
	 * menu item, has `onClick`, or holds an `ItemLink`, which it only learns after it mounts, at the cost of a second render.
	 */
	interactive?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'selected' | 'disabled'> &
	RefAttributes<HTMLElement>;

type StateVariants = Pick<GetProps<typeof ItemFrame>, 'surface' | 'pointer' | 'tone' | 'focusRing'>;

const getStateVariants = ({
	disabled,
	selected,
	focused,
	interactive,
	danger,
	focusVisible,
}: Record<'disabled' | 'selected' | 'focused' | 'interactive' | 'danger', boolean> & { focusVisible?: boolean }): StateVariants => {
	const focusRing = focusVisible === undefined ? 'native' : 'managed';

	if (disabled) {
		return { surface: 'disabled', pointer: 'disabled', tone: 'disabled', focusRing: focusVisible ? 'visible' : focusRing };
	}

	const surface = (selected && 'selected') || (focused && 'focused') || (interactive && 'interactive') || 'none';

	return {
		surface,
		pointer: interactive ? 'interactive' : 'default',
		tone: danger ? 'danger' : 'default',
		focusRing: focusVisible ? 'visible' : focusRing,
	};
};

/**
 * A list row composed from slots: media, icon, content and actions.
 */
const Item = ({
	is: Tag = 'div',
	inset = 'none',
	selected,
	highlighted,
	focused,
	focusVisible,
	disabled,
	variant,
	multiline,
	interactive: interactiveProp,
	className,
	onClick,
	children,
	...props
}: ItemProps) => {
	const [descriptionIds, registerDescription] = useIdRegistry();
	const [titleIds, registerTitle] = useIdRegistry();
	const [linkIds, registerLink] = useIdRegistry();
	const [multilineIds, registerMultiline] = useIdRegistry();

	// Two lines of content get a wider gap, so the media and actions breathe beside them
	const gap = (multiline ?? multilineIds.length > 0) ? 'x8' : 'x4';
	const parentValue = useMemo<ItemParent>(() => ({ kind: 'item', gap }), [gap]);

	// A menu item is named by its titles and described by its labelled icons, as an `ItemLink` is.
	const isMenuItem = !!props.role?.startsWith('menuitem');

	// Only a menu item reads its titles' ids, so any other row skips the render a title's registration causes on mount
	const contextValue = useMemo(
		() => ({
			descriptionIds,
			registerDescription,
			registerTitle: isMenuItem ? registerTitle : skipRegistration,
			// What the row declares it doesn't need to find out
			registerLink: interactiveProp === undefined ? registerLink : skipRegistration,
			registerMultiline: multiline === undefined ? registerMultiline : skipRegistration,
		}),
		[descriptionIds, registerDescription, registerTitle, isMenuItem, registerLink, registerMultiline, interactiveProp, multiline],
	);

	const ariaLabelledBy = isMenuItem ? (props['aria-labelledby'] ?? (titleIds.join(' ') || undefined)) : props['aria-labelledby'];

	const ariaDescribedBy = isMenuItem
		? [props['aria-describedby'], ...descriptionIds].filter(Boolean).join(' ') || undefined
		: props['aria-describedby'];

	const handleClick = onClick
		? (event: MouseEvent<HTMLElement>) => {
				if (disabled) {
					return;
				}
				onClick(event);
			}
		: undefined;

	const interactive =
		interactiveProp ?? (!!onClick || Tag === 'a' || Tag === 'button' || props.role === 'option' || isMenuItem || linkIds.length > 0);

	return (
		<ItemContext.Provider value={contextValue}>
			<ItemParentContext.Provider value={parentValue}>
				<ItemHighlightContext.Provider value={highlighted ? 'item' : undefined}>
					<ItemFrame
						{...(props as GetProps<typeof ItemFrame>)}
						render={toRender(Tag)}
						gap={gap}
						{...getStateVariants({
							disabled: !!disabled,
							selected: !!selected,
							focused: !!focused,
							interactive,
							danger: variant === 'danger',
							focusVisible,
						})}
						aria-labelledby={ariaLabelledBy}
						aria-describedby={ariaDescribedBy}
						className={cx(
							cxx('rcx-item')({
								[`inset-${inset}`]: inset !== 'none',
								'clickable': !!onClick,
								'interactive': !!interactiveProp,
								'multiline': !!multiline,
								'selected': !!selected,
								'highlighted': !!highlighted,
								'focused': !!focused,
								'focus-managed': focusVisible !== undefined,
								'focus-visible': !!focusVisible,
								'disabled': !!disabled,
								'danger': variant === 'danger',
							}),
							className,
						)}
						onClick={handleClick}
					>
						{children}
					</ItemFrame>
				</ItemHighlightContext.Provider>
			</ItemParentContext.Provider>
		</ItemContext.Provider>
	);
};

export default withFuselageProvider(Item);
