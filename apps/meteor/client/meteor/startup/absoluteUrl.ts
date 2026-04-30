import { Meteor } from 'meteor/meteor';

import { _relativeToSiteRootUrl, absoluteUrl } from '../../lib/absoluteUrl';

Object.assign(Meteor, {
	absoluteUrl,
	_relativeToSiteRootUrl,
});
