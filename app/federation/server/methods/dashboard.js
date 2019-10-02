import { Meteor } from 'meteor/meteor';

import { federationGetServers, federationGetOverviewData } from '../functions/dashboard';

Meteor.methods({
	'federation:getOverviewData': federationGetOverviewData,
	'federation:getServers': federationGetServers,
});
