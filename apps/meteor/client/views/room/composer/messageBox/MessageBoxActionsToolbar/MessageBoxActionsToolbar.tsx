import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { MessageComposerAction, MessageComposerActionsDivider } from '@rocket.chat/ui-composer';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import { memo } from 'react';

import { useAudioMessageAction } from './hooks/useAudioMessageAction';
import { useCreateDiscussionAction } from './hooks/useCreateDiscussionAction';
import { useFileUploadAction } from './hooks/useFileUploadAction';
import { useShareLocationAction } from './hooks/useShareLocationAction';
import { useVideoMessageAction } from './hooks/useVideoMessageAction';
import { useWebdavActions } from './hooks/useWebdavActions';
import { messageBox } from '../../../../../../app/ui-utils/client';
import { isTruthy } from '../../../../../../lib/isTruthy';
import { useMessageboxAppsActionButtons } from '../../../../../hooks/useMessageboxAppsActionButtons';
import { useChat } from '../../../contexts/ChatContext';
import { useRoom } from '../../../contexts/RoomContext';

type MessageBoxActionsToolbarProps = {
	canSend: boolean;
	typing: boolean;
	isMicrophoneDenied: boolean;
	variant: 'small' | 'large';
	isRecording: boolean;
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
};

const isHidden = (hiddenActions: Array<string>, action: GenericMenuItemProps) => {
	if (!action) {
		return true;
	}
	return hiddenActions.includes(action.id);
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
	const t = useTranslation();
	const chatContext = useChat();

	if (!chatContext) {
		throw new Error('useChat must be used within a ChatProvider');
	}

	const room = useRoom();

	const audioMessageAction = useAudioMessageAction(!canSend || typing || isRecording || isMicrophoneDenied, isMicrophoneDenied);
	const videoMessageAction = useVideoMessageAction(!canSend || typing || isRecording);
	const fileUploadAction = useFileUploadAction(!canSend || typing || isRecording);
	const webdavActions = useWebdavActions();
	const createDiscussionAction = useCreateDiscussionAction(room);
	const shareLocationAction = useShareLocationAction(room, tmid);

	const apps = useMessageboxAppsActionButtons();
	const { composerToolbox: hiddenActions } = useLayoutHiddenActions();

	const allActions = {
		...(!isHidden(hiddenActions, audioMessageAction) && { audioMessageAction }),
		...(!isHidden(hiddenActions, videoMessageAction) && { videoMessageAction }),
		...(!isHidden(hiddenActions, fileUploadAction) && { fileUploadAction }),
		...(!isHidden(hiddenActions, createDiscussionAction) && { createDiscussionAction }),
		...(!isHidden(hiddenActions, shareLocationAction) && { shareLocationAction }),
		...(!hiddenActions.includes('webdav-add') && { webdavActions }),
	};

	const featured = [];
	const createNew = [];
	const share = [];

	createNew.push(allActions.createDiscussionAction);

	if (variant === 'small') {
		featured.push(allActions.audioMessageAction, allActions.fileUploadAction);
		createNew.push(allActions.videoMessageAction);
	} else {
		featured.push(allActions.audioMessageAction, allActions.videoMessageAction, allActions.fileUploadAction);
	}

	if (allActions.webdavActions) {
		createNew.push(...allActions.webdavActions);
	}

	share.push(allActions.shareLocationAction);

	const groups = {
		...(apps.isSuccess &&
			apps.data.length > 0 && {
				Apps: apps.data,
			}),
		...messageBox.actions.get(),
	};

	const messageBoxActions = Object.entries(groups).map(([name, group]) => {
		const items: GenericMenuItemProps[] = group
			.filter((item) => !hiddenActions.includes(item.id))
			.map((item) => ({
				id: item.id,
				icon: item.icon as ComponentProps<typeof Icon>['name'],
				content: t(item.label),
				onClick: (event?: MouseEvent<HTMLElement>) =>
					item.action({
						rid,
						tmid,
						event: event as unknown as Event,
						chat: chatContext,
					}),
				gap: Boolean(!item.icon),
			}));

		return {
			title: t(name as TranslationKey),
			items: items || [],
		};
	});

	const createNewFiltered = createNew.filter(isTruthy);
	const shareFiltered = share.filter(isTruthy);

	const renderAction = ({ id, icon, content, disabled, onClick }: GenericMenuItemProps) => {
		if (!icon) {
			return;
		}

		return <MessageComposerAction key={id} icon={icon} data-qa-id={id} title={content as string} disabled={disabled} onClick={onClick} />;
	};

	return (
		<>
			<MessageComposerActionsDivider />
			{featured.map((action) => action && renderAction(action))}
			<GenericMenu
				disabled={isRecording}
				data-qa-id='menu-more-actions'
				detached
				icon='plus'
				sections={[{ title: t('Create_new'), items: createNewFiltered }, { title: t('Share'), items: shareFiltered }, ...messageBoxActions]}
				title={t('More_actions')}
			/>
		</>
	);
};

export default memo(MessageBoxActionsToolbar);
