import { Box, Table, TextInput, Icon, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState, useEffect } from 'react';

import { GenericTable, Th } from '../../../app/ui/client/components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import { Apps } from '../../../app/apps/client/orchestrator';
import { formatPricingPlan } from '../../../app/apps/client/admin/helpers';


// const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const FilterByText = React.memo(({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);

	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Apps')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
});

const useResizeInlineBreakpoint = (sizes = [], debounceDelay = 0) => {
	const { ref, borderBoxSize } = useResizeObserver({ debounceDelay });
	const inlineSize = borderBoxSize ? borderBoxSize.inlineSize : 0;
	sizes = useMemo(() => sizes.map((current) => (inlineSize ? inlineSize > current : true)), [inlineSize]);
	return [ref, ...sizes];
};

const formatPrice = (purchaseType, pricingPlans, price) => {
	if (purchaseType === 'subscription') {
		if (!pricingPlans || !Array.isArray(pricingPlans) || pricingPlans.length === 0) {
			return;
		}

		return formatPricingPlan(pricingPlans[0]);
	}

	if (price > 0) {
		return formatPrice(price);
	}

	return 'Free';
};

export function MarketplaceTable({ type }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const [ref, isBig] = useResizeInlineBreakpoint([700], 200);

	const [data, setData] = useState({});

	useEffect(() => {
		(async () => {
			const appsData = await Promise.all([Apps.getAppsFromMarketplace(), Apps.getApps()]);
			setData(await Apps.getAppsFromMarketplace())
		})();
	}, []);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedText = useDebouncedValue(params.text, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const filteredData = useMemo(() => {
		const filteredValues = Object.values(data).filter(debouncedSort).sort((a, b) => (a.name > b.name ? 1 : -1));
		return debouncedSort[1] === 'asc' ? filteredValues : filteredValues.reverse();
	}, [debouncedText, debouncedSort, params.current, params.itemsPerPage, JSON.stringify(data)]);

	const router = useRoute('admin-integrations');

	const onClick = (_id, type) => () => router.push({
		context: 'edit',
		type: type === 'webhook-incoming' ? 'incoming' : 'outgoing',
		id: _id,
	});

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w={isBig ? 'x280' : 'x240'}>{t('Name')}</Th>,
		<Th key={'details'}>{t('Details')}</Th>,
		<Th key={'price'}>{t('Price')}</Th>,
		isBig && <Th key={'status'}>{t('Status')}</Th>,

	].filter(Boolean), [sort, isBig]);

	const renderRow = useCallback(({ author, name, id, description, categories, purchaseType, pricingPlans, price, purchased,  }) => {
		const handler = useMemo(() => onClick(id, type), []);
		return <Table.Row key={id} onKeyDown={handler} onClick={handler} tabIndex={0} role='link' action>
			<Table.Cell withTruncatedText display='flex' flexDirection='row'>
				<Box w='x40' h='x40' alignSelf='center'>avatar</Box>
				<Box display='flex' flexDirection='column' alignSelf='flex-start'>
					<Box color='default' fontScale='p2'>{name}</Box>
					<Box color='default' fontScale='p2'>{`${ t('By') } ${ author.name }`}</Box>
				</Box>
			</Table.Cell>
			<Table.Cell withTruncatedText>
				<Box display='flex' flexDirection='column'>
					<Box color='default'>{description}</Box>
					{categories && <Box color='hint'>{categories.map((current) => <Chip key={current}>{current}</Chip>)}</Box>}
				</Box>
			</Table.Cell>
			<Table.Cell withTruncatedText>{formatPrice(purchaseType, pricingPlans, price)}</Table.Cell>
			{isBig && <Table.Cell withTruncatedText>{}</Table.Cell>}
		</Table.Row>;
	}, []);

	return <GenericTable ref={ref} FilterComponent={FilterByText} header={header} renderRow={renderRow} results={filteredData} total={filteredData.length} setParams={setParams} params={params} />;
}

export default MarketplaceTable;
