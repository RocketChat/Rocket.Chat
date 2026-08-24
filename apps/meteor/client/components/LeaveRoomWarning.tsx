import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

type LeaveRoomWarningProps = {
	name: string;
	warnText: TranslationKey;
	isEncrypted: boolean;
};

const LeaveRoomWarning = ({ name, warnText, isEncrypted }: LeaveRoomWarningProps) => {
	const { t } = useTranslation();

	return (
		<>
			{t(warnText, { roomName: name })}
			{isEncrypted && (
				<Box is='p' color='status-font-on-danger' mbs={16}>
					{t('E2E_Leave_Room_Warning')}
				</Box>
			)}
		</>
	);
};

export default LeaveRoomWarning;
