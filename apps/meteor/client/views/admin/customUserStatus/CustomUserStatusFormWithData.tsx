import { IUserStatus } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import CustomUserStatusForm from './CustomUserStatusForm';

type CustomUserStatusFormWithDataProps = {
	_id?: IUserStatus['_id'];
	onClose: () => void;
	onReload: () => void;
};

const CustomUserStatusFormWithData = ({ _id, onReload, onClose }: CustomUserStatusFormWithDataProps): ReactElement => {
	const t = useTranslation();
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const { value: data, phase: state, error, reload } = useEndpointData('custom-user-status.list', query);

	const handleReload = (): void => {
		onReload?.();
		reload?.();
	};

	if (!_id) {
		return <CustomUserStatusForm onReload={handleReload} onClose={onClose} />;
	}

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box p='x20'>
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs='x8'>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs='x8'>
					<Button primary danger disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
			</Box>
		);
	}

	if (error || !data || data.statuses.length < 1) {
		return (
			<Box p='x20'>
				<Callout type='danger'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Callout>
			</Box>
		);
	}

	return <CustomUserStatusForm status={data.statuses[0]} onReload={handleReload} onClose={onClose} />;
};

export default CustomUserStatusFormWithData;
