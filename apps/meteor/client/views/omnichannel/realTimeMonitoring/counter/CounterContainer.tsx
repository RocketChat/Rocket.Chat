import type { Box } from '@rocket.chat/fuselage';
import { Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useEffect, useState } from 'react';

import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import CounterItem from './CounterItem';
import CounterRow from './CounterRow';

export type DataType = {
	title: string;
	value: number | string;
}[];

type Totalizers = {
	totalizers: DataType;
};

type CounterContainerProps = {
	counterData?: Totalizers;
	state: AsyncStatePhase;
	initialData: DataType;
} & ComponentProps<typeof Box>;

const CounterContainer = ({ counterData, state, initialData, ...props }: CounterContainerProps) => {
	const t = useTranslation();

	const [displayData, setDisplayData] = useState<DataType>(initialData);

	const { totalizers } = counterData || { totalizers: initialData };

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED) {
			setDisplayData(totalizers);
		}
	}, [state, t, totalizers]);

	return (
		<CounterRow {...props}>
			{displayData.map(({ title, value }, i) => (
				<CounterItem key={i} title={title ? t(title as TranslationKey) : <Skeleton width='x60' />} count={value} />
			))}
		</CounterRow>
	);
};

export default CounterContainer;
