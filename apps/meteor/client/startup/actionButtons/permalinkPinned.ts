import { Meteor } from 'meteor/meteor';

import { t } from '../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../lib/toast';
import { ui } from '../../lib/ui';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	ui.addMessageAction({
		id: 'permalink-pinned',
		icon: 'permalink',
		label: 'Get_link',
		context: ['pinned'],
		async action(_, props) {
			try {
				const { message = messageArgs(this).msg } = props;
				const permalink = await ui.getMessageLinkById(message._id);
				navigator.clipboard.writeText(permalink);
				dispatchToastMessage({ type: 'success', message: t('Copied') });
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 101,
		group: 'menu',
	});
});
