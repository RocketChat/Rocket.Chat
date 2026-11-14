import { ToastBar } from '@rocket.chat/fuselage';
import { useCountdown } from 'react-timing-hooks';

import type { ToastBarPayload } from './ToastBarContext';
import { useToastBarDismiss } from './ToastBarContext';

const ToastBarTimed = ({ time, type, id, message, title }: ToastBarPayload) => {
	const dismissToastMessage = useToastBarDismiss();

	// useCountdown maps pause() to stop() by default, so isPaused never turns true
	const [, { isStopped, pause, resume }] = useCountdown(time, 0, {
		onEnd: () => dismissToastMessage(id),
		startOnMount: true,
	});

	return (
		<ToastBar
			variant={type}
			onPointerEnter={() => pause()}
			onPointerLeave={() => resume()}
			onClose={dismissToastMessage}
			id={id}
			time={time}
			isPaused={isStopped}
		>
			{title}
			{message instanceof Error ? String(message) : message}
		</ToastBar>
	);
};

export default ToastBarTimed;
