import { Template } from 'meteor/templating';

import { modal } from '../../../ui-utils';


Template.GameModal.events({
	'click .rc-game.close'() {
		modal.cancel();
	},
});

// TODO when this component destroyed, we will post
// the relevant data to the webhooks URL
Template.GameModal.onDestroyed(function() {
	console.log('I was destroyed!');
});
