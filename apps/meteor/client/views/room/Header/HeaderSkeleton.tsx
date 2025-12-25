import { Skeleton } from '@rocket.chat/fuselage';
import { Header, HeaderContent, HeaderContentRow } from '@rocket.chat/ui-client';

const HeaderSkeleton = () => {
	return (
		<Header>
			<HeaderContent>
				<HeaderContentRow>
					<Skeleton width='25%' />
				</HeaderContentRow>
			</HeaderContent>
		</Header>
	);
};

export default HeaderSkeleton;
