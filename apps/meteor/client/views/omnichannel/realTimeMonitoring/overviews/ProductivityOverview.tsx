import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import CounterContainer from '../counter/CounterContainer';

const defaultValue = { title: '', value: '00:00:00' };

const initialData = [defaultValue, defaultValue, defaultValue, defaultValue];

type ProductivityOverviewProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/productivity-totalizers'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ProductivityOverview = ({ params, reloadRef, ...props }: ProductivityOverviewProps) => {
	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/productivity-totalizers', { params });

	reloadRef.current.productivityOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props} />;
};

export default ProductivityOverview;
