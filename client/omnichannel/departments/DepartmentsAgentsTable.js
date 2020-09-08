
import { useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Box, Table, Icon, Button, NumberInput } from '@rocket.chat/fuselage';

import { Th, GenericTable } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import UserAvatar from '../../components/basic/avatar/UserAvatar';
import DeleteWarningModal from '../DeleteWarningModal';
import { useSetModal } from '../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { AutoCompleteAgent } from '../../components/basic/AutoCompleteAgent';

function AddAgent({ agentList, setAgentList, ...props }) {
	const t = useTranslation();
	const [userId, setUserId] = useState();
	const getAgent = useEndpointAction('GET', `livechat/users/agent/${ userId }`);
	const dispatchToastMessage = useToastMessageDispatch();

	const handleAgent = useMutableCallback((e) => setUserId(e));
	console.log(userId);

	const handleSave = useMutableCallback(async () => {
		if (!userId) {
			return;
		}
		const { user } = await getAgent();

		if (agentList.filter((e) => e.agentId === userId).length === 0) {
			setAgentList([user, ...agentList]);
			setUserId();
		} else {
			dispatchToastMessage({ type: 'error', message: t('Already_selected') });
		}
	});
	return <Box display='flex' alignItems='center' {...props}>
		<AutoCompleteAgent empty value={userId} onChange={handleAgent}/>
		<Button disabled={!userId} onClick={handleSave} mis='x8' primary>{t('Add')}</Button>
	</Box>;
}

function AgentsPage({
	data,
	reload,
	header,
	setParams,
	params,
	renderRow,
	children,
	agentList,
	setAgentList,
}) {
	console.log(data);
	return <Box>
		<AddAgent reload={reload} agentList={agentList} setAgentList={setAgentList} pi='x24'/>
		<GenericTable header={header} renderRow={renderRow} results={data && (data.users || data.agents)} total={data && data.total} setParams={setParams} params={params} pi='x24' />
		{children}
	</Box>;
}


export function RemoveAgentButton({ _id, setAgentList, agentList }) {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			setAgentList([...agentList.filter((e) => e._id !== _id)]);
			dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onDeleteAgent} onCancel={() => setModal()}/>);
	});

	return <Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<Button small ghost title={t('Remove')} onClick={handleDelete}>
			<Icon name='trash' size='x16'/>
		</Button>
	</Table.Cell>;
}

export function Count({ agentId, setAgentList, agentList }) {
	const t = useTranslation();
	const [agentCount, setAgentCount] = useState(agentList.find((agent) => agent.agentId === agentId).counta);
	const [updatedList, setUpdatedList] = useState(agentList);

	useMemo(() => setAgentList(updatedList), [setAgentList, updatedList]);

	const changeList = () => {
		setUpdatedList(agentList.map((agent) => {
			if (agent.agentId === agentId) {
				agent.count = agentCount;
			}
			return agent;
		}));
		// setAgentList(newList);
		// debugger
		// console.log(agentList);
	};
	console.log(agentCount);

	const handleCount = useMutableCallback(async (e) => {
		setAgentCount(Number(e.currentTarget.value));
		changeList();
	});

	return <Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<NumberInput title={t('Count')} value={agentCount} onChange={handleCount} />
	</Table.Cell>;
}

function DepartmentsAgentsTable({ agents }) {
	const t = useTranslation();

	console.log(agents);

	const [agentList, setAgentList] = useState(agents || []);
	const [data, setData] = useState({});

	useMemo(() => setData({ users: agentList }), [agentList]);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const header = useMemo(() => [
		<Th key={'name'} w='x200'>{t('Name')}</Th>,
		<Th key={'username'} w='x140'>{t('Username')}</Th>,
		<Th key={'email'} w='x120'>{t('Email')}</Th>,
		<Th key={'remove'} w='x40'>{t('Remove')}</Th>,
	].filter(Boolean), [t]);

	const renderRow = useCallback(({ agentId, username, name, avatarETag }) => <Table.Row key={agentId} tabIndex={0} role='link' action qa-user-id={agentId}>
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
		<Count agentId={agentId} agentList={agentList} setAgentList={setAgentList}/>
		<RemoveAgentButton agentId={agentId} agentList={agentList} setAgentList={setAgentList}/>
		<RemoveAgentButton agentId={agentId} agentList={agentList} setAgentList={setAgentList}/>
	</Table.Row>, [agentList, mediaQuery]);

	return <AgentsPage
		data={data}
		header={header}
		renderRow={renderRow}
		mini
		agentList={agentList}
		setAgentList={setAgentList}>
	</AgentsPage>;
}

export default DepartmentsAgentsTable;
