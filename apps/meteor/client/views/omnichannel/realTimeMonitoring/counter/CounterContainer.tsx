import type { Box } from '@rocket.chat/fuselage';
import { Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CounterItem from './CounterItem';
import CounterRow from './CounterRow';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';

type DataType = {
	title: string;
	value: number | string;
}[];

type Totalizers = {
	totalizers: DataType;
};

type CounterContainerProps = {
	data?: Totalizers;
	state: AsyncStatePhase;
	initialData: DataType;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const CounterContainer = ({ data, state, initialData, ...props }: CounterContainerProps) => {
	const { t } = useTranslation();

	const [displayData, setDisplayData] = useState<DataType>(initialData);

	const { totalizers } = data || { totalizers: initialData };

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
