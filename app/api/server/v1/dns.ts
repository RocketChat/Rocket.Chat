import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../api';
import { resolveSRV, resolveTXT } from '../../../federation/server/functions/resolveDNS';

API.v1.addRoute('dns.resolve.srv', { authRequired: true }, {
	get() {
		check(this.queryParams, Match.ObjectIncluding({
			url: String,
		}));

		const { url } = this.queryParams;
		if (!url) {
			throw new Meteor.Error('error-missing-param', 'The required "url" param is missing.');
		}

		const resolved = Promise.await(resolveSRV(url));

		return API.v1.success({ resolved });
	},
});

API.v1.addRoute('dns.resolve.txt', { authRequired: true }, {
	post() {
		check(this.queryParams, Match.ObjectIncluding({
			url: String,
		}));

		const { url } = this.queryParams;
		if (!url) {
			throw new Meteor.Error('error-missing-param', 'The required "url" param is missing.');
		}

		const resolved = Promise.await(resolveTXT(url));

		return API.v1.success({ resolved });
	},
});
