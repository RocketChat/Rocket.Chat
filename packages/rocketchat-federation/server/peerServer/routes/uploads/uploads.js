/* globals FileUpload */
import { Meteor } from 'meteor/meteor';

export default function uploadsRoutes() {
	RocketChat.API.v1.addRoute('federation.uploads', { authRequired: false }, {
		get() {
			const { upload_id } = this.requestParams();

			const upload = RocketChat.models.Uploads.findOneById(upload_id);

			if (!upload) {
				return RocketChat.API.v1.failure('There is no such file in this server');
			}

			const getFileBuffer = Meteor.wrapAsync(FileUpload.getBuffer, FileUpload);

			const buffer = getFileBuffer(upload);

			return RocketChat.API.v1.success({ upload, buffer });
		},
	});
}
