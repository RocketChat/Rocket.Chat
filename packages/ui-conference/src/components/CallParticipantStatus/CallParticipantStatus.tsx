import { VisuallyHidden } from '@react-aria/visually-hidden';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { PluginParticipant } from '../../lib/providerPlugin';

export type CallParticipantStatusProps = {
	participant: PluginParticipant;
};

/**
 * What the provider says about someone, beside their name.
 *
 * Both mutes read the same: being silenced by the conference and having silenced yourself sound identical to
 * everyone listening, and which it was only matters to whoever is deciding to undo it.
 */
const CallParticipantStatus = ({ participant }: CallParticipantStatusProps) => {
	const { t } = useTranslation();

	const muted = participant.isMuted || participant.isClientMuted;

	return (
		<>
			{muted && (
				<Box marginInlineStart={4} display='flex' color='hint' title={t('Microphone_muted')}>
					<Icon name='mic-off' size='x16' />
					<VisuallyHidden>{t('Microphone_muted')}</VisuallyHidden>
				</Box>
			)}
			{participant.raisedHand && (
				<Box marginInlineStart={4} display='flex' title={t('Raised_hand')}>
					<Box is='span' aria-hidden>
						✋
					</Box>
					<VisuallyHidden>{t('Raised_hand')}</VisuallyHidden>
				</Box>
			)}
		</>
	);
};

export default CallParticipantStatus;
