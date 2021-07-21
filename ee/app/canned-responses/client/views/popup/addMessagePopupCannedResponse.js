import _ from 'underscore';

import { CannedResponse } from '../../collections/CannedResponse';
import { addMessagePopup } from '../../../../../../app/ui-message/client/popup/customMessagePopups';
import { t } from '../../../../../../app/utils';

addMessagePopup((template) => ({
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
}));
