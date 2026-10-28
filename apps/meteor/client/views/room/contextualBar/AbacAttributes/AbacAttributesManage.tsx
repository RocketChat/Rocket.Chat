import type { IAbacAttributeDefinition, IAbacRoomMembershipPreview, IRoom } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Stack, Text } from '@rocket.chat/fuselage';
import {
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarTitle,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { InfiniteData } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AbacAttributesFormData } from '../../../../components/ABAC/AbacRoomCreation';
import { AbacAttributesStep, toAttributeMap, useAssignableAttributes } from '../../../../components/ABAC/AbacRoomCreation';
import AbacRoomMembershipPreview from '../../../../components/ABAC/AbacRoomMembershipPreview/AbacRoomMembershipPreview';
import { hasAttributeChanges } from '../../../../components/ABAC/hasAttributeChanges';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

export const getInitialAttributeRows = (attributes: IAbacAttributeDefinition[], requiredKeys: string[]): IAbacAttributeDefinition[] => {
	const required = requiredKeys.map((key) => ({ key, values: attributes.find((attribute) => attribute.key === key)?.values ?? [] }));
	const optional = attributes.filter(({ key }) => !requiredKeys.includes(key));
	const rows = [...required, ...optional];

	return rows.length > 0 ? rows : [{ key: '', values: [] }];
};

type AbacAttributesManageProps = {
	room: IRoom;
	requiredKeys: string[];
	onBack: () => void;
	onClose: () => void;
	onSaved: () => void;
};

const AbacAttributesManage = ({ room, requiredKeys, onBack, onClose, onSaved }: AbacAttributesManageProps) => {
	const { t } = useTranslation();
	const formId = useId();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const roomAttributes = room.abacAttributes ?? [];

	const methods = useForm<AbacAttributesFormData>({
		defaultValues: { attributes: getInitialAttributeRows(roomAttributes, requiredKeys) },
		mode: 'onChange',
	});
	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = methods;

	const attributes = useWatch({ control, name: 'attributes' });
	const draft = toAttributeMap(attributes);
	const canReview = isValid && Object.keys(draft).length > 0 && hasAttributeChanges(attributes, roomAttributes);

	const [previewAttributes, setPreviewAttributes] = useState<Record<string, string[]>>();

	const assignable = useAssignableAttributes({ select: (data) => data.attributes, rid: room._id });
	const saveRoomAttributes = useEndpoint('POST', '/v1/abac/rooms/:rid/attributes', { rid: room._id });

	const saveMutation = useMutation({
		mutationFn: (attributes: Record<string, string[]>) => saveRoomAttributes({ attributes }),
		onMutate: (attributes) => {
			const preview = queryClient.getQueryData<InfiniteData<IAbacRoomMembershipPreview>>(
				ABACQueryKeys.roomMembershipPreview.group(room._id, attributes, '', 'loses'),
			);
			const editorVerdict = preview?.pages[0]?.editor;
			return { editorLosesAccess: !!editorVerdict && editorVerdict !== 'compliant' };
		},
		onSuccess: (_data, _attributes, context) => {
			dispatchToastMessage({ type: 'success', message: t('ABAC_Room_attributes_updated') });
			void queryClient.invalidateQueries({ queryKey: ABACQueryKeys.assignableAttributes(room._id) });

			if (context?.editorLosesAccess) {
				router.navigate('/home');
				return;
			}

			onSaved();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	useEffect(
		() => () => queryClient.removeQueries({ queryKey: ABACQueryKeys.roomMembershipPreview.all(room._id) }),
		[queryClient, room._id],
	);

	if (previewAttributes) {
		return (
			<>
				<ContextualbarHeader>
					<ContextualbarBack onClick={() => setPreviewAttributes(undefined)} disabled={saveMutation.isPending} />
					<ContextualbarTitle>{t('ABAC_Members_preview')}</ContextualbarTitle>
					<ContextualbarClose onClick={onClose} />
				</ContextualbarHeader>
				<AbacRoomMembershipPreview
					rid={room._id}
					roomName={room.fname || room.name || room._id}
					attributes={previewAttributes}
					isSaving={saveMutation.isPending}
					onBack={() => setPreviewAttributes(undefined)}
					onSave={() => saveMutation.mutate(previewAttributes)}
				/>
			</>
		);
	}

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarBack onClick={onBack} />
				<ContextualbarTitle>{t('ABAC_Manage_attributes')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<FormProvider {...methods}>
				<ContextualbarScrollableContent
					is='form'
					id={formId}
					onSubmit={handleSubmit((values) => setPreviewAttributes(toAttributeMap(values.attributes)))}
				>
					<Stack gap='x16'>
						<Text fontScale='p2' color='hint'>
							{t('ABAC_Manage_attributes_description')}
						</Text>
						<AbacAttributesStep
							requiredKeys={requiredKeys}
							assignable={assignable.data}
							isPending={assignable.isPending}
							error={assignable.error}
							showTitle={false}
						/>
					</Stack>
				</ContextualbarScrollableContent>
			</FormProvider>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onBack}>{t('Back')}</Button>
					<Button variant='primary' type='submit' form={formId} disabled={!canReview}>
						{t('ABAC_Review_changes')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AbacAttributesManage;
