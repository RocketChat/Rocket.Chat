import { Box, Icon, IconButton, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type FilePickerBreadcrumbsProps = {
	parentFolders: string[];
	handleBreadcrumb: () => void;
};

const FilePickerBreadcrumbs = ({ parentFolders, handleBreadcrumb }: FilePickerBreadcrumbsProps): ReactElement => {
	const t = useTranslation();

	return (
		<Box display='flex' alignItems='center'>
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
