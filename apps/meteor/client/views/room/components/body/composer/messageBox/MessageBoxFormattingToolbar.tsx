import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import type { FormattingButton } from '../../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { popover } from '../../../../../../../app/ui-utils/client';
import type { ComposerAPI } from '../../../../../../lib/chats/ChatAPI';

type MessageBoxFormattingToolbarProps = {
	disabled: boolean;
	items: FormattingButton[];
	composer: ComposerAPI;
	variant?: 'small' | 'large';
};

export const MessageBoxFormattingToolbar = ({ items, variant = 'large', composer, ...props }: MessageBoxFormattingToolbarProps) => {
	const t = useTranslation();

	if (variant === 'small') {
		return (
			<MessageComposerAction
				{...props}
				onClick={(event): void => {
					const config = {
						popoverClass: 'message-box',
						columns: [
							{
								groups: [
									{
										title: t('Message_Formatting_Toolbox'),
										items: items.map((item) =>
											'icon' in item
												? {
														icon: item.icon,
														name: t(item.label),
														type: 'messagebox-action',
														id: item.label,
														action: () => composer.wrapSelection(item.pattern),
												  }
												: {
														icon: 'link',
														name: item.label,
														type: 'messagebox-action',
														id: item.label,
														action: () => window.open(item.link, '_blank'),
												  },
										),
									},
								],
							},
						],
						offsetVertical: 10,
						direction: 'top-inverted',
						currentTarget: event.currentTarget,
						activeElement: event.currentTarget,
					};

					popover.open(config);
				}}
				icon='bold'
			/>
		);
	}
	return (
		<>
			{items.map((formatter) =>
				'icon' in formatter ? (
					<MessageComposerAction
						{...props}
						icon={formatter.icon}
						key={formatter.label}
						data-id={formatter.label}
						title={t(formatter.label)}
						onClick={(): void => {
							if ('link' in formatter) {
								window.open(formatter.link, '_blank', 'rel=noreferrer noopener');
								return;
							}
							composer.wrapSelection(formatter.pattern);
						}}
					/>
				) : (
					<span
						{...props}
						{...(props.disabled && { style: { pointerEvents: 'none' } })}
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
