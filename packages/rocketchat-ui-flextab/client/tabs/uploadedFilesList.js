import { fixCordova } from 'meteor/rocketchat:lazy-load';
import moment from 'moment';
import _ from 'underscore';

const roomFiles = new Mongo.Collection('room_files');

Template.uploadedFilesList.onCreated(function() {
	const { rid } = Template.currentData();
	this.searchText = new ReactiveVar(null);
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);

	this.autorun(() => {
		this.subscribe('roomFilesWithSearchText', rid, this.searchText.get(), this.limit.get(), () => {
			if (roomFiles.find({ rid }).fetch().length < this.limit.get()) {
				this.hasMore.set(false);
			}
		});
	});
});

Template.uploadedFilesList.helpers({
	files() {
		return roomFiles.find({ rid: this.rid }, { sort: { uploadedAt: -1 } });
	},

	fixCordova,

	url() {
		return `/file-upload/${ this._id }/${ this.name }`;
	},

	fileTypeClass() {
		const [, type] = (this.type && /^(.+?)\//.exec(this.type)) || [];
		if (type) {
			return `room-files-${ type }`;
		}
	},

	thumb() {
		if (/image/.test(this.type)) {
			return fixCordova(this.url);
		}
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
			id: 'file-generic',
			type: 'generic',
			extension,
		};
	},

	formatTimestamp(timestamp) {
		return moment(timestamp).format(RocketChat.settings.get('Message_TimeAndDateFormat') || 'LLL');
	},

	hasMore() {
		return Template.instance().hasMore.get();
	},

	hasFiles() {
		return roomFiles.find({ rid: this.rid }).count() > 0;
	},
});

Template.uploadedFilesList.events({
	'input .uploaded-files-list__search-input'(e, t) {
		t.searchText.set(e.target.value.trim());
		t.hasMore.set(true);
	},

	'scroll .flex-tab__result': _.throttle(function(e, t) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			return t.limit.set(t.limit.get() + 50);
		}
	}, 200),
});
