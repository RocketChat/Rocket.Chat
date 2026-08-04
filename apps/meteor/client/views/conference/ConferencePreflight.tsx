import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { Box, Button, Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CallBar, CallBarAction, CallBarActions } from './components';
import type { CallPreferences } from './hooks/useCallPreferences';
import { useCallPreferences } from './hooks/useCallPreferences';
import { useCameraPreview } from './hooks/useCameraPreview';

type ConferencePreflightProps = {
	callId: string;
	/** What the call is called today: its own name, or the room it belongs to. */
	name: string;
	/** Only the person who started a group call may name it, and only a group call has a name of its own. */
	canRename: boolean;
	/** This user is placing the call: nobody has been asked to answer it until they go in. */
	placing: boolean;
	capabilities: VideoConferenceCapabilities;
	onJoin: (preferences: CallPreferences) => void;
};

/**
 * What the user sees before they are in the call: how they will arrive, and — for whoever started it — what the
 * call is called.
 *
 * This is why the call window can open the moment someone asks for it and still leave the choice with them: the
 * join is what turns these preferences into the provider's URL, so it waits here rather than happening on the way
 * in. It is also the only place devices are configured, which is what let the popups in the room stop asking —
 * a choice made in a popup, seconds before a window opens, is one the user makes again anyway once they can see
 * themselves.
 *
 * The devices sit in the same bar the call's own controls occupy, so the control that mutes the mic doesn't move
 * between deciding to join and being in the call.
 */
const ConferencePreflight = ({ callId, name, canRename, placing, capabilities, onJoin }: ConferencePreflightProps) => {
	const { t } = useTranslation();
	const user = useUser();
	const { preferences, toggle } = useCallPreferences(capabilities);
	const { videoRef, live } = useCameraPreview(preferences.cam);
	const dispatchToastMessage = useToastMessageDispatch();
	const renameCall = useEndpoint('POST', '/v1/video-conference.rename');

	const [title, setTitle] = useState(name);
	const [joining, setJoining] = useState(false);

	const join = async () => {
		setJoining(true);

		// Naming is not worth failing the join over: if it doesn't take, say so and let them into the call, which
		// is what they actually asked for.
		const renamed = title.trim();
		if (canRename && renamed && renamed !== name) {
			try {
				await renameCall({ callId, title: renamed });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		}

		onJoin(preferences);
	};

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0}>
			<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' flexGrow={1} minHeight={0} paddingInline={24}>
				{/* The self-view, in the shape and place the call itself will occupy. With the camera off it holds the
				    user's avatar rather than collapsing, so turning it on and off doesn't move everything below it. */}
				<Box
					width='100%'
					maxWidth='x480'
					display='flex'
					alignItems='center'
					justifyContent='center'
					overflow='hidden'
					borderRadius='x8'
					backgroundColor='surface-tint'
					style={{ aspectRatio: '16 / 9' }}
				>
					{/* A live camera has nothing to caption. */}
					{/* eslint-disable-next-line jsx-a11y/media-has-caption */}
					<video
						ref={videoRef}
						autoPlay
						muted
						playsInline
						aria-label={t('Camera')}
						style={{ width: '100%', height: '100%', objectFit: 'cover', display: live ? 'block' : 'none' }}
					/>
					{!live && <UserAvatar size='x124' username={user?.username ?? ''} />}
				</Box>

				<Box fontScale='h3' color='default' marginBlockStart={24} maxWidth='x480' withTruncatedText>
					{name}
				</Box>

				{/* Nobody's phone is ringing yet — going in is what rings it, and saying so is what makes the wait
				    afterwards make sense. */}
				{placing && (
					<Box fontScale='p2' color='hint' marginBlockStart={8} maxWidth='x480' withTruncatedText>
						{t('__name__will_be_notified_when_you_start_the_call', { name })}
					</Box>
				)}

				{canRename && (
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
					<Button primary loading={joining} onClick={join}>
						{placing ? t('Call__name__', { name }) : t('Join_call')}
					</Button>
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
