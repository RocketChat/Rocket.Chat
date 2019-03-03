import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { DateFormat } from 'meteor/rocketchat:lib';
import { t } from 'meteor/rocketchat:utils';
import { popover } from 'meteor/rocketchat:ui-utils';
import { Template } from 'meteor/templating';
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
			return this.url;
		}
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

	hasMore() {
		return Template.instance().hasMore.get();
	},

	hasFiles() {
		return roomFiles.find({ rid: this.rid }).count() > 0;
	},
});

Template.uploadedFilesList.events({
	'submit .search-form'(e) {
		e.preventDefault();
	},

	'input .uploaded-files-list__search-input'(e, t) {
		t.searchText.set(e.target.value.trim());
		t.hasMore.set(true);
	},

	'scroll .flex-tab__result': _.throttle(function(e, t) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			return t.limit.set(t.limit.get() + 50);
		}
	}, 200),

	'click .js-action'(e) {
		e.currentTarget.parentElement.classList.add('active');

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
										a.href = this.file.url;
										a.download = this.file.name;
										document.body.appendChild(a);
										a.click();
										window.URL.revokeObjectURL(this.file.url);
										a.remove();
									},
								},
							],
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			onDestroyed:() => {
				e.currentTarget.parentElement.classList.remove('active');
			},
		};

		popover.open(config);
	},
});
