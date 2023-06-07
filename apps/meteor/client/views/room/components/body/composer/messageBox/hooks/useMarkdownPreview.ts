import type { IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useState, useEffect } from 'react';

import { getUserMentions, getChannelMentions, getChannel, getUser, textToMessageToken } from '../utils/messageMarkdownUtils';

export const useMarkdownPreview = (text: string, rid: IRoom['_id']) => {
	const [md, setMd] = useState([]);
	const [channels, setChannels] = useState([]);
	const [mentions, setMentions] = useState([]);
	const userSpotlight = useMethod('spotlight');

	useEffect(() => {
		setMd(textToMessageToken(text, {}) as any);
		setChannels(getChannelMentions(text).map((c) => getChannel(c)) as any);
		setMentions(getUserMentions(text) as any);
		const mentionsText = getUserMentions(text);
		const promises = mentionsText.map((u) => getUser(u, rid, userSpotlight));
		Promise.all(promises).then((users: any) => setMentions(users));
	}, [text]);

	return { md, channels, mentions };
};
