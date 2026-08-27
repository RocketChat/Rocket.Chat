import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import FormattingToolbarDropdown from './FormattingToolbarDropdown';
import type { FormattingButton } from '../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { isLinePrefixButton, isPromptButton } from '../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { toggleLinePrefix } from '../../../../../../app/ui-message/client/messageBox/toggleLinePrefix';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';

export type MessageBoxFormattingToolbarProps = {
	composer: ComposerAPI;
	variant?: 'small' | 'large';
	items: FormattingButton[];
	disabled: boolean;
};

const MessageBoxFormattingToolbar = ({ items, variant = 'large', composer, disabled }: MessageBoxFormattingToolbarProps) => {
	const { t } = useTranslation();

	const applyFormatter = (formatter: FormattingButton): void => {
		if (isPromptButton(formatter)) {
			formatter.prompt(composer);
			return;
		}

		if (isLinePrefixButton(formatter)) {
			toggleLinePrefix(composer, formatter.linePrefix);
			return;
		}

		if ('link' in formatter) {
			window.open(formatter.link, '_blank', 'rel=noreferrer noopener');
			return;
		}

		composer.wrapSelection(formatter.pattern);
	};

	if (variant === 'small') {
		const collapsedItems = [...items];
		const featuredFormatter = collapsedItems.splice(0, 1)[0];

		return (
			<>
				{'icon' in featuredFormatter && (
					<MessageComposerAction
						onClick={() => applyFormatter(featuredFormatter)}
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
						onClick={(): void => applyFormatter(formatter)}
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
