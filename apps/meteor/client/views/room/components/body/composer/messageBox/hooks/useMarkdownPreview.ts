import type { IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import { getChannel, getChannelMentions, getUser, getUserMentions, textToMessageToken } from '../utils/messageMarkdownUtils';

export const useMarkdownPreview = (rid: IRoom['_id']) => {
	const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
	const [md, setMd] = useState();
	const [channels, setChannels] = useState([]);
	const [mentions, setMentions] = useState([]);
	const userSpotlight = useMethod('spotlight');

	// TODO: add proper types, currently using "any"

	const handleViewPreview = async (text: string) => {
		const mdToken = textToMessageToken(text, {});
		// Type 'Root' is not assignable to parameter of type 'SetStateAction<undefined>'
		setMd(mdToken as any);
		const channelTextArray = getChannelMentions(text) as any;
		const channelsMentioned = channelTextArray.map((c: string) => getChannel(c)).filter((ch: any) => ch !== undefined);
		setChannels(channelsMentioned as any);
		setMentions(getUserMentions(text) as any);
		const mentionsText = getUserMentions(text);
		const promises = mentionsText.map((u: any) => getUser(u, rid, userSpotlight));
		const users = await Promise.all(promises);
		setMentions(users.filter((user: any) => user !== undefined) as any);
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
