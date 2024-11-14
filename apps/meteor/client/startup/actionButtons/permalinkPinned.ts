import { isE2EEMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { MessageAction } from '../../../app/ui-utils/client';
import { t } from '../../../app/utils/lib/i18n';
import { getPermaLink } from '../../lib/getPermaLink';
import { dispatchToastMessage } from '../../lib/toast';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'permalink-pinned',
		icon: 'permalink',
		label: 'Copy_link',
		context: ['pinned'],
		async action(_, { message }) {
			try {
				const permalink = await getPermaLink(message._id);
				navigator.clipboard.writeText(permalink);
				dispatchToastMessage({ type: 'success', message: t('Copied') });
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 5,
		group: 'menu',
		disabled({ message }) {
			return isE2EEMessage(message);
		},
	});
});
