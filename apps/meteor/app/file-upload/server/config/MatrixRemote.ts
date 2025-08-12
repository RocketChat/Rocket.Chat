import { FederationMatrix } from '@rocket.chat/core-services';
import { Uploads } from '@rocket.chat/models';
import { FileUploadClass } from '../lib/FileUpload';

const MatrixRemoteHandler = new FileUploadClass({
	name: 'MatrixRemote:Uploads',
	model: Uploads,

	async get(file, req, res) {
		await FederationMatrix.downloadRemoteFile(file, req, res);
	},
});

export { MatrixRemoteHandler };
