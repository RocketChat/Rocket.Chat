import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { DateFormat } from '../../../lib/client';
import { canDeleteMessage, getURL, handleError, t, APIClient } from '../../../utils/client';
import { popover, modal } from '../../../ui-utils/client';
import { Rooms, Messages } from '../../../models/client';
import { upsertMessageBulk } from '../../../ui-utils/client/lib/RoomHistoryManager';

const LIST_SIZE = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

const getFileUrl = (attachments) => {
	if (!attachments || !attachments.length) {
		return;
	}
	return attachments[0].image_url || attachments[0].audio_url || attachments[0].video_url;
};

const mountFileObject = (message) => ({
	...message.file,
	rid: message.rid,
	user: message.u,
	description: message.attachments && message.attachments[0].description,
	url: getFileUrl(message.attachments),
	_updatedAt: message.attachments && message.attachments[0].ts,
});

const roomTypes = {
	c: 'channels',
	l: 'channels',
	d: 'im',
	p: 'groups',
};

const fields = {
	_id: 1,
	userId: 1,
	rid: 1,
	name: 1,
	description: 1,
	type: 1,
	url: 1,
	uploadedAt: 1,
};

Template.uploadedFilesList.onCreated(function() {
	const { rid } = Template.currentData();
	const room = Rooms.findOne({ _id: rid });
	this.searchText = new ReactiveVar(null);

	this.showFileType = new ReactiveVar('all');

	this.roomFiles = new ReactiveVar([]);
	this.files = new Mongo.Collection(null);

	this.state = new ReactiveDict({
		limit: LIST_SIZE,
		hasMore: true,
	});

	const messageQuery = {
		rid,
		'file._id': { $exists: true },
	};

	this.cursor = Messages.find(messageQuery).observe({
		added: ({ ...message }) => {
			this.files.upsert(message.file._id, mountFileObject(message));
		},
		changed: ({ ...message }) => {
			this.files.upsert(message.file._id, mountFileObject(message));
		},
		removed: ({ ...message }) => {
			this.files.remove(message.file._id);
		},
	});

	const loadFiles = _.debounce(async (query, limit) => {
		this.state.set('loading', true);

		const { files } = await APIClient.v1.get(`${ roomTypes[room.t] }.files?roomId=${ query.rid }&limit=${ limit }&query=${ JSON.stringify(query) }&fields=${ JSON.stringify(fields) }`);

		upsertMessageBulk({ msgs: files }, this.files);

		this.state.set({
			hasMore: this.state.get('limit') <= files.length,
			loading: false,
		});
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	const query = {
		rid,
		complete: true,
		uploading: false,
		_hidden: {
			$ne: true,
		},
	};

	this.autorun(() => {
		this.searchText.get();
		this.state.set('limit', LIST_SIZE);
	});

	this.autorun(() => {
		if (this.showFileType.get() === 'all') {
			delete query.typeGroup;
		} else {
			this.files.remove({});
			query.typeGroup = this.showFileType.get();
		}

		const limit = this.state.get('limit');
		const searchText = this.searchText.get();
		if (!searchText) {
			return loadFiles(query, limit);
		}
		this.files.remove({});
		const regex = { $regex: searchText, $options: 'i' };
		return loadFiles({ ...query, name: regex }, limit);
	});
});

Template.mentionsFlexTab.onDestroyed(function() {
	this.cursor.stop();
});

Template.uploadedFilesList.helpers({
	files() {
		const instance = Template.instance();
		return instance.files.find({}, { limit: instance.state.get('limit') });
	},

	url() {
		return getURL(`/file-upload/${ this._id }/${ this.name }`);
	},

	fileTypeClass() {
		const [, type] = (this.type && /^(.+?)\//.exec(this.type)) || [];
		if (type) {
			return `room-files-${ type }`;
		}
	},

	thumb() {
		if (/image/.test(this.type)) {
			return getURL(this.url);
		}
	},

	escapeCssUrl: (url) => url.replace(/(['"])/g, '\\$1'),

	limit() {
		return Template.instance().state.get('limit');
	},
	format(timestamp) {
		return DateFormat.formatDateAndTime(timestamp);
	},
	fileTypeIcon() {
		const [, extension] = this.name.match(/.*?\.(.*)$/);

		if (this.type.match(/application\/pdf/)) {
			return {
				id: 'file-pdf',
				type: 'pdf',
				extension,
			};
		}

		if (['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(this.type)) {
			return {
				id: 'file-document',
				type: 'document',
				extension,
			};
		}

		if (['application/vnd.ms-excel', 'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(this.type)) {
			return {
				id: 'file-sheets',
				type: 'sheets',
				extension,
			};
		}

		if (['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(this.type)) {
			return {
				id: 'file-sheets',
				type: 'ppt',
				extension,
			};
		}

		return {
			id: 'clip',
			type: 'generic',
			extension,
		};
	},

	formatTimestamp(timestamp) {
		return DateFormat.formatDateAndTime(timestamp);
	},

	isLoading() {
		return Template.instance().state.get('loading');
	},
});

Template.uploadedFilesList.events({
	'submit .search-form'(e) {
		e.preventDefault();
	},

	'input .uploaded-files-list__search-input'(e, t) {
		t.searchText.set(e.target.value.trim());
		t.state.set('hasMore', true);
	},

	'scroll .flex-tab__result': _.throttle(function(e, t) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			if (!t.state.get('hasMore')) {
				return;
			}
			return t.state.set('limit', t.state.get('limit') + LIST_SIZE);
		}
	}, 200),

	'change .js-type'(e, t) {
		t.showFileType.set(e.currentTarget.value);
	},

	'click .js-action'(e) {
		e.currentTarget.parentElement.classList.add('active');

		const canDelete = canDeleteMessage({
			rid: this.rid,
			ts: this.file.uploadedAt,
			uid: this.file.userId,
		});

		const config = {
			columns: [
				{
					groups: [
						{
							items: [
								{
									icon: 'download',
									name: t('Download'),
									action: () => {
										const a = document.createElement('a');
										a.href = getURL(this.file.url);
										a.download = this.file.name;
										document.body.appendChild(a);
										a.click();
										window.URL.revokeObjectURL(this.file.url);
										a.remove();
									},
								},
							],
						},
						...canDelete ? [{
							items: [
								{
									icon: 'trash',
									name: t('Delete'),
									modifier: 'alert',
									action: () => {
										modal.open({
											title: t('Are_you_sure'),
											text: t('You_will_not_be_able_to_recover_file'),
											type: 'warning',
											showCancelButton: true,
											confirmButtonColor: '#DD6B55',
											confirmButtonText: t('Yes_delete_it'),
											cancelButtonText: t('Cancel'),
											html: false,
										}, () => {
											Meteor.call('deleteFileMessage', this.file._id, (error) => {
												if (error) {
													handleError(error);
												} else {
													modal.open({
														title: t('Deleted'),
														text: t('Your_entry_has_been_deleted'),
														type: 'success',
														timer: 1000,
														showConfirmButton: false,
													});
												}
											});
										});
									},
								},
							],
						}] : [],
					],
				},
			],
			currentTarget: e.currentTarget,
			onDestroyed: () => {
				e.currentTarget.parentElement.classList.remove('active');
			},
		};

		popover.open(config);
	},
});

Template.uploadedFilesList.onRendered(function() {
	this.firstNode.querySelector('[name="file-search"]').focus();
});
