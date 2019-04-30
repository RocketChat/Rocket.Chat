/* globals Department, Livechat, LivechatVideoCall */
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import visitor from '../../imports/client/visitor';

function showDepartments() {
	return Department.find({ showOnRegistration: true }).count() > 1;
}

Template.livechatWindow.helpers({
	title() {
		return Livechat.title;
	},
	color() {
		return Livechat.color;
	},
	fontColor() {
		return Livechat.fontColor;
	},
	popoutActive() {
		return FlowRouter.getQueryParam('mode') === 'popout';
	},
	soundActive() {
		return Session.get('sound');
	},
	showRegisterForm() {
		if (Session.get('triggered') || visitor.getId()) {
			return false;
		}
		return Livechat.registrationForm && (Livechat.nameFieldRegistrationForm || Livechat.emailFieldRegistrationForm || showDepartments());
	},
	showSwitchDepartmentForm() {
		return Livechat.showSwitchDepartmentForm;
	},
	livechatStarted() {
		return Livechat.online !== null;
	},
	livechatOnline() {
		return Livechat.online;
	},
	offlineMessage() {
		return Livechat.offlineMessage;
	},
	offlineData() {
		return {
			offlineMessage: Livechat.offlineMessage.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'),
			offlineSuccessMessage: Livechat.offlineSuccessMessage,
			offlineUnavailableMessage: Livechat.offlineUnavailableMessage.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'),
			displayOfflineForm: Livechat.displayOfflineForm,
		};
	},
	videoCalling() {
		return LivechatVideoCall.isActive();
	},
	isOpened() {
		return Livechat.isWidgetOpened();
	},
	showWidget() {
		return Livechat.online || Livechat.displayOfflineForm;
	},
});

Template.livechatWindow.events({
	'mousedown .title'({ target, clientX: x, clientY: y }) {
		parentCall('startDragWindow', { x, y });

		this.onDrag = ({ clientX: x, clientY: y }) => {
			parentCall('dragWindow', {
				x: x - target.getBoundingClientRect().left,
				y: y - target.getBoundingClientRect().top,
			});
		};

		this.onDragStop = () => {
			parentCall('stopDragWindow');
			window.removeEventListener('mousemove', this.onDrag);
			window.removeEventListener('mousedown', this.onDragStop);
			this.onDrag = null;
			this.onDragStop = null;
		};

		window.addEventListener('mousemove', this.onDrag);
		window.addEventListener('mouseup', this.onDragStop);
	},
	'click .title'() {
		parentCall('restoreWindow');
	},
	'click .maximize'(e) {
		parentCall('toggleWindow');
		e.stopPropagation();
	},
	'click .minimize'(e) {
		parentCall('toggleWindow');
		e.stopPropagation();
	},
	'click .popout'(event) {
		event.stopPropagation();
		parentCall('openPopout');
	},
	'click .sound'(event) {
		event.stopPropagation();
		Session.set({ sound: !Session.get('sound') });
	},
});

Template.livechatWindow.onCreated(function() {
	Session.set({ sound: true });

	TAPi18n.conf.i18n_files_route = Meteor._relativeToSiteRootUrl('/tap-i18n');

	const availableLanguages = TAPi18n.getLanguages();

	const defaultAppLanguage = () => {
		let lng = window.navigator.userLanguage || window.navigator.language || 'en';
		const regexp = /([a-z]{2}-)([a-z]{2})/;
		if (regexp.test(lng)) {
			lng = lng.replace(regexp, function(match, ...parts) {
				return parts[0] + parts[1].toUpperCase();
			});
		}
		return lng;
	};

	const loadDepartments = (departments) => {
		Department.remove({});
		departments.forEach((department) => {
			Department.insert(department);
		});
	};

	const normalizeLanguageString = (languageString) => {
		let [languageCode, countryCode] = languageString.split ? languageString.split(/[-_]/) : [];
		if (!languageCode || languageCode.length !== 2) {
			return 'en';
		}
		languageCode = languageCode.toLowerCase();

		if (!countryCode || countryCode.length !== 2) {
			countryCode = null;
		} else {
			countryCode = countryCode.toUpperCase();
		}

		return countryCode ? `${ languageCode }-${ countryCode }` : languageCode;
	};

	this.autorun(() => {
		// get all needed live chat info for the user
		Meteor.call('livechat:getInitialData', visitor.getToken(), Livechat.department, (err, result) => {
			if (err) {
				return console.error(err);
			}

			if (!result.enabled) {
				Triggers.setDisabled();
				return parentCall('removeWidget');
			}

			if (!result.online) {
				Triggers.setDisabled();
				Livechat.title = result.offlineTitle;
				Livechat.offlineColor = result.offlineColor;
				Livechat.offlineMessage = result.offlineMessage;
				Livechat.displayOfflineForm = result.displayOfflineForm;
				Livechat.offlineUnavailableMessage = result.offlineUnavailableMessage;
				Livechat.offlineSuccessMessage = result.offlineSuccessMessage;
				Livechat.online = false;
			} else {
				Livechat.title = result.title;
				Livechat.onlineColor = result.color;
				Livechat.online = true;
				Livechat.transcript = result.transcript;
				Livechat.transcriptMessage = result.transcriptMessage;
				Livechat.conversationFinishedMessage = result.conversationFinishedMessage;
			}
			Livechat.videoCall = result.videoCall;
			Livechat.fileUpload = result.fileUpload;
			Livechat.registrationForm = result.registrationForm;
			Livechat.nameFieldRegistrationForm = result.nameFieldRegistrationForm;
			Livechat.emailFieldRegistrationForm = result.emailFieldRegistrationForm;
			Livechat.registrationFormMessage = result.registrationFormMessage;
			Livechat.connecting = !!(result.room && !result.agentData && result.showConnecting);

			loadDepartments(result.departments);

			if (result.visitor) {
				visitor.setData(result.visitor);

				if (result.visitor.department) {
					Livechat.department = result.visitor.department;
				}

				if (result.visitor.name) {
					Livechat.guestName = result.visitor.name;
				}

				if (result.visitor.visitorEmails && result.visitor.visitorEmails.length > 0) {
					Livechat.guestEmail = result.visitor.visitorEmails[0].address;
				}

				if (!Livechat.department) {
					Livechat.department = result.visitor.department;
				}
			}

			let room;
			if (result.room && (!result.room.departmentId || !Livechat.department || result.room.departmentId === Livechat.department)) {
				room = result.room._id;

				visitor.setConnected();
			}
			Livechat.room = room;

			if (result.agentData) {
				Livechat.agent = result.agentData;
			}

			let language = normalizeLanguageString(result.language || defaultAppLanguage());

			if (!availableLanguages[language]) {
				language = language.split('-').shift();
			}

			TAPi18n.setLanguage(language);

			Triggers.init(result.triggers);

			Livechat.allowSwitchingDepartments = result.allowSwitchingDepartments;

			Livechat.ready();
		});
	});

	$(window).on('focus', () => {
		if (Livechat.isWidgetOpened()) {
			$('textarea').focus();
		}
	});
});
