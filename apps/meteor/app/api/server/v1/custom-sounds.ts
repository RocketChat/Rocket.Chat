import { CustomSounds } from '@rocket.chat/models';
import { isUploadCustomSoundProps } from '@rocket.chat/rest-typings/src/v1/customSounds';

import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';

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
		CHECKpermisssions: ['manage-sounds']
	},
	{
		async post() {

			const [sound, fields] = await getUploadFormData(
				this,
				{ 
					field: 'sound',
					validade: isUploadCustomSoundProps,
				},
			);

			// const binaryContent = ...File;
			const result = Meteor.call('uploadCustomSound', binaryContent, contentType, fields);

			return API.v1.success(result);
		},
	},
);
