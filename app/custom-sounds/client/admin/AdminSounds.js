import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Table, TextInput, Icon } from '@rocket.chat/fuselage';

import { GenericTable, Th } from '../../../ui/client/components/GenericTable';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);
	return <Box mb='x16' is='form' display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

export function AdminSounds({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
	].filter(Boolean), [sort]);

	const renderRow = (sound) => {
		const { _id, name } = sound;
		return <Table.Row key={_id} onKeyDown={onClick(_id, sound)} onClick={onClick(_id, sound)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default' style={style}>{name}</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.sounds} total={data.total} setParams={setParams} params={params} />;
}

// import React, { useMemo, useCallback, useState, useEffect } from 'react';
// import { Box, Table, TextInput, Icon, ButtonGroup, Button } from '@rocket.chat/fuselage';
// import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

// import { NewSound } from './NewSound';
// import { useRouteParameter, useRoute } from '../../../../client/contexts/RouterContext';
// import { GenericTable, Th } from '../../../ui/client/components/GenericTable';
// import { useEndpointData } from '../../../../client/hooks/useEndpointData';
// import { useTranslation } from '../../../../client/contexts/TranslationContext';
// import VerticalBar from '../../../../client/components/basic/VerticalBar';
// import Page from '../../../../client/components/basic/Page';

// const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };


// const FilterByText = ({ setFilter, ...props }) => {
// 	const t = useTranslation();
// 	const [text, setText] = useState('');
// 	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

// 	useEffect(() => {
// 		setFilter({ text });
// 	}, [text]);
// 	return <Box mb='x16' is='form' display='flex' flexDirection='column' {...props}>
// 		<TextInput placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
// 	</Box>;
// };

// export function AdminSounds({
// 	// workspace = 'local',
// 	sort,
// 	// onClick,
// 	onHeaderClick,
// 	route,
// 	setParams,
// 	params,
// }) {
// 	// Router Handlers
// 	const router = useRoute(route);
// 	const context = useRouteParameter('context');
// 	console.log(context, router);
// 	const handleHeaderButtonClick = useCallback((context) => () => router.push({
// 		context,
// 	}), [router]);
// 	const handleVerticalBarCloseButtonClick = () => {
// 		router.push({});
// 	};

// 	const t = useTranslation();
// 	const data = useEndpointData('custom-sounds.list', '') || {};

// 	const mediaQuery = useMediaQuery('(min-width: 1024px)');

// 	const header = useMemo(() => [
// 		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
// 		// <Th key={'action'} direction={sort[1]} active={sort[0] === 'emails.adress'} onClick={onHeaderClick} sort='emails.address' w='x120'>{t('Email')}</Th>,
// 	].filter(Boolean), [sort, mediaQuery]);

// 	console.log('ADMIN SOUNDS');

// 	const renderRow = useCallback(({ _id, name }) => <Table.Row key={_id} tabIndex={0} role='link'>
// 		<Table.Cell style={style}>
// 			<Box display='flex' alignItems='center'>
// 				<Box display='flex' style={style} mi='x8'>
// 					<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
// 						<Box textStyle='p2' style={style} textColor='default'>{name}</Box>
// 					</Box>
// 				</Box>
// 			</Box>
// 		</Table.Cell>
// 		<Table.Cell style={style}></Table.Cell>
// 	</Table.Row>, [mediaQuery]);

// 	return <Page flexDirection='row'>
// 		<Page _id='AdminSounds' name='admin-custom-sounds'>
// 			<Page.Header title={t('Custom_Sounds')}>
// 				<ButtonGroup>
// 					<Button small onClick={handleHeaderButtonClick('new')} aria-label={t('New')}>
// 						<Icon name='plus'/>
// 					</Button>
// 				</ButtonGroup>
// 			</Page.Header>
// 			<Page.Content>
// 				<GenericTable FilterComponent={FilterByText} header={header} results={data.sounds} renderRow={renderRow} total={data.total} setParams={setParams} params={params} />
// 			</Page.Content>
// 		</Page>
// 		{ context
// 			&& <VerticalBar>
// 				<VerticalBar.Header>
// 					{context === 'new' && t('Custom_Sound_Add')}
// 					<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
// 				</VerticalBar.Header>
// 				<VerticalBar.Content>
// 					{ context === 'new' && <NewSound/> }
// 				</VerticalBar.Content>
// 			</VerticalBar>}
// 	</Page>;
// }
