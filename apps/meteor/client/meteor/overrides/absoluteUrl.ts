// TODO: remove this file together with the Meteor webapp/DDP layer — it only
// exists to patch Meteor.absoluteUrl's rootUrl, which no longer has a caller
// once DDP is gone.
import { Meteor } from 'meteor/meteor';

import { _relativeToSiteRootUrl, absoluteUrl } from '../../lib/absoluteUrl';

Object.assign(Meteor, {
	absoluteUrl,
	_relativeToSiteRootUrl,
});
