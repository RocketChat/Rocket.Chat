import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useState, forwardRef } from 'react';
import type { ChangeEvent, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import MessageComposerInput from './MessageComposerInput';

export type ExpandComposerButtonProps = ComponentProps<typeof Box> & {
	dimensions: Readonly<{
		inlineSize: number;
		blockSize: number;
	}>;
};

const MessageComposerInputExpandable = forwardRef<HTMLTextAreaElement, ExpandComposerButtonProps>(
	({ dimensions, onChange, ...props }, ref) => {
		const { t } = useTranslation();
		const [expanded, setExpanded] = useState(false);

		const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
			if (event.target.value.length === 0) {
				setExpanded(false);
			}

			onChange?.(event);
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
						<IconButton
							small
							icon={expanded ? 'arrow-collapse' : 'arrow-expand'}
							title={expanded ? t('Collapse') : t('Expand')}
							onClick={() => setExpanded(!expanded)}
						/>
					</Box>
				)}
				<MessageComposerInput ref={ref} onChange={handleChange} {...(!!expanded && { height: 500, maxHeight: '50vh' })} {...props} />
			</>
		);
	},
);

MessageComposerInputExpandable.displayName = 'MessageComposerInputExpandable';

export default MessageComposerInputExpandable;
