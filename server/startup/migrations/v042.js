import { Mongo } from 'meteor/mongo';
import { Migrations } from 'meteor/rocketchat:migrations';
import { settings } from 'meteor/rocketchat:settings';
import { RocketChatAssets } from 'meteor/rocketchat:assets';

Migrations.add({
	version: 42,
	up() {
		const files = new Mongo.Collection('assets.files');
		const chunks = new Mongo.Collection('assets.chunks');
		const list = {
			'favicon.ico': 'favicon_ico',
			'favicon.svg': 'favicon',
			'favicon_64.png': 'favicon_64',
			'favicon_96.png': 'favicon_96',
			'favicon_128.png': 'favicon_128',
			'favicon_192.png': 'favicon_192',
			'favicon_256.png': 'favicon_256',
		};

		for (const from of Object.keys(list)) {
			const to = list[from];

			const query = {
				_id: to,
			};

			if (!files.findOne(query)) {
				const oldFile = files.findOne({
					_id: from,
				});

				if (oldFile) {
					const extension = RocketChatAssets.mime.extension(oldFile.contentType);
					settings.removeById(`Assets_${ from }`);
					settings.updateById(`Assets_${ to }`, {
						url: `/assets/${ to }.${ extension }`,
						defaultUrl: RocketChatAssets.assets[to].defaultUrl,
					});

					oldFile._id = to;
					oldFile.filename = to;
					files.insert(oldFile);
					files.remove({
						_id: from,
					});

					chunks.update({
						files_id: from,
					}, {
						$set: {
							files_id: to,
						},
					}, {
						multi: true,
					});
				}
			}
		}
	},
});
