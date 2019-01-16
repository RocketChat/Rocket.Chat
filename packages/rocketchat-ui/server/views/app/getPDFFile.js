const fs = require('fs');

Meteor.methods({
	async getPDFFile(pdfId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getPDFFile' });
		}

		try {
			const pathToFilePdf = `${ RocketChat.settings.get('FileUpload_FileSystemPath') }/${ pdfId }`;
			return fs.readFileSync(pathToFilePdf);
		} catch (error) {
			return error;
		}
	},
});
