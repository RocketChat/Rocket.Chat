import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import type { ChatAPI } from '../../../../../../../lib/chats/ChatAPI';
import { useChat } from '../../../../../contexts/ChatContext';

type AudioMessageActionProps = {
	chatContext?: ChatAPI;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const AudioMessageAction = ({ chatContext, ...props }: AudioMessageActionProps) => {
	const t = useTranslation();
	const chat = useChat() ?? chatContext;

	const handleRecordButtonClick = () => chat?.composer?.setRecordingMode(true);

	return (
		<MessageComposerAction
			title={t('Audio_message')}
			icon='mic'
			className='rc-message-box__icon rc-message-box__audio-message-mic'
			data-qa-id='audio-record'
			onClick={handleRecordButtonClick}
			{...props}
		/>
	);
};

export default AudioMessageAction;
