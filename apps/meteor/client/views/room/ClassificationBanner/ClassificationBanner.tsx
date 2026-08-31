import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { buildClassificationBanner, parseClassificationBannersConfig } from './lib/engine';
import { useIsABACManagedRoom } from '../../admin/ABAC/hooks/useIsABACManagedRoom';
import { useRoom } from '../contexts/RoomContext';

const ClassificationBanner = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const isABACRoom = useIsABACManagedRoom(room);
	const bannersEnabled = useSetting('ABAC_Classification_Banners_Enabled', false);
	const rawConfig = useSetting('ABAC_Classification_Banners_Config', '');
	const enabled = bannersEnabled && isABACRoom;

	const banner = useMemo(() => {
		if (!enabled) {
			return null;
		}

		const config = parseClassificationBannersConfig(rawConfig);
		return config?.enabled ? buildClassificationBanner(config, room.abacAttributes ?? []) : null;
	}, [enabled, rawConfig, room.abacAttributes]);

	if (!banner) {
		return null;
	}

	return (
		<Box
			role='region'
			aria-live='polite'
			aria-label={t('ABAC_Room_Attributes')}
			{...(banner.monospace && { fontFamily: 'mono' })}
			backgroundColor={banner.backgroundColor}
			color={banner.color}
			textTransform={banner.uppercase ? 'uppercase' : 'none'}
			fontScale='c2'
			height='x20'
			display='flex'
			alignItems='center'
			justifyContent='center'
		>
			<Box is='span' withTruncatedText>
				{banner.text}
			</Box>
		</Box>
	);
};

export default ClassificationBanner;
