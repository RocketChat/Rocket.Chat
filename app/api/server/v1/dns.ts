import dns from 'dns';

import { Promise } from 'meteor/promise';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../api';

const dnsResolveSRV = Meteor.wrapAsync(dns.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dns.resolveTxt);

API.v1.addRoute('dns.resolve.srv', { authRequired: true }, {
	get() {
		check(this.queryParams, Match.ObjectIncluding({
			url: String,
		}));

		const { url } = this.queryParams;
		if (!url) {
			throw new Meteor.Error('error-missing-param', 'The required "url" param is missing.');
		}

		const [resolved] = Promise.await(dnsResolveSRV(url));

		// Normalize
		resolved.target = resolved.name;
		delete resolved.name;

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

		const [resolved] = Promise.await(dnsResolveTXT(url));

		return API.v1.success({ resolved });
	},
});
