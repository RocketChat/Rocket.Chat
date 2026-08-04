import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Field, FieldLabel, FieldRow, Icon, TextInput } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CallBar, CallBarAction, CallBarActions } from './components';
import type { CallPreferences } from './hooks/useCallPreferences';
import { useCallPreferences } from './hooks/useCallPreferences';

type ConferencePreflightProps = {
	/** What the call is called, or would be: its own name, or the room it belongs to. */
	name: string;
	/**
	 * What confirming does. `call` places a direct call, so it says who is about to be rung; `start` opens a group
	 * conference that doesn't exist yet; `join` walks into one that is already under way.
	 */
	confirm: 'call' | 'start' | 'join';
	/** Whether this user may name the call — only a group call has a name of its own, and not everyone sets it. */
	canName: boolean;
	capabilities: VideoConferenceCapabilities;
	onConfirm: (preferences: CallPreferences, name: string) => void;
	onCancel: () => void;
};

/**
 * What the user sees before they are in the call: how they will arrive, and — for whoever started it — what the
 * call is called.
 *
 * This is why the call window can open the moment someone asks for it and still leave the choice with them: the
 * join is what turns these preferences into the provider's URL, so it waits here rather than happening on the way
 * in. It is also the only place devices are configured, which is what let the popups in the room stop asking.
 *
 * There is deliberately **no camera preview**. All today's providers can be told is whether to start with the
 * camera and microphone on — not *which* devices to use — so a self-view would promise a choice this screen can't
 * make, and would show a camera the call may not even end up using. It states what will happen instead, and says
 * where the choice does live. A native provider is what makes a real preview honest.
 *
 * The devices sit in the same bar the call's own controls occupy, so the control that mutes the mic doesn't move
 * between deciding to join and being in the call.
 */
const confirmLabels = { call: 'Call__name__', start: 'Start_call', join: 'Join_call' } as const;

const ConferencePreflight = ({ name, confirm, canName, capabilities, onConfirm, onCancel }: ConferencePreflightProps) => {
	const { t } = useTranslation();
	const { preferences, toggle } = useCallPreferences(capabilities);

	const [title, setTitle] = useState(name);
	const [confirming, setConfirming] = useState(false);

	const handleConfirm = () => {
		setConfirming(true);
		onConfirm(preferences, title.trim() || name);
	};

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0}>
			<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' flexGrow={1} minHeight={0} paddingInline={24}>
				{/* Where a self-view would go, saying what will actually happen: the provider is told on or off, and
				    nothing more, so this is the honest version of a preview until a native provider can offer one. */}
				<Box
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
				</Box>

				<Box fontScale='h3' color='default' marginBlockStart={24} maxWidth='x480' withTruncatedText>
					{name}
				</Box>

				{/* Nobody's phone is ringing yet — going in is what rings it, and saying so is what makes the wait
				    afterwards make sense. */}
				{confirm === 'call' && (
					<Box fontScale='p2' color='hint' marginBlockStart={8} maxWidth='x480' withTruncatedText>
						{t('__name__will_be_notified_when_you_start_the_call', { name })}
					</Box>
				)}

				{canName && (
					<Box width='100%' maxWidth='x360' marginBlockStart={16}>
						<Field>
							<FieldLabel htmlFor='conference-preflight-name'>{t('Call_name')}</FieldLabel>
							<FieldRow>
								<TextInput
									id='conference-preflight-name'
									value={title}
									placeholder={name}
									onChange={(event) => setTitle((event.target as HTMLInputElement).value)}
								/>
							</FieldRow>
						</Field>
					</Box>
				)}

				<Box marginBlockStart={24}>
					<ButtonGroup>
						{/* Leaving is a click away here, not a window the user has to find the close button on: this
						    screen exists precisely because they may not want the call after all. */}
						<Button onClick={onCancel}>{t('Cancel')}</Button>
						<Button primary loading={confirming} onClick={handleConfirm}>
							{t(confirmLabels[confirm], { name })}
						</Button>
					</ButtonGroup>
				</Box>
			</Box>

			{/* Only the devices the provider can be told about — today that is this pair, on or off. A native
			    conference will have inputs and outputs to choose from, in this same bar. */}
			<CallBar>
				<CallBarActions>
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
				</CallBarActions>
			</CallBar>
		</Box>
	);
};

export default ConferencePreflight;
