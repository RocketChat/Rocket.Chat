import { Box, Icon, TextInput, Margins, Select, Throbber, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../../components/VerticalBar';
import DefaultRow from './DefaultRow';

const RoomMembers = ({
	loading,
	members = [],
	text,
	type,
	setText,
	setType,
	onClickClose,
	onClickView,
	onClickAdd,
	onClickInvite,
	total,
	error,
	loadMoreItems,
	renderRow: Row = DefaultRow,
	rid,
	isTeam,
	isDirect,
	reload,
}) => {
	const t = useTranslation();
	const inputRef = useAutoFocus(true);

	const options = useMemo(
		() => [
			['online', t('Online')],
			['all', t('All')],
		],
		[t],
	);

	const itemData = useMemo(() => ({ onClickView, rid }), [onClickView, rid]);
	const lm = useMutableCallback((start) => !loading && loadMoreItems(start));

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='members' />
				<VerticalBar.Text>{isTeam ? t('Teams_members') : t('Members')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box display='flex' flexDirection='row' p='x12' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								placeholder={t('Search_by_username')}
								value={text}
								ref={inputRef}
								onChange={setText}
								addon={<Icon name='magnifier' size='x20' />}
							/>
							<Select flexGrow={0} width='110px' onChange={setType} value={type} options={options} />
						</Margins>
					</Box>
				</Box>

				{loading && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}

				{error && (
					<Box pi='x12' pb='x12'>
						<Callout type='danger'>{error.message}</Callout>
					</Box>
				)}

				{!loading && members.length <= 0 && (
					<Box textAlign='center' p='x12' color='neutral-600'>
						{t('No_members_found')}
					</Box>
				)}

				{!loading && members.length > 0 && (
					<Box pi='x18' pb='x12'>
						<Box is='span' color='info' fontScale='p2'>
							{t('Showing')}: {members.length}
						</Box>

						<Box is='span' color='info' fontScale='p2' mis='x8'>
							{t('Total')}: {total}
						</Box>
					</Box>
				)}

				<Box w='full' h='full' overflow='hidden' flexShrink={1}>
					{!loading && members && members.length > 0 && (
						<Virtuoso
							style={{
								height: '100%',
								width: '100%',
							}}
							totalCount={total}
							endReached={lm}
							overscan={50}
							data={members}
							components={{ Scroller: ScrollableContentWrapper }}
							itemContent={(index, data) => <Row data={itemData} user={data} index={index} reload={reload} />}
						/>
					)}
				</Box>
			</VerticalBar.Content>
			{!isDirect && (onClickInvite || onClickAdd) && (
				<VerticalBar.Footer>
					<ButtonGroup stretch>
						{onClickInvite && (
							<Button onClick={onClickInvite} width='50%'>
								<Icon name='link' size='x20' mie='x4' />
								{t('Invite_Link')}
							</Button>
						)}
						{onClickAdd && (
							<Button onClick={onClickAdd} width='50%' primary>
								<Icon name='user-plus' size='x20' mie='x4' />
								{t('Add')}
							</Button>
						)}
					</ButtonGroup>
				</VerticalBar.Footer>
			)}
		</>
	);
};

export default RoomMembers;
