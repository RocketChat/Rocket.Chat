import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { Box, Margins, Throbber, States, StatesIcon, StatesTitle, Select } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Key } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import ContactInfoHistoryItem from './ContactInfoHistoryItem';
import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { useOmnichannelSource } from '../../../hooks/useOmnichannelSource';
import AdvancedContactModal from '../../AdvancedContactModal';

type ContactInfoHistoryProps = {
	contact: Serialized<ILivechatContact>;
	setChatId: (chatId: string) => void;
};

const isFilterBlocked = (hasLicense: boolean, fieldValue: Key) => !hasLicense && fieldValue !== 'all';

const ContactInfoHistory = ({ contact, setChatId }: ContactInfoHistoryProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const [storedType, setStoredType] = useLocalStorage<string>('contact-history-type', 'all');

	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;
	const type = isFilterBlocked(hasLicense, storedType) ? 'all' : storedType;

	const { getSourceName } = useOmnichannelSource();

	const getContactHistory = useEndpoint('GET', '/v1/omnichannel/contacts.history');
	const { data, isLoading, isError } = useQuery({
		queryKey: ['getContactHistory', contact._id, type],
		queryFn: () => getContactHistory({ contactId: contact._id, source: type === 'all' ? undefined : type }),
	});

	const handleChangeFilter = (value: Key) => {
		if (isFilterBlocked(hasLicense, value)) {
			return setModal(<AdvancedContactModal onCancel={() => setModal(null)} />);
		}

		setStoredType(value as string);
	};

	const historyFilterOptions: [string, string][] = useMemo(
		() =>
			Object.values(OmnichannelSourceType).reduce(
				(acc, cv) => {
					let sourceName;
					const hasSourceType = contact.channels?.find((item) => {
						sourceName = getSourceName(item.details, false);
						return item.details.type === cv;
					});

					if (hasSourceType && sourceName) {
						acc.push([cv, sourceName]);
					}

					return acc;
				},
				[['all', t('All')]],
			),
		[contact.channels, getSourceName, t],
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
						<Select
							value={type}
							onChange={handleChangeFilter}
							placeholder={t('Filter')}
							options={historyFilterOptions}
							disabled={type === 'all' && data?.history.length === 0}
						/>
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
					<Box role='list' height='100%' overflow='hidden' flexShrink={1}>
						<VirtualizedScrollbars>
							<Virtuoso
								totalCount={data.history.length}
								overscan={25}
								data={data?.history}
								itemContent={(index, data) => <ContactInfoHistoryItem key={index} onClick={() => setChatId(data._id)} {...data} />}
							/>
						</VirtualizedScrollbars>
					</Box>
				</>
			)}
		</ContextualbarContent>
	);
};

export default ContactInfoHistory;
