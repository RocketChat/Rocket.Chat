import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import { Screen, ScreenContent, ScreenFooter } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import Triggers from '../../lib/triggers';
import { useStore } from '../../store';

export type ChatFinishedProps = {
	path?: string;
};

const ChatFinished = (_: ChatFinishedProps) => {
	const { t } = useTranslation();
	const { config: { messages: { conversationFinishedMessage: greeting, conversationFinishedText: message } = {} } = {} } = useStore();

	const handleClick = () => {
		route('/');
		Triggers.callbacks?.emit('chat-visitor-registered');
	};

	return (
		<Screen title={t('chat_finished')} className={createClassName(styles, 'chat-finished')}>
			<ScreenContent>
				<p className={createClassName(styles, 'chat-finished__greeting')}>{greeting || t('thanks_for_talking_with_us')}</p>
				<p className={createClassName(styles, 'chat-finished__message')}>
					{message || t('if_you_have_any_other_questions_just_press_the_but')}
				</p>

				<ButtonGroup>
					<Button onClick={handleClick} stack>
						{t('new_chat')}
					</Button>
				</ButtonGroup>
			</ScreenContent>
			<ScreenFooter />
		</Screen>
	);
};

export default ChatFinished;
