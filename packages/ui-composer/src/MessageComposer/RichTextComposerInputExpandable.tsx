import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useState, forwardRef } from 'react';
import type { FormEvent, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import RichTextComposerInput from './RichTextComposerInput';

export type RichTextExpandComposerButtonProps = ComponentProps<typeof RichTextComposerInput> & {
	dimensions: Readonly<{
		inlineSize: number;
		blockSize: number;
	}>;
};

const RichTextComposerInputExpandable = forwardRef<HTMLDivElement, RichTextExpandComposerButtonProps>(
	({ dimensions, onInput, ...props }, ref) => {
		const { t } = useTranslation();
		const [expanded, setExpanded] = useState(false);

		const handleInput = (event: FormEvent<HTMLDivElement>) => {
			if ((event.target as HTMLDivElement).innerText.trim().length === 0) {
				setExpanded(false);
			}

			onInput?.(event);
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
				<RichTextComposerInput ref={ref} onInput={handleInput} {...(!!expanded && { height: 500, maxHeight: '50vh' })} {...props} />
			</>
		);
	},
);

RichTextComposerInputExpandable.displayName = 'RichTextComposerInputExpandable';

export default RichTextComposerInputExpandable;
