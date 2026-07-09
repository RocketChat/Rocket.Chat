import type { ClassificationBannerPayload } from '@rocket.chat/abac';
import type { IRoom } from '@rocket.chat/core-typings';
import { isABACManagedRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { CSSProperties } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { ABACQueryKeys } from '../../../lib/queryKeys';

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
	const enabled = hasABAC && bannersEnabled && isABACManagedRoom(room);

	const getClassificationBanner = useEndpoint('GET', '/v1/abac/rooms/:rid/classification-banner', { rid: room._id });
	const { data } = useQuery({
		queryKey: ABACQueryKeys.rooms.classificationBanner(room._id, room.abacAttributes),
		queryFn: () => getClassificationBanner(),
		enabled,
	});

	const banner = data?.banner;
	if (!enabled || !banner) {
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
