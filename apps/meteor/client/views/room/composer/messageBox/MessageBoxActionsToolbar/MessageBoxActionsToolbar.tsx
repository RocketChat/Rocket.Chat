import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { Option, OptionTitle, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { MessageComposerAction, MessageComposerActionsDivider } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

import { useChat } from '../../../contexts/ChatContext';
import ActionsToolbarDropdown from './ActionsToolbarDropdown';
import { useToolbarActions } from './hooks/useToolbarActions';

type MessageBoxActionsToolbarProps = {
	canSend: boolean;
	typing: boolean;
	isMicrophoneDenied: boolean;
	variant: 'small' | 'large';
	isRecording: boolean;
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
};

const MessageBoxActionsToolbar = ({
	canSend,
	typing,
	isRecording,
	rid,
	tmid,
	variant = 'large',
	isMicrophoneDenied,
}: MessageBoxActionsToolbarProps) => {
	const data = useToolbarActions({
		canSend,
		typing,
		isRecording,
		isMicrophoneDenied: Boolean(isMicrophoneDenied),
		rid,
		tmid,
		variant,
	});

	const { featured, menu } = data;
	const t = useTranslation();
	const chatContext = useChat();

	if (!chatContext) {
		throw new Error('useChat must be used within a ChatProvider');
	}

	if (!featured.length && !menu.length) {
		return null;
	}

	return (
		<>
			<MessageComposerActionsDivider />
			{featured.map((action) => (
				<MessageComposerAction
					key={action.id}
					{...action}
					data-qa-id={action.id}
					icon={action.icon as ComponentProps<typeof MessageComposerAction>['icon']}
				/>
			))}
			{menu.length > 0 && (
				<ActionsToolbarDropdown disabled={isRecording}>
					{() =>
						menu.map((option) => {
							if (typeof option === 'string') {
								return <OptionTitle key={option}>{t.has(option) ? t(option) : option}</OptionTitle>;
							}

							return (
								<Option
									key={option.id}
									onClick={(event) =>
										option.onClick({
											rid,
											tmid,
											event: event as unknown as Event,
											chat: chatContext,
										})
									}
									gap={!option.icon}
									disabled={option.disabled}
								>
									{option.icon && <OptionIcon name={option.icon as ComponentProps<typeof OptionIcon>['name']} />}
									<OptionContent>{option.label}</OptionContent>
								</Option>
							);
						})
					}
				</ActionsToolbarDropdown>
			)}
		</>
	);
};

export default memo(MessageBoxActionsToolbar);
