import type { ClassificationBannerPayload } from '@rocket.chat/abac';
import { buildClassificationBanner, parseClassificationBannersConfig } from '@rocket.chat/abac/dist/classification-banners/engine';
import type { IRoom } from '@rocket.chat/core-typings';
import { isABACManagedRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type ClassificationBannerProps = {
	room: IRoom;
};

const shade = (hex: string, factor: number): string => {
	const [r, g, b] = [0, 2, 4].map((offset) => Math.round(parseInt(hex.replace('#', '').slice(offset, offset + 2), 16) * factor));
	return `rgb(${r}, ${g}, ${b})`;
};

const getBannerStyle = (banner: ClassificationBannerPayload): CSSProperties => {
	const edgeRule = banner.color === '#FFFFFF' ? shade(banner.backgroundColor, 0.6) : 'rgba(0, 0, 0, 0.28)';

	return {
		height: 28,
		background: banner.backgroundColor,
		color: banner.color,
		fontSize: 13,
		fontWeight: 700,
		lineHeight: 1,
		...(banner.monospace && { fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }),
		letterSpacing: banner.monospace ? '0.02em' : '0.08em',
		textTransform: banner.uppercase ? 'uppercase' : 'none',
		whiteSpace: 'nowrap',
		userSelect: 'none',
		...(banner.style === 'edge' && { borderTop: `3px solid ${edgeRule}`, borderBottom: `3px solid ${edgeRule}` }),
	};
};

const ClassificationBanner = ({ room }: ClassificationBannerProps) => {
	const { data: hasABAC = false } = useHasLicenseModule('abac');
	const bannersEnabled = useSetting('ABAC_Classification_Banners_Enabled', false);
	const rawConfig = useSetting('ABAC_Classification_Banners_Config', '');
	const enabled = hasABAC && bannersEnabled && isABACManagedRoom(room);

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
			role='note'
			aria-label={banner.text}
			data-qa-id='classification-banner'
			display='flex'
			alignItems='center'
			justifyContent='center'
			flexShrink={0}
			overflow='hidden'
			style={getBannerStyle(banner)}
		>
			{banner.style === 'segmented' ? (
				banner.segments.map((segment, index) => (
					<Box key={segment.attrId} display='flex' alignItems='center'>
						{index > 0 && <Box style={{ width: 1, height: '60%', margin: '0 14px', background: banner.color, opacity: 0.45 }} />}
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
