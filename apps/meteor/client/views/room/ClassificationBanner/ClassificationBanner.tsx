import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { shade } from './lib/colors';
import { buildClassificationBanner, parseClassificationBannersConfig } from './lib/engine';
import { useIsABACManagedRoom } from '../../admin/ABAC/hooks/useIsABACManagedRoom';
import { useRoom } from '../contexts/RoomContext';

const ClassificationBanner = () => {
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

	const edgeRule = banner.color === '#FFFFFF' ? shade(banner.backgroundColor, 0.6) : 'rgba(0, 0, 0, 0.28)';
	const bannerClass = css`
		height: 28px;
		background-color: ${banner.backgroundColor};
		color: ${banner.color};
		font-size: 13px;
		font-weight: 700;
		line-height: 1;
		letter-spacing: ${banner.monospace ? '0.02em' : '0.08em'};
		text-transform: ${banner.uppercase ? 'uppercase' : 'none'};
		white-space: nowrap;
		user-select: none;
		${banner.monospace ? 'font-family: Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;' : ''}
		${banner.style === 'edge' ? `border-top: 3px solid ${edgeRule}; border-bottom: 3px solid ${edgeRule};` : ''}
	`;
	const segmentRuleClass = css`
		width: 1px;
		height: 60%;
		margin: 0 14px;
		background-color: ${banner.color};
		opacity: 0.45;
	`;

	return (
		<Box
			role='note'
			aria-label={banner.text}
			data-qa-id='classification-banner'
			display='flex'
			alignItems='center'
			justifyContent='center'
			flexShrink={0}
			overflow='hidden'
			className={bannerClass}
		>
			{banner.style === 'segmented' ? (
				banner.segments.map((segment, index) => (
					<Box key={`${segment.attrId}-${index}`} display='flex' alignItems='center'>
						{index > 0 && <Box className={segmentRuleClass} />}
						<span>{segment.text}</span>
					</Box>
				))
			) : (
				<span>{banner.text}</span>
			)}
		</Box>
	);
};

export default ClassificationBanner;
