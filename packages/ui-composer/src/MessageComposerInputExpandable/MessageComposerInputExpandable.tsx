import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useState, type ComponentProps, RefCallback } from 'react';

import { MessageComposerInput } from '../MessageComposer';

export type ExpandComposerButtonProps = ComponentProps<typeof Box> & {
	dimensions: Readonly<{
		inlineSize: number;
		blockSize: number;
	}>;
	inputRef: RefCallback<HTMLElement>;
};

const MessageComposerInputExpandable = ({ dimensions, inputRef, ...props }: ExpandComposerButtonProps) => {
	const [expanded, setExpanded] = useState(false);
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
			<MessageComposerInput {...props} ref={inputRef} {...(!!expanded && { height: 500 })} {...(!!expanded && { maxHeight: 500 })} />
		</>
	);
};

export default MessageComposerInputExpandable;
