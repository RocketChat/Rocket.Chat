import type { IRoom } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';
import React, { memo, useMemo } from 'react';

import GazzodownText from '../../../GazzodownText';

type ParsedTextProps = {
	text: string;
	mentions?: {
		type: 'user' | 'team';
		_id: string;
		username?: string;
		name?: string;
	}[];
	channels?: Pick<IRoom, '_id' | 'name'>[];
	searchText?: string;
};

const ParsedText = ({ text, mentions, channels, searchText }: ParsedTextProps) => {
	const tokens = useMemo(() => {
		if (!text) {
			return undefined;
		}

		return parse(text, { emoticons: true });
	}, [text]);

	if (!tokens) {
		return null;
	}

	return <GazzodownText tokens={tokens} mentions={mentions} channels={channels} searchText={searchText} />;
};

export default memo(ParsedText);
