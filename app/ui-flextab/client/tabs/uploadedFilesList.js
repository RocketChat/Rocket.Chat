import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { getURL } from '../../../utils/client';
import { Messages } from '../../../models/client';

const LIST_SIZE = 50;

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

Template.uploadedFilesList.onCreated(function() {
	const { rid } = Template.currentData();
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

	this.autorun(() => {
		this.searchText.get();
		this.state.set('limit', LIST_SIZE);
	});
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

});
