import { CustomSounds } from '@rocket.chat/models';
import { isUploadCustomSoundProps } from '@rocket.chat/rest-typings/src/v1/customSounds';

import { API } from '../api';

API.v1.addRoute(
	'custom-sounds.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const { cursor, totalCount } = CustomSounds.findPaginated(query, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
			});

			const [sounds, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				sounds,
				count: sounds.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'custom-sounds.uploadCustomSound',
	{
		authRequired: true,
		validateParams: isUploadCustomSoundProps,
	},
	{
		async post() {
			const { binaryContent, contentType, soundData } = this.bodyParams;

			const result = Meteor.call('uploadCustomSound', binaryContent, contentType, soundData);

			return API.v1.success(result);
		},
	},
);
