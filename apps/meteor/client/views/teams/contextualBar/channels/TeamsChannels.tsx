import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select, Throbber, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useEffectEvent, useAutoFocus, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import TeamsChannelItem from './TeamsChannelItem';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarEmptyContent,
	ContextualbarSection,
} from '../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../components/CustomScrollbars';
import InfiniteListAnchor from '../../../../components/InfiniteListAnchor';

type TeamsChannelsProps = {
	loading: boolean;
	channels: IRoom[];
	mainRoom: IRoom;
	text: string;
	type: 'all' | 'autoJoin';
	setType: Dispatch<SetStateAction<'all' | 'autoJoin'>>;
	setText: (e: ChangeEvent<HTMLInputElement>) => void;
	onClickClose: () => void;
	onClickAddExisting: false | ((e: SyntheticEvent) => void);
	onClickCreateNew: false | ((e: SyntheticEvent) => void);
	total: number;
	loadMoreItems: (start: number, end: number) => void;
	onClickView: (room: IRoom) => void;
	reload: () => void;
};

const TeamsChannels = ({
	loading,
	channels = [],
	mainRoom,
	text,
	type,
	setText,
	setType,
	onClickClose,
	onClickAddExisting,
	onClickCreateNew,
	total,
	loadMoreItems,
	onClickView,
	reload,
}: TeamsChannelsProps) => {
	const { t } = useTranslation();
	const inputRef = useAutoFocus<HTMLInputElement>(true);

	const options: SelectOption[] = useMemo(
		() => [
			['all', t('All')],
			['autoJoin', t('Team_Auto-join')],
		],
		[t],
	);

	const lm = useEffectEvent((start: number) => !loading && loadMoreItems(start, Math.min(50, total - start)));

	const loadMoreChannels = useDebouncedCallback(
		() => {
			if (channels.length >= total) {
				return;
			}

			lm(channels.length);
		},
		300,
		[lm, channels],
	);

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='hash' />
				<ContextualbarTitle>{t('Team_Channels')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput placeholder={t('Search')} value={text} ref={inputRef} onChange={setText} addon={<Icon name='magnifier' size='x20' />} />
				<Box w='x144' mis={8}>
					<Select onChange={(val) => setType(val as 'all' | 'autoJoin')} value={type} options={options} />
				</Box>
			</ContextualbarSection>
			<ContextualbarContent p={12}>
				{loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{!loading && channels.length === 0 && <ContextualbarEmptyContent title={t('No_channels_in_team')} />}
				{!loading && channels.length > 0 && (
					<>
						<Box pi={18} pb={12}>
							<Box is='span' color='hint' fontScale='p2'>
								{t('Showing')}: {channels.length}
							</Box>

							<Box is='span' color='hint' fontScale='p2' mis={8}>
								{t('Total')}: {total}
							</Box>
						</Box>
						<Box w='full' h='full' role='list' overflow='hidden' flexShrink={1}>
							<VirtualizedScrollbars>
								<Virtuoso
									totalCount={total}
									data={channels}
									// eslint-disable-next-line react/no-multi-comp
									components={{ Footer: () => <InfiniteListAnchor loadMore={loadMoreChannels} /> }}
									itemContent={(index, data) => (
										<TeamsChannelItem onClickView={onClickView} room={data} mainRoom={mainRoom} reload={reload} key={index} />
									)}
								/>
							</VirtualizedScrollbars>
						</Box>
					</>
				)}
			</ContextualbarContent>
			{(onClickAddExisting || onClickCreateNew) && (
				<ContextualbarFooter>
					<ButtonGroup stretch>
						{onClickAddExisting && (
							<Button onClick={onClickAddExisting} width='50%'>
								{t('Team_Add_existing')}
							</Button>
						)}
						{onClickCreateNew && (
							<Button onClick={onClickCreateNew} width='50%'>
								{t('Create_new')}
							</Button>
						)}
					</ButtonGroup>
				</ContextualbarFooter>
			)}
		</>
	);
};

export default TeamsChannels;
