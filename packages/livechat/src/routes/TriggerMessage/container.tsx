import type { FunctionalComponent } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { route } from 'preact-router';

import TriggerMessage from './component';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { formatAgent } from '../../helpers/formatAgent';
import { parentCall } from '../../lib/parentCall';
import { StoreContext } from '../../store';

export const TriggerMessageContainer: FunctionalComponent<{ path: string }> = ({ ref }) => {
	const { messages, agent, unread } = useContext(StoreContext);
	const { theme, onRestore } = useContext(ScreenContext);

	const handleStart = async () => {
		parentCall('setFullScreenDocumentMobile');
		parentCall('openWidget');
		await onRestore();
		route('/');
	};

	useEffect(() => {
		parentCall('resetDocumentStyle');
	}, []);

	return (
		<TriggerMessage
			ref={ref}
			unread={unread}
			agent={formatAgent(agent)}
			messages={messages?.filter(canRenderMessage)}
			theme={theme}
			onStartChat={() => handleStart()}
		/>
	);
};

export default TriggerMessageContainer;
