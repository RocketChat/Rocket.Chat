import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useState, type ComponentProps, ChangeEvent, forwardRef } from 'react';

import { MessageComposerInput } from '../MessageComposer';

export type ExpandComposerButtonProps = ComponentProps<typeof Box> & {
	dimensions: Readonly<{
		inlineSize: number;
		blockSize: number;
	}>;
};

const MessageComposerInputExpandable = forwardRef<HTMLTextAreaElement, ExpandComposerButtonProps>(({ dimensions, ...props }, ref) => {
	const [expanded, setExpanded] = useState(false);

	const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		props.onChange?.(event);
		if (event.target.value.length === 0) {
			setExpanded(false);
		}
	};

	return (
		<>
			{dimensions.blockSize > 100 && (
				<Box
					position='absolute'
					padding={8}
					className={css`
						top: 0;
						right: 0;
					`}
				>
					<IconButton small icon={expanded ? 'arrow-collapse' : 'arrow-expand'} onClick={() => setExpanded(!expanded)}></IconButton>
				</Box>
			)}
			<MessageComposerInput
				{...props}
				ref={ref}
				onChange={onChange}
				{...(!!expanded && { height: 500 })}
				{...(!!expanded && { maxHeight: 500 })}
			/>
		</>
	);
});

MessageComposerInputExpandable.displayName = 'MessageComposerInputExpandable';

export default MessageComposerInputExpandable;
