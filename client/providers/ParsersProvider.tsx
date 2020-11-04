import React, { FC, useMemo } from 'react';
import s from 'underscore.string';

import { IMessage } from '../../definition/IMessage';
import { IRoom, IDirectMessageRoom } from '../../definition/IRoom';
import { IUser } from '../../definition/IUser';
import { ParsersContext } from '../contexts/ParsersContext';
import { filterMarkdown } from '../../app/markdown/lib/markdown.js';
import { TranslationContextValue, useTranslation } from '../contexts/TranslationContext';
import { useUser } from '../contexts/UserContext';

export const getSidebarMessage = ({ ...message }: IMessage, t: TranslationContextValue['translate']): string => {
	if (message.msg) {
		return s.escapeHTML(filterMarkdown(message.msg));
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return s.escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return s.escapeHTML(attachment.title);
		}
		return t('Sent_an_attachment');
	}
	return t('No_messages_yet');
};


const getSidebarParser = (t: TranslationContextValue['translate'], username?: IUser['username']) => ({ ...message }: IMessage, room: IRoom): JSX.Element => {
	const label: string = ((): string => {
		if (!message.u) {
			return getSidebarMessage(message, t);
		}
		if (message.u?.username === username) {
			return `${ t('You') }: ${ getSidebarMessage(message, t) }`;
		}
		if (room.t === 'd' && (room as unknown as IDirectMessageRoom).uids.length <= 2) {
			return getSidebarMessage(message, t);
		}
		return `${ message.u.name || message.u.username }: ${ getSidebarMessage(message, t) }`;
	})();
	return <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: label }}/>;
};


const getThreadTitleParser = (t: TranslationContextValue['translate'], username?: IUser['username']) => ({ ...message }: IMessage, room: IRoom): JSX.Element => {
	const label: string = ((): string => {
		if (!message.u) {
			return getSidebarMessage(message, t);
		}
		if (message.u?.username === username) {
			return `${ t('You') }: ${ getSidebarMessage(message, t) }`;
		}
		if (room.t === 'd' && (room as unknown as IDirectMessageRoom).uids.length <= 2) {
			return getSidebarMessage(message, t);
		}
		return `${ message.u.name || message.u.username }: ${ getSidebarMessage(message, t) }`;
	})();
	return <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: label }}/>;
};

const ParsersProvider: FC = ({ children }) => {
	const t = useTranslation();
	const user = useUser();

	const value = useMemo(() => ({
		useThreadTitleMessage: getThreadTitleParser(t, user?.username),
		useSidebarMessage: getSidebarParser(t, user?.username),
	}), [t, user]);

	return <ParsersContext.Provider
		children={children}
		value={value}
	/>;
};

export default ParsersProvider;
