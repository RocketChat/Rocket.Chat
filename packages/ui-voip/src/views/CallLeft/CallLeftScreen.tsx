import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { playCallEndTone } from '../../utils/callChimes';

export type CallLeftScreenProps = {
	/** how many other participants remain in the call */
	participantCount: number;
	autoCloseSeconds?: number;
	onRejoin: () => void;
	onClose: () => void;
};

/**
 * Post-leave state of the call window ("In call: you left / ended"). The
 * window is never a dead end: it survives for a few seconds with a Rejoin
 * action, then closes itself — the room's call card remains the way back.
 * Edge states live inside the call window, never as app toasts.
 */
const CallLeftScreen = ({ participantCount, autoCloseSeconds = 10, onRejoin, onClose }: CallLeftScreenProps) => {
	const { t } = useTranslation();
	const [secondsLeft, setSecondsLeft] = useState(autoCloseSeconds);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		playCallEndTone();
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setSecondsLeft((seconds) => {
				if (seconds <= 1) {
					clearInterval(interval);
					onCloseRef.current();
					return 0;
				}
				return seconds - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<Box
			is='section'
			aria-label={t('You_left_the_call')}
			display='flex'
			flexDirection='column'
			alignItems='center'
			justifyContent='center'
			w='full'
			h='full'
			bg='surface-tint'
			style={{ gap: '1rem' }}
		>
			<Box fontScale='h3' color='default'>
				{t('You_left_the_call')}
			</Box>
			<Box fontScale='c1' color='hint' textAlign='center' role='status'>
				{participantCount > 0 && <>{t('Call_continues_with_count_participants', { count: participantCount })} </>}
				{t('Window_closes_automatically_in_seconds', { seconds: secondsLeft })}
			</Box>
			<ButtonGroup>
				<Button secondary onClick={onClose}>
					{t('Close')}
				</Button>
				<Button primary onClick={onRejoin}>
					{t('Rejoin')}
				</Button>
			</ButtonGroup>
		</Box>
	);
};

export default CallLeftScreen;
