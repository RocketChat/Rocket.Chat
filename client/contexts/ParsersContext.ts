import { createContext, FC, useContext } from 'react';

import { IMessage } from '../../definition/IMessage';
import { IRoom } from '../../definition/IRoom';

export type ParsedMessage = FC | string | JSX.Element;

export type ParsersContextValue = {
	useThreadTitleMessage: (msg: IMessage, room: IRoom) => FC | string | JSX.Element;
	useSidebarMessage: (msg: IMessage, room: IRoom) => FC | string | JSX.Element;
};

export const ParsersContext = createContext<ParsersContextValue>({
	useThreadTitleMessage: (msg) => msg.msg || '',
	useSidebarMessage: (msg) => msg.msg || '',
});


export const useThreadTitleMessage = (): (msg: IMessage, room: IRoom) => ParsedMessage => useContext(ParsersContext).useThreadTitleMessage;

export const useSidebarMessage = (): (msg: IMessage, room: IRoom) => ParsedMessage => useContext(ParsersContext).useSidebarMessage;
