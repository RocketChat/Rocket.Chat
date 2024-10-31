import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { Box, Margins, Throbber, States, StatesIcon, StatesTitle, Select } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Key } from 'react';
import React, { useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtuosoScrollbars } from '../../../../../components/CustomScrollbars';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { useOmnichannelSourceName } from '../../../hooks/useOmnichannelSourceName';
import AdvancedContactModal from '../../AdvancedContactModal';
import ContactInfoHistoryItem from './ContactInfoHistoryItem';

type ContactInfoHistoryProps = {
	contactId: string;
	setChatId: (chatId: string) => void;
};

const isFilterBlocked = (hasLicense: boolean, fieldValue: Key) => !hasLicense && fieldValue !== 'all';

const ContactInfoHistory = ({ contactId, setChatId }: ContactInfoHistoryProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const [type, setType] = useLocalStorage<string>('contact-history-type', 'all');
	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;
	const getSourceName = useOmnichannelSourceName();

	const getContactHistory = useEndpoint('GET', '/v1/omnichannel/contacts.history');
	const { data, isLoading, isError } = useQuery(['getContactHistory', contactId, type], () =>
		getContactHistory({ contactId, source: type === 'all' ? undefined : type }),
	);

	useEffect(() => {
		if (isFilterBlocked(hasLicense, type)) {
			setType('all');
		}
	}, [hasLicense, type, setType]);

	const handleChangeFilter = (value: Key) => {
		if (isFilterBlocked(hasLicense, value)) {
			return setModal(<AdvancedContactModal onCancel={() => setModal(null)} />);
		}

		setType(value as string);
	};

	const historyFilterOptions: [string, string][] = Object.values(OmnichannelSourceType).reduce(
		(acc, cv) => {
			let sourceName;
			const hasSourceType = data?.history.find((item) => {
				sourceName = getSourceName(item.source);
				return item.source.type === cv;
			});

			if (hasSourceType && sourceName) {
				acc.push([cv, sourceName]);
			}

			return acc;
		},
		[['all', t('All')]],
	);

	return (
		<ContextualbarContent paddingInline={0}>
			<Box
				display='flex'
				flexDirection='row'
				p={24}
				borderBlockEndWidth='default'
				borderBlockEndStyle='solid'
				borderBlockEndColor='extra-light'
				flexShrink={0}
			>
				<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
					<Margins inline={4}>
						<Select value={type} onChange={handleChangeFilter} placeholder={t('Filter')} options={historyFilterOptions || []} />
					</Margins>
				</Box>
			</Box>
			{isLoading && (
				<Box pi={24} pb={12}>
					<Throbber size='x12' />
				</Box>
			)}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				</States>
			)}
			{data?.history.length === 0 && (
				<ContextualbarEmptyContent icon='history' title={t('No_history_yet')} subtitle={t('No_history_yet_description')} />
			)}
			{!isError && data?.history && data.history.length > 0 && (
				<>
					<Box pi={24} pb={12}>
						<Box is='span' color='hint' fontScale='p2'>
							{t('Showing_current_of_total', { current: data?.history.length, total: data?.total })}
						</Box>
					</Box>
					<Box role='list' flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
						<Virtuoso
							totalCount={data.history.length}
							overscan={25}
							data={data?.history}
							components={{ Scroller: VirtuosoScrollbars }}
							itemContent={(index, data) => <ContactInfoHistoryItem key={index} onClick={() => setChatId(data._id)} {...data} />}
						/>
					</Box>
				</>
			)}
		</ContextualbarContent>
	);
};

export default ContactInfoHistory;
