import { useTranslation } from 'react-i18next';

import type { NavigableListProps } from '../../../../components/NavigableList';
import NavigableList from '../../../../components/NavigableList';

const RoomFilesListWrapper = (props: Omit<NavigableListProps, 'aria-label'>) => {
	const { t } = useTranslation();

	return <NavigableList aria-label={t('Files_list')} {...props} />;
};

export default RoomFilesListWrapper;
