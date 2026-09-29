import { Box } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import RaisedHandsButton from './RaisedHandsButton';

export type RaisedHand = {
	id: string;
	/** Who they are. Falls back to whatever the call knows; never blank, or the label would say nothing. */
	name: string;
};

export type CallRaisedHandsProps = {
	hands: RaisedHand[];
};

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
const CallRaisedHands = ({ hands }: CallRaisedHandsProps) => {
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
			<Box display='flex' alignItems='center' fontScale='p2' minWidth={0} title={name}>
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
