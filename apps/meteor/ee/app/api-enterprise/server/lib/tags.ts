import type { ILivechatTag, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { LivechatTag } from '@rocket.chat/models';

const filterTags = (tags: string[], serverTags: ILivechatTag[]) => {
	return tags.reduce((acc, tag) => {
		const found = serverTags.find((serverTag) => serverTag._id === tag);
		if (found) {
			acc.push(found.name);
		} else {
			acc.push(tag);
		}
		return acc;
	}, [] as string[]);
};

export const getTagsInformation = async (cannedResponses: IOmnichannelCannedResponse[]) => {
	return Promise.all(
		cannedResponses.map(async (cannedResponse) => {
			const { tags } = cannedResponse;

			if (!Array.isArray(tags) || !tags.length) {
				return cannedResponse;
			}

			const serverTags = await LivechatTag.findInIds(tags, { projection: { _id: 1, name: 1 } }).toArray();

			// Known limitation: if a tag was added and removed before this, it will return the tag id instead of the name
			cannedResponse.tags = filterTags(tags, serverTags);

			return cannedResponse;
		}),
	);
};
