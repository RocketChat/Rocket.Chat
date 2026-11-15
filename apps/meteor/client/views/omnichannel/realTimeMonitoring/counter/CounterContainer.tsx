import type { Box } from '@rocket.chat/fuselage';
import { Skeleton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

import CounterItem from './CounterItem';
import CounterRow from './CounterRow';

export type CounterContainerProps = {
	totals: {
		title: string;
		value: number | string;
	}[];
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const CounterContainer = ({ totals, ...props }: CounterContainerProps) => {
	const { t } = useTranslation();

	return (
		<CounterRow {...props}>
			{totals.map(({ title, value }, i) => (
				<CounterItem key={i} title={title ? t(title) : <Skeleton width='x60' />} count={value} />
			))}
		</CounterRow>
	);
};

export default CounterContainer;
