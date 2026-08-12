import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Field, FieldRow, Icon, TextInput } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceMenu from './CallDeviceMenu';
import CallDeviceToggle from './CallDeviceToggle';
import { useCallDevicePreview } from './hooks/useCallDevicePreview';
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
 * Whether it shows a **camera preview** depends on what the provider can be told. A URL-based provider takes
 * only "camera on" — not *which* camera — so a self-view there would promise a choice this screen can't make and
 * might show a camera the call never uses; it says what will happen instead. A provider that runs the call in
 * here takes the devices as well, so the preview is the honest thing: the camera it will actually send.
 *
 * Laid out in two columns: how the user will look and sound on one side, what they are joining and the decision
 * itself on the other. They are separate questions, and putting the decision under a column of controls made it
 * read as the last of them rather than the point of the screen. Narrow viewports stack, preview first.
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
	const { preferences, devices, toggle, selectDevice } = useCallPreferences(capabilities);

	// Only a provider that runs the call in here can be told which devices to use. Offering the choice to one
	// that can't would be a promise this screen has no way to keep.
	const canChooseDevices = Boolean(capabilities.embedded);

	const preview = useCallDevicePreview(canChooseDevices, preferences, devices);
	const selfView = canChooseDevices && preferences.cam && !!preview.stream;

	// Assigned rather than passed as a prop: `srcObject` is not an attribute, so React cannot set it.
	const videoRef = useCallback(
		(node: HTMLVideoElement | null) => {
			if (node) {
				node.srcObject = preview.stream;
			}
		},
		[preview.stream],
	);

	// Side by side once there is room for both; stacked below that, with the preview still first.
	const columns = useBreakpoints().includes('md');

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

	const previewColumn = (
		<Box display='flex' flexDirection='column' alignItems='center' width='100%' maxWidth='x800' minWidth={0}>
			{/* A provider that runs the call in here takes the devices too, so this shows what will actually be sent:
			    the camera itself, and which camera and microphone it is. A URL-based provider takes neither, so there
			    it keeps saying what will happen rather than promising a choice it can't make. */}
			<Box
				position='relative'
				width='100%'
				display='flex'
				flexDirection='column'
				alignItems='center'
				justifyContent='center'
				borderRadius='x8'
				overflow='hidden'
				// Black, not a themed surface: this is where a camera goes, and a camera with nothing to show is black.
				// It stays black with the camera off too, so toggling it doesn't repaint the tile.
				style={{ aspectRatio: '16 / 9', backgroundColor: '#000' }}
			>
				{selfView ? (
					<Box
						is='video'
						ref={videoRef}
						autoPlay
						playsInline
						muted
						width='100%'
						height='100%'
						// Mirrored, because a self-view that isn't reads as someone else's camera.
						style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
					/>
				) : (
					<>
						<Icon name={preferences.cam ? 'video' : 'video-off'} size='x32' color='pure-white' />
						<Box fontScale='p2b' color='pure-white' marginBlockStart={8} textAlign='center' paddingInline={24}>
							{preferences.cam ? t('Your_camera_will_be_on') : t('Your_camera_is_turned_off')}
						</Box>
						{preferences.cam && !canChooseDevices && (
							<Box fontScale='c1' color='hint' marginBlockStart={4} textAlign='center' paddingInline={24}>
								{t('Which_devices_are_used_is_chosen_in_the_call')}
							</Box>
						)}
						{preferences.cam && canChooseDevices && preview.error && (
							<Box fontScale='c1' color='hint' marginBlockStart={4} textAlign='center' paddingInline={24}>
								{t('Could_not_access_your_camera')}
							</Box>
						)}
					</>
				)}

				{/* Over the preview, where they belong to the thing they change — and where every call UI puts them. */}
				<Box position='absolute' style={{ bottom: 12 }} display='flex' justifyContent='center'>
					<ButtonGroup>
						{capabilities.mic && (
							<CallDeviceToggle
								device='mic'
								on={preferences.mic}
								label={preferences.mic ? t('Mic_on') : t('Mic_off')}
								onToggle={() => toggle('mic')}
							/>
						)}
						{capabilities.cam && (
							<CallDeviceToggle
								device='cam'
								on={preferences.cam}
								label={preferences.cam ? t('Cam_on') : t('Cam_off')}
								onToggle={() => toggle('cam')}
							/>
						)}
					</ButtonGroup>
				</Box>
			</Box>

			{/* Below the preview rather than on it: which device is a setting, not a control you reach for
			    mid-thought, and a named device needs room the tile's corner doesn't have.
			
			    None of them is gated on the device being on. Arriving muted is normal, and someone who does may
			    still care which microphone gets unmuted later — refusing the choice until they turn it on would
			    make them turn it on just to set it. */}
			{canChooseDevices && (
				<Box
					display='grid'
					width='100%'
					alignItems='center'
					marginBlockStart={12}
					// A grid rather than flex: equal columns are what make the three read as one set, and flex
					// sizes to content however hard it is pushed. `minmax(0, 1fr)` is what lets them truncate.
					style={{ gap: 8, gridAutoFlow: 'column', gridAutoColumns: 'minmax(0, 1fr)' }}
				>
					{capabilities.mic && (
						<CallDeviceMenu
							icon='mic'
							label={t('Microphone')}
							devices={preview.audioInputs}
							selectedId={devices.micId}
							onSelect={(deviceId) => selectDevice('mic', deviceId)}
						/>
					)}
					<CallDeviceMenu
						icon='volume'
						label={t('Speaker')}
						devices={preview.audioOutputs}
						selectedId={devices.speakerId}
						onSelect={(deviceId) => selectDevice('speaker', deviceId)}
					/>
					{capabilities.cam && (
						<CallDeviceMenu
							icon='video'
							label={t('Camera')}
							devices={preview.videoInputs}
							selectedId={devices.camId}
							onSelect={(deviceId) => selectDevice('cam', deviceId)}
						/>
					)}
				</Box>
			)}
		</Box>
	);

	const detailsColumn = (
		<Box display='flex' flexDirection='column' alignItems='center' width='100%' maxWidth='x320' flexShrink={0}>
			<Box fontScale='h2' color='default' textAlign='center'>
				{heading}
			</Box>

			{/* Named here because it is the one thing on this screen that is *about* the call rather than about how the
			    user shows up in it. The field is its own label. */}
			{canName && (
				<Box width='100%' marginBlockStart={16}>
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

			{/* Nobody's phone is ringing yet — going in is what rings it, and saying so is what makes the wait
			    afterwards make sense. */}
			{action === 'start' && isDirect && (
				<Box fontScale='p2' color='hint' marginBlockStart={16} textAlign='center' withTruncatedText>
					{t('__name__will_be_notified_when_you_start_the_call', { name })}
				</Box>
			)}

			{/* Stacked and full width, confirm first: it is what this screen is asking. Leaving stays a click away
			    underneath -- not a window the user has to find a close button on -- because the screen exists
			    precisely because they may not want the call after all. */}
			<Box marginBlockStart={24} width='100%'>
				<ButtonGroup vertical stretch>
					<Button primary loading={confirming} onClick={handleConfirm}>
						{confirmLabel}
					</Button>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
				</ButtonGroup>
			</Box>
		</Box>
	);

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} overflowY='auto'>
			<Box
				display='flex'
				flexDirection={columns ? 'row' : 'column'}
				alignItems='center'
				justifyContent='center'
				flexGrow={1}
				minHeight={0}
				paddingInline={24}
				paddingBlock={24}
				style={{ gap: columns ? 48 : 32 }}
			>
				{previewColumn}
				{detailsColumn}
			</Box>
		</Box>
	);
};

export default ConferencePreflight;
