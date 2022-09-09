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
		permissionsRequired: ['manage-sounds'],
		validateParams: isUploadCustomSoundProps,
	},
	{
		async post() {
			const { contentType, soundData } = this.bodyParams;

			const [sound, fields] = await getUploadFormData(
				{
					request: this.request,
				},
				{
					field: 'sound',
					// validation: 'required',
				},
			);

			if (!sound) {
				return API.v1.failure("The 'sound' param is required");
			}

			// const binaryContent = ...File;
			Meteor.call('uploadCustomSound', sound, contentType, soundData, fields);

			return API.v1.success();
		},
	},
);
