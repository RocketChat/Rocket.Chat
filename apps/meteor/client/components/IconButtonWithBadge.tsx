import { Badge, Box, IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type IconButtonWithBadgeProps = {
	/**
	 * What the badge says, if anything. A badge with no children is the dot — activity with no count behind it —
	 * and `undefined` is no badge at all.
	 */
	badge?: ReactNode;
	badgeVariant?: ComponentProps<typeof Badge>['variant'];
	/**
	 * A tooltip for the badge itself, where what it counts is worth spelling out on hover — the button's own
	 * `title` names the control, which is a different sentence.
	 */
	badgeTitle?: string;
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
const IconButtonWithBadge = ({ badge, badgeVariant, badgeTitle, children, ...props }: IconButtonWithBadgeProps) => (
	<IconButton position='relative' overflow='visible' {...props}>
		{badge !== undefined && (
			// Hit-testable, because `badgeTitle` promises a tooltip and `pointer-events: none` is precisely what
			// stops one appearing. The badge sits inside the button, so a click on it is a click on the button.
			<Box position='absolute' insetBlockStart={-6} insetInlineEnd={-6} aria-hidden='true'>
				<Badge variant={badgeVariant} title={badgeTitle}>
					{badge}
				</Badge>
			</Box>
		)}
		{children}
	</IconButton>
);

export default IconButtonWithBadge;
