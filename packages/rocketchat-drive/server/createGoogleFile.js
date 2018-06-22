Meteor.methods({
	async createGoogleFile({type, name}, rid) {
		const mimeTypes = {
			'docs': 'application/vnd.google-apps.document',
			'slides': 'application/vnd.google-apps.presentation',
			'sheets': 'application/vnd.google-apps.spreadsheet'
		};

		const fileData = null;
		const metaData = {
			'mimeType': `${ mimeTypes[type] }`,
			'name': `${ name }`
		};

		Meteor.call('uploadFileToDrive', {fileData, metaData}, true, rid);
	}
});
