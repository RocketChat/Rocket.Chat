import { Template } from 'meteor/templating';

import './ModalBlock.html';
// import { triggerAction } from '../ActionManager';

Template.ModalBlock.events({
	'submit form'(e) {
		e.preventDefault();
		console.log(Object.values(e.target).reduce((obj, e) => {
			const block = e.getAttribute('block_id') || 'default';
			obj[block] = obj[block] || {};
			obj[block][e.name] = e.value;
			return obj;
		}, {}));
	},
});
