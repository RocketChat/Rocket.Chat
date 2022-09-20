import { CustomSounds } from '@rocket.chat/models';
import { isUploadCustomSoundProps } from '@rocket.chat/rest-typings';

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
			const [sound, { contentType, extension, _id, previousName, previousSound, previousExtension, name, newFile, random }] =
				await getUploadFormData(
					{
						request: this.request,
					},
					{
						field: 'sound',
					},
				);

			const soundData = {
				extension,
				_id,
				previousName,
				previousSound,
				previousExtension,
				name,
				newFile,
				random,
			};

			if (!sound) {
				return API.v1.failure("The 'sound' param is required");
			}

			Meteor.call('uploadCustomSound', sound.fileBuffer, contentType, soundData);

			return API.v1.success();
		},
	},
);
