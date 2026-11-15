import { useContext, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Screen, ScreenContent } from '../../components/Screen';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { createClassName } from '../../helpers/createClassName';
import { parentCall } from '../../lib/parentCall';
import { useStore } from '../../store';

export type TriggerMessageProps = {
	path?: string;
};

export const TriggerMessage = (_: TriggerMessageProps) => {
	const { messages } = useStore();
	const { onRestore } = useContext(ScreenContext);

	const handleStartChatClick = async () => {
		parentCall('setFullScreenDocumentMobile');
		parentCall('openWidget');
		await onRestore();
		route('/');
	};

	const { t } = useTranslation();

	const {
		theme: { color },
	} = useContext(ScreenContext);

	useEffect(() => {
		parentCall('resetDocumentStyle');
	}, []);

	const screenRef = useRef<any>(null);

	useEffect(() => {
		let height = 0;

		for (const el of screenRef.current.base.children) {
			height += el.scrollHeight;
		}

		parentCall('resizeWidget', height);
	});

	return (
		<Screen title={t('messages')} triggered ref={screenRef}>
			<ScreenContent triggered>
				{messages?.filter(canRenderMessage).map((message, i) =>
					message.msg ? (
						<p key={i} className={createClassName(styles, 'trigger-message__message')}>
							{message.msg}
						</p>
					) : null,
				)}
			</ScreenContent>
			<footer className={createClassName(styles, 'trigger-message__footer')}>
				<hr className={createClassName(styles, 'trigger-message__separator')} />
				<button
					style={color && { color }}
					onClick={handleStartChatClick}
					className={createClassName(styles, 'trigger-message__link-reply')}
				>
					{t('start_chat')}
				</button>
			</footer>
		</Screen>
	);
};

export default TriggerMessage;
