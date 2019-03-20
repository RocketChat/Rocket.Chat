import { Meteor } from 'meteor/meteor';
import { modal } from '../../../ui-utils';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { hasAtLeastOnePermission } from '../../../authorization';
import { DateFormat } from '../../../lib';
import { settings } from '../../../settings';
import { t, handleError } from '../../../utils';
import { popover } from '../../../ui-utils';
import { Template } from 'meteor/templating';
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

		const canDelete = () => {
			console.log(2);
			const forceDelete = hasAtLeastOnePermission('force-delete-message', this.rid);
			const hasPermission = hasAtLeastOnePermission('delete-message', this.rid);
			const isDeleteAllowed = settings.get('Message_AllowDeleting');
			const deleteOwn = this.file.userId === Meteor.userId();
			if (!(hasPermission || (isDeleteAllowed && deleteOwn) || forceDelete)) {
				return;
			}
			console.log(3);
			const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
			if (forceDelete) {
				return true;
			}
			console.log(4);
			if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
				let msgTs;
				if (this.file.uploadedAt != null) {
					msgTs = moment(this.file.uploadedAt);
				}
				let currentTsDiff;
				if (msgTs != null) {
					currentTsDiff = moment().diff(msgTs, 'minutes');
				}
				console.log(5);
				return currentTsDiff < blockDeleteInMinutes;
			} else {
				console.log(6);
				return true;
			}
		};

		if (canDelete()) {
			config.columns[0].groups[0].items.push({
				icon: 'trash',
				name: t('Delete'),
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
			});
		}

		popover.open(config);
	},
});
