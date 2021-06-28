import { Meteor } from "meteor/meteor";

import { settings } from "../../settings";

Meteor.startup(() => {
	settings.addGroup('Discovery', function() {
		this.add('Enabled', false, {
			group: 'Discovery',
			type: 'boolean',
			public: true,
		});
        this.add('Discovery_Tags', '', {
			type: 'string',
            i18nLabel: 'Discovery_Tags',
            i18nDescription: 'Discovery_Tags_Description',
		});
	});
});