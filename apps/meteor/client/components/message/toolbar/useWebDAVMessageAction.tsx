import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { getURL } from '../../../../app/utils/client';
import { useWebDAVAccountIntegrationsQuery } from '../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
import { messageArgs } from '../../../lib/utils/messageArgs';
import SaveToWebdavModal from '../../../views/room/webdav/SaveToWebdavModal';

export const useWebDAVMessageAction = () => {
	const enabled = useSetting<boolean>('Webdav_Integration_Enabled', false);

	const { data } = useWebDAVAccountIntegrationsQuery({ enabled });

	const setModal = useSetModal();

	useEffect(() => {
		if (!enabled) {
			return;
		}

		MessageAction.addButton({
			id: 'webdav-upload',
			icon: 'upload',
			label: 'Save_To_Webdav',
			condition: ({ message, subscription }) => {
				return !!subscription && !!data?.length && !!message.file;
			},
			action(_, props) {
				const { message = messageArgs(this).msg } = props;
				const [attachment] = message.attachments || [];
				const url = getURL(attachment.title_link as string, { full: true });

				setModal(<SaveToWebdavModal data={{ attachment, url }} onClose={() => setModal(undefined)} />);
			},
			order: 100,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('webdav-upload');
		};
	}, [data?.length, enabled, setModal]);
};
