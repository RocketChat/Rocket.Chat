import { Box, Icon, TextInput, Margins, Select, Throbber, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import Row from './Row';

const BaseTeamsChannels = ({
	loading,
	channels = [],
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
}) => {
	const t = useTranslation();
	const inputRef = useAutoFocus(true);

	const options = useMemo(
		() => [
			['all', t('All')],
			['autoJoin', t('Auto-join')],
		],
		[t],
	);

	const lm = useMutableCallback((start) => !loading && loadMoreItems(start));

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='hash' />
				<VerticalBar.Text>{t('Team_Channels')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box display='flex' flexDirection='row' p='x12' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								placeholder={t('Search')}
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
				{!loading && channels.length === 0 && (
					<Box textAlign='center' p='x12' color='annotation'>
						{t('No_channels_in_team')}
					</Box>
				)}
				{!loading && (
					<Box w='full' h='full' overflow='hidden' flexShrink={1}>
						<Virtuoso
							totalCount={total}
							endReached={lm}
							data={channels}
							components={{ Scroller: ScrollableContentWrapper }}
							itemContent={(index, data) => <Row onClickView={onClickView} room={data} reload={reload} />}
						/>
					</Box>
				)}
			</VerticalBar.Content>

			{(onClickAddExisting || onClickCreateNew) && (
				<VerticalBar.Footer>
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
				</VerticalBar.Footer>
			)}
		</>
	);
};

export default BaseTeamsChannels;
