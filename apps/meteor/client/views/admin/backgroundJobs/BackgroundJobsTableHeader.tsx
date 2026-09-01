import { GenericTableHeader, GenericTableHeaderCell } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export const BackgroundJobsTableHeader = ({ isDesktopOrLarger }: { isDesktopOrLarger: boolean }) => {
	const { t } = useTranslation();
	return (
		<GenericTableHeader>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x120'>{t('Status')}</GenericTableHeaderCell>
			{isDesktopOrLarger && (
				<>
					<GenericTableHeaderCell>{t('Last_Run')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Next_Run')}</GenericTableHeaderCell>
				</>
			)}
			<GenericTableHeaderCell>{t('Interval')}</GenericTableHeaderCell>
		</GenericTableHeader>
	);
};
