/* globals FileUpload */
import Webdav from 'webdav';
import Future from 'fibers/future';

Meteor.methods({
	async getFileFromWebdav(file) {
		const client = new Webdav(
			//move credentials to user account
			'http://192.168.157.143/core/remote.php/webdav',
			'ocadmin',
			'pass'
		);
		const future = new Future();
		await client.getFileContents(file.filename).then(function(fileContent) {
			const byteArray = new Uint8Array(fileContent);
			future['return']({success: true, data: byteArray});
		});

		return future.wait();
	}
});
