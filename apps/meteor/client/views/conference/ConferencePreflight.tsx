import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Field, FieldRow, Icon, TextInput } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CallBarAction } from './components';
import type { CallPreferences } from './hooks/useCallPreferences';
import { useCallPreferences } from './hooks/useCallPreferences';

type ConferencePreflightProps = {
	/** What the call is called, or would be: its own name, or the room it belongs to. */
	name: string;
	/**
	 * Whether confirming *starts* the call — nothing has been asked of anyone yet — or *joins* one already under
	 * way. It is the difference between "Start a new conference" and "Join the conference".
	 */
	action: 'start' | 'join';
	/** A call with one person rather than in a room, which is what lets this screen say who it is with. */
	isDirect: boolean;
	/** Whether this user may name the call — only a group call has a name of its own, and not everyone sets it. */
	canName: boolean;
	/** What to offer as the name. Defaults to what the call is called, which is right for one that already exists. */
	defaultName?: string;
	capabilities: VideoConferenceCapabilities;
	onConfirm: (preferences: CallPreferences, name: string) => void;
	onCancel: () => void;
};

/**
 * What the user sees before they are in the call: what this call is, how they will arrive, and — for whoever
 * started it — what it is called.
 *
 * This is why the call window can open the moment someone asks for it and still leave the choice with them: the
 * join is what turns these preferences into the provider's URL, so it waits here rather than happening on the way
 * in. It is also the only place devices are configured, which is what let the popups in the room stop asking.
 *
 * There is deliberately **no camera preview**. All today's providers can be told is whether to start with the
 * camera and microphone on — not *which* devices to use — so a self-view would promise a choice this screen can't
 * make, and would show a camera the call may not even end up using. It states what will happen instead, and says
 * where the choice does live. A native provider is what makes a real preview honest — in the same tile, with the
 * device controls that already sit inside it.
 */
const ConferencePreflight = ({
	name,
	action,
	isDirect,
	canName,
	defaultName,
	capabilities,
	onConfirm,
	onCancel,
}: ConferencePreflightProps) => {
	const { t } = useTranslation();
	const { preferences, toggle } = useCallPreferences(capabilities);

	const [title, setTitle] = useState(defaultName ?? name);
	const [confirming, setConfirming] = useState(false);

	const handleConfirm = () => {
		setConfirming(true);
		onConfirm(preferences, title.trim() || name);
	};

	// A call with a person is named after them; a call in a room is just the conference that is about to happen —
	// the room's name is already on the field below, or in the call it belongs to.
	const heading = (() => {
		if (action === 'start') {
			return isDirect ? t('Start_conference_with__name__', { name }) : t('Start_a_new_conference');
		}

		return isDirect ? t('Join_conference_with__name__', { name }) : t('Join_the_conference');
	})();

	const confirmLabel = (() => {
		if (action === 'join') {
			return t('Join_call');
		}

		return isDirect ? t('Call__name__', { name }) : t('Start_call');
	})();

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0}>
			<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' flexGrow={1} minHeight={0} paddingInline={24}>
				<Box fontScale='h2' color='default' marginBlockEnd={16} maxWidth='x480' textAlign='center'>
					{heading}
				</Box>

				{/* Named before anything else, because it is the one thing here that is *about* the call rather than
				    about how the user shows up in it. The field is its own label. */}
				{canName && (
					<Box width='100%' maxWidth='x480' marginBlockEnd={16}>
						<Field>
							<FieldRow>
								<TextInput
									id='conference-preflight-name'
									aria-label={t('Call_name')}
									value={title}
									placeholder={defaultName ?? name}
									onChange={(event) => setTitle((event.target as HTMLInputElement).value)}
								/>
							</FieldRow>
						</Field>
					</Box>
				)}

				{/* Where a self-view would go, saying what will actually happen: the provider is told on or off, and
				    nothing more, so this is the honest version of a preview until a native provider can offer one.
				    The devices sit inside it, where a preview's own controls would be. */}
				<Box
					position='relative'
					width='100%'
					maxWidth='x480'
					display='flex'
					flexDirection='column'
					alignItems='center'
					justifyContent='center'
					borderRadius='x8'
					backgroundColor='surface-tint'
					paddingInline={24}
					style={{ aspectRatio: '16 / 9' }}
				>
					<Icon name={preferences.cam ? 'video' : 'video-off'} size='x32' color='hint' />
					<Box fontScale='p2b' color='hint' marginBlockStart={8} textAlign='center'>
						{preferences.cam ? t('Your_camera_will_be_on') : t('Your_camera_is_turned_off')}
					</Box>
					{preferences.cam && (
						<Box fontScale='c1' color='hint' marginBlockStart={4} textAlign='center'>
							{t('Which_devices_are_used_is_chosen_in_the_call')}
						</Box>
					)}

					{/* Only the devices the provider can be told about — today that is this pair, on or off. A native
					    conference will have inputs and outputs to choose from, in this same place. */}
					<Box position='absolute' style={{ bottom: 12 }} display='flex' justifyContent='center'>
						<ButtonGroup>
							{capabilities.mic && (
								<CallBarAction
									icon={preferences.mic ? 'mic' : 'mic-off'}
									label={preferences.mic ? t('Mic_on') : t('Mic_off')}
									pressed={preferences.mic}
									onClick={() => toggle('mic')}
								/>
							)}
							{capabilities.cam && (
								<CallBarAction
									icon={preferences.cam ? 'video' : 'video-off'}
									label={preferences.cam ? t('Cam_on') : t('Cam_off')}
									pressed={preferences.cam}
									onClick={() => toggle('cam')}
								/>
							)}
						</ButtonGroup>
					</Box>
				</Box>

				{/* Nobody's phone is ringing yet — going in is what rings it, and saying so is what makes the wait
				    afterwards make sense. */}
				{action === 'start' && isDirect && (
					<Box fontScale='p2' color='hint' marginBlockStart={16} maxWidth='x480' withTruncatedText>
						{t('__name__will_be_notified_when_you_start_the_call', { name })}
					</Box>
				)}

				<Box marginBlockStart={24}>
					<ButtonGroup>
						{/* Leaving is a click away here, not a window the user has to find the close button on: this
						    screen exists precisely because they may not want the call after all. */}
						<Button onClick={onCancel}>{t('Cancel')}</Button>
						<Button primary loading={confirming} onClick={handleConfirm}>
							{confirmLabel}
						</Button>
					</ButtonGroup>
				</Box>
			</Box>
		</Box>
	);
};

export default ConferencePreflight;
