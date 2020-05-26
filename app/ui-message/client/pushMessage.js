import { Template } from 'meteor/templating';

import './pushMessage.html';

Template.pushMessage.helpers({
	data() {
		const { title, options } = this.msg.pushMessage;
		const data = {
			title,
			...options,
		};
		console.log(data);
		return data;
	},
});
