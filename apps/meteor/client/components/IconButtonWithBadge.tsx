import { Badge, Box, IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type IconButtonWithBadgeProps = {
	/**
	 * What the badge says, if anything. A badge with no children is the dot — activity with no count behind it —
	 * and `undefined` is no badge at all.
	 */
	badge?: ReactNode;
	badgeVariant?: ComponentProps<typeof Badge>['variant'];
} & ComponentProps<typeof IconButton>;

/**
 * A button with a count pinned to its corner: the calls in the navbar, the people and the unread messages in the
 * call window's top bar. Four copies of the same absolutely-positioned `Box` had grown across three files, and
 * they had already drifted apart in how far they overhung and how they were announced.
 *
 * The badge is hidden from assistive technology, always. `aria-label` replaces a button's contents rather than
 * adding to them, so a badge inside a labelled button is never read out — the count has to reach the button's own
 * name instead, and saying it twice is the failure mode when it does. What the badge says is therefore the
 * caller's to fold into `aria-label`; this only draws it.
 */
const IconButtonWithBadge = ({ badge, badgeVariant, children, ...props }: IconButtonWithBadgeProps) => (
	<IconButton position='relative' overflow='visible' {...props}>
		{badge !== undefined && (
			// `pointerEvents` is not one of Box's styling props — written as one it reached the DOM as an invalid
			// `pointer-events` attribute and did nothing, which the snapshots had been recording as normal.
			<Box position='absolute' insetBlockStart={-6} insetInlineEnd={-6} style={{ pointerEvents: 'none' }} aria-hidden='true'>
				<Badge variant={badgeVariant}>{badge}</Badge>
			</Box>
		)}
		{children}
	</IconButton>
);

export default IconButtonWithBadge;
