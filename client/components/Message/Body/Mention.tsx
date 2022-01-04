import { UserMention as ASTUserMention } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import { useUserId } from '../../../contexts/UserContext';
import { UserMention } from './definitions/UserMention';

const Mention: FC<{ value: ASTUserMention['value']; mentions: UserMention[] }> = ({ value: { value: mention }, mentions }) => {
	const uid = useUserId();
	const mentioned = mentions.find((mentioned) => mentioned.username === mention);
	const classNames = ['mention-link'];
	if (mention === 'all') {
		classNames.push('mention-link--all');
		classNames.push('mention-link--group');
	} else if (mention === 'here') {
		classNames.push('mention-link--here');
		classNames.push('mention-link--group');
	} else if (mentioned && mentioned._id === uid) {
		classNames.push('mention-link--me');
		classNames.push('mention-link--user');
	} else {
		classNames.push('mention-link--user');
	}
	return (
		<>
			{mentioned && <span className={classNames.join(' ')}>{mentioned.name || mention}</span>}
			{!mentioned && `@${mention}`}
		</>
	);
};

export default memo(Mention);
