import { Meteor } from 'meteor/meteor';

import { AutoTranslate } from './autotranslate';

Meteor.startup(() => {
	AutoTranslate.init();
});
