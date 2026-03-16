import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { memo, useEffect, useState } from 'react';
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
	const [activeModes, setActiveModes] = useState<Record<string, boolean>>({});

	useEffect(() => {
		const textarea = composer.composerRef.current?.querySelector('textarea');
		if (!textarea) return;

		const handleInput = () => {
			if (!textarea.value) {
				setActiveModes({});
			}
		};

		textarea.addEventListener('input', handleInput);
		return () => textarea.removeEventListener('input', handleInput);
	}, [composer]);

	const toggleMode = (pattern: string, label: string) => {
		composer.wrapSelection(pattern);
		setActiveModes((prev) => ({ ...prev, [label]: !prev[label] }));
	};

	if (variant === 'small') {
		const collapsedItems = [...items];
		const featuredFormatter = collapsedItems.splice(0, 1)[0];

		return (
			<>
				{'icon' in featuredFormatter && (
					<MessageComposerAction
						onClick={() =>
							isPromptButton(featuredFormatter)
								? featuredFormatter.prompt(composer)
								: toggleMode(featuredFormatter.pattern, featuredFormatter.label)
						}
						icon={featuredFormatter.icon}
						title={t(featuredFormatter.label)}
						disabled={disabled}
						pressed={!!activeModes[featuredFormatter.label]}
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
						key={formatter.label}
						icon={formatter.icon}
						title={t(formatter.label)}
						disabled={disabled}
						pressed={!!activeModes[formatter.label]}
						onClick={() => {
							if (isPromptButton(formatter)) return formatter.prompt(composer);
							if ('link' in formatter) return window.open(formatter.link, '_blank', 'rel=noreferrer noopener');
							toggleMode(formatter.pattern, formatter.label);
						}}
					/>
				) : null,
			)}
		</>
	);
};

export default memo(MessageBoxFormattingToolbar);