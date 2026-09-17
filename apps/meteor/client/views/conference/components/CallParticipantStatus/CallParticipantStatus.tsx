import { VisuallyHidden } from '@react-aria/visually-hidden';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { PluginParticipant } from '../../hooks/useProviderPlugin';

/**
 * What the provider says about someone, beside their name.
 *
 * Only what the roster can answer, which for a call running in the provider's own frame is less than the window
 * would like: there is no audio here to meter, so a microphone is either off or unremarked. Both mutes count as
 * off — being silenced by the conference and having silenced yourself sound identical to everyone listening,
 * and which of the two it was only matters to whoever is deciding to undo it, in the menu.
 *
 * Each marker is drawn `aria-hidden` and said in text beside it: an icon carries nothing to a reader who cannot
 * see it, and a hand that is only an emoji is announced as the emoji's own name or as nothing at all.
 */
const CallParticipantStatus = ({ participant }: { participant: PluginParticipant }) => {
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
