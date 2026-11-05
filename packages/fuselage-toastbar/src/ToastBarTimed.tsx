import { ToastBar } from '@rocket.chat/fuselage';
import { useCountdown } from 'react-timing-hooks';

import type { ToastBarPayload } from './ToastBarContext';
import { useToastBarDismiss } from './ToastBarContext';

const ToastBarTimed = ({ time, type, id, message, title }: ToastBarPayload) => {
	const dismissToastMessage = useToastBarDismiss();

	const [, { isPaused, pause, resume }] = useCountdown(time, 0, {
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
			isPaused={isPaused}
		>
			{title}
			{message instanceof Error ? String(message) : message}
		</ToastBar>
	);
};

export default ToastBarTimed;
