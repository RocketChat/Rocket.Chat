import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, CheckBox, Field, FieldRow, Icon, TextInput } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceToggle from './CallDeviceToggle';
import type { CallPreferences } from './hooks/useCallPreferences';
import { useCallPreferences, useCallRingPreference } from './hooks/useCallPreferences';
import CallParticipants from '../../components/CallParticipants';

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
	const { preferences, toggle } = useCallPreferences(capabilities);
	const { ring, toggleRing } = useCallRingPreference();

	const columns = useBreakpoints().includes('md');

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
				style={{ aspectRatio: '16 / 9', backgroundColor: '#000' }}
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
			<Box fontScale='h2' color='default' textAlign='center'>
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
