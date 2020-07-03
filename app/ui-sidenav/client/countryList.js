import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Promise } from 'meteor/promise';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

import CountriesList from '../../../public/public/countiesList';

const getCountries = () => new Promise((resolve, reject) => {
	Meteor.call('getCountry', (error, result) => {
		if (error) {
			reject(error);
		}
		resolve(result);
	});
});

Template.countryList.onCreated(async function () {
	this.list = new ReactiveVar([]);

	Tracker.autorun(async () => {
		await getCountries()
			.then((result) => {
				this.list.set(result);
			});
		if (FlowRouter.getRouteName() !== 'home') {
			FlowRouter.route(`/country/${ FlowRouter.getParam('name') }`);
		}
	});
});

Template.countryList.helpers({
	getFlag(name) {
		return CountriesList?.filter((cou) => JSON.stringify(cou.name).indexOf(name) !== -1)[0]?.flag;
	},
	countries() {
		const instance = Template.instance();
		return instance.list.get();
	},
});
