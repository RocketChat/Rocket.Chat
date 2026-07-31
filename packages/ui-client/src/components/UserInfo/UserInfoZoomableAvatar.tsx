import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UserInfoAvatar from './UserInfoAvatar';

// Loaded on demand: the gallery drags the swiper dependency along, which is
// only needed once the avatar is actually zoomed.
const ImageGallery = lazy(() => import('../ImageGallery').then((module) => ({ default: module.ImageGallery })));

const avatarButtonStyle = css`
	padding: 0;
	border: none;
	background: none;
	cursor: pointer;
	line-height: 0;

	&:focus-visible {
		outline: 0.125rem solid ${Palette.stroke['stroke-highlight']};
		outline-offset: 0.125rem;
	}
`;

type UserInfoZoomableAvatarProps = {
	username: NonNullable<IUser['username']>;
	etag?: IUser['avatarETag'];
};

const UserInfoZoomableAvatar = ({ username, etag }: UserInfoZoomableAvatarProps) => {
	const { t } = useTranslation();
	const getUserAvatarPath = useUserAvatarPath();
	const [isZoomed, setIsZoomed] = useState(false);

	const avatarUrl = getUserAvatarPath({ username, etag });

	return (
		<>
			<Box
				is='button'
				type='button'
				className={avatarButtonStyle}
				title={t('View_avatar')}
				aria-label={t('View_avatar')}
				onClick={() => setIsZoomed(true)}
			>
				<UserInfoAvatar username={username} etag={etag} size='x48' />
			</Box>
			{isZoomed && (
				<Suspense fallback={null}>
					<ImageGallery images={[{ _id: avatarUrl, url: avatarUrl }]} onClose={() => setIsZoomed(false)} />
				</Suspense>
			)}
		</>
	);
};

export default UserInfoZoomableAvatar;
