import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

import { t, APIClient } from '../../../utils';
import { SideNav } from '../../../ui-utils/client';
import { settings } from '../../../settings';
import { showImporterException } from '../functions/showImporterException';

import { Importers } from '..';

import './adminImportNew.html';

Template.adminImportNew.helpers({
	isPreparing() {
		return Template.instance().preparing.get();
	},
	importers() {
		return Importers.getAll();
	},
	pageTitle() {
		const importerKey = Template.instance().importType.get();
		if (!importerKey) {
			return t('Import_New_File');
		}

		const importer = Importers.get(importerKey);
		if (!importer) {
			return t('Import_New_File');
		}

		return TAPi18n.__('Importer_From_Description', { from: t(importer.name) });
	},
	importType() {
		return Template.instance().importType.get();
	},
	fileType() {
		return Template.instance().fileType.get();
	},
	isImporterSelected() {
		return Template.instance().importType.get();
	},
	isFileTypeSelected() {
		return Template.instance().fileType.get();
	},
	isUpload() {
		return Template.instance().fileType.get() === 'upload';
	},
	isPublicURL() {
		return Template.instance().fileType.get() === 'url';
	},
	isServerFile() {
		return Template.instance().fileType.get() === 'path';
	},
	fileSizeLimitMessage() {
		const maxFileSize = settings.get('FileUpload_MaxFileSize');
		let message;

		if (maxFileSize > 0) {
			const sizeInKb = maxFileSize / 1024;
			const sizeInMb = sizeInKb / 1024;

			let fileSizeMessage;
			if (sizeInMb > 0) {
				fileSizeMessage = TAPi18n.__('FileSize_MB', { fileSize: sizeInMb.toFixed(2) });
			} else if (sizeInKb > 0) {
				fileSizeMessage = TAPi18n.__('FileSize_KB', { fileSize: sizeInKb.toFixed(2) });
			} else {
				fileSizeMessage = TAPi18n.__('FileSize_Bytes', { fileSize: maxFileSize.toFixed(0) });
			}

			message = TAPi18n.__('Importer_Upload_FileSize_Message', { maxFileSize: fileSizeMessage });
		} else {
			message = TAPi18n.__('Importer_Upload_Unlimited_FileSize');
		}

		return message;
	},
});

Template.adminImportNew.events({
	'change .file-type'(event, template) {
		template.fileType.set($('select[name=file-type]').val());
	},
	'change .import-type'(event, template) {
		template.importType.set($('select[name=import-type]').val());
	},

	'change .import-file-input'(event, template) {
		const importType = template.importType.get();

		const e = event.originalEvent || event;
		let { files } = e.target;
		if (!files || (files.length === 0)) {
			files = (e.dataTransfer != null ? e.dataTransfer.files : undefined) || [];
		}

		Array.from(files).forEach((file) => {
			template.preparing.set(true);

			const reader = new FileReader();

			reader.readAsBinaryString(file);
			reader.onloadend = () => {
				APIClient.post('v1/uploadImportFile', {
					binaryContent: reader.result,
					contentType: file.type,
					fileName: file.name,
					importerKey: importType,
				}).then(() => {
					toastr.success(t('File_uploaded_successfully'));
					FlowRouter.go('/admin/import/prepare');
				}).catch((error) => {
					if (error) {
						showImporterException(error);
						template.preparing.set(false);
					}
				});
			};
		});
	},

	'click .import-btn'(event, template) {
		const importType = template.importType.get();
		const fileUrl = $('.import-file-url').val();

		template.preparing.set(true);

		APIClient.post('v1/downloadPublicImportFile', {
			fileUrl,
			importerKey: importType,
		}).then(() => {
			toastr.success(t('Import_requested_successfully'));
			FlowRouter.go('/admin/import/prepare');
		}).catch((error) => {
			if (error) {
				showImporterException(error);
				template.preparing.set(false);
			}
		});
	},
});

Template.adminImportNew.onCreated(function() {
	this.preparing = new ReactiveVar(false);
	this.importType = new ReactiveVar('');
	this.fileType = new ReactiveVar('upload');
});

Template.adminImportNew.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
