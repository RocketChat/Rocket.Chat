import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select, Throbber, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useStableCallback, useAutoFocus, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import {
	VirtualizedScrollbars,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarEmptyContent,
	ContextualbarSection,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { ChangeEvent, Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import TeamsChannelItem from './TeamsChannelItem';
import InfiniteListAnchor from '../../../../components/InfiniteListAnchor';

export type TeamsChannelsProps = {
	loading: boolean;
	channels: IRoom[];
	mainRoom: IRoom;
	text: string;
	type: 'all' | 'autoJoin';
	setText: (e: ChangeEvent<HTMLInputElement>) => void;
	setType: Dispatch<SetStateAction<'all' | 'autoJoin'>>;
	onClickClose: () => void;
	onClickAddExisting: false | ((e: SyntheticEvent) => void);
	onClickCreateNew: false | ((e: SyntheticEvent) => void);
	total: number;
	loadMoreItems: () => void;
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

	const lm = useStableCallback(() => !loading && loadMoreItems());

	const loadMoreChannels = useDebouncedCallback(
		() => {
			if (channels.length >= total) {
				return;
			}

			lm();
		},
		300,
		[lm, channels],
	);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='hash' />
				<ContextualbarTitle>{t('Team_Channels')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search')}
					value={text}
					ref={inputRef}
					onChange={setText}
					endAddon={<Icon name='magnifier' size='x20' />}
				/>
				<Box width='x144' marginInlineStart={8}>
					<Select onChange={(val) => setType(val as 'all' | 'autoJoin')} value={type} options={options} />
				</Box>
			</ContextualbarSection>
			<ContextualbarContent padding={0} paddingBlock={12}>
				{loading && (
					<Box paddingInline={24} paddingBlock={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{!loading && channels.length === 0 && <ContextualbarEmptyContent title={t('No_channels_in_team')} />}
				{!loading && channels.length > 0 && (
					<>
						<Box paddingInline={24} paddingBlockStart={4} paddingBlockEnd={8}>
							<Box is='span' color='hint' fontScale='p2'>
								{t('Showing_current_of_total', { current: channels.length, total })}
							</Box>
						</Box>
						<Box width='full' height='full' role='list' overflow='hidden' flexShrink={1}>
							<VirtualizedScrollbars>
								<Virtuoso
									totalCount={total}
									data={channels}
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
					<ButtonGroup stretch='equal'>
						{onClickAddExisting && <Button onClick={onClickAddExisting}>{t('Team_Add_existing')}</Button>}
						{onClickCreateNew && <Button onClick={onClickCreateNew}>{t('Create_new')}</Button>}
					</ButtonGroup>
				</ContextualbarFooter>
			)}
		</ContextualbarDialog>
	);
};

export default TeamsChannels;
