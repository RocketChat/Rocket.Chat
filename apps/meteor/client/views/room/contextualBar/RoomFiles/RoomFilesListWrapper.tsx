import type { HTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

const RoomFilesListWrapper = forwardRef(function RoomFilesListWrapper(props: HTMLAttributes<HTMLDivElement>, ref: Ref<HTMLDivElement>) {
	const { t } = useTranslation();
	return <div role='list' aria-label={t('Files_list')} ref={ref} {...props} />;
});

export default RoomFilesListWrapper;
