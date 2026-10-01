import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { canOfferControl } from '../../lib/callParticipants';
import type { PluginFeature, PluginParticipant, PluginSelf, ProviderPluginActions } from '../../lib/providerPlugin';

export type CallParticipantControlsProps = {
	/** Whoever this row is about, named as the row names them — the menu and its buttons are announced with it. */
	name: string;
	participant: PluginParticipant;
	/** Whether this row is the viewer's own, which changes what is worth offering and what it is called. */
	isSelf?: boolean;
	features: ReadonlySet<PluginFeature>;
	actions: ProviderPluginActions;
	/** The viewer's own standing, which is what says whether the lobby is theirs to open. */
	self?: PluginSelf;
};

/**
 * What can be done to one participant of the call, and nothing that can't — `canOfferControl` draws that line
 * and nothing here is rendered without asking it.
 *
 * The lobby gets buttons rather than a menu: being let in is the one thing anyone wants to do about someone
 * waiting there, and it is worth a click rather than two.
 */
const CallParticipantControls = ({ name, participant, isSelf = false, features, actions, self }: CallParticipantControlsProps) => {
	const { t } = useTranslation();

	const offers = (control: Parameters<typeof canOfferControl>[0]) => canOfferControl(control, participant, features, self, isSelf);

	if (participant.isWaiting) {
		return (
			<>
				{offers('admit') && (
					<IconButton small icon='check' title={t('Admit')} aria-label={t('Admit')} onClick={() => actions.admit(participant.uuid)} />
				)}
				{/* Turning someone away at the door is the same request as hanging up on them once they are in. */}
				{offers('disconnect') && (
					<IconButton
						small
						danger
						icon='cross'
						title={t('Reject')}
						aria-label={t('Reject')}
						onClick={() => actions.disconnect(participant.uuid)}
					/>
				)}
			</>
		);
	}

	const items: GenericMenuItemProps[] = [];

	// Not on your own row: the only mute this protocol carries is the conference's, which leaves your own
	// microphone running. The provider's buttons a few pixels away are the ones that reach your devices.
	if (!isSelf && offers('mute')) {
		// The conference's own mute, the only one a host can undo: a self-mute stays whatever is asked here.
		items.push({
			id: 'mute',
			icon: participant.isMuted ? 'mic' : 'mic-off',
			content: t(participant.isMuted ? 'Unmute' : 'Mute'),
			onClick: () => actions.mute(participant.uuid, !participant.isMuted),
		});
	}

	// No flag of its own for a camera, so it rides on the microphone's: Pexip gates them together.
	if (!isSelf && offers('mute-video')) {
		items.push({
			id: 'mute-video',
			icon: participant.isCameraMuted ? 'video' : 'video-off',
			content: t(participant.isCameraMuted ? 'Cam_on' : 'Cam_off'),
			onClick: () => actions.muteVideo(participant.uuid, !participant.isCameraMuted),
		});
	}

	if (offers('spotlight')) {
		items.push({
			id: 'spotlight',
			icon: participant.isSpotlight ? 'star-filled' : 'star',
			content: t(participant.isSpotlight ? 'Remove_from_spotlight' : 'Spotlight'),
			onClick: () => actions.spotlight(participant.uuid, !participant.isSpotlight),
		});
	}

	// A hand is the participant's own signal, so the label follows theirs rather than asking them to guess.
	if (offers('raise-hand')) {
		items.push({
			id: 'raise-hand',
			icon: 'hand',
			content: t(participant.raisedHand ? 'Lower_hand' : 'Raise_hand'),
			onClick: () => actions.raiseHand(participant.uuid, !participant.raisedHand),
		});
	}

	if (offers('set-role')) {
		items.push({
			id: 'set-role',
			icon: participant.isHost ? 'user' : 'shield',
			content: t(participant.isHost ? 'Make_guest' : 'Make_host'),
			onClick: () => actions.setRole(participant.uuid, participant.isHost ? 'guest' : 'host'),
		});
	}

	if (offers('disconnect')) {
		// Hanging up on yourself is leaving, and the label says so.
		items.push({
			id: 'disconnect',
			icon: 'phone-off',
			content: t(isSelf ? 'Leave' : 'Disconnect'),
			variant: 'danger',
			onClick: () => actions.disconnect(participant.uuid),
		});
	}

	if (!items.length) {
		return null;
	}

	return <GenericMenu detached icon='kebab' title={t('Call_actions_for_participant', { name })} items={items} placement='bottom-end' />;
};

export default CallParticipantControls;
