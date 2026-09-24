import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, CheckBox, Icon } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { useBreakpoints, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceToggle from '../components/CallDeviceToggle';
import CallParticipants from '../components/CallParticipants';
import type { PreflightMedia } from '../context/definitions';
import type { CallPreferences } from '../hooks/useCallDevicesInitialState';
import { useCallDevicesInitialState } from '../hooks/useCallDevicesInitialState';

/**
 * How much of the tile's bottom edge the toggles float over. The placeholder centres in what is left above it,
 * or on a short tile the icon and its line of text land underneath the buttons.
 */
const TOGGLES_ZONE = 60;

/**
 * The camera tile: 16:9, and black, because that is what a camera with nothing to show looks like. Width leads
 * while there is height to spare; on a short viewport height leads instead, or the tile crowds out the actions.
 */
const previewTileStyle = css`
	width: 100%;
	aspect-ratio: 16 / 9;
	background-color: #000;

	@media (max-height: 620px) {
		width: auto;
		max-width: 100%;
		height: min(52dvh, 300px);
	}
`;

type ConferencePreflightProps = {
	name: string;
	action: 'start' | 'join';
	isDirect: boolean;
	canName: boolean;
	defaultName?: string;
	participants?: ComponentProps<typeof CallParticipants>;
	capabilities: VideoConferenceCapabilities;
	canChooseRinging?: boolean;
	/**
	 * Whether the call this screen confirms is on its way. Both callers already hold it — confirming starts a
	 * mutation in each — so the button reads their state rather than keeping a second copy that nothing resets.
	 */
	confirming?: boolean;
	onConfirm: (preferences: CallPreferences, name: string, ring: boolean) => void;
	onCancel: () => void;
	/** The reader's own camera and microphone, for a provider that can be told which devices to use. */
	media?: PreflightMedia;
};

const ConferencePreflight = ({
	name,
	action,
	isDirect,
	canName,
	defaultName,
	participants,
	capabilities,
	canChooseRinging = false,
	confirming = false,
	onConfirm,
	onCancel,
	media,
}: ConferencePreflightProps) => {
	const { t } = useTranslation();
	// `useCallDevicesInitialState` already carries the ring habit — it calls `useCallRingPreference` itself.
	// Calling that again here put a second `useLocalStorage` subscriber on the same key, only one of which drove
	// this screen's state, leaving two sources of truth for one answer.
	const { preferences, ring, toggle, toggleRing } = useCallDevicesInitialState(capabilities);

	// Side by side once there is room for both; stacked below that, with the preview still first. Height as well
	// as width, because stacking on a landscape phone spends what little height it has on the preview.
	const wideEnough = useBreakpoints().includes('md');
	// 700px: the details column is a fixed 320 and the gap and padding take another 96, so below that the preview
	// is too narrow to see a camera in.
	const shortAndWide = useMediaQuery('(max-height: 620px) and (min-width: 700px)');
	const columns = wideEnough || shortAndWide;

	// Only a provider that runs the call in here can be told which devices to use, and only the application can
	// show them — offering the choice anywhere else would be a promise this screen has no way to keep.
	const chooseDevices = Boolean(capabilities.embedded && media);

	// In the future tense: whatever is on screen, the camera it describes is the one the call will open with.
	const placeholder = (note?: string) => (
		<Box
			display='flex'
			flexDirection='column'
			alignItems='center'
			justifyContent='center'
			width='100%'
			height='100%'
			style={{ paddingBlockEnd: TOGGLES_ZONE }}
		>
			<Icon name={preferences.cam ? 'video' : 'video-off'} size='x32' color='pure-white' />
			<Box fontScale='p2b' color='pure-white' marginBlockStart={8} textAlign='center' paddingInline={24}>
				{preferences.cam ? t('Your_camera_will_be_on') : t('Your_camera_will_be_off')}
			</Box>
			{note && (
				<Box fontScale='c1' color='hint' marginBlockStart={4} textAlign='center' paddingInline={24}>
					{note}
				</Box>
			)}
		</Box>
	);

	const [title, setTitle] = useState(defaultName ?? name);

	const previewColumn = (
		<Box display='flex' flexDirection='column' alignItems='center' width='100%' maxWidth='x700' minWidth={0}>
			<Box
				position='relative'
				width='100%'
				display='flex'
				flexDirection='column'
				alignItems='center'
				justifyContent='center'
				borderRadius='large'
				overflow='hidden'
				className={previewTileStyle}
			>
				{chooseDevices && media
					? media.renderPreview(placeholder)
					: placeholder(preferences.cam ? t('Choose_your_camera_and_microphone_inside_the_call') : undefined)}

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

			{/* Below the preview rather than on it: which device is a setting, not a control reached for mid-thought,
					    and a device's name needs more room than the tile's corner has. */}
			{chooseDevices && media?.renderDevices()}
		</Box>
	);

	/** Typed from the Box it is given to, which submits its own event type rather than React's. */
	const handleSubmit: NonNullable<ComponentProps<typeof Box>['onSubmit']> = (event) => {
		event.preventDefault();
		onConfirm(preferences, title.trim() || name, ring);
	};

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
		// A form, so Enter in the name field does what the button does. The device toggles are `IconButton`s,
		// which Fuselage types as `button`, so they stay toggles rather than becoming submits.
		<Box is='form' onSubmit={handleSubmit} display='flex' flexDirection='column' flexGrow={1} minHeight={0} overflowY='auto'>
			{/* No `minHeight={0}` here, deliberately. Shrinking this below its content let `justify-content: center`
			    push the overflow out of *both* ends: the top of the tile went above the scroll origin, where nothing
			    can reach it, and Cancel fell off the bottom. Left at `auto`, the content sets the floor — the form
			    above simply scrolls past it — and the centring still applies whenever there is room to spare. */}
			<Box
				display='flex'
				flexDirection={columns ? 'row' : 'column'}
				alignItems='center'
				justifyContent='center'
				flexGrow={1}
				paddingInline={24}
				paddingBlock={24}
				style={{ gap: columns ? 48 : 32 }}
			>
				{chooseDevices && media ? <media.Provider capabilities={capabilities}>{previewColumn}</media.Provider> : previewColumn}
				<Box display='flex' flexDirection='column' alignItems='center' width='100%' maxWidth='x320' flexShrink={0}>
					{/* An `h2`, not a `div` at heading size: it is the screen's heading and has to be findable as one. */}
					<Box is='h2' fontScale='h2' color='default' textAlign='center'>
						{heading}
					</Box>

					{canName && (
						<Box width='100%' marginBlockStart={16}>
							<Field>
								<FieldLabel>{t('Call_name')}</FieldLabel>
								<FieldRow>
									<TextInput
										value={title}
										placeholder={defaultName ?? name}
										onChange={(event) => setTitle((event.target as HTMLInputElement).value)}
									/>
								</FieldRow>
							</Field>
						</Box>
					)}

					{action === 'join' && participants && (
						<Box marginBlockStart={16} display='flex' flexDirection='column' alignItems='center'>
							<Box fontScale='c1' color='hint'>
								{t('People_in_the_call')}
							</Box>
							<Box marginBlockStart={8}>
								<CallParticipants {...participants} size='large' />
							</Box>
						</Box>
					)}

					{action === 'start' && canChooseRinging && (
						<Box marginBlockStart={16} width='100%'>
							<Field>
								<FieldRow justifyContent='center'>
									<CheckBox id='conference-preflight-ring' checked={ring} onChange={toggleRing} />
									<Box is='label' htmlFor='conference-preflight-ring' fontScale='p2' color='default' marginInlineStart={8}>
										{t('Ring_people')}
									</Box>
								</FieldRow>
							</Field>
						</Box>
					)}

					{/* Only where a ring is actually going out, or this promises a notification nobody will get. */}
					{action === 'start' && isDirect && canChooseRinging && ring && (
						<Box fontScale='p2' color='hint' marginBlockStart={16} textAlign='center'>
							{t('__name__will_be_notified_when_you_start_the_call', { name })}
						</Box>
					)}

					<Box marginBlockStart={24} width='100%'>
						<ButtonGroup vertical stretch>
							<Button type='submit' variant='primary' loading={confirming}>
								{confirmLabel}
							</Button>
							{/* Not while the call is being created: that would leave a conference nobody has entered. */}
							<Button type='button' disabled={confirming} onClick={onCancel}>
								{t('Cancel')}
							</Button>
						</ButtonGroup>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default ConferencePreflight;
