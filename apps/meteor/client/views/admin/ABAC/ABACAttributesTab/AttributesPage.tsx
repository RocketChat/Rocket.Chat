import { Box, Button, Icon, Margins, Pagination, TextInput, Stack, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	usePaginatedQuery,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AttributeMenu from './AttributeMenu';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import { useIsABACAvailable } from '../hooks/useIsABACAvailable';

const AttributesPage = () => {
	const { t } = useTranslation();

	const searchTerm = useSearchParameter('searchTerm');
	const [text, setText] = useState(searchTerm ?? '');

	const debouncedText = useDebouncedValue(text, 400);
	const getAttributes = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	const router = useRouter();
	const handleNewAttribute = useStableCallback(() => {
		router.navigate({
			name: 'admin-ABAC',
			params: {
				tab: 'room-attributes',
				context: 'new',
			},
		});
	});

	const query = useMemo(() => ({ ...(debouncedText ? { key: debouncedText, values: debouncedText } : {}) }), [debouncedText]);

	const { data, isLoading, paginationProps } = usePaginatedQuery({
		query,
		getQueryKey: (query) => ABACQueryKeys.roomAttributes.list(query),
		queryFn: getAttributes,
		itemsKey: 'attributes',
	});

	const columns: TableColumnWidth[] = ['auto', 'auto', 40];

	return (
		<>
			<Margins block={24}>
				<Stack direction='row' gap={8}>
					<TextInput
						endAddon={<Icon name='magnifier' size='x20' />}
						placeholder={t('ABAC_Search_attributes')}
						value={text}
						onChange={(e) => setText((e.target as HTMLInputElement).value)}
					/>
					<Button onClick={handleNewAttribute} variant='primary' disabled={!isABACAvailable}>
						{t('ABAC_New_attribute')}
					</Button>
				</Stack>
			</Margins>
			{(!data || data.attributes?.length === 0) && !isLoading ? (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='list-alt' title={t('ABAC_No_attributes')} description={t('ABAC_No_attributes_description')} />
				</Box>
			) : (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>
							<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Value')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='spacer' />
						</GenericTableHeader>
						<GenericTableBody>
							{data?.attributes?.map((attribute) => (
								<GenericTableRow key={attribute._id}>
									<GenericTableCell truncate>{attribute.key}</GenericTableCell>
									<GenericTableCell truncate>{attribute.values.join(', ')}</GenericTableCell>
									<GenericTableCell>
										<AttributeMenu attribute={attribute} />
									</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
				</>
			)}
		</>
	);
};

export default AttributesPage;
