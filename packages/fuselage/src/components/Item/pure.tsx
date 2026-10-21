import { styled } from '@tamagui/web';
import type { AllHTMLAttributes, RefAttributes } from 'react';

import { ItemFrame } from './Item';
import { ItemContentFrame } from './ItemContent';
import { ItemDescriptionFrame } from './ItemDescription';
import { ItemMediaFrame } from './ItemMedia';
import { ItemMetaFrame } from './ItemMeta';
import { ItemRowFrame } from './ItemRow';
import { ItemTitleFrame } from './ItemTitle';
import type { ItemHighlight } from './itemStyles';
import type { ItemInset } from './types';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

type ElementProps = Omit<AllHTMLAttributes<HTMLElement>, 'selected' | 'disabled'> & RefAttributes<HTMLElement> & { render?: string };

/**
 * An `Item` row as plain frames, for long lists where rows declare their state instead of having `Item` work it out:
 * the caller sets `surface`, `pointer` and `gap`, the `highlight` of each text part, and any ARIA ids. Each use-site
 * compiles to a plain element with static classes.
 */
export const PureItem = asPublicFrame<
	ElementProps & {
		inset?: ItemInset;
		selected?: boolean;
		highlighted?: boolean;
		/** What `Item` derives from its state props; the caller picks it */
		surface?: 'none' | 'interactive' | 'focused' | 'selected' | 'disabled';
		pointer?: 'default' | 'interactive' | 'disabled';
		tone?: 'default' | 'danger' | 'disabled';
		/** `x8` for two lines of content, which `Item` measures */
		gap?: 'x4' | 'x8';
	}
>(
	styled(ItemFrame, {
		displayName: 'PureItem',
		render: 'div',
		// What `Item` renders when no state prop is set
		gap: 'x4',
		surface: 'none',
		pointer: 'default',
		tone: 'default',
		focusRing: 'native',
		variants: {
			rcx: { true: variantClass('rcx-item') },
			inset: {
				none: {},
				sm: variantClass('rcx-item--inset-sm'),
				md: variantClass('rcx-item--inset-md'),
				lg: variantClass('rcx-item--inset-lg'),
			},
			selected: { true: variantClass('rcx-item--selected') },
			highlighted: { true: variantClass('rcx-item--highlighted') },
		} as const,
		defaultVariants: { rcx: true },
	}),
);

const part = (Frame: Parameters<typeof styled>[0], className: string, displayName: string) =>
	styled(Frame as typeof ItemRowFrame, {
		displayName,
		render: 'div',
		variants: { rcx: { true: variantClass(className) } } as const,
		defaultVariants: { rcx: true },
	});

export const PureItemMedia = asPublicFrame<ElementProps>(part(ItemMediaFrame, 'rcx-item__media', 'PureItemMedia'));
export const PureItemContent = asPublicFrame<ElementProps>(part(ItemContentFrame, 'rcx-item__content', 'PureItemContent'));
export const PureItemRow = asPublicFrame<ElementProps>(part(ItemRowFrame, 'rcx-item__row', 'PureItemRow'));

type HighlightProps = ElementProps & { highlight?: ItemHighlight };

export const PureItemTitle = asPublicFrame<HighlightProps>(part(ItemTitleFrame, 'rcx-item__title', 'PureItemTitle'));
export const PureItemMeta = asPublicFrame<HighlightProps>(part(ItemMetaFrame, 'rcx-item__meta', 'PureItemMeta'));
export const PureItemDescription = asPublicFrame<HighlightProps>(
	part(ItemDescriptionFrame, 'rcx-item__description', 'PureItemDescription'),
);
