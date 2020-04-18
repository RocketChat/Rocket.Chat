import toastr from 'toastr';

import { t } from '../../../utils';

function showToastrForErrorType(errorType, defaultErrorString) {
	let errorCode;

	if (typeof errorType === 'string') {
		errorCode = errorType;
	} else if (typeof errorType === 'object') {
		if (errorType.error && typeof errorType.error === 'string') {
			errorCode = errorType.error;
		}
	}

	if (errorCode) {
		const errorTranslation = t(errorCode);
		if (errorTranslation !== errorCode) {
			toastr.error(errorTranslation);
			return;
		}
	}

	toastr.error(t(defaultErrorString || 'Failed_To_upload_Import_File'));
}

function showException(error, defaultErrorString) {
	console.error(error);
	if (error && error.xhr && error.xhr.responseJSON) {
		console.log(error.xhr.responseJSON);

		if (error.xhr.responseJSON.errorType) {
			showToastrForErrorType(error.xhr.responseJSON.errorType, defaultErrorString);
			return;
		}
	}

	toastr.error(t(defaultErrorString || 'Failed_To_upload_Import_File'));
}

export const showImporterException = showException;
