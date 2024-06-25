import { Skeleton } from '@rocket.chat/fuselage';
import { Header, HeaderAvatar, HeaderContent, HeaderContentRow } from '@rocket.chat/ui-client';
import React from 'react';

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
