import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';
import { usePeekMediaSessionState, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import useClipboardWithToast from '../../hooks/useClipboardWithToast';
import { formatPhoneNumber } from '../../lib/formatPhoneNumber';

const UserInfoPhoneNumberItem = ({ number, label }: IUserPhoneNumber) => {
	const { t } = useTranslation();
	const formattedNumber = number.startsWith('+') ? formatPhoneNumber(number) : number;
	const { copy } = useClipboardWithToast(number);

	const mediaCallState = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();
	const canMakeExternalCall = usePermission('allow-external-voice-calls');
	const isSipEnabled = useSetting('VoIP_TeamCollab_SIP_Integration_Enabled', false);

	const canCallFromWidget = mediaCallState !== 'unavailable' && canMakeExternalCall && isSipEnabled;
	const callInProgress = mediaCallState !== 'available';
	const callName = t('Voice_call__user_', { user: label || formattedNumber });

	return (
		<Box is='li' display='flex' alignItems='center' justifyContent='space-between' gap={8}>
			<Box display='flex' flexDirection='column' minWidth={0}>
				{label && (
					<Box fontScale='p2' color='default' withTruncatedText>
						{label}
					</Box>
				)}
				<Box fontScale='p2' color='hint' withTruncatedText>
					{formattedNumber}
				</Box>
			</Box>
			<Box display='flex' flexShrink={0} gap={4}>
				{canCallFromWidget ? (
					<IconButton
						small
						icon='phone'
						disabled={callInProgress}
						title={callInProgress ? t('Call_in_progress') : t('Call')}
						aria-label={callName}
						onClick={() => toggleWidget({ number })}
					/>
				) : (
					<IconButton is='a' small icon='phone' href={`tel:${number}`} title={t('Call')} aria-label={callName} />
				)}
				<IconButton
					small
					icon='copy'
					title={t('Copy_phone_number')}
					aria-label={t('Copy_phone_number__user_', { user: label || formattedNumber })}
					onClick={() => copy()}
				/>
			</Box>
		</Box>
	);
};

export default UserInfoPhoneNumberItem;
