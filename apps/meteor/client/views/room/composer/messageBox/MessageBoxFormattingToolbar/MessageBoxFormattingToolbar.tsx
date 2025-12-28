import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import FormattingToolbarDropdown from './FormattingToolbarDropdown';
import type { FormattingButton } from '../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { isPromptButton } from '../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';

type MessageBoxFormattingToolbarProps = {
	composer: ComposerAPI;
	variant?: 'small' | 'large';
	items: FormattingButton[];
	disabled: boolean;
};

const MessageBoxFormattingToolbar = ({ items, variant = 'large', composer, disabled }: MessageBoxFormattingToolbarProps) => {
	const { t } = useTranslation();

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
						title={t(featuredFormatter.label)}
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
					<span key={formatter.label} {...(disabled && { style: { pointerEvents: 'none' } })} title={formatter.label}>
						<a href={formatter.link} target='_blank' rel='noopener noreferrer'>
							{formatter.text()}
						</a>
					</span>
				),
			)}
		</>
	);
};

export default memo(MessageBoxFormattingToolbar);
