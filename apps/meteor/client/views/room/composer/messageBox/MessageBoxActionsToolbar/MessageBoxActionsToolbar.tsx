import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import type { GenericMenuItemProps } from '../../../../../components/GenericMenu/GenericMenuItem';
import ActionsToolbarDropdown from './ActionsToolbarDropdown';
import { useAudioMessageAction } from './actions/useAudioMessageAction';
import { useFileUploadAction } from './actions/useFileUploadAction';
import useVideoMessageAction from './actions/useVideoMessageAction';

type MessageBoxActionsToolbarProps = {
	variant: 'small' | 'large';
	isRecording: boolean;
	typing: boolean;
	canSend: boolean;
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	isMicrophoneDenied?: boolean;
};

const MessageBoxActionsToolbar = ({
	variant = 'large',
	isRecording,
	typing,
	canSend,
	rid,
	tmid,
	isMicrophoneDenied,
}: MessageBoxActionsToolbarProps) => {
	const t = useTranslation();

	const { handleRecordButtonClick, audioTitle, isAudioAllowed } = useAudioMessageAction(isMicrophoneDenied);
	const { handleOpenVideoMessage, videoTitle, isVideoAllowed } = useVideoMessageAction();
	const { handleUpload, handleUploadChange, fileUploadEnabled, fileInputRef } = useFileUploadAction();

	const audioMessageItem: GenericMenuItemProps = {
		id: 'audio-record',
		content: audioTitle,
		icon: 'mic',
		disabled: !isAudioAllowed || !canSend || typing || isRecording || isMicrophoneDenied,
		onClick: () => handleRecordButtonClick(),
	};

	const videoMessageItem: GenericMenuItemProps = {
		id: 'video-message',
		content: videoTitle,
		icon: 'video',
		disabled: !isVideoAllowed || !canSend || typing || isRecording,
		onClick: () => handleOpenVideoMessage(),
	};

	const fileUploadItem: GenericMenuItemProps = {
		id: 'file-upload',
		content: t('Upload_file'),
		icon: 'clip',
		disabled: !fileUploadEnabled || !canSend || isRecording,
		onClick: () => handleUpload(),
	};

	const actions = [audioMessageItem, videoMessageItem, fileUploadItem];

	let featuredAction;
	if (variant === 'small') {
		featuredAction = actions.splice(0, 1);
	}

	const renderAction = ({ id, icon, content, disabled, onClick }: GenericMenuItemProps) => {
		if (!icon) {
			return;
		}

		return <MessageComposerAction key={id} icon={icon} data-qa-id={id} title={content as string} disabled={disabled} onClick={onClick} />;
	};

	return (
		<>
			{variant !== 'small' && actions.map((action) => renderAction(action))}
			{variant === 'small' && featuredAction?.map((action) => renderAction(action))}
			<ActionsToolbarDropdown actions={variant === 'small' ? actions : undefined} isRecording={isRecording} rid={rid} tmid={tmid} />
			<input ref={fileInputRef} type='file' onChange={handleUploadChange} multiple style={{ display: 'none' }} />
		</>
	);
};

export default memo(MessageBoxActionsToolbar);
