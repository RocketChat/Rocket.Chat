import { Meteor } from 'meteor/meteor';

import { imperativeModal } from '../../../client/lib/imperativeModal';
import { messageArgs } from '../../../client/lib/utils/messageArgs';
import SaveToWebdav from '../../../client/views/room/webdav/SaveToWebdavModal';
import { WebdavAccounts } from '../../models/client';
import { settings } from '../../settings/client';
import { MessageAction } from '../../ui-utils/client';
import { getURL } from '../../utils/client';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'webdav-upload',
		icon: 'upload',
		label: 'Save_To_Webdav',
		condition: ({ message, subscription }) => {
			if (subscription == null) {
				return false;
			}
			if (WebdavAccounts.findOne() == null) {
				return false;
			}
			if (!message.file) {
				return false;
			}

			return settings.get('Webdav_Integration_Enabled');
		},
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			const [attachment] = message.attachments || [];
			const url = getURL(attachment.title_link as string, { full: true });
			imperativeModal.open({
				component: SaveToWebdav,
				props: {
					data: {
						attachment,
						url,
					},
					onClose: imperativeModal.close,
				},
			});
		},
		order: 100,
		group: 'menu',
	});
});
