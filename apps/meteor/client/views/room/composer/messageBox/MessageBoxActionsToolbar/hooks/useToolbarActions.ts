import { useUserRoom, useTranslation, useLayoutHiddenActions } from '@rocket.chat/ui-contexts';

import { messageBox } from '../../../../../../../app/ui-utils/client';
import { isTruthy } from '../../../../../../../lib/isTruthy';
import { useMessageboxAppsActionButtons } from '../../../../../../hooks/useAppActionButtons';
import type { ToolbarAction } from './ToolbarAction';
import { useAudioMessageAction } from './useAudioMessageAction';
import { useCreateDiscussionAction } from './useCreateDiscussionAction';
import { useFileUploadAction } from './useFileUploadAction';
import { useShareLocationAction } from './useShareLocationAction';
import { useVideoMessageAction } from './useVideoMessageAction';
import { useWebdavActions } from './useWebdavActions';

type ToolbarActionsOptions = {
	variant: 'small' | 'large';
	canSend: boolean;
	typing: boolean;
	isRecording: boolean;
	isMicrophoneDenied: boolean;
	rid: string;
	tmid?: string;
};

const isHidden = (hiddenActions: Array<string>, action: ToolbarAction) => {
	if (!action) {
		return true;
	}
	return hiddenActions.includes(action.id);
};

export const useToolbarActions = ({ canSend, typing, isRecording, isMicrophoneDenied, rid, tmid, variant }: ToolbarActionsOptions) => {
	const room = useUserRoom(rid);
	const t = useTranslation();

	const videoMessageAction = useVideoMessageAction(!canSend || typing || isRecording);
	const audioMessageAction = useAudioMessageAction(!canSend || typing || isRecording || isMicrophoneDenied, isMicrophoneDenied);
	const fileUploadAction = useFileUploadAction(!canSend || typing || isRecording);
	const webdavActions = useWebdavActions();
	const createDiscussionAction = useCreateDiscussionAction(room);
	const shareLocationAction = useShareLocationAction(room, tmid);

	const apps = useMessageboxAppsActionButtons();
	const { composerToolbox: hiddenActions } = useLayoutHiddenActions();

	const allActions = {
		...(!isHidden(hiddenActions, videoMessageAction) && { videoMessageAction }),
		...(!isHidden(hiddenActions, audioMessageAction) && { audioMessageAction }),
		...(!isHidden(hiddenActions, fileUploadAction) && { fileUploadAction }),
		...(!isHidden(hiddenActions, createDiscussionAction) && { createDiscussionAction }),
		...(!isHidden(hiddenActions, shareLocationAction) && { shareLocationAction }),
		...(!hiddenActions.includes('webdav-add') && { webdavActions }),
	};

	const data: { featured: ToolbarAction[]; menu: Array<string | ToolbarAction> } = (() => {
		const featured: Array<ToolbarAction | undefined> = [];
		const createNew = [];
		const share = [];

		if (variant === 'small') {
			featured.push(allActions.audioMessageAction);
			createNew.push(allActions.videoMessageAction, allActions.fileUploadAction);
		} else {
			featured.push(allActions.videoMessageAction, allActions.audioMessageAction, allActions.fileUploadAction);
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

		const messageBoxActions = Object.entries(groups).reduce<Array<string | ToolbarAction>>((acc, [name, group]) => {
			const items = group
				.filter((item) => !hiddenActions.includes(item.id))
				.map(
					(item): ToolbarAction => ({
						id: item.id,
						icon: item.icon,
						label: t(item.label),
						onClick: item.action,
					}),
				);

			if (items.length === 0) {
				return acc;
			}
			return [...acc, (t.has(name) && t(name)) || name, ...items];
		}, []);

		const createNewFiltered = createNew.filter(isTruthy);
		const shareFiltered = share.filter(isTruthy);

		return {
			featured: featured.filter(isTruthy),
			menu: [
				...(createNewFiltered.length > 0 ? ['Create_new', ...createNewFiltered] : []),
				...(shareFiltered.length > 0 ? ['Share', ...shareFiltered] : []),
				...messageBoxActions,
			],
		};
	})();

	return data;
};
