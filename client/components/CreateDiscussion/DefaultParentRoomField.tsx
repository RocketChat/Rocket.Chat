import { Skeleton, Select, Callout } from '@rocket.chat/fuselage';
import React, { useMemo, ReactElement } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { useEndpointData } from '../../hooks/useEndpointData';

const DefaultParentRoomField = ({
	defaultParentRoom,
}: {
	defaultParentRoom: string;
}): ReactElement => {
	const t = useTranslation();
	const { value, phase } = useEndpointData(
		'rooms.info',
		useMemo(
			() => ({
				roomId: defaultParentRoom,
			}),
			[defaultParentRoom],
		),
	);

	if (phase === AsyncStatePhase.LOADING) {
		return <Skeleton width='full' />;
	}

	if (!value || !value.room) {
		return <Callout type={'error'}>{t('Error')}</Callout>;
	}

	const { _id, fname, name } = value?.room;

	return (
		<Select
			options={[[_id, (fname || name) as string]]}
			value={_id}
			disabled
			onChange={(): string => ''}
		/>
	);
};

export default DefaultParentRoomField;
