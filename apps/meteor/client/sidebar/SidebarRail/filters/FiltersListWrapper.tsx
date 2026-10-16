import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { RoomListWrapperProps } from '../../RoomList/RoomListWrapper';
import RoomListWrapper from '../../RoomList/RoomListWrapper';

const FiltersListWrapper = forwardRef(function FiltersListWrapper(props: RoomListWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	const { t } = useTranslation();
	return <RoomListWrapper {...props} aria-label={t('Filters')} ref={ref} />;
});

export default FiltersListWrapper;
