import { Box, Icon, Skeleton, Table } from '@rocket.chat/fuselage';
import React, { FC, useMemo, useCallback } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericTable from '../../../../components/GenericTable';
import Page from '../../../../components/Page';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const VoipExtensionsPage: FC = () => {
	const t = useTranslation();

	// const handleClick = useMutableCallback(() =>
	// 	// tagsRoute.push({
	// 	// 	context: 'new',
	// 	// }),
	// );

	const {
		value: data = {},
		phase,
		reload,
	} = useEndpointData(
		'connector.extension.list',
		useMemo(() => ({}), []),
	);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'number'}>{t('Extension_Number')}</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'agent'}>{t('Agent_Name')}</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[t],
	);

	const renderRow = useCallback(
		({ _id, extension, state }) => (
			<Table.Row key={_id} tabIndex={0} role='link' action>
				<Table.Cell withTruncatedText>{extension}</Table.Cell>
				<Table.Cell withTruncatedText>{state}</Table.Cell>
				<Table.Cell withTruncatedText>remove</Table.Cell>
				{/* <RemoveTagButton _id={_id} reload={reload} /> */}
			</Table.Row>
		),
		[reload],
	);

	if (phase === AsyncStatePhase.LOADING) {
		return <Skeleton width='full' />;
	}

	console.log(data);

	return (
		<Page.ScrollableContentWithShadow>
			<Box marginBlock='none' marginInline='auto' width='full'>
				<GenericTable
					header={header}
					renderRow={renderRow}
					results={data?.extensions}
					total={data?.extensions.length}
					// setParams={(): void => {}}
					// params={params}
					// renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
				/>
			</Box>
		</Page.ScrollableContentWithShadow>
	);
};

export default VoipExtensionsPage;
