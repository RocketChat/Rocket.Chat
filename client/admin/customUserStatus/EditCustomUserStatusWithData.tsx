import React, { useMemo, FC } from 'react';
import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import EditCustomUserStatus from './EditCustomUserStatus';

type EditCustomUserStatusWithDataProps = {
	_id: string;
	close: () => void;
	onChange: () => void;
};

export const EditCustomUserStatusWithData: FC<EditCustomUserStatusWithDataProps> = ({ _id, onChange, ...props }) => {
	const t = useTranslation();
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const { data, state, error, reload } = useEndpointDataExperimental<{
		statuses: unknown[];
	}>('custom-user-status.list', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box pb='x20'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button primary danger disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || !data || data.statuses.length < 1) {
		return <Box fontScale='h1' pb='x20'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Box>;
	}

	const handleChange = (): void => {
		onChange && onChange();
		reload && reload();
	};

	return <EditCustomUserStatus data={data.statuses[0]} onChange={handleChange} {...props}/>;
};

export default EditCustomUserStatusWithData;
