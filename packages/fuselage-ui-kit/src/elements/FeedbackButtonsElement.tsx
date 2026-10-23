import { Button, Stack } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useState } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type FeedbackButtonsElementProps = BlockProps<UiKit.FeedbackButtonsElement>;

const FeedbackButtonsElement = ({ block, context }: FeedbackButtonsElementProps) => {
	const [{ loading }, action] = useUiKitState(block, context);
	const [chosen, setChosen] = useState<'positive' | 'negative'>();

	const buttons = [
		{ kind: 'positive', button: block.positive_button, emoji: '👍' },
		{ kind: 'negative', button: block.negative_button, emoji: '👎' },
	] as const;

	return (
		<Stack direction='row' gap={4}>
			{buttons.map(({ kind, button, emoji }) => (
				<Button
					key={kind}
					small
					square
					secondary={chosen === kind}
					disabled={loading}
					aria-label={button.accessibility_label ?? button.text.text}
					aria-pressed={chosen === kind}
					title={button.text.text}
					onClick={() => {
						setChosen(kind);
						void action({ target: { value: button.value } });
					}}
				>
					<span aria-hidden>{emoji}</span>
				</Button>
			))}
		</Stack>
	);
};

export default FeedbackButtonsElement;
