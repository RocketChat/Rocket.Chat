import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export type RaisedHand = {
	id: string;
	/** Who they are. Falls back to whatever the call knows; never blank, or the label would say nothing. */
	name: string;
};

const buttonStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	max-width: 220px;
	padding: 4px 10px;
	border: none;
	border-radius: 16px;
	background-color: var(--rcx-color-button-background-success-default, #148660);
	color: #fff;
	font-size: 12px;
	line-height: 16px;
	font-weight: 500;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background-color: var(--rcx-color-button-background-success-hover, #106d4f);
	}
`;

// GenericMenu clones whatever it is given as `button` and stamps its own props onto it: `small` and `icon`, neither
// of which belongs on a label, and a `className` of its own. That last one is why this takes the class apart and
// puts it back together — spread over the top, it replaced the pill's styling wholesale and left the label as bare
// text with no background, no padding and nothing between the hand and the name.
type RaisedHandsButtonProps = Omit<ComponentProps<typeof Box>, 'is' | 'className'> & {
	small?: boolean;
	icon?: unknown;
	className?: string;
};

const RaisedHandsButton = forwardRef<HTMLButtonElement, RaisedHandsButtonProps>(function RaisedHandsButton(
	{ small: _small, icon: _icon, className, children, ...props },
	ref,
) {
	return (
		<Box is='button' type='button' ref={ref} className={[buttonStyles, className]} {...props}>
			{children}
		</Box>
	);
});

/**
 * Who is waiting to speak, next in line first.
 *
 * A raised hand used to be visible only as a badge on the raiser's own tile, which stops working the moment a
 * call is bigger than the tiles it can show — the very calls where a queue matters most. So the front of the
 * queue is stated next to the participants button, where it is legible however many people are in the call, and
 * the rest of the line is a click away rather than spread across tiles that may not be on screen.
 *
 * Nothing is rendered when nobody has their hand up: an empty queue is not a thing to say, and a permanent
 * control that is usually blank teaches people to stop reading it.
 */
// eslint-disable-next-line react/no-multi-comp
const CallRaisedHands = ({ hands }: { hands: RaisedHand[] }) => {
	const { t } = useTranslation();

	if (!hands.length) {
		return null;
	}

	const [next, ...waiting] = hands;

	const items: GenericMenuItemProps[] = hands.map(({ id, name }, index) => ({
		id,
		textValue: name,
		// Numbered, because the order is the point — this is a queue, not a set.
		content: (
			<Box display='flex' alignItems='center' fontSize={14} minWidth={0} title={name}>
				<Box is='span' color='hint' marginInlineEnd={8}>
					{index + 1}.
				</Box>
				<Box is='span' withTruncatedText>
					{name}
				</Box>
			</Box>
		),
	}));

	// Reads as a sentence for anyone who can't see the layout: the name alone would be a name with no reason.
	const label = t('__name__raised_their_hand', { name: next.name });

	return (
		<GenericMenu
			title={label}
			sections={[{ title: t('Raised_hands'), items }]}
			placement='bottom-end'
			button={
				<RaisedHandsButton aria-label={label}>
					<Box is='span' aria-hidden lineHeight={1}>
						✋
					</Box>
					<Box is='span' withTruncatedText>
						{next.name}
					</Box>
					{/* How many more are behind them. Kept out of the truncation above, so a long name shortens
					    rather than hiding the fact that there is a queue at all. */}
					{waiting.length > 0 && (
						<Box is='span' flexShrink={0}>
							+{waiting.length}
						</Box>
					)}
				</RaisedHandsButton>
			}
		/>
	);
};

export default CallRaisedHands;
