import type { IRoom } from '@rocket.chat/core-typings';
import { HeaderState } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomFeatures } from '../../contexts/RoomFeaturesContext';

export type EncryptedProps = { room: IRoom };

const Encrypted = ({ room }: EncryptedProps) => {
	const { t } = useTranslation();
	const { e2eEnabled } = useRoomFeatures();
	return e2eEnabled && room?.encrypted ? <HeaderState title={t('Encrypted')} icon='key' color='status-font-on-success' /> : null;
};

export default memo(Encrypted);
