import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { DateFormat } from '../../../lib/client';
import { canDeleteMessage, getURL, handleError, t } from '../../../utils/client';
import { popover, modal } from '../../../ui-utils/client';

const roomFiles = new Mongo.Collection('room_files');

const LIST_SIZE = 50;

Template.uploadedFilesList.onCreated(function() {
	const { rid } = Template.currentData();
	this.searchText = new ReactiveVar(null);

	this.state = new ReactiveDict({
		limit: LIST_SIZE,
		hasMore: true,
	});

	this.autorun(() => {
		const ready = this.subscribe('roomFilesWithSearchText', rid, this.searchText.get(), this.state.get('limit'), () => this.state.set('hasMore', this.state.get('limit') <= roomFiles.find({ rid }).count())).ready();
		this.state.set('loading', !ready);
	});
});

Template.uploadedFilesList.helpers({
	files() {
		return roomFiles.find({ rid: this.rid }, { sort: { uploadedAt: -1 } });
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
