import React, { FC, useMemo } from 'react';
import s from 'underscore.string';

import { IMessage } from '../../definition/IMessage';
import { IRoom, IDirectMessageRoom } from '../../definition/IRoom';
import { IUser } from '../../definition/IUser';
import { ParsersContext } from '../contexts/ParsersContext';
import { filterMarkdown } from '../../app/markdown/lib/markdown.js';
import { TranslationContextValue, useTranslation } from '../contexts/TranslationContext';
import { useUser } from '../contexts/UserContext';
import { MentionsParser } from '../../app/mentions/lib/MentionsParser';
import { emojiParser } from '../../app/emoji/client/emojiParser';


export const getAttachmentMessage = (message: IMessage, t: TranslationContextValue['translate']): string | undefined => {
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
};

export const getSidebarMessage = ({ ...message }: IMessage, t: TranslationContextValue['translate']): string => {
	if (message.msg) {
		return s.escapeHTML(filterMarkdown(message.msg));
	}
	return getAttachmentMessage(message, t) || t('No_messages_yet');
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


const getThreadTitleParser = (t: TranslationContextValue['translate'], username: IUser['username'], pattern: string, useRealName: boolean): ({ ...message }: IMessage) => JSX.Element => {
	const instance = new MentionsParser({
		pattern: (): string => pattern,
		useRealName: (): boolean => useRealName,
		me: (): string | undefined => username,
		userTemplate: ({ label }): string => `<strong> ${ label } </strong>`,
		roomTemplate: ({ prefix, mention }): string => `${ prefix }<strong> ${ mention } </strong>`,
	});


	const getTitleThreadMessage = (message: IMessage): string => {
		if (message.msg) {
			const filteredMessage = filterMarkdown(s.escapeHTML(message.msg));
			if (!message.channels && !message.mentions) {
				return filteredMessage;
			}

			const { html } = emojiParser({ html: filteredMessage });
			return instance.parse({ ...message, msg: filteredMessage, html }).html;
		}
		return getAttachmentMessage(message, t) || t('No_messages_yet');
	};

	return ({ ...message }: IMessage): JSX.Element => {
		const label = getTitleThreadMessage(message);
		return <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: label }}/>;
	};
};

const ParsersProvider: FC = ({ children }) => {
	const t = useTranslation();
	const user = useUser();

	const pattern = '';
	const useRealName = true;

	const value = useMemo(() => ({
		useThreadTitleMessage: getThreadTitleParser(t, user?.username, pattern, useRealName),
		useSidebarMessage: getSidebarParser(t, user?.username),
	}), [t, user, pattern, useRealName]);

	return <ParsersContext.Provider
		children={children}
		value={value}
	/>;
};

export default ParsersProvider;
