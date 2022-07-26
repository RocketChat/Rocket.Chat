import { css } from '@rocket.chat/css-in-js';
import { Icon, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesTitle, Box } from '@rocket.chat/fuselage';
import { useDebouncedState, useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useEffect, ReactElement } from 'react';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import FilterByText from '../../../../components/FilterByText';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableCell,
	GenericTableBody,
	GenericTableRow,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useIsCallReady } from '../../../../contexts/CallContext';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { CallDialpadButton } from '../CallDialpadButton';

type ContactTableProps = {
	setContactReload(fn: () => void): void;
};

export const rcxCallDialButton = css`
	&:not(:hover) {
		.rcx-call-dial-button {
			display: none !important;
		}
	}
`;
function ContactTable({ setContactReload }: ContactTableProps): ReactElement {
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'username' | 'phone' | 'name' | 'visitorEmails.address' | 'lastchat'>('username');
	const isCallReady = useIsCallReady();

	const [term, setTerm] = useDebouncedState('', 500);

	const t = useTranslation();

	const query = useDebouncedValue(
		useMemo(
			() => ({
				term,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[itemsPerPage, current, sortBy, sortDirection, term],
		),
		500,
	);

	const directoryRoute = useRoute('omnichannel-directory');
	const formatDate = useFormatDate();

	const onButtonNewClick = useMutableCallback(() =>
		directoryRoute.push({
			page: 'contacts',
			bar: 'new',
		}),
	);

	const onRowClick = useMutableCallback(
		(id) => (): void =>
			directoryRoute.push({
				page: 'contacts',
				id,
				bar: 'info',
			}),
	);

	const { reload, ...result } = useEndpointData('/v1/livechat/visitors.search', query);

	useEffect(() => {
		setContactReload(() => reload);
	}, [reload, setContactReload]);

	return (
		<>
			<FilterByText
				displayButton
				textButton={t('New_Contact')}
				onButtonClick={onButtonNewClick}
				onChange={({ text }): void => setTerm(text)}
			/>
			<GenericTable>
				<GenericTableHeader>
					<GenericTableHeaderCell
						key={'username'}
						direction={sortDirection}
						active={sortBy === 'username'}
						onClick={setSort}
						sort='username'
					>
						{t('Username')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key={'name'} direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
						{t('Name')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key={'phone'} direction={sortDirection} active={sortBy === 'phone'} onClick={setSort} sort='phone'>
						{t('Phone')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell
						key={'email'}
						direction={sortDirection}
						active={sortBy === 'visitorEmails.address'}
						onClick={setSort}
						sort='visitorEmails.address'
					>
						{t('Email')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell
						key={'lastchat'}
						direction={sortDirection}
						active={sortBy === 'lastchat'}
						onClick={setSort}
						sort='lastchat'
					>
						{t('Last_Chat')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='call' width={44} />
				</GenericTableHeader>
				{result.phase === AsyncStatePhase.RESOLVED && (
					<GenericTableBody>
						{result.value.visitors.map(({ _id, username, fname, visitorEmails, phone, lastChat }) => {
							const phoneNumber = phone?.length && phone[0].phoneNumber;
							const visitorEmail = visitorEmails?.length && visitorEmails[0].address;

							return (
								<GenericTableRow
									action
									key={_id}
									tabIndex={0}
									role='link'
									height='40px'
									qa-user-id={_id}
									className={rcxCallDialButton}
									onClick={onRowClick(_id)}
								>
									<GenericTableCell withTruncatedText>{username}</GenericTableCell>
									<GenericTableCell withTruncatedText>{parseOutboundPhoneNumber(fname)}</GenericTableCell>
									<GenericTableCell withTruncatedText>{parseOutboundPhoneNumber(phoneNumber)}</GenericTableCell>
									<GenericTableCell withTruncatedText>{visitorEmail}</GenericTableCell>
									<GenericTableCell withTruncatedText>{lastChat && formatDate(lastChat.ts)}</GenericTableCell>
									<GenericTableCell>{isCallReady && <CallDialpadButton phoneNumber={phoneNumber} />}</GenericTableCell>
								</GenericTableRow>
							);
						})}
					</GenericTableBody>
				)}
				{result.phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={6} />}
			</GenericTable>

			{result.phase === AsyncStatePhase.REJECTED && (
				<Box mbs='x20'>
					<States>
						<StatesIcon variation='danger' name='circle-exclamation' />
						<StatesTitle>{t('Connection_error')}</StatesTitle>
						<StatesActions>
							<StatesAction onClick={reload}>
								<Icon mie='x4' size='x20' name='reload' />
								{t('Reload_page')}
							</StatesAction>
						</StatesActions>
					</States>
				</Box>
			)}
			{result.phase === AsyncStatePhase.RESOLVED && (
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					count={result.value.total}
					onSetItemsPerPage={setItemsPerPage}
					onSetCurrent={setCurrent}
					{...paginationProps}
				/>
			)}
		</>
	);
}

export default ContactTable;
