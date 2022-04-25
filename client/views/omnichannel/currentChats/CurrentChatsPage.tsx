import { Button, Button } from '@rocket.chat/fuselage';
import React, { Dispatch, FC, Key, memo, ReactElement, ReactNode, SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { IOmnichannelRoom } from '../../../../definition/IRoom';
import { Serialized } from '../../../../definition/Serialized';
import GenericTable from '../../../components/GenericTable';
import Page from '../../../components/Page';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import CustomFieldsVerticalBar from './CustomFieldsVerticalBar';
import FilterByText from './FilterByText';

type CurrentChatsPageData = {
	rooms: Serialized<IOmnichannelRoom>[];
	count: number;
	offset: number;
	total: number;
};

interface ICurrentChatsProps {
	guest: string;
	fname: string;
	servedBy: string;
	status: string;
	department: string;
	from: string;
	to: string;
	tags: string[];
}

interface ICurrentChatsPageDataParams extends ICurrentChatsProps {
	customFields: any;
	current: number;
	itemsPerPage?: 50 | 25 | 100;
}

const CurrentChatsPage: FC<{
	data?: CurrentChatsPageData;
	header: ReactNode;
	setParams: Dispatch<SetStateAction<ICurrentChatsPageDataParams>>;
	params: ICurrentChatsPageDataParams;
	title: string;
	renderRow: (props: { _id?: Key }) => ReactElement;
	reload: () => void;
	context?: string;
}> = ({ data, header, setParams, params, title, renderRow, reload, context, id }) => {
	const { value: allCustomFieldsDefinition, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');

	// const forms = useSubscription<any>(formsSubscription);

	// const { useCurrentChatTags = (): void => undefined } = forms;

	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	// const Tags = useCurrentChatTags();

	const {
		register,
		handleSubmit,
		setValue,
		control,
		watch,
		reset,
		formState: { errors },
	} = useForm<ICurrentChatsPageDataParams>({ mode: 'onChange' });

	useEffect(() => {
		const subscription = watch((value, { name, type }) => console.log(value, name, type));
		return () => subscription.unsubscribe();
	}, [watch]);

	const directoryRoute = useRoute('omnichannel-current-chats');

	const handleClick = () => {
		directoryRoute.push({ context: 'custom-fields' });
	};

	if (stateCustomFields === AsyncStatePhase.LOADING) {
		return <>LOADING</>;
	}

	console.log('CurrentChatsPage');
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
						renderFilter={(): ReactElement => <FilterByText register={register} control={control} errors={errors} />}
					/>
				</Page.Content>
			</Page>
			{(context === 'custom-fields' || id === 'custom-fields') && canViewCustomFields && (
				<CustomFieldsVerticalBar
					customFields={allCustomFieldsDefinition?.customFields || []}
					reset={reset}
					register={register}
					errors={errors}
				/>
			)}
		</Page>
	);
};

export default memo(CurrentChatsPage);
