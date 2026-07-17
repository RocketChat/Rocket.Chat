import { Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import CounterItem from './CounterItem';
import CounterRow from './CounterRow';
import type { AnalyticsGridItemProps } from '../AnalyticsLayoutProps';

export type CounterContainerProps = {
	totals: {
		title: string;
		value: number | string;
	}[];
} & AnalyticsGridItemProps;

const CounterContainer = ({ totals, ...props }: CounterContainerProps) => {
	const { t } = useTranslation();

	return (
		<CounterRow {...props}>
			{totals.map(({ title, value }, i) => (
				<CounterItem key={i} title={title ? t(title as TranslationKey) : <Skeleton width='x60' />} count={value} />
			))}
		</CounterRow>
	);
};

export default CounterContainer;
