import { Meteor } from 'meteor/meteor';

import { MessageAction } from '../../../app/ui-utils/client';
import { t } from '../../../app/utils/lib/i18n';
import { getPermaLink } from '../../lib/getPermaLink';
import { dispatchToastMessage } from '../../lib/toast';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'permalink-star',
		icon: 'permalink',
		label: 'Get_link',
		// classes: 'clipboard',
		context: ['starred', 'threads', 'videoconf-threads'],
		async action(_, props) {
			try {
				const { message = messageArgs(this).msg } = props;
				const permalink = await getPermaLink(message._id);
				navigator.clipboard.writeText(permalink);
				dispatchToastMessage({ type: 'success', message: t('Copied') });
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		},
		condition({ message, subscription, user }) {
			if (subscription == null) {
				return false;
			}

			return Boolean(message.starred?.find((star) => star._id === user?._id));
		},
		order: 101,
		group: 'menu',
	});
});
