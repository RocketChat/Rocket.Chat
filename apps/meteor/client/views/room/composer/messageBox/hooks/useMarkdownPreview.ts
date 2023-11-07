import type { IRoom } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';
import { useMethod } from '@rocket.chat/ui-contexts';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import { getChannel, getChannelMentions, getUser, getUserMentions, textToMessageToken } from '../utils/messageMarkdownUtils';
import type { UserMention } from '../utils/messageMarkdownUtils';

export const useMarkdownPreview = (rid: IRoom['_id']) => {
	const userSpotlight = useMethod('spotlight');

	const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
	const [md, setMd] = useState<Root>();
	const [channels, setChannels] = useState<(SubscriptionWithRoom | undefined)[]>([]);
	const [mentions, setMentions] = useState<(UserMention | undefined)[]>([]);

	const handleViewPreview = async (text: string) => {
		const mdToken = textToMessageToken(text, {});
		setMd(mdToken);

		const channelTextArray = getChannelMentions(text);
		const channelsMentioned = channelTextArray
			.map((channelText: string) => getChannel(channelText))
			.filter((channel: SubscriptionWithRoom | undefined) => channel !== undefined);
		setChannels(channelsMentioned);

		const mentionsText = getUserMentions(text);
		const usersPromises = mentionsText.map((mention: string) => getUser(mention, rid, userSpotlight));
		const users = await Promise.all(usersPromises);
		const validUsers = users.filter((user: UserMention | undefined) => user !== undefined);
		setMentions(validUsers);

		setShowMarkdownPreview(!showMarkdownPreview);
	};

	return {
		showMarkdownPreview,
		setShowMarkdownPreview,
		handleViewPreview,
		md,
		channels,
		mentions,
	};
};
