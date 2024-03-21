import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import type { FormattingButton } from '../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { isPromptButton } from '../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';
import FormattingToolbarDropdown from './FormattingToolbarDropdown';

type MessageBoxFormattingToolbarProps = {
	composer: ComposerAPI;
	variant?: 'small' | 'large';
	items: FormattingButton[];
	disabled: boolean;
};

const MessageBoxFormattingToolbar = ({ items, variant = 'large', composer, disabled }: MessageBoxFormattingToolbarProps) => {
	const t = useTranslation();

	if (variant === 'small') {
		const collapsedItems = [...items];
		const featuredFormatter = collapsedItems.splice(0, 1)[0];

		return (
			<>
				{'icon' in featuredFormatter && (
					<MessageComposerAction
						onClick={() =>
							isPromptButton(featuredFormatter) ? featuredFormatter.prompt(composer) : composer.wrapSelection(featuredFormatter.pattern)
						}
						icon={featuredFormatter.icon}
						disabled={disabled}
					/>
				)}
				<FormattingToolbarDropdown composer={composer} items={collapsedItems} disabled={disabled} />
			</>
		);
	}

	return (
		<>
			{items.map((formatter) =>
				'icon' in formatter ? (
					<MessageComposerAction
						disabled={disabled}
						icon={formatter.icon}
						key={formatter.label}
						data-id={formatter.label}
						title={t(formatter.label)}
						onClick={(): void => {
							if (isPromptButton(formatter)) {
								formatter.prompt(composer);
								return;
							}
							if ('link' in formatter) {
								window.open(formatter.link, '_blank', 'rel=noreferrer noopener');
								return;
							}
							composer.wrapSelection(formatter.pattern);
						}}
					/>
				) : (
					<span
						{...(disabled && { style: { pointerEvents: 'none' } })}
						className='rc-message-box__toolbar-formatting-item'
						title={formatter.label}
						key={formatter.label}
					>
						<a href={formatter.link} target='_blank' rel='noopener noreferrer' className='rc-message-box__toolbar-formatting-link'>
							{formatter.text()}
						</a>
					</span>
				),
			)}
		</>
	);
};

export default memo(MessageBoxFormattingToolbar);
