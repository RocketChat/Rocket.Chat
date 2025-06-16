import { Skeleton } from '@rocket.chat/fuselage';

import { Header, HeaderAvatar, HeaderContent, HeaderContentRow } from '../../../components/Header';

const HeaderSkeleton = () => {
	return (
		<Header>
			<HeaderAvatar>
				<Skeleton variant='rect' width={36} height={36} />
			</HeaderAvatar>
			<HeaderContent>
				<HeaderContentRow>
					<Skeleton width='10%' />
				</HeaderContentRow>
				<HeaderContentRow>
					<Skeleton width='30%' />
				</HeaderContentRow>
			</HeaderContent>
		</Header>
	);
};

export default HeaderSkeleton;
