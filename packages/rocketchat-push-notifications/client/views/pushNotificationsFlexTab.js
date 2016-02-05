Template.pushNotificationsFlexTab.helpers({
	"desktopNotifications"() {
		const sub = ChatSubscription.findOne({ rid: Session.get('openedRoom') });
		return sub ? sub.desktopNotifications : '';
	},
	"desktopNotificationsValue"() {
		sub = ChatSubscription.findOne({ rid: Session.get('openedRoom') });
		if (sub) {
			switch (sub.desktopNotification) {
				case 'all':
					return TAPi18n.__('All_messages');
					break;
				case 'nothing':
					return TAPi18n.__('Nothing');
					break;
				default:
					return TAPi18n.__('Mentions');
					break;
			}
		}
	},
	"editing"(field) {
		return Template.instance().editing.get() === field;
	}
});

Template.pushNotificationsFlexTab.onCreated(function() {
	this.editing = new ReactiveVar();
	this.saveSetting = () => {
		this.editing.set();
	}
});

Template.pushNotificationsFlexTab.events({
	'keydown input[type=text]'(e, instance) {
		if (e.keyCode === 13) {
			e.preventDefault();
			instance.saveSetting();
		}
	},

	'click [data-edit]'(e, instance) {
		e.preventDefault();
		instance.editing.set($(e.currentTarget).data('edit'));
		setTimeout(function() { instance.$('input.editing').focus().select(); }, 100);
	},

	'click .cancel'(e, instance) {
		e.preventDefault();
		instance.editing.set();
	},

	'click .save'(e, instance) {
		e.preventDefault();
		instance.saveSetting();
	}
});