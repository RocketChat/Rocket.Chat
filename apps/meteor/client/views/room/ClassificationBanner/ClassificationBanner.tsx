import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { buildClassificationBanner, buildNonAbacClassificationBanner, parseClassificationBannersConfig } from './lib/engine';
import { useIsABACManagedRoom } from '../../admin/ABAC/hooks/useIsABACManagedRoom';
import { useRoom } from '../contexts/RoomContext';

const ClassificationBanner = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const isABACRoom = useIsABACManagedRoom(room);
	const bannersEnabled = useSetting('ABAC_Classification_Banners_Enabled', false);
	const rawConfig = useSetting('ABAC_Classification_Banners_Config', '');

	// ABAC-P4 M4 — the gate was `bannersEnabled && isABACRoom`, so only ABAC-managed rooms ever
	// showed a banner. Classification awareness is meant to be continuous, so every room type is
	// now considered: an ABAC-managed room shows marking derived from its attributes, and a room
	// with none shows the separately configured banner, if one is configured.
	const banner = useMemo(() => {
		if (!bannersEnabled) {
			return null;
		}

		const config = parseClassificationBannersConfig(rawConfig);

		if (!config?.enabled) {
			return null;
		}

		if (isABACRoom) {
			return buildClassificationBanner(config, room.abacAttributes ?? []);
		}

		// DMs, Group DMs, discussions and federated rooms land here. Absent configuration means no
		// banner, which is the pre-v2 behaviour.
		return buildNonAbacClassificationBanner(config);
	}, [bannersEnabled, isABACRoom, rawConfig, room.abacAttributes]);

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
