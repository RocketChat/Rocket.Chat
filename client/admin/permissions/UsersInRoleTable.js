import React, { useState, useMemo } from 'react';
import { Box, Table, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import UserAvatar from '../../components/basic/avatar/UserAvatar';
import DeleteWarningModal from '../../components/DeleteWarningModal';
import { useMethod } from '../../contexts/ServerContext';
import { GenericTable } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useSetModal } from '../../contexts/ModalContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';


const UserRow = React.memo(({ _id, username, name, avatarETag, emails, onRemove }) => {
	const email = emails?.find(({ address }) => !!address).address;

	const handleRemove = useMutableCallback(() => {
		onRemove(username);
	});

	return <Table.Row key={_id} tabIndex={0} role='link'>
		<Table.Cell withTruncatedText>
			<Box display='flex' alignItems='center'>
				<UserAvatar size='x40' title={username} username={username} etag={avatarETag}/>
				<Box display='flex' withTruncatedText mi='x8'>
					<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
						<Box fontScale='p2' withTruncatedText color='default'>{name || username}</Box>
						{name && <Box fontScale='p1' color='hint' withTruncatedText> {`@${ username }`} </Box>}
					</Box>
				</Box>
			</Box>
		</Table.Cell>
		<Table.Cell withTruncatedText>{email}</Table.Cell>
		<Table.Cell withTruncatedText>
			<Button small square danger onClick={handleRemove}>
				<Icon name='trash' size='x20' />
			</Button>
		</Table.Cell>
	</Table.Row>;
});

export function UsersInRoleTable({ data, reload, roleName, total, params, setParams, rid }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const setModal = useSetModal();

	const removeUser = useMethod('authorization:removeUserFromRole');

	const closeModal = () => setModal();

	const onRemove = useMutableCallback((username) => {
		const remove = async () => {
			try {
				await removeUser(roleName, username, rid);
				dispatchToastMessage({ type: 'success', message: t('User_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'erroor', message: error });
			}
			closeModal();
			reload();
		};
		setModal(<DeleteWarningModal onCancel={closeModal} onDelete={remove}>
			{t('The_user_s_will_be_removed_from_role_s', username, roleName)}
		</DeleteWarningModal>);
	});

	return <GenericTable
		header={<>
			<GenericTable.HeaderCell >
				{t('Name')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Email')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell w='x80'>
			</GenericTable.HeaderCell>
		</>}
		results={data}
		params={params}
		setParams={setParams}
		total={total}
	>
		{(props) => <UserRow onRemove={onRemove} key={props._id} {...props}/>}
	</GenericTable>;
}

const UsersInRoleTableContainer = ({ rid, roleName, reloadRef }) => {
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const debouncedParams = useDebouncedValue(params, 500);

	const query = useMemo(() => ({
		roomId: rid,
		role: roleName,
		...debouncedParams.itemsPerPage && { count: debouncedParams.itemsPerPage },
		...debouncedParams.current && { offset: debouncedParams.current },
	}), [debouncedParams, rid, roleName]);

	const { data = {}, reload } = useEndpointDataExperimental('roles.getUsersInRole', query);

	reloadRef.current = reload;

	const tableData = data?.users || [];

	return <UsersInRoleTable
		data={tableData}
		total={data?.total}
		reload={reload}
		params={params}
		setParams={setParams}
		roleName={roleName}
		rid={rid}
	/>;
};

export default UsersInRoleTableContainer;
