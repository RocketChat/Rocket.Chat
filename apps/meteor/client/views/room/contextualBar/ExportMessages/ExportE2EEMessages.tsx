import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Field,
	FieldLabel,
	FieldRow,
	Select,
	ButtonGroup,
	Button,
	FieldGroup,
	InputBox,
	Margins,
	Box,
	FieldHint,
	Callout,
} from '@rocket.chat/fuselage';
import { useAutoFocus, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

// import type { MailExportFormValues } from './ExportMessages';
// import { useRoomExportMutation } from './useRoomExportMutation';
import { Messages } from '../../../../../app/models/client';
import {
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarClose,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
} from '../../../../components/Contextualbar';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { downloadJsonAs } from '../../../../lib/download';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): IMessage[] => {
	const showThreadsInMainChannel = useUserPreference<boolean>('showThreadsInMainChannel', false);
	// const hideSysMesSetting = useSetting<MessageTypesValues[]>('Hide_System_Messages', []);
	const room = useRoom();
	// const hideRoomSysMes: Array<MessageTypesValues> = Array.isArray(room.sysMes) ? room.sysMes : [];

	// const hideSysMessages = useStableArray(mergeHideSysMessages(hideSysMesSetting, hideRoomSysMes));

	const query: Mongo.Selector<IMessage> = useMemo(
		() => ({
			rid,
			_hidden: { $ne: true },
			// t: { $nin: hideSysMessages },
			...(!showThreadsInMainChannel && {
				$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
			}),
			ts: { $gte: new Date('2024-11-30'), $lt: new Date() },
		}),
		[rid, showThreadsInMainChannel],
	);

	return useReactiveValue(
		useCallback(
			() =>
				Messages.find(query, {
					sort: {
						ts: 1,
					},
				}).fetch(),
			[query],
		),
	);
};

const useExportE2EEMessages = ({ rid }: { rid: string }) => {
	const showThreadsInMainChannel = useUserPreference<boolean>('showThreadsInMainChannel', false);

	// const messages = useMessages({ rid: room._id });

	// const query: Mongo.Selector<IMessage> = useMemo(
	// 	() => ({
	// 		rid,
	// 		_hidden: { $ne: true },
	// 		// t: { $nin: hideSysMessages },
	// 		...(!showThreadsInMainChannel && {
	// 			$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
	// 		}),
	// 		ts: { $gte: new Date('2024-11-15'), $lt: new Date() },
	// 	}),
	// 	[rid, showThreadsInMainChannel],
	// );

	return useMutation({
		mutationFn: ({ from, until }: FormValues) => {
			return Messages.find({
				rid,
				_hidden: { $ne: true },
				// t: { $nin: hideSysMessages },
				...(!showThreadsInMainChannel && {
					$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
				}),
				...((from.date || until.date) && { ts: { $gte: new Date(from.date), $lt: new Date(until.date) } }),
			}).fetch();
		},
		onSuccess: (data) => {
			console.log(data);
			downloadJsonAs(data, 'exportedMessages');
		},
	});
};

type FormValues = {
	type: 'file';
	format: 'html' | 'json';
	from: { date: string; time: string };
	until: { date: string; time: string };
};

const ExportE2EEMessages = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	// console.log(messages);
	const exportE2EEMessages = useExportE2EEMessages({ rid: room._id });

	const { control, register, handleSubmit } = useForm<FormValues>({
		defaultValues: { type: 'file', format: 'html', from: { date: '', time: '' }, until: { date: '', time: '' } },
	});

	const outputOptions = useMemo<SelectOption[]>(
		() => [
			['html', t('HTML')],
			['json', t('JSON')],
		],
		[t],
	);

	const handleExport = async (data: FormValues) => {
		console.log(data);

		exportE2EEMessages.mutate(data);
		// return downloadJsonAs(statisticsQuery.data, 'statistics');
	};

	const formId = useUniqueId();
	const typeField = useUniqueId();
	const formatField = useUniqueId();
	const formFocus = useAutoFocus<HTMLFormElement>();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='mail' />
				<ContextualbarTitle id={`${formId}-title`}>{t('Export_Encrypted_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			<>
				<ContextualbarScrollableContent>
					<form ref={formFocus} tabIndex={-1} aria-labelledby={`${formId}-title`} id={formId} onSubmit={handleSubmit(handleExport)}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={typeField}>{t('Method')}</FieldLabel>
								<FieldRow>
									<Controller
										name='type'
										control={control}
										render={({ field }) => (
											<Select id={typeField} {...field} disabled placeholder={t('Type')} options={[['file', t('Export_as_file')]]} />
										)}
									/>
								</FieldRow>
								<FieldHint>Encrypted messages cannot be emailed.</FieldHint>
							</Field>
							<Field>
								<FieldLabel flexGrow={0}>{t('From_date')}</FieldLabel>
								<Box display='flex' mi='neg-x4'>
									<Margins inline={4}>
										<InputBox type='date' flexGrow={1} h='x20' {...register('from.date')} />
										<InputBox type='time' flexGrow={1} h='x20' {...register('from.time')} />
									</Margins>
								</Box>
							</Field>
							<Field>
								<FieldLabel flexGrow={0}>{t('Until_date')}</FieldLabel>
								<Box display='flex' mi='neg-x4'>
									<Margins inline={4}>
										<InputBox type='date' flexGrow={1} h='x20' {...register('until.date')} />
										<InputBox type='time' flexGrow={1} h='x20' {...register('until.time')} />
									</Margins>
								</Box>
							</Field>
							<Field>
								<FieldLabel htmlFor={formatField}>{t('Output_format')}</FieldLabel>
								<FieldRow>
									<Controller
										name='format'
										control={control}
										render={({ field }) => <Select {...field} id={formatField} placeholder={t('Format')} options={outputOptions} />}
									/>
								</FieldRow>
							</Field>
							<Callout>A maximum of 500 messages can be exported at a time from encrypted `room type`.</Callout>
						</FieldGroup>
					</form>
				</ContextualbarScrollableContent>
				<ContextualbarFooter>
					<ButtonGroup stretch>
						<Button onClick={() => closeTab()}>{t('Cancel')}</Button>
						<Button form={formId} primary type='submit'>
							{t('Export')}
						</Button>
					</ButtonGroup>
				</ContextualbarFooter>
			</>
		</>
	);
};

export default ExportE2EEMessages;
