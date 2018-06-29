import Webdav from 'webdav';

Meteor.methods({
	getWebdavFileList(path) {
		const client = new Webdav(
			//move credentials to user account
			'http://192.168.157.143/core/remote.php/webdav',
			'ocadmin',
			'pass'
		);
		return client.getDirectoryContents(path);
	}
});
