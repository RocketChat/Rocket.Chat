import moment from 'moment';
const colors = {
	good: '#35AC19',
	warning: '#FCB316',
	danger: '#D30230'
};
const fixCordova = function(url) {
	if (url && url.indexOf('data:image') === 0) {
		return url;
	}
	if (Meteor.isCordova && (url && url[0] === '/')) {
		url = Meteor.absoluteUrl().replace(/\/$/, '') + url;
		const query = `rc_uid=${ Meteor.userId() }&rc_token=${ Meteor._localStorage.getItem('Meteor.loginToken') }`;
		if (url.indexOf('?') === -1) {
			url = `${ url }?${ query }`;
		} else {
			url = `${ url }&${ query }`;
		}
	}
	if (Meteor.settings['public'].sandstorm || url.match(/^(https?:)?\/\//i)) {
		return url;
	} else if (navigator.userAgent.indexOf('Electron') > -1) {
		return __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
	} else {
		return Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
	}
};
/*globals renderMessageBody*/
Template.messageAttachment.helpers({
	fixCordova,
	parsedText() {
		return renderMessageBody({
			msg: this.text
		});
	},
	loadImage() {
		const user = Meteor.user();
		if (this.downloadImages !== true) {
			if (RocketChat.getUserPreference(user, 'autoImageLoad') === false) {
				return false;
			}
			if (Meteor.Device.isPhone() && RocketChat.getUserPreference(user, 'saveMobileBandwidth') !== true) {
				return false;
			}
		}
		return true;
	},
	getImageHeight(height = 200) {
		return height;
	},
	color() {
		return colors[this.color] || this.color;
	},
	collapsed() {
		if (this.collapsed != null) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return RocketChat.getUserPreference(user, 'collapseMediaByDefault') === true;
		}
	},
	time() {
		const messageDate = new Date(this.ts);
		const today = new Date();
		if (messageDate.toDateString() === today.toDateString()) {
			return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'));
		} else {
			return moment(this.ts).format(RocketChat.settings.get('Message_TimeAndDateFormat'));
		}
	},
	injectIndex(data, previousIndex, index) {
		data.index = `${ previousIndex }.attachments.${ index }`;
	},

	isFile() {
		return this.type === 'file';
	}
});
