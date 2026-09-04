import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, CheckBox, Field, FieldRow, Icon, TextInput } from '@rocket.chat/fuselage';
import { useBreakpoints, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceToggle from './components/CallDeviceToggle';
import type { CallPreferences } from './hooks/useCallPreferences';
import { useCallPreferences } from './hooks/useCallPreferences';
import CallParticipants from '../../components/CallParticipants';

/**
 * How much of the tile's bottom edge the mic and camera toggles float over: their own inset plus their height,
 * and a little clear air. The placeholder inside the tile centres in what is left above this rather than in the
 * whole tile — otherwise the icon and its line of text land underneath the buttons, which is what a short tile
 * (a phone in landscape, a small window) leaves room for.
 */
const TOGGLES_ZONE = 60;

/**
 * The camera tile: 16:9, and black rather than a themed surface, since this is where a camera goes and a camera
 * with nothing to show is black. It stays black with the camera off too, so toggling it doesn't repaint the tile.
 *
 * Width leads while there is height to spare. On a short viewport — a phone in landscape, a small window — a
 * full-width 16:9 tile is taller than the whole screen, and it was pushing the field and the button that starts
 * the call below the fold: the tile says what the camera *will* do, while the button is what the screen is for.
 * So there, height leads and the aspect ratio derives the width, which keeps the tile 16:9 and centred instead
 * of crowding out the actions.
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
	onConfirm: (preferences: CallPreferences, name: string, ring: boolean) => void;
	onCancel: () => void;
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
	onConfirm,
	onCancel,
}: ConferencePreflightProps) => {
	const { t } = useTranslation();
	// `useCallPreferences` already carries the ring habit — it calls `useCallRingPreference` itself. Calling that
	// again here put a second `useLocalStorage` subscriber on the same key, only one of which drove this screen's
	// state, leaving two sources of truth for one answer.
	const { preferences, ring, toggle, toggleRing } = useCallPreferences(capabilities);

	// Side by side once there is room for both; stacked below that, with the preview still first.
	//
	// Width alone was the wrong question. A phone in landscape is wide but short, and stacking there spent the
	// little height it has on the preview, leaving the name and the call button off the bottom of the screen —
	// so the columns come back on the viewport's shape as well as its width.
	const wideEnough = useBreakpoints().includes('md');
	const shortAndWide = useMediaQuery('(max-height: 620px) and (min-width: 480px)');
	const columns = wideEnough || shortAndWide;

	const [title, setTitle] = useState(defaultName ?? name);
	const [confirming, setConfirming] = useState(false);

	const handleConfirm = () => {
		setConfirming(true);
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

	const previewColumn = (
		<Box display='flex' flexDirection='column' alignItems='center' width='100%' maxWidth='x700' minWidth={0}>
			<Box
				position='relative'
				width='100%'
				display='flex'
				flexDirection='column'
				alignItems='center'
				justifyContent='center'
				borderRadius='x8'
				overflow='hidden'
				className={previewTileStyle}
			>
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
						{preferences.cam ? t('Your_camera_will_be_on') : t('Your_camera_is_turned_off')}
					</Box>
					{preferences.cam && (
						<Box fontScale='c1' color='hint' marginBlockStart={4} textAlign='center' paddingInline={24}>
							{t('Which_devices_are_used_is_chosen_in_the_call')}
						</Box>
					)}
				</Box>

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
		</Box>
	);

	const detailsColumn = (
		<Box display='flex' flexDirection='column' alignItems='center' width='100%' maxWidth='x320' flexShrink={0}>
			{/* An `h2` rather than a `div` at heading size: it is the screen's heading, and this is the only thing
			    that lets anyone — or anything — find it as one. */}
			<Box is='h2' fontScale='h2' color='default' textAlign='center'>
				{heading}
			</Box>

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

			{action === 'join' && participants && (
				<Box marginBlockStart={16} display='flex' flexDirection='column' alignItems='center'>
					<Box fontScale='c1' color='hint'>
						{t('People_in_the_call')}
					</Box>
					<Box marginBlockStart={8}>
						<CallParticipants {...participants} size='x24' />
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

			{action === 'start' && isDirect && (!canChooseRinging || ring) && (
				<Box fontScale='p2' color='hint' marginBlockStart={16} textAlign='center' withTruncatedText>
					{t('__name__will_be_notified_when_you_start_the_call', { name })}
				</Box>
			)}

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
