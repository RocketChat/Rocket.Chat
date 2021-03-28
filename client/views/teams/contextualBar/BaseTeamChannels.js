import {
	Box,
	Icon,
	TextInput,
	Margins,
	Select,
	Throbber,
	ButtonGroup,
	Button,
} from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../components/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import Row from './Row';
import { TeamChannelItem } from './TeamChannelItem';

const BaseTeamChannels = ({
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

	const lm = useMutableCallback((start) =>
		loadMoreItems(start + 1, Math.min(50, start + 1 - channels.length)),
	);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='hash' />
				<VerticalBar.Text>{t('Channels')}</VerticalBar.Text>
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

				{loading && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}
				{!loading && channels.length <= 0 && (
					<Box pi='x24' pb='x12'>
						{t('No_results_found')}
					</Box>
				)}

				<Box w='full' h='full' overflow='hidden' flexShrink={1}>
					{!loading && channels && channels.length > 0 && (
						<Virtuoso
							style={{
								height: '100%',
								width: '100%',
							}}
							totalCount={total}
							endReached={lm}
							overscan={50}
							data={channels}
							components={{ Scroller: ScrollableContentWrapper }}
							itemContent={(index, data) => <Row onClickView={onClickView} room={data} />}
						/>
					)}
				</Box>
			</VerticalBar.Content>

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
		</>
	);
};

export default Object.assign(BaseTeamChannels, {
	Option: TeamChannelItem,
});
