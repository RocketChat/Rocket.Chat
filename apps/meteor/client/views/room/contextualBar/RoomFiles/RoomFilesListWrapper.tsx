import type { HTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';

export type RoomFilesListWrapperProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

const RoomFilesListWrapper = ({ ref, ...props }: RoomFilesListWrapperProps) => {
	const { t } = useTranslation();
	return <div role='list' aria-label={t('Files_list')} ref={ref} {...props} />;
};

export default RoomFilesListWrapper;
