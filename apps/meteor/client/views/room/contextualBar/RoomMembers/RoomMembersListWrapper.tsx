import { useTranslation } from 'react-i18next';

import type { NavigableListProps } from '../../../../components/NavigableList';
import NavigableList from '../../../../components/NavigableList';

export type RoomMembersListWrapperProps = Omit<NavigableListProps, 'aria-label'>;

const RoomMembersListWrapper = (props: RoomMembersListWrapperProps) => {
	const { t } = useTranslation();

	return <NavigableList aria-label={t('Members')} {...props} />;
};

export default RoomMembersListWrapper;
