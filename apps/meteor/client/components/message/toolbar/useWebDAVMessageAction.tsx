import type { IMessage, ISubscription } from '@rocket.chat/core-typings';

import { useWebDAVAccountIntegrationsQuery } from '../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageActionsContext';

export const useWebDAVMessageAction = (
	message: IMessage,
	{ subscription }: { subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const enabled = policy.settings.webdavEnabled ?? false;

	const { data } = useWebDAVAccountIntegrationsQuery({ enabled });

	const actions = useMessageActions();

	if (!enabled || !subscription || !data?.length || !message.file) {
		return null;
	}

	return {
		id: 'webdav-upload',
		icon: 'upload',
		label: 'Save_To_Webdav',
		action() {
			actions.saveToWebdav(message);
		},
		order: 100,
		group: 'menu',
	};
};
