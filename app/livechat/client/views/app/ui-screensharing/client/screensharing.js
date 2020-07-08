import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';

import { ScreenSharinDialog } from './ScreenSharinDialog';

Template.screenSharinDialog.helpers({
	src() {
		return Template.instance().src.get();
	},
});

Template.screenSharinDialog.events({
	'click .screensharing-dialog .cancel'() {
		const rid = Session.get('openedRoom');
		Meteor.call('livechat:endScreenSharingSession', rid);
		ScreenSharinDialog.close();
	},
});

Template.screenSharinDialog.onCreated(function() {
	this.width = 400;
	this.height = 290;

	this.rid = new ReactiveVar();
	this.input = new ReactiveVar();
	this.src = new ReactiveVar('');
	this.update = ({ rid, input, src }) => {
		this.rid.set(rid);
		this.input.set(input);
		this.src.set(src);
	};

	this.setPosition = function(dialog, source, anchor = 'left') {
		const _set = () => {
			const sourcePos = $(source).offset();
			let top = sourcePos.top - this.height - 5;

			if (top < 0) {
				top = 10;
			}
			if (anchor === 'left') {
				let right = window.innerWidth - (sourcePos.left + source.offsetWidth - 25);
				if (right < 0) {
					right = 10;
				}
				return dialog.css({ top: `${ top }px`, right: `${ right }px` });
			}
			let left = (sourcePos.left - this.width) + 100;
			if (left < 0) {
				left = 10;
			}
			return dialog.css({ top: `${ top }px`, left: `${ left }px` });
		};

		const set = _.debounce(_set, 2000);
		_set();
		this.remove = set;
		$(window).on('resize', set);
	};
});

Template.screenSharinDialog.onDestroyed(function() {
	$(window).off('resize', this.remove);
});
