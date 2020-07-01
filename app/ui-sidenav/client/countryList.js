import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
// import { ReactiveVar } from 'meteor/reactive-var';
import { Promise } from 'meteor/promise';
import { Tracker } from 'meteor/tracker';

import CountriesList from '../../../public/public/countiesList';
// import Countries from '../../models';

const getCountries = () => new Promise((resolve, reject) => {
	Meteor.call('getCountry', (error, result) => {
		if (error) {
			reject(error);
		}
		resolve(result);
	});
});

Template.countryList.helpers({
	getFlag(name) {
		return CountriesList?.filter((cou) => JSON.stringify(cou.name).indexOf(name) !== -1)[0]?.flag;
	},
	countries() {
		console.log(this.list);
		return this.list;
		// const list = getCountries();
		// this.data = [];
		// for (let c = 0; c < list.lenght; c++) {
		// 	this.data.push(list[c]);
		// }
		// console.log(this.data);
		// return this.data;
		// console.log(Countries);
		// return Countries.find({});
		// const c = Template.instance().list.get();
		// console.log(c);
		// return c;

		// console.log(list);

		// list = getCountries.then((value) => value);
		// console.log(list);
		// return ;
		// return [{ name: 'Jordan' }];
	},

});

Template.countryList.onCreated(function() {
	this.list = [];
	Tracker.autorun(async function() {
		await getCountries()
			.then((result) => {
				this.list = result;
			});
	});
});
// Template.countryList.onCreated(async function countryListOnCreated() {
// 	this.list = new ReactiveVar([]);
// 	this.list.set(await Meteor.call('getCountry'));
// });
