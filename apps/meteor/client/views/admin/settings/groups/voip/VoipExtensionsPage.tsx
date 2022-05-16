import { Box, Chip, Table, Button } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../../../components/GenericTable';
import Page from '../../../../../components/Page';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import AssignAgentButton from './AssignAgentButton';
import AssignAgentModal from './AssignAgentModal';
import RemoveAgentButton from './RemoveAgentButton';

const VoipExtensionsPage: FC = () => {
	const t = useTranslation();
	const setModal = useSetModal();

	const [params, setParams] = useState<{ current?: number; itemsPerPage?: 25 | 50 | 100 }>({
		current: 0,
		itemsPerPage: 25,
	});

	const { itemsPerPage, current } = useDebouncedValue(params, 500);
	const query = useMemo(
		() => ({
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[itemsPerPage, current],
	);

	const { value: data, reload } = useEndpointData('omnichannel/extensions', query);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key='extension' w='x156'>
					{t('Extension_Number')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='username' w='x160'>
					{t('Agent_Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='username' w='x120'>
					{t('Extension_Status')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='queues' w='x120'>
					{t('Queues')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove-add'} w='x60' />,
			].filter(Boolean),
		[t],
	);

	const renderRow = useCallback(
		({ _id, extension, username, name, state, queues }) => (
			<Table.Row key={_id} tabIndex={0}>
				<Table.Cell withTruncatedText>{extension}</Table.Cell>
				<Table.Cell withTruncatedText>
					{username ? (
						<Box display='flex' alignItems='center'>
							<UserAvatar size={'x28'} username={username} />
							<Box display='flex' mi='x8'>
								<Box display='flex' flexDirection='column' alignSelf='center'>
									<Box fontScale='p2m' color='default'>
										{name || username}
									</Box>
								</Box>
							</Box>
						</Box>
					) : (
						t('Free')
					)}
				</Table.Cell>
				<Table.Cell withTruncatedText>{state}</Table.Cell>
				<Table.Cell withTruncatedText maxHeight='x36'>
					<Box display='flex' flexDirection='row' alignItems='center' title={queues?.join(', ')}>
						{queues?.map(
							(queue: string, index: number) =>
								index <= 1 && (
									<Chip mie='x4' key={queue} value={queue}>
										{queue}
									</Chip>
								),
						)}
						{queues?.length > 2 && `+${(queues.length - 2).toString()}`}
					</Box>
				</Table.Cell>
				{username ? <RemoveAgentButton username={username} reload={reload} /> : <AssignAgentButton extension={extension} reload={reload} />}
			</Table.Row>
		),
		[reload, t],
	);

	return (
		<Page.Content>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mb='x14'>
				<Box fontScale='p2' color='hint'>
					{data?.total} {t('Extensions')}
				</Box>
				<Box>
					<Button primary onClick={(): void => setModal(<AssignAgentModal closeModal={(): void => setModal()} reload={reload} />)}>
						{t('Associate_Agent')}
					</Button>
				</Box>
			</Box>
			<GenericTable
				header={header}
				renderRow={renderRow}
				results={data?.extensions.map((extension) => ({ _id: extension.extension, ...extension }))}
				total={data?.total}
				params={params}
				setParams={setParams}
				// renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
			/>
		</Page.Content>
	);
};

export default VoipExtensionsPage;
