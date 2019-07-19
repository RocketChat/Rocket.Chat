import { Template } from 'meteor/templating';

import { t } from '../../../../../utils';
import './visitorSession.html';

Template.visitorSession.helpers({
	user() {
		return Template.instance().data;
	},
	pageTitle() {
		return this.navigation.page.title || t('Empty_title');
	},
});
