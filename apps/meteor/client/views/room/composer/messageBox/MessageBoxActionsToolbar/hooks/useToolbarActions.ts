import { useUserRoom, useTranslation } from '@rocket.chat/ui-contexts';

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

	const data = (() => {
		const actions: { featured: Array<ToolbarAction>; menu: Array<ToolbarAction | string> } = {
			featured: [],
			menu: ['Create_new', createDiscussionAction],
		};

		if (variant === 'small') {
			actions.featured.push(audioMessageAction);
			actions.menu.push(videoMessageAction, fileUploadAction);
		} else {
			actions.featured.push(videoMessageAction, audioMessageAction, fileUploadAction);
		}

		actions.menu.push(...webdavActions, 'Share', shareLocationAction);

		const groups = {
			...(apps.isSuccess &&
				apps.data.length > 0 && {
					Apps: apps.data,
				}),
			...messageBox.actions.get(),
		};

		const messageBoxActions = Object.entries(groups)
			.flatMap(([name, group]) => {
				const items = group.map((item) => ({
					id: item.id,
					icon: item.icon || '',
					label: t(item.label),
					onClick: item.action,
				}));

				return [t.has(name) && t(name), ...items];
			})
			.filter(isTruthy);

		actions.menu.push(...messageBoxActions);
		return actions;
	})();

	return data;
};
