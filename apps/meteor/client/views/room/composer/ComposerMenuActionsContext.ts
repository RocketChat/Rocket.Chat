import type { IMessage, IRoom, IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

import type { ComposerAPI } from '../../../lib/chats/ChatAPI';

/** What the composer's action menu asks for, carried out by whoever mounts the composer: modals, uploads */
export type ComposerMenuActions = {
	addWebdavAccount: () => void;
	pickWebdavFile: (account: IWebdavAccountIntegration) => void;
	createDiscussion: (room: IRoom) => void;
	shareLocation: (room: IRoom, tmid?: IMessage['tmid']) => void;
	insertTimestamp: (composer: ComposerAPI) => void;
};

const noop = () => undefined;

export const inertComposerMenuActions: ComposerMenuActions = {
	addWebdavAccount: noop,
	pickWebdavFile: noop,
	createDiscussion: noop,
	shareLocation: noop,
	insertTimestamp: noop,
};

export const ComposerMenuActionsContext = createContext<ComposerMenuActions>(inertComposerMenuActions);
ComposerMenuActionsContext.displayName = 'ComposerMenuActions';

export const useComposerMenuActions = (): ComposerMenuActions => useContext(ComposerMenuActionsContext);
