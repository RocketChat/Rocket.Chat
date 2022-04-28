import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement, useState } from 'react';
import { createPortal } from 'react-dom';

import ScreenshotCarousel from './ScreenshotCarousel';

const ScreenshotCarouselAnchor = (): ReactElement => {
	const AppScreenshots = [
		{
			id: '61cc57c14c306b0001d87023',
			appId: 'fc96e832-5472-49e4-aace-1521a7ebeaa6',
			fileName: 'Telegram 2.png',
			accessUrl:
				'https://marketplace.cdn.cloud.rocket.chat/screenshots/fc96e832-5472-49e4-aace-1521a7ebeaa6/0f5f5ef7-6c79-4c26-9661-d54b37f2b345.png',
			thumbnailUrl:
				'https://marketplace.cdn.cloud.rocket.chat/screenshots/fc96e832-5472-49e4-aace-1521a7ebeaa6/thumbnail_0f5f5ef7-6c79-4c26-9661-d54b37f2b345.png',
			createdAt: '2021-12-29T12:42:41.404Z',
			modifiedAt: '2021-12-29T12:42:41.404Z',
		},
		{
			id: '61cc57c14c306b0001d87024',
			appId: 'fc96e832-5472-49e4-aace-1521a7ebeaa6',
			fileName: 'Telegram1.png',
			accessUrl:
				'https://marketplace.cdn.cloud.rocket.chat/screenshots/fc96e832-5472-49e4-aace-1521a7ebeaa6/1efa88d3-fb77-402d-8843-f1f11d394546.png',
			thumbnailUrl:
				'https://marketplace.cdn.cloud.rocket.chat/screenshots/fc96e832-5472-49e4-aace-1521a7ebeaa6/thumbnail_1efa88d3-fb77-402d-8843-f1f11d394546.png',
			createdAt: '2021-12-29T12:42:41.422Z',
			modifiedAt: '2021-12-29T12:42:41.422Z',
		},
		{
			id: '644dasdos',
			appId: 'fc96e832-5472-49e4-aace-1521a7ebeaa6',
			fileName: 'Telegram1.png',
			accessUrl:
				'https://marketplace.cdn.cloud.rocket.chat/screenshots/fc96e832-5472-49e4-aace-1521a7ebeaa6/1efa88d3-fb77-402d-8843-f1f11d394546.png',
			thumbnailUrl:
				'https://marketplace.cdn.cloud.rocket.chat/screenshots/fc96e832-5472-49e4-aace-1521a7ebeaa6/thumbnail_1efa88d3-fb77-402d-8843-f1f11d394546.png',
			createdAt: '2021-12-29T12:42:41.422Z',
			modifiedAt: '2021-12-29T12:42:41.422Z',
		},
	];

	const [viewCarousel, setViewCarousel] = useState(false);

	const isCarouselVisible = AppScreenshots?.length && viewCarousel;

	const carouselPortal = createPortal(
		<ScreenshotCarousel AppScreenshots={AppScreenshots} setViewCarousel={setViewCarousel} />,
		document.body,
	);

	return (
		<>
			<Box
				onClick={(): void => setViewCarousel(true)}
				display='flex'
				flexDirection='column'
				maxWidth='x640'
				width='100%'
				style={{ cursor: 'pointer' }}
			>
				<img src={AppScreenshots[0].accessUrl} alt='App preview image' />
				<Box display='flex' flexDirection='row' bg={colors.n100} pi='x16' pb='x10' alignItems='center'>
					<Icon name='image' size='x24' mie='x8' />{' '}
					<Box is='span' fontWeight={500} fontSize='x14' color={colors.n800}>
						1 of {AppScreenshots.length}
					</Box>
				</Box>
			</Box>
			{isCarouselVisible && carouselPortal}
		</>
	);
};

export default ScreenshotCarouselAnchor;
