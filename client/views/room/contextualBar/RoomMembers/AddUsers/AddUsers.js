import React, { useMemo, useState } from 'react';
import { Box, Field, MultiSelectFiltered, Button, Callout, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import UserAvatar from '../../../../../components/avatar/UserAvatar';
import VerticalBar from '../../../../../components/VerticalBar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
// import { useEndpoint } from '../../../../contexts/ServerContext';
// import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

export const AddUsers = ({
	onClickBack,
	onClickClose,
	onClickEdit,
	error,
	userList,
}) => {
	const t = useTranslation();

	console.log(userList);

	const options = useMemo(() => userList && userList?.map(({ _id, name, username }) => [_id, <Chip key={_id}><Box is='span' m='none' mie='x4'><UserAvatar size='x20' username={username} /></Box>{name}</Chip>]), [userList]);

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('Add_users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent>
				<Box width='100%'>
					<Field >
						<Field.Label flexGrow={0}>{t('Choose_users')}</Field.Label>
						<Field.Row>
							<MultiSelectFiltered options={options} placeholder={t('Choose_users')} />
						</Field.Row>
					</Field>
				</Box>

				{ error && <Callout mi='x24' type='danger'>{error.toString()}</Callout>}

				<Box pb='x16'><Button primary onClick={onClickEdit}>{t('Add_users')}</Button></Box>
			</VerticalBar.ScrollableContent>
		</>
	);
};

// const query = (term = '') => ({ selector: JSON.stringify({ term }) });

export default ({
	tabBar,
	onClickBack,
	...props
}) => {
	console.log(props);

	const userId = 'rehxTAXYS36NM4gj2';

	const query = useMemo(() => ({
		userId,
	}), []);

	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const { value } = useEndpointData('users.list');
	const avatar = useEndpointData('users.getAvatar', query);

	console.log(avatar);

	console.log(value);

	// console.log(usersList);

	return (
		<AddUsers
			onClickClose={onClickClose}
			onClickBack={onClickBack}
			userList={value && value.users}
		/>
	);
};
