import moment from 'moment';

import { fixCordova } from 'meteor/rocketchat:lazy-load';
import { e2e } from 'meteor/rocketchat:e2e';

const colors = {
	good: '#35AC19',
	warning: '#FCB316',
	danger: '#D30230',
};

/* globals renderMessageBody*/
Template.messageAttachment.helpers({
	fixCordova,
	parsedText() {
		return renderMessageBody({
			msg: this.text,
		});
	},
	markdownInPretext() {
		return this.mrkdwn_in && this.mrkdwn_in.includes('pretext');
	},
	parsedPretext() {
		return renderMessageBody({
			msg: this.pretext,
		});
	},
	loadImage() {
		if (this.downloadImages !== true) {
			const user = RocketChat.models.Users.findOne({ _id: Meteor.userId() }, { fields: { 'settings.autoImageLoad' : 1 } });
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

	// Decrypt received encrypted file.
	decryptFile() {
		const xhttp = new XMLHttpRequest();
		const self = this;

		// Download file asynchronously using XHR.
		xhttp.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200) {
				const e2eRoom = e2e.getInstanceByRoomId(self.rid);

				e2eRoom.decryptFile(xhttp.response)
					.then((msg) => {
						if (msg) {
							const decryptedFile = new File([msg], self.title);
							const downloadUrl = URL.createObjectURL(decryptedFile);
							const a = document.createElement('a');
							document.body.appendChild(a);
							a.style = 'display: none';
							a.href = downloadUrl;
							a.download = self.title;
							a.click();
						}
					});
			}
		};
		xhttp.open('GET', this.title_link, true);
		xhttp.send();
	},
	isFile() {
		return this.type === 'file';
	},
});
