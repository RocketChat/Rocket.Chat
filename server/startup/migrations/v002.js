import { RocketChatFile } from '../../../app/file';
import { FileUpload } from '../../../app/file-upload';
import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';
import { getAvatarSuggestionForUser } from '../../../app/lib';

Migrations.add({
	version: 2,
	up() {
		return Users.find({
			avatarOrigin: {
				$exists: false,
			},
			username: {
				$exists: true,
			},
		}).forEach((user) => {
			const avatars = getAvatarSuggestionForUser(user);
			const services = Object.keys(avatars);

			if (services.length === 0) {
				return;
			}

			const service = services[0];

			console.log(user.username, '->', service);

			const dataURI = avatars[service].blob;
			const { image, contentType } = RocketChatFile.dataURIParse(dataURI);

			const rs = RocketChatFile.bufferToStream(Buffer.from(image, 'base64'));
			const fileStore = FileUpload.getStore('Avatars');
			fileStore.deleteByName(user.username);

			const file = {
				userId: user._id,
				type: contentType,
			};

			fileStore.insert(file, rs, (err, result) => Users.setAvatarData(user._id, service, result.etag));
		});
	},
});
