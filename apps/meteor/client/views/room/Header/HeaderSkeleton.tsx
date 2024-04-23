import { Skeleton } from '@rocket.chat/fuselage';
import { Header, HeaderAvatar, HeaderContent, HeaderContentRow, HeaderSection } from '@rocket.chat/ui-client';
import React from 'react';

const HeaderSkeleton = () => {
	return (
		<Header>
			<HeaderSection>
				<HeaderAvatar>
					<Skeleton variant='rect' width={28} height={28} />
				</HeaderAvatar>
				<HeaderContent>
					<HeaderContentRow>
						<Skeleton width='25%' />
					</HeaderContentRow>
				</HeaderContent>
			</HeaderSection>
		</Header>
	);
};

export default HeaderSkeleton;
