import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type LeaveRoomWarningProps = {
	name: string;
	warnText: TranslationKey;
	isEncrypted?: boolean;
	rid?: string;
};

const LeaveRoomWarning = ({ name, warnText, isEncrypted, rid }: LeaveRoomWarningProps): ReactNode => {
	const { t } = useTranslation();
	const subscription = useUserSubscription(rid ?? '');
	const room = useUserRoom(rid ?? '');

	const encrypted = isEncrypted ?? Boolean(subscription?.encrypted ?? room?.encrypted);

	return (
		<>
			{t(warnText, { roomName: name })}
			{encrypted && (
				<Box is='p' color='status-font-on-danger' mbs={16}>
					{t('E2E_Leave_Room_Warning')}
				</Box>
			)}
		</>
	);
};

export default LeaveRoomWarning;
