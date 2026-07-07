import { Box } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useGroupDrop } from './CategoryDnDContext';
import { normalizeSidebarViewMode } from '../../../../sidebar/lib/normalizeSidebarViewMode';

// The placeholder mimics an empty room row so the drop target reads as a ghost menu item rather than a
// centered banner: it follows the active view mode's height and left-aligns the hint at the same indent as
// the room rows' leading icon/avatar.
const ITEM_HEIGHT = { extended: 44, condensed: 28 } as const;

/**
 * Placeholder + drop target shown inside an empty category — the whole row is the drop zone. Custom categories
 * accept any dragged room; empty system categories accept only rooms whose native category matches (drag-back).
 */
const CategoryEmptyPlaceholder = ({ categoryId, isCustom = true }: { categoryId: string; isCustom?: boolean }) => {
	const { t } = useTranslation();
	const { isDragOver, dropProps } = useGroupDrop(categoryId, isCustom);

	const viewMode = normalizeSidebarViewMode(useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode')) ?? 'extended';

	return (
		<Box
			{...dropProps}
			role='presentation'
			data-drop-group={categoryId}
			display='flex'
			alignItems='center'
			color='hint'
			fontScale='c1'
			style={{
				// Same box model as a room row so the placeholder lines up with the items above/below it: the hint
				// starts at the same indent (1.5rem) as the rows' leading icon/avatar. Drag-over only tints the
				// background, keeping the inset margins and rounding so the drop area stays rounded and the same height.
				marginInline: '0.5rem',
				marginBlock: '1px',
				paddingBlock: 'calc(0.25rem - 1px)',
				paddingInlineStart: '1.5rem',
				paddingInlineEnd: 'calc(0.5rem - 1px)',
				minBlockSize: `${ITEM_HEIGHT[viewMode]}px`,
				borderRadius: 'var(--rcx-border-radius-medium, 0.25rem)',
				backgroundColor: isDragOver ? 'var(--rcx-color-surface-hover)' : undefined,
			}}
		>
			{t('Drag_rooms_here')}
		</Box>
	);
};

export default CategoryEmptyPlaceholder;
