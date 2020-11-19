
import { useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';
import { Box, Table, Icon, Button, NumberInput } from '@rocket.chat/fuselage';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import UserAvatar from '../../../components/avatar/UserAvatar';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { AutoCompleteAgent } from '../../../components/AutoCompleteAgent';

function AddAgent({ agentList, setAgentList, ...props }) {
	const t = useTranslation();
	const [userId, setUserId] = useState();
	const getAgent = useEndpointAction('GET', `livechat/users/agent/${ userId }`);
	const dispatchToastMessage = useToastMessageDispatch();

	const handleAgent = useMutableCallback((e) => setUserId(e));

	const handleSave = useMutableCallback(async () => {
		if (!userId) {
			return;
		}
		const { user } = await getAgent();

		if (agentList.filter((e) => e.agentId === user._id).length === 0) {
			setAgentList([{ ...user, agentId: user._id }, ...agentList]);
			setUserId();
		} else {
			dispatchToastMessage({ type: 'error', message: t('This_agent_was_already_selected') });
		}
	});
	return <Box display='flex' alignItems='center' {...props}>
		<AutoCompleteAgent empty value={userId} onChange={handleAgent}/>
		<Button disabled={!userId} onClick={handleSave} mis='x8' primary>{t('Add')}</Button>
	</Box>;
}

export function RemoveAgentButton({ agentId, setAgentList, agentList }) {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			const newList = agentList.filter((listItem) => listItem.agentId !== agentId);
			setAgentList(newList);
			dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			setModal();
		};

		setModal(<DeleteWarningModal
			onDelete={onDeleteAgent}
			onCancel={() => setModal()}
		/>);
	});

	return <Button small ghost title={t('Remove')} onClick={handleDelete}><Icon name='trash' size='x16'/></Button>;
}

export function Count({ agentId, setAgentList, agentList }) {
	const t = useTranslation();
	const [agentCount, setAgentCount] = useState(agentList.find((agent) => agent.agentId === agentId).count || 0);

	const handleCount = useMutableCallback(async (e) => {
		const countValue = Number(e.currentTarget.value);
		setAgentCount(countValue);
		setAgentList(agentList.map((agent) => {
			if (agent.agentId === agentId) {
				agent.count = countValue;
			}
			return agent;
		}));
	});

	return <Box display='flex'><NumberInput flexShrink={1} key={`${ agentId }-count`} title={t('Count')} value={agentCount} onChange={handleCount} /></Box>;
}

export function Order({ agentId, setAgentList, agentList }) {
	const t = useTranslation();
	const [agentOrder, setAgentOrder] = useState(agentList.find((agent) => agent.agentId === agentId).order || 0);

	const handleOrder = useMutableCallback(async (e) => {
		const orderValue = Number(e.currentTarget.value);
		setAgentOrder(orderValue);
		setAgentList(agentList.map((agent) => {
			if (agent.agentId === agentId) {
				agent.order = orderValue;
			}
			return agent;
		}));
	});

	return <Box display='flex'><NumberInput flexShrink={1} key={`${ agentId }-order`} title={t('Order')} value={agentOrder} onChange={handleOrder} /></Box>;
}

const AgentRow = React.memo(({ agentId, username, name, avatarETag, mediaQuery, agentList, setAgentList }) => <Table.Row key={agentId} tabIndex={0} role='link' action qa-user-id={agentId}>
	<Table.Cell withTruncatedText>
		<Box display='flex' alignItems='center'>
			<UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag}/>
			<Box display='flex' withTruncatedText mi='x8'>
				<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
					<Box fontScale='p2' withTruncatedText color='default'>{name || username}</Box>
					{!mediaQuery && name && <Box fontScale='p1' color='hint' withTruncatedText> {`@${ username }`} </Box>}
				</Box>
			</Box>
		</Box>
	</Table.Cell>
	<Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<Count agentId={agentId} agentList={agentList} setAgentList={setAgentList}/>
	</Table.Cell>
	<Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<Order agentId={agentId} agentList={agentList} setAgentList={setAgentList}/>
	</Table.Cell>
	<Table.Cell fontScale='p1' color='hint'>
		<RemoveAgentButton agentId={agentId} agentList={agentList} setAgentList={setAgentList}/>
	</Table.Cell>
</Table.Row>);

function DepartmentsAgentsTable({ agents, setAgentListFinal }) {
	const t = useTranslation();
	const [agentList, setAgentList] = useState((agents && JSON.parse(JSON.stringify(agents))) || []);

	useEffect(() => setAgentListFinal(agentList), [agentList, setAgentListFinal]);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	return <>
		<AddAgent agentList={agentList} setAgentList={setAgentList}/>
		<GenericTable
			header={<>
				<GenericTable.HeaderCell key={'name'} w='x200'>{t('Name')}</GenericTable.HeaderCell>
				<GenericTable.HeaderCell key={'Count'} w='x140'>{t('Count')}</GenericTable.HeaderCell>
				<GenericTable.HeaderCell key={'Order'} w='x120'>{t('Order')}</GenericTable.HeaderCell>
				<GenericTable.HeaderCell key={'remove'} w='x40'>{t('Remove')}</GenericTable.HeaderCell>
			</>}
			results={agentList}
			total={agentList?.length}
			pi='x24'
		>
			{(props) => <AgentRow key={props._id} mediaQuery={mediaQuery} agentList={agentList} setAgentList={setAgentList} {...props}/>}
		</GenericTable>
	</>;
}

export default DepartmentsAgentsTable;
