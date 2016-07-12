/* globals Department */
Template.livechatWindow.helpers({
	title() {
		return Template.instance().title.get();
	},
	color() {
		return Template.instance().color.get();
	},
	popoutActive() {
		return FlowRouter.getQueryParam('mode') === 'popout';
	},
	soundActive() {
		return Session.get('sound');
	},
	showRegisterForm() {
		if (Session.get('triggered') || Meteor.userId()) {
			return false;
		}
		return Template.instance().registrationForm.get();
	},
	livechatStarted() {
		return Template.instance().online.get() !== null;
	},
	livechatOnline() {
		return Template.instance().online.get();
	},
	offlineMessage() {
		return Template.instance().offlineMessage.get();
	},
	offlineData() {
		return {
			offlineMessage: Template.instance().offlineMessage.get().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'),
			offlineSuccessMessage: Template.instance().offlineSuccessMessage.get(),
			offlineUnavailableMessage: Template.instance().offlineUnavailableMessage.get().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'),
			displayOfflineForm: Template.instance().displayOfflineForm.get()
		};
	}
});

Template.livechatWindow.events({
	'click .title'() {
		parentCall('toggleWindow');
	},
	'click .popout'(event) {
		event.stopPropagation();
		parentCall('openPopout');
	},
	'click .sound'(event) {
		event.stopPropagation();
		Session.set({sound: !Session.get('sound')});
	}
});

Template.livechatWindow.onCreated(function() {
	this.online = new ReactiveVar(null);

	this.title = new ReactiveVar('Rocket.Chat');
	this.color = new ReactiveVar('#C1272D');
	this.registrationForm = new ReactiveVar(true);
	this.offlineMessage = new ReactiveVar('');
	this.offlineUnavailableMessage = new ReactiveVar('');
	this.displayOfflineForm = new ReactiveVar(true);
	this.offlineSuccessMessage = new ReactiveVar(t('Thanks_We_ll_get_back_to_you_soon'));

	Session.set({sound: true});

	const defaultAppLanguage = () => {
		let lng = window.navigator.userLanguage || window.navigator.language || 'en';
		let regexp = /([a-z]{2}-)([a-z]{2})/;
		if (regexp.test(lng)) {
			lng = lng.replace(regexp, function(match, ...parts) {
				return parts[0] + parts[1].toUpperCase();
			});
		}
		return lng;
	};

	// get all needed live chat info for the user
	Meteor.call('livechat:getInitialData', visitor.getToken(), (err, result) => {
		if (err) {
			console.error(err);
		} else {
			if (!result.enabled) {
				Triggers.setDisabled();
				return parentCall('removeWidget');
			}

			if (!result.online) {
				Triggers.setDisabled();
				this.title.set(result.offlineTitle);
				this.color.set(result.offlineColor);
				this.offlineMessage.set(result.offlineMessage);
				this.displayOfflineForm.set(result.displayOfflineForm);
				this.offlineUnavailableMessage.set(result.offlineUnavailableMessage);
				this.offlineSuccessMessage.set(result.offlineSuccessMessage);
				this.online.set(false);
			} else {
				this.title.set(result.title);
				this.color.set(result.color);
				this.online.set(true);
			}
			this.registrationForm.set(result.registrationForm);

			if (result.room) {
				RoomHistoryManager.getMoreIfIsEmpty(result.room._id);
				visitor.subscribeToRoom(result.room._id);
				visitor.setRoom(result.room._id);
			}

			TAPi18n.setLanguage((result.language || defaultAppLanguage()).split('-').shift());

			Triggers.setTriggers(result.triggers);
			Triggers.init();

			result.departments.forEach((department) => {
				Department.insert(department);
			});
		}
	});
});
