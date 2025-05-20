import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import { GenericMenu, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { MessageComposerAction, MessageComposerActionsDivider } from '@rocket.chat/ui-composer';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import { memo } from 'react';

import type { MessageBoxAction } from '../../../../../../app/ui-utils/client/lib/messageBox';
import { useAudioMessageAction } from './hooks/useAudioMessageAction';
import { useCreateDiscussionAction } from './hooks/useCreateDiscussionAction';
import { useFileUploadAction } from './hooks/useFileUploadAction';
import { useShareLocationAction } from './hooks/useShareLocationAction';
import { useVideoMessageAction } from './hooks/useVideoMessageAction';
import { useWebdavActions } from './hooks/useWebdavActions';

// Added for Timestamp feature
import { useTimestampAction } from './hooks/useTimestampAction';
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


// Type alias for timestamp hook's return type 
type ActionHookResultFunc = () => GenericMenuItemProps;

// Modified isHidden to handle both direct objects and functions returning objects
const isHidden = (
    hiddenActions: Array<string>,
    actionOrCallback?: GenericMenuItemProps | ActionHookResultFunc | GenericMenuItemProps[] | ActionHookResultFunc[]
) => {
    if (!actionOrCallback) {
        return true;
    }

    let actionsToCheck: GenericMenuItemProps[];

    if (typeof actionOrCallback === 'function') {
        // If it's a function (our timestamp hook), call it
        actionsToCheck = [actionOrCallback()];
    } else if (Array.isArray(actionOrCallback)) {
        // If it's an array (potentially webdav), check if elements are functions or objects
        actionsToCheck = actionOrCallback.map(item => typeof item === 'function' ? item() : item);
    } else {
        // If it's already an object (built-in hooks)
        actionsToCheck = [actionOrCallback];
    }

    // Hide if *any* action's ID is in the hidden list
    return actionsToCheck.some(action => action && hiddenActions.includes(action.id));
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

    // Get the hook results (can be functions or objects)
    const audioMessageActionResult = useAudioMessageAction(!canSend || typing || isRecording || isMicrophoneDenied, isMicrophoneDenied);
    const videoMessageActionResult = useVideoMessageAction(!canSend || typing || isRecording);
    const fileUploadActionResult = useFileUploadAction(!canSend || typing || isRecording);
    const webdavActionsResult = useWebdavActions(); 
    const createDiscussionActionResult = useCreateDiscussionAction(room); 
    const shareLocationActionResult = useShareLocationAction(room, tmid); 
	// Added for Timestamp feature: Get the function that generates timestamp action props
    const timestampActionCallback = useTimestampAction(chatContext.composer, !canSend || typing || isRecording);

    const apps = useMessageboxAppsActionButtons();
    const { composerToolbox: hiddenActions } = useLayoutHiddenActions();

    // Filter actions based on settings/layout
    const allActions: { [key: string]: GenericMenuItemProps | GenericMenuItemProps[] | undefined } = {
        ...(!isHidden(hiddenActions, audioMessageActionResult) && { audioMessageAction: audioMessageActionResult }),
        ...(!isHidden(hiddenActions, videoMessageActionResult) && { videoMessageAction: videoMessageActionResult }),
        ...(!isHidden(hiddenActions, fileUploadActionResult) && { fileUploadAction: fileUploadActionResult }),
        ...(!isHidden(hiddenActions, createDiscussionActionResult) && { createDiscussionAction: createDiscussionActionResult }),
        ...(!isHidden(hiddenActions, shareLocationActionResult) && { shareLocationAction: shareLocationActionResult }),
        ...(!hiddenActions.includes('webdav-add') && webdavActionsResult && { webdavActions: webdavActionsResult }),
        // Added for Timestamp feature: Check if hidden, then call the callback to get props 
        ...(!isHidden(hiddenActions, timestampActionCallback) && { timestampAction: timestampActionCallback() }),
    };

    const featured: GenericMenuItemProps[] = [];
    const createNew: GenericMenuItemProps[] = [];
    const share: GenericMenuItemProps[] = [];
	// Added for Timestamp feature: Group for less common actions
    const others: GenericMenuItemProps[] = [];

    allActions.createDiscussionAction && !Array.isArray(allActions.createDiscussionAction) && createNew.push(allActions.createDiscussionAction);
    allActions.shareLocationAction && !Array.isArray(allActions.shareLocationAction) && share.push(allActions.shareLocationAction);
	// Added for Timestamp feature: Add timestamp action to the 'others' group
    allActions.timestampAction && !Array.isArray(allActions.timestampAction) && others.push(allActions.timestampAction);

    if (variant === 'small') {
        allActions.audioMessageAction && !Array.isArray(allActions.audioMessageAction) && featured.push(allActions.audioMessageAction);
        allActions.fileUploadAction && !Array.isArray(allActions.fileUploadAction) && featured.push(allActions.fileUploadAction);
        allActions.videoMessageAction && !Array.isArray(allActions.videoMessageAction) && createNew.push(allActions.videoMessageAction);
    } else {
        allActions.audioMessageAction && !Array.isArray(allActions.audioMessageAction) && featured.push(allActions.audioMessageAction);
        allActions.videoMessageAction && !Array.isArray(allActions.videoMessageAction) && featured.push(allActions.videoMessageAction);
        allActions.fileUploadAction && !Array.isArray(allActions.fileUploadAction) && featured.push(allActions.fileUploadAction);
    }

    if (allActions.webdavActions) {
        if (Array.isArray(allActions.webdavActions)) {
            createNew.push(...allActions.webdavActions);
        } else {
            createNew.push(allActions.webdavActions as GenericMenuItemProps); 
        }
    }

    const groups: { [key: string]: MessageBoxAction[] } = {
        ...(apps.isSuccess &&
            apps.data?.length > 0 && {
                Apps: apps.data as MessageBoxAction[], 
            }),
        ...messageBox.actions.get(),
    };

    const messageBoxActionSections = Object.entries(groups).map(([name, group]) => {
        const items: GenericMenuItemProps[] = group
            .filter((item) => !hiddenActions.includes(item.id))
            .map((item: MessageBoxAction) => ({
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
                gap: !item.icon,
            }));

        return {
            title: t(name as TranslationKey),
            items: items.filter(isTruthy),
        };
    });

    const createNewFiltered = createNew.filter(isTruthy);
    const shareFiltered = share.filter(isTruthy);
	// Added for Timestamp feature: Filter the 'others' group
    const othersFiltered = others.filter(isTruthy);

    const renderAction = (action: GenericMenuItemProps | undefined) => {
        if (!action || !action.icon) {
            return null;
        }

        return (
            <MessageComposerAction
                key={action.id}
                icon={action.icon as ComponentProps<typeof Icon>['name']}
                data-qa-id={action.id}
                title={action.content ? t(action.content as TranslationKey) : ''}
                disabled={action.disabled}
                onClick={action.onClick}
            />
        );
    };

    const menuSections = [
        ...(createNewFiltered.length > 0 ? [{ title: t('Create_new'), items: createNewFiltered }] : []),
        ...(shareFiltered.length > 0 ? [{ title: t('Share'), items: shareFiltered }] : []),
        ...(othersFiltered.length > 0 ? [{ title: 'Other Actions', items: othersFiltered }] : []),
        ...messageBoxActionSections,
    ].filter(section => section.items.length > 0);

    return (
        <>
            <MessageComposerActionsDivider />
            {featured.map(renderAction)}
            <GenericMenu
                disabled={isRecording}
                data-qa-id='menu-more-actions'
                detached
                icon='plus'
                sections={menuSections}
                title={t('More_actions')}
            />
        </>
    );
};

export default memo(MessageBoxActionsToolbar);
