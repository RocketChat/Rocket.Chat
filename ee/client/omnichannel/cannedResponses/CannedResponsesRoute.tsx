import { Table, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState, FC } from 'react';

import GenericTable from '../../../../client/components/GenericTable';
import NotAuthorizedPage from '../../../../client/components/NotAuthorizedPage';
import VerticalBar from '../../../../client/components/VerticalBar';
import UserAvatar from '../../../../client/components/avatar/UserAvatar';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { useRouteParameter, useRoute } from '../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useForm } from '../../../../client/hooks/useForm';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import CannedResponseFilter from './CannedResponseFilter';
import CannedResponsesPage from './CannedResponsesPage';
import RemoveCannedResponseButton from './RemoveCannedResponseButton';


const CannedResponsesRoute = (): FC => {
	const t = useTranslation();
	const canViewCannedResponses = usePermission('manage-livechat-canned-responses');


	const { values, handlers } = useForm({
		sharing: '',
		createdBy: {},
		tags: [],
		text: '',
	});

	const { sharing, createdBy, tags, text } = values;
	const { handleSharing, handleCreatedBy, handleTags, handleText } = handlers;

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['shortcut', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const debouncedText = useDebouncedValue(text, 500);
	// () => ({
	// 	fields: JSON.stringify({ name: 1 }),
	// 	text,
	// 	sort: JSON.stringify({
	// 		[column]: sortDir(direction),
	// 		usernames: column === 'name' ? sortDir(direction) : undefined,
	// 	}),
	// 	...(itemsPerPage && { count: itemsPerPage }),
	// 	...(current && { offset: current }),
	// }),
	// [text, itemsPerPage, current, column, direction],
	const query = useMemo(
		() => ({
			text: debouncedText,
			sort: JSON.stringify({ [debouncedSort[0]]: debouncedSort[1] === 'asc' ? 1 : -1 }),
			...(tags && tags.length > 0 && { tags }),
			...(sharing && { scope: sharing }),
			...(createdBy?.label && { createdBy: createdBy.label }),
			...(debouncedParams.itemsPerPage && { count: debouncedParams.itemsPerPage }),
			...(debouncedParams.current && { offset: debouncedParams.current }),
		}),
		[createdBy, debouncedParams, debouncedSort, debouncedText, sharing, tags],
	);

	const cannedResponsesRoute = useRoute('omnichannel-canned-responses');
	const context = useRouteParameter('context');
	// const id = useRouteParameter('id');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback((id) => (): void =>
		cannedResponsesRoute.push({
			context: 'edit',
			id,
		}),
	);

	const { value: data, phase: state, error } = useEndpointData('canned-responses', query);

	console.log(data);

	const getTime = useFormatDateAndTime();

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'shortcut'}
					direction={sort[1]}
					active={sort[0] === 'shortcut'}
					onClick={onHeaderClick}
					sort='shortcut'
				>
					{t('Shortcut')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'sharing'}
					direction={sort[1]}
					active={sort[0] === 'sharing'}
					onClick={onHeaderClick}
					sort='sharing'
				>
					{t('Sharing')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'createdBy'}
					direction={sort[1]}
					active={sort[0] === 'createdBy'}
					onClick={onHeaderClick}
					sort='createdBy'
				>
					{t('Created_by')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'createdAt'}
					direction={sort[1]}
					active={sort[0] === 'createdAt'}
					onClick={onHeaderClick}
					sort='createdAt'
				>
					{t('Created_at')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'tags'}
					direction={sort[1]}
					active={sort[0] === 'tags'}
					onClick={onHeaderClick}
					sort='tags'
				>
					{t('Tags')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, shortcut, scope, createdBy, createdAt, tags = ['teste 1'] }) => (
			<Table.Row
				key={_id}
				tabIndex={0}
				role='link'
				onClick={onRowClick(_id)}
				action
				qa-user-id={_id}
			>
				<Table.Cell withTruncatedText>{shortcut}</Table.Cell>
				<Table.Cell withTruncatedText>{scope}</Table.Cell>
				<Table.Cell withTruncatedText>
					<Box display='flex' alignItems='center'>
						<UserAvatar size='x24' username={createdBy.username} />
						<Box display='flex' withTruncatedText mi='x8'>
							<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
								<Box fontScale='p2' withTruncatedText color='default'>
									{createdBy.username}
								</Box>
							</Box>
						</Box>
					</Box>
				</Table.Cell>
				<Table.Cell withTruncatedText>{getTime(createdAt)}</Table.Cell>
				<Table.Cell withTruncatedText>{tags.join(', ')}</Table.Cell>
				<RemoveCannedResponseButton _id={_id} />
			</Table.Row>
		),
		[getTime, onRowClick],
	);

	const EditCannedResponsesTab = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = (): void => {
			cannedResponsesRoute.push({});
		};

		return (
			<VerticalBar>
				<VerticalBar.Header>
					{context === 'edit' && t('Edit_CannedResponse')}
					{context === 'new' && t('New_CannedResponse')}
					<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
				</VerticalBar.Header>
			</VerticalBar>
			// {context === 'edit' && <CannedResponsesEditWithData cannedResponseId={id} reload={reload} />}
			// {context === 'new' && <CannedResponsesNew reload={reload} />}
		);
	}, [t, context, cannedResponsesRoute]);

	if (!canViewCannedResponses) {
		return <NotAuthorizedPage />;
	}

	return (
		<CannedResponsesPage
			setParams={setParams}
			renderFilter={() => (<CannedResponseFilter
				sharingValue={sharing}
				createdByValue={createdBy}
				tagsValue={tags}
				shortcutValue={text}
				setSharing={handleSharing}
				setCreatedBy={handleCreatedBy}
				setTags={handleTags}
				setShortcut={handleText}
			/>)}
			params={params}
			onHeaderClick={onHeaderClick}
			data={data}
			header={header}
			renderRow={renderRow}
			title={t('Canned_Responses')}
		>
			<EditCannedResponsesTab />
		</CannedResponsesPage>
	);
};

export default CannedResponsesRoute;
