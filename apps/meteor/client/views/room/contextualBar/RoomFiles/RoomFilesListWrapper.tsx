import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useItemListNavigation } from '../../../../hooks/useItemListNavigation';

const RoomFilesListWrapper = forwardRef(function RoomFilesListWrapper(props: HTMLAttributes<HTMLDivElement>, ref: Ref<HTMLDivElement>) {
	const { t } = useTranslation();
	const filesListRef = useItemListNavigation();
	const mergedRefs = useMergedRefs(ref, filesListRef);

	return <div role='list' aria-label={t('Files_list')} ref={mergedRefs} {...props} />;
});

export default RoomFilesListWrapper;
