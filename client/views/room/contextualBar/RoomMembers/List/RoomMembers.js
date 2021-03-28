import {
	Box,
	Icon,
	TextInput,
	Margins,
	Select,
	Throbber,
	ButtonGroup,
	Button,
	Callout,
} from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../../components/VerticalBar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
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
	const lm = useMutableCallback((start) =>
		loadMoreItems(start + 1, Math.min(50, start + 1 - members.length)),
	);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='team' />
				<VerticalBar.Text>{t('Members')}</VerticalBar.Text>
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
							<Select
								flexGrow={0}
								width='110px'
								onChange={setType}
								value={type}
								options={options}
							/>
						</Margins>
					</Box>
				</Box>

				{error && (
					<Box pi='x24' pb='x12'>
						<Callout type='danger'>{error}</Callout>
					</Box>
				)}

				{loading && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}
				{!loading && members.length <= 0 && (
					<Box pi='x24' pb='x12'>
						{t('No_results_found')}
					</Box>
				)}

				{!loading && members.length > 0 && (
					<Box pi='x24' pb='x12'>
						<Box is='span' color='info' fontScale='p1'>
							{t('Showing')}:{' '}
							<Box is='span' color='default' fontScale='p2'>
								{members.length}
							</Box>
						</Box>

						{/* <Box is='span' color='info' fontScale='p1' mis='x8'>
							{t('Online')}: <Box is='span' color='default' fontScale='p2'>{members.length}</Box>
						</Box> */}

						<Box is='span' color='info' fontScale='p1' mis='x8'>
							{t('Total')}:{' '}
							<Box is='span' color='default' fontScale='p2'>
								{total}
							</Box>
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
							itemContent={(index, data) => <Row data={itemData} user={data} index={index} />}
						/>
					)}
				</Box>
			</VerticalBar.Content>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{onClickInvite && (
						<Button onClick={onClickInvite} width='50%'>
							<Box is='span' mie='x4'>
								<Icon name='link' size='x20' />
							</Box>
							{t('Invite_Link')}
						</Button>
					)}
					{onClickAdd && (
						<Button onClick={onClickAdd} width='50%' primary>
							<Box is='span' mie='x4'>
								<Icon name='user-plus' size='x20' />
							</Box>
							{t('Add_users')}
						</Button>
					)}
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default RoomMembers;
