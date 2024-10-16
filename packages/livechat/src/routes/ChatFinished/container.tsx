import type { TFunction } from 'i18next';
import type { FunctionalComponent } from 'preact';
import { route } from 'preact-router';
import { useContext } from 'preact/hooks';
import { withTranslation } from 'react-i18next';

import { StoreContext } from '../../store';
import ChatFinished from './component';

const ChatFinishedContainer: FunctionalComponent<{ path: string; t: TFunction }> = ({ ref, t }) => {
	const {
		config: {
			messages: { conversationFinishedMessage: greeting, conversationFinishedText: message },
		},
	} = useContext(StoreContext);

	const handleRedirect = () => {
		route('/');
	};

	return <ChatFinished ref={ref} title={t('chat_finished')} greeting={greeting} message={message} onRedirectChat={handleRedirect} />;
};

export default withTranslation()(ChatFinishedContainer);
