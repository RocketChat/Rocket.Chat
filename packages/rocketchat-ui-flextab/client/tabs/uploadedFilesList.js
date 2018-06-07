/* globals chatMessages*/
import moment from 'moment';
import _ from 'underscore';
import s from 'underscore.string';

const fixCordova = (url) => {
	if ((url != null ? url.indexOf('data:image') : undefined) === 0) {
		return url;
	}

	if (Meteor.isCordova && ((url != null ? url[0] : undefined) === '/')) {
		url = Meteor.absoluteUrl().replace(/\/$/, '') + url;
		const query = `rc_uid=${ Meteor.userId() }&rc_token=${ Meteor._localStorage.getItem('Meteor.loginToken') }`;
		if (url.indexOf('?') === -1) {
			url = `${ url }?${ query }`;
		} else {
			url = `${ url }&${ query }`;
		}
	}

	if ((Meteor.settings && Meteor.settings.public && Meteor.settings.sandstorm) || url.match(/^(https?:)?\/\//i)) {
		return url;
	} else if (navigator.userAgent.indexOf('Electron') > -1) {
		return __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
	} else {
		return Meteor.absoluteUrl().replace(/\/$/, '') + url;
	}
};

const roomFiles = new Mongo.Collection('room_files');

Template.uploadedFilesList.helpers({
	iconType() {
		let icon = 'file-generic';
		let type = '';

		if (this.type.match(/application\/pdf/)) {
			icon = 'file-pdf';
			type = 'pdf';
		}
		if (['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(this.type)) {
			icon = 'file-document';
			type = 'document';
		}
		if (['application/vnd.ms-excel', 'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(this.type)) {
			icon = 'file-sheets';
			type = 'sheets';
		}

		if (['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(this.type)) {
			icon = 'file-sheets';
			type = 'ppt';
		}

		const [, extension] = this.name.match(/.*?\.(.*)$/);

		return {icon, extension, type};
	},
	thumb() {
		if (/image/.test(this.type)) {
			return fixCordova(this.url);
		}
	},
	format(timestamp) {
		return moment(timestamp).format(RocketChat.settings.get('Message_TimeAndDateFormat') || 'LLL');
	},
	files() {
		return roomFiles.find({ rid: this.rid }, { sort: { uploadedAt: -1 } });
	},

	hasFiles() {
		return roomFiles.find({ rid: this.rid }).count() > 0;
	},

	hasMore() {
		return Template.instance().hasMore.get();
	},

	getFileIcon(type) {
		if (type.match(/^image\/.+$/)) {
			return 'icon-picture';
		}

		return 'icon-docs';
	},

	customClassForFileType() {
		if (this.type.match(/^image\/.+$/)) {
			return 'room-files-image';
		}
	},

	escapedName() {
		return s.escapeHTML(this.name);
	},

	canDelete() {
		return RocketChat.authz.hasAtLeastOnePermission('delete-message', this.rid) || (RocketChat.settings && RocketChat.settings.get('Message_AllowDeleting') && (this.userId === Meteor.userId()));
	},

	url() {
		return `/file-upload/${ this._id }/${ this.name }`;
	},
	fixCordova
});

Template.uploadedFilesList.events({
	'click .room-file-item'(e) {
		if ($(e.currentTarget).siblings('.icon-picture').length) {
			return e.preventDefault();
		}
	},

	'click .icon-trash'() {
		const self = this;
		modal.open({
			title: TAPi18n.__('Are_you_sure'),
			text: TAPi18n.__('You_will_not_be_able_to_recover_file'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: TAPi18n.__('Yes_delete_it'),
			cancelButtonText: TAPi18n.__('Cancel'),
			closeOnConfirm: false,
			html: false
		}, function() {
			modal.open({
				title: TAPi18n.__('Deleted'),
				text: TAPi18n.__('Your_file_has_been_deleted'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false
			});

			// Check if the upload message for this file is currently loaded
			const msg = ChatMessage.findOne({ file: { _id: self._id } });
			return RocketChat.models.Uploads.remove(self._id, function() {
				if (msg) {
					return chatMessages[Session.get('openedRoom')].deleteMsg(msg);
				} else {
					return Meteor.call('deleteFileMessage', self._id, function(error) {
						if (error) {
							return handleError(error);
						}
					});
				}
			});
		});
	},

	'scroll .js-list': _.throttle(function(e, t) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			return t.limit.set(t.limit.get() + 50);
		}
	}, 200)
});

Template.uploadedFilesList.onCreated(function() {
	const { rid } = Template.currentData();
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	return this.autorun(() => {
		return this.subscribe('roomFiles', rid, this.limit.get(), () => {
			if (roomFiles.find({ rid }).fetch().length < this.limit.get()) {
				return this.hasMore.set(false);
			}
		}
		);
	}
	);
});
