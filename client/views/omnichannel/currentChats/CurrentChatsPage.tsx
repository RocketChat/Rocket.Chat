import React, { Dispatch, FC, Key, memo, ReactElement, ReactNode, SetStateAction, useMemo, useState } from 'react';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { ILivechatCustomField } from '../../../../definition/ILivechatCustomField';
import { IOmnichannelRoom } from '../../../../definition/IRoom';
import { Serialized } from '../../../../definition/Serialized';
import CustomFieldsForm from '../../../components/CustomFieldsForm';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import FilterByText from './FilterByText';

type CurrentChatsPageData = {
	rooms: Serialized<IOmnichannelRoom>[];
	count: number;
	offset: number;
	total: number;
};

type CurrentChatsPageDataParams = {
	guest: string;
	fname: string;
	servedBy: string;
	status: string;
	department: string;
	from: string;
	to: string;
	customFields: any;
	current: number;
	itemsPerPage: number;
	tags: string[];
};

type CustomFieldsData = Record<string, Pick<ILivechatCustomField, 'label' | 'type' | 'required' | 'defaultValue'> & { options?: string[] }>;

const CurrentChatsPage: FC<{
	data?: CurrentChatsPageData;
	header: ReactNode;
	setParams: Dispatch<SetStateAction<CurrentChatsPageDataParams>>;
	params: CurrentChatsPageDataParams;
	title: string;
	renderRow: (props: { _id?: Key }) => ReactElement;
	reload: () => void;
}> = ({ data, header, setParams, params, title, renderRow, reload }) => {
	const t = useTranslation();

	const [customFieldsSearchBarOpen, setCustomFieldsSearchBarOpen] = useState<boolean>(false);
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');

	const jsonConverterToValidFormat = (customFields: Omit<ILivechatCustomField, '_updatedAt'>[]): CustomFieldsData => {
		const jsonObj: CustomFieldsData = {};
		customFields.forEach(({ _id, label, visibility, options, scope, defaultValue, required }) => {
			visibility === 'visible' &&
				scope === 'room' &&
				(jsonObj[_id] = {
					label,
					type: options ? 'select' : 'text',
					required,
					defaultValue,
					options: options?.split(',').map((item) => item.trim()),
				});
		});
		return jsonObj;
	};

	const jsonCustomField = useMemo(
		() => (allCustomFields?.customFields ? jsonConverterToValidFormat(allCustomFields.customFields) : {}),
		[allCustomFields],
	);

	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	if ([stateCustomFields].includes(AsyncStatePhase.LOADING)) {
		return <>{t('Loading')}</>;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title} />
				<Page.Content>
					<GenericTable
						header={header}
						renderRow={renderRow}
						results={data?.rooms}
						total={data?.total}
						params={params}
						setParams={setParams}
						reload={reload}
						renderFilter={({ onChange, ...props }: any): any => (
							<FilterByText setFilter={onChange} setCustomFieldsSearchBarOpen={setCustomFieldsSearchBarOpen} {...props} />
						)}
					/>
				</Page.Content>
			</Page>
			{customFieldsSearchBarOpen && (
				<VerticalBar>
					<VerticalBar.Header>
						{t('Filter_by_Custom_Fields')}
						<VerticalBar.Close
							onClick={(): void => {
								console.log('close button clicked');
								setCustomFieldsSearchBarOpen(false);
							}}
						/>
					</VerticalBar.Header>
					<VerticalBar.ScrollableContent>
						{canViewCustomFields && allCustomFields && (
							<CustomFieldsForm
								jsonCustomFields={jsonCustomField}
								customFieldsData={{}}
								setCustomFieldsData={(): void => {
									console.log('setCustomFieldsData called');
								}}
								setCustomFieldsError={(): void => {
									console.log('setCustomFieldsData called');
								}}
							/>
						)}
					</VerticalBar.ScrollableContent>
				</VerticalBar>
			)}
		</Page>
	);
};

export default memo(CurrentChatsPage);
