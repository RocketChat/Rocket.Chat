import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { PluginFeature, PluginParticipant, PluginSelf, ProviderPluginActions } from '../../hooks/useProviderPlugin';
import { canOfferControl } from '../../lib/callParticipants';

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
 * What can be done to one participant of the call, and nothing that can't.
 *
 * Every control here goes out over the plugin protocol, which carries no answers back: a request the provider
 * refuses is a 403 in a console this window cannot read, and the only sign of it would be the next roster
 * looking exactly like the last one. So a control is either offered and honoured or not offered at all —
 * `canOfferControl` is what draws that line, and nothing here is rendered without asking it.
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

	// Not on your own row. The only mute this protocol carries is the conference's — it stops the call carrying
	// you, and leaves your microphone running, your camera on and the provider's own buttons where they were.
	// Those buttons are the ones that reach your devices, they are in this same window, and the plugin API has
	// nothing that reaches them. Offering a control that looks like the one a few pixels away and does something
	// else is worse than offering none.
	if (!isSelf && offers('mute')) {
		// The conference's own mute, which is the only one a host can undo — someone who muted themselves in
		// their own client stays muted whatever is asked here.
		items.push({
			id: 'mute',
			icon: participant.isMuted ? 'mic' : 'mic-off',
			content: t(participant.isMuted ? 'Unmute' : 'Mute'),
			onClick: () => actions.mute(participant.uuid, !participant.isMuted),
		});
	}

	// The provider has no flag of its own for a camera, so this rides on the one for a microphone: both are the
	// conference silencing a device of theirs, and Pexip gates them together.
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

	// A hand is the participant's own signal, so the label follows theirs rather than asking them to guess: on
	// your own row it is putting your hand up, and on somebody else's it is taking theirs down.
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
		// Hanging up on yourself is leaving, and calling it what it is matters most on the one row where the
		// reader might otherwise think it happens to someone else.
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
