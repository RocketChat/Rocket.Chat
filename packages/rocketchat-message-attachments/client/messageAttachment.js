import moment from 'moment';
import { fixCordova } from 'meteor/rocketchat:lazy-load';
const colors = {
	good: '#35AC19',
	warning: '#FCB316',
	danger: '#D30230'
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
		if (this.downloadImages !== true) {
			const user = RocketChat.models.Users.findOne({_id: Meteor.userId()}, {fields: {'settings.autoImageLoad' : 1}});
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
		}
		return false;
	},
	mediaCollapsed() {
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
	},

	googleDriveAvailable() {
		return RocketChat.settings.get('Accounts_OAuth_Google') && RocketChat.settings.get('Accounts_OAuth_Google_Drive_Access');
	},

	fileType() {
		if (this.audio_url) {
			return 'audio/*';
		}
		if (this.video_url) {
			return 'video/*';
		}
		if (this.image_url) {
			return 'image/*';
		}
		return 'application/octet-stream';
	}
});
