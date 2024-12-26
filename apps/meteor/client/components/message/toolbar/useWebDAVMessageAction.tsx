import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { getURL } from '../../../../app/utils/client';
import { useWebDAVAccountIntegrationsQuery } from '../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
import SaveToWebdavModal from '../../../views/room/webdav/SaveToWebdavModal';

export const useWebDAVMessageAction = (
	message: IMessage,
	{ subscription }: { subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const enabled = useSetting('Webdav_Integration_Enabled', false);

	const { data } = useWebDAVAccountIntegrationsQuery({ enabled });

	const setModal = useSetModal();

	if (!enabled || !subscription || !data?.length || !message.file) {
		return null;
	}

	return {
		id: 'webdav-upload',
		icon: 'upload',
		label: 'Save_To_Webdav',
		action() {
			const [attachment] = message.attachments || [];
			const url = getURL(attachment.title_link as string, { full: true });

			setModal(
				<SaveToWebdavModal
					data={{ attachment, url }}
					onClose={() => {
						setModal(null);
					}}
				/>,
			);
		},
		order: 100,
		group: 'menu',
	};
};
