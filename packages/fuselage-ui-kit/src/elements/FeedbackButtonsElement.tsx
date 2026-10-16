import { Box, Button } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useState } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type FeedbackButtonsElementProps = BlockProps<UiKit.FeedbackButtonsElement>;

const FeedbackButtonsElement = ({ block, context }: FeedbackButtonsElementProps) => {
	const [{ loading }, action] = useUiKitState(block, context);
	const [chosen, setChosen] = useState<string>();

	const buttons = [
		{ button: block.positive_button, emoji: '👍' },
		{ button: block.negative_button, emoji: '👎' },
	];

	return (
		<Box display='flex'>
			{buttons.map(({ button, emoji }) => (
				<Button
					key={emoji}
					small
					square
					secondary={chosen === button.value}
					disabled={loading}
					aria-label={button.accessibility_label ?? button.text.text}
					aria-pressed={chosen === button.value}
					title={button.text.text}
					onClick={() => {
						setChosen(button.value);
						void action({ target: { value: button.value } });
					}}
					marginInlineEnd={4}
				>
					<span aria-hidden>{emoji}</span>
				</Button>
			))}
		</Box>
	);
};

export default FeedbackButtonsElement;
