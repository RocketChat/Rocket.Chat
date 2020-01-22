import { Template } from 'meteor/templating';

import { getShareData } from '../../utils';

function getShareString() {
	const data = getShareData();
	return `${ data.title } \n${ data.url } \n${ data.text }`;
}

Template.share.helpers({

});

Template.share.events({
	'click [data-type="copy"]'() {
		console.log(getShareString());
		navigator.clipboard.writeText(getShareString());
	},
	'click [data-type="print"]'() {
		self.print();
	},
	'click [data-type="email"]'() {
		const { title } = getShareData();
		window.open(`mailto:?subject=${ title }&body=${ getShareString() }`);
	},
	'click [data-type="sms"]'() {
		location.href = `sms:'Pick a contact'?&body=${ getShareString() }`;
	},
});
