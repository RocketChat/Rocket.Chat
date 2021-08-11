import { Box, Table, Avatar, Icon, Label, MultiSelect } from '@rocket.chat/fuselage';
import { useMediaQuery, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useCallback } from 'react';

import { roomTypes } from '../../../app/utils/client';
import FilterByText from '../../components/FilterByText';
import GenericTable from '../../components/GenericTable';
import MarkdownText from '../../components/MarkdownText';
import TagCard from '../../components/TagCard/TagCard';
import { useRoute } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useForm } from '../../hooks/useForm';
import { useFormatDate } from '../../hooks/useFormatDate';
import Tag from '../InfoPanel/Tag';
import TagGroup from '../InfoPanel/TagGroup';
import RoomTags from './RoomTags';
import { useQuery } from './hooks';

const style = {
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	overflow: 'hidden',
};

function ChannelsTable(props) {
	const t = useTranslation();
	const refAutoFocus = useAutoFocus(true);
	const [tagFilter, setTagFilter] = useState(!!props.tag);
	const [sort, setSort] = useState(['name', 'asc']);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const { values, handlers } = useForm({ searchTags: props.tag ? [props.tag] : [] });
	const { searchTags } = values;
	const { handleSearchTags } = handlers;

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const query = useQuery(params, sort, 'onlyChannels', searchTags);

	const discoveryEnabled = useSetting('Discovery_Enabled');
	const discoveryTags = useSetting('Discovery_Tags');
	const tagsAvailable =
		discoveryEnabled && !!discoveryTags
			? discoveryTags.split(',').map((item) => [item.trim(), `#${item.trim()}`])
			: [];

	const onHeaderClick = useCallback(
		(id) => {
			const [sortBy, sortDirection] = sort;

			if (sortBy === id) {
				setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
				return;
			}
			setSort([id, 'asc']);
		},
		[sort],
	);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'name'}
					direction={sort[1]}
					active={sort[0] === 'name'}
					onClick={onHeaderClick}
					sort='name'
				>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'usersCount'}
					direction={sort[1]}
					active={sort[0] === 'usersCount'}
					onClick={onHeaderClick}
					sort='usersCount'
					style={{ width: '100px' }}
				>
					{t('Users')}
				</GenericTable.HeaderCell>,
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'createdAt'}
						direction={sort[1]}
						active={sort[0] === 'createdAt'}
						onClick={onHeaderClick}
						sort='createdAt'
						style={{ width: '150px' }}
					>
						{t('Created_at')}
					</GenericTable.HeaderCell>
				),
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'lastMessage'}
						direction={sort[1]}
						active={sort[0] === 'lastMessage'}
						onClick={onHeaderClick}
						sort='lastMessage'
						style={{ width: '150px' }}
					>
						{t('Last_Message')}
					</GenericTable.HeaderCell>
				),
				mediaQuery && (
					<GenericTable.HeaderCell key={'belongsTo'} style={{ width: '150px' }}>
						{t('Belongs_To')}
					</GenericTable.HeaderCell>
				),
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'tags'}
						direction={sort[1]}
						active={sort[0] === 'tags'}
						onClick={onHeaderClick}
						sort={false}
						style={{ width: '300px' }}
					>
						{t('Tags')}
					</GenericTable.HeaderCell>
				),
			].filter(Boolean),
		[sort, onHeaderClick, t, mediaQuery],
	);

	const channelRoute = useRoute('channel');

	const { value: data = {} } = useEndpointData('discovery', query);

	const onClick = useMemo(
		() => (name) => (e) => {
			if (e.type === 'click' || e.key === 'Enter') {
				channelRoute.push({ name });
			}
		},
		[channelRoute],
	);

	const onClickTag = useCallback(
		(tag) => (e) => {
			if (e.type === 'click' || e.key === 'Enter') {
				setTagFilter(true);
				handleSearchTags([tag]);
			}
		},
		[handleSearchTags],
	);

	const formatDate = useFormatDate();
	const renderRow = useCallback(
		(room) => {
			const { _id, ts, t, name, fname, usersCount, lastMessage, topic, belongsTo, tags } = room;
			const avatarUrl = roomTypes.getConfig(t).getAvatarPath(room);

			const mapTags = (tag, index) => {
				if (index < 3) {
					return <Tag key={tag} tag={tag} onClick={onClickTag(tag)} />;
				}
				if (index === 3) {
					return (
						<TagCard
							key={'more'}
							tags={tags.filter((tag, i) => i > 2)}
							onChange={handleSearchTags}
							onSelect={setTagFilter}
						/>
					);
				}
				return null;
			};

			const tagsGroup = tags?.map(mapTags).filter(Boolean);

			return (
				<Table.Row key={_id} onKeyDown={onClick(name)} tabIndex={0}>
					<Table.Cell onClick={onClick(name)} clickable>
						<Box display='flex'>
							<Box flexGrow={0}>
								<Avatar size='x40' title={fname || name} url={avatarUrl} />
							</Box>
							<Box grow={1} mi='x8' style={style}>
								<Box display='flex' alignItems='center'>
									<Icon name={roomTypes.getIcon(room)} color='hint' />{' '}
									<Box fontScale='p2' mi='x4'>
										{fname || name}
									</Box>
									<RoomTags room={room} style={style} />
								</Box>
								{topic && (
									<MarkdownText
										variant='inlineWithoutBreaks'
										fontScale='p1'
										color='hint'
										style={style}
										content={topic}
									/>
								)}
							</Box>
						</Box>
					</Table.Cell>
					<Table.Cell fontScale='p1' color='hint' style={style}>
						{usersCount}
					</Table.Cell>
					{mediaQuery && (
						<Table.Cell fontScale='p1' color='hint' style={style}>
							{formatDate(ts)}
						</Table.Cell>
					)}
					{mediaQuery && (
						<Table.Cell fontScale='p1' color='hint' style={style}>
							{lastMessage && formatDate(lastMessage.ts)}
						</Table.Cell>
					)}
					{mediaQuery && (
						<Table.Cell fontScale='p1' color='hint' style={style}>
							{belongsTo}
						</Table.Cell>
					)}
					{mediaQuery && (
						<Table.Cell fontScale='p1' color='hint' style={style}>
							<TagGroup flexWrap='nowrap'>{tagsGroup}</TagGroup>
						</Table.Cell>
					)}
				</Table.Row>
			);
		},
		[formatDate, handleSearchTags, mediaQuery, onClick, onClickTag],
	);

	return (
		<GenericTable
			header={header}
			renderFilter={({ onChange, ...props }) => (
				<Box mbe='x8'>
					<FilterByText
						placeholder={t('Search_Channels')}
						inputRef={refAutoFocus}
						onChange={onChange}
						{...props}
					/>
					<Label onClick={() => setTagFilter(!tagFilter)}>
						<Icon name={`chevron-${tagFilter ? 'up' : 'down'}`} size='x16' />{' '}
						{t('Additional_Filters')}
					</Label>
					{tagFilter && (
						<MultiSelect
							options={tagsAvailable}
							value={searchTags}
							width='100%'
							placeholder={t('Select_an_option')}
							onChange={handleSearchTags}
						/>
					)}
				</Box>
			)}
			renderRow={renderRow}
			results={data.result}
			setParams={setParams}
			total={data.total}
		/>
	);
}

export default ChannelsTable;
