import type { IUserStatus } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox, Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import CustomUserStatusForm from './CustomUserStatusForm';

type CustomUserStatusFormWithDataProps = {
	_id?: IUserStatus['_id'];
	onClose: () => void;
	onReload: () => void;
};

const CustomUserStatusFormWithData = ({ _id, onReload, onClose }: CustomUserStatusFormWithDataProps): ReactElement => {
	const t = useTranslation();
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const getCustomUserStatus = useEndpoint('GET', '/v1/custom-user-status.list');

	const { data, isLoading, error, refetch } = useQuery(['custom-user-statuses', query], async () => {
		const customUserStatus = await getCustomUserStatus(query);
		return customUserStatus;
	});

	const handleReload = (): void => {
		onReload?.();
		refetch?.();
	};

	if (!_id) {
		return <CustomUserStatusForm onReload={handleReload} onClose={onClose} />;
	}

	if (isLoading) {
		return (
			<Box p={20}>
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs={8}>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs={8}>
					<Button danger disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
			</Box>
		);
	}

	if (error || !data || data.count < 1) {
		return (
			<Box p={20}>
				<Callout type='danger'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Callout>
			</Box>
		);
	}

	return <CustomUserStatusForm status={data.statuses[0]} onReload={handleReload} onClose={onClose} />;
};

export default CustomUserStatusFormWithData;
