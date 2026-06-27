import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useGroupDrop } from './CategoryDnDContext';

/** Placeholder + drop target shown inside an empty custom category — the whole row is the drop zone. */
const CategoryEmptyPlaceholder = ({ categoryId }: { categoryId: string }) => {
	const { t } = useTranslation();
	const { isDragOver, dropProps } = useGroupDrop(categoryId, true);

	return (
		<Box
			{...dropProps}
			role='presentation'
			display='flex'
			alignItems='center'
			justifyContent='center'
			pi={16}
			pb={16}
			color='hint'
			fontScale='c1'
			style={{ backgroundColor: isDragOver ? 'var(--rcx-color-surface-hover)' : undefined }}
		>
			{t('Drag_rooms_here')}
		</Box>
	);
};

export default CategoryEmptyPlaceholder;
