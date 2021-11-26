import _ from 'underscore';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';

import { CannedResponse } from '../../collections/CannedResponse';
import { addMessagePopup, removeMessagePopup } from '../../../../../../app/ui-message/client/popup/customMessagePopups';
import { t } from '../../../../../../app/utils';
import { settings } from '../../../../../../app/settings';

const added = new ReactiveVar(false);
Tracker.autorun(() => {
	const templateFunc = (template) => ({
		title: t('Canned_Responses'),
		collection: CannedResponse,
		trigger: '!',
		prefix: '',
		suffix: ' ',
		triggerAnywhere: true,
		template: 'messagePopupCannedResponse',
		rid: template.data.rid,
		getInput: template.data.getInput,
		textFilterDelay: 500,
		getFilter: (collection, filter) => {
			const exp = new RegExp(filter, 'i');
			const records = collection.find({
				shortcut: exp,
			}, {
				reactive: 1,
				limit: 12,
				sort: {
					shortcut: -1,
				},
			}).fetch();

			return records;
		},
		getValue: (_id, collection, records) => {
			const record = _.findWhere(records, {
				_id,
			});
			return record && record.text;
		},
	});

	const settingValue = settings.get('Canned_Responses_Enable');
	if (settingValue && !added.get()) {
		addMessagePopup(templateFunc, 'cannedResponses');
		added.set(true);
	} else if (!settingValue && added.get()) {
		removeMessagePopup('cannedResponses');
		added.set(false);
	}
});
