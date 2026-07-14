import { Box } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarAISearchNoResults from './NavBarAISearchNoResults';
import NavBarSearchItemSkeleton from './NavBarSearchItemSkeleton';
import NavBarSearchRow from './NavBarSearchRow';

export type NavBarSearchRoomSectionProps = {
	filterText: string;
	itemCount: number;
	isLoading: boolean;
	isFetching: boolean;
	rooms: SubscriptionWithRoom[];
	suggestAISearch: boolean;
	onSelect: () => void;
};

const NavBarSearchRoomSection = ({
	filterText,
	itemCount,
	isLoading,
	isFetching,
	rooms,
	suggestAISearch,
	onSelect,
}: NavBarSearchRoomSectionProps): ReactElement => {
	const { t } = useTranslation();
	const showSkeleton = isLoading || (itemCount === 0 && isFetching);

	return (
		<>
			{itemCount === 0 && !isLoading && !isFetching && <NavBarAISearchNoResults suggestAISearch={suggestAISearch} />}
			{rooms.length > 0 && (
				<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
					{filterText ? t('Results') : t('Recent')}
				</Box>
			)}
			{rooms.map((item) => (
				<NavBarSearchRow key={item._id} room={item} onClick={onSelect} />
			))}
			{showSkeleton && Array.from({ length: 4 }, (_, index) => <NavBarSearchItemSkeleton key={`skeleton-${index}`} />)}
		</>
	);
};

export default NavBarSearchRoomSection;
