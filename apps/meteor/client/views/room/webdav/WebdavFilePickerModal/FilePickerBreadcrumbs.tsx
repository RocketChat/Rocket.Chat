import { Box, Icon, IconButton, Tag } from '@rocket.chat/fuselage';
import type { ReactElement, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

type FilePickerBreadcrumbsProps = {
	parentFolders: string[];
	handleBreadcrumb: (e: MouseEvent<HTMLElement>) => void;
	handleBack: () => void;
};

const FilePickerBreadcrumbs = ({ parentFolders, handleBreadcrumb, handleBack }: FilePickerBreadcrumbsProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box display='flex' alignItems='center' overflowX='auto' mie={8}>
			<IconButton disabled={parentFolders.length === 0} title={t('Back')} aria-label='back' icon='arrow-back' small onClick={handleBack} />
			<IconButton title={t('Root')} aria-label='home' icon='home' small data-index={-1} onClick={handleBreadcrumb} />
			{parentFolders?.map((parentFolder, index) => (
				<Box display='flex' alignItems='center' key={index}>
					<Icon name='chevron-left' />
					<Tag aria-label={parentFolder} data-index={index} onClick={handleBreadcrumb}>
						{parentFolder}
					</Tag>
				</Box>
			))}
		</Box>
	);
};

export default FilePickerBreadcrumbs;
