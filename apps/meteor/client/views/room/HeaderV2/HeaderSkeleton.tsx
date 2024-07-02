import { Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import { Header, HeaderAvatar, HeaderContent, HeaderContentRow } from '../../../components/Header';

const HeaderSkeleton = () => {
	return (
		<Header>
			<HeaderAvatar>
				<Skeleton variant='rect' width={28} height={28} />
			</HeaderAvatar>
			<HeaderContent>
				<HeaderContentRow>
					<Skeleton width='25%' />
				</HeaderContentRow>
			</HeaderContent>
		</Header>
	);
};

export default HeaderSkeleton;
