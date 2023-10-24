import { Box, Chip, Button, Pagination } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableRow,
	GenericTableCell,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingRow,
} from '../../../../../components/GenericTable';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import Page from '../../../../../components/Page';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import AssignAgentButton from './AssignAgentButton';
import AssignAgentModal from './AssignAgentModal';
import RemoveAgentButton from './RemoveAgentButton';

const VoipExtensionsPage = () => {
	const t = useTranslation();
	const setModal = useSetModal();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useMemo(
		() => ({
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[itemsPerPage, current],
	);

	const getExtensions = useEndpoint('GET', '/v1/omnichannel/extensions');
	const { data, isSuccess, isLoading, refetch } = useQuery(['omnichannel-extensions', query], async () => getExtensions(query));

	const headers = (
		<>
			<GenericTableHeaderCell key='extension-number' w='x156'>
				{t('Extension_Number')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='agent-name' w='x160'>
				{t('Agent_Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='extension-status' w='x120'>
				{t('Extension_Status')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='queues' w='x120'>
				{t('Queues')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='remove-add' w='x60' />
		</>
	);

	return (
		<Page.Content>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mb={14}>
				<Box fontScale='p2' color='hint'>
					{data?.total} {t('Extensions')}
				</Box>
				<Box>
					<Button primary onClick={(): void => setModal(<AssignAgentModal closeModal={(): void => setModal()} reload={refetch} />)}>
						{t('Associate_Agent')}
					</Button>
				</Box>
			</Box>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.extensions.length === 0 && <GenericNoResults />}
			{isSuccess && data?.extensions.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.extensions.map(({ extension, username, name, state, queues }) => (
								<GenericTableRow key={extension} tabIndex={0}>
									<GenericTableCell withTruncatedText>{extension}</GenericTableCell>
									<GenericTableCell withTruncatedText>
										{username ? (
											<Box display='flex' alignItems='center'>
												<UserAvatar size='x28' username={username} />
												<Box display='flex' mi={8}>
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
									</GenericTableCell>
									<GenericTableCell withTruncatedText>{state}</GenericTableCell>
									<GenericTableCell withTruncatedText maxHeight='x36'>
										<Box display='flex' flexDirection='row' alignItems='center' title={queues?.join(', ')}>
											{queues?.map(
												(queue: string, index: number) =>
													index <= 1 && (
														<Chip mie={4} key={queue} value={queue}>
															{queue}
														</Chip>
													),
											)}
											{queues && queues?.length > 2 && `+${(queues.length - 2).toString()}`}
										</Box>
									</GenericTableCell>
									{username ? (
										<RemoveAgentButton username={username} reload={refetch} />
									) : (
										<AssignAgentButton extension={extension} reload={refetch} />
									)}
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</Page.Content>
	);
};

export default VoipExtensionsPage;
