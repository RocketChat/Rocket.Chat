import { Template } from 'meteor/templating';

import './ModalBlock.html';
// import { triggerAction } from '../ActionManager';

Template.ModalBlock.events({
	'submit form'(e) {
		e.preventDefault();
		console.log(Object.values(e.target).reduce((obj, e) => {
			if (!e.getAttribute || !e.name) {
				return obj;
			}
			const block = e.getAttribute('data-block-id') || 'default';
			obj[block] = obj[block] || {};
			obj[block][e.name] = e.value;
			return obj;
		}, {}));
	},
});
