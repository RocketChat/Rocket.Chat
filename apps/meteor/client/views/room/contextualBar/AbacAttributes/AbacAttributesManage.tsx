import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import {
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarTitle,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AbacAttributesFormData } from '../../../../components/ABAC/AbacRoomCreation';
import { AbacAttributesStep, toAttributeMap, useAssignableAttributeList } from '../../../../components/ABAC/AbacRoomCreation';
import AbacRoomMembershipPreview from '../../../../components/ABAC/AbacRoomMembershipPreview/AbacRoomMembershipPreview';
import { hasAttributeChanges } from '../../../../components/ABAC/hasAttributeChanges';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

export const getInitialAttributeRows = (attributes: IAbacAttributeDefinition[], requiredKeys: string[]): IAbacAttributeDefinition[] => {
	const required = requiredKeys.map((key) => ({ key, values: attributes.find((attribute) => attribute.key === key)?.values ?? [] }));
	const optional = attributes.filter(({ key }) => !requiredKeys.includes(key));
	const rows = [...required, ...optional];

	return rows.length > 0 ? rows : [{ key: '', values: [] }];
};

type SaveVariables = {
	attributes: Record<string, string[]>;
	editorLosesAccess: boolean;
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

	const assignable = useAssignableAttributeList(true, room._id);
	const saveRoomAttributes = useEndpoint('POST', '/v1/abac/rooms/:rid/attributes', { rid: room._id });

	const saveMutation = useMutation({
		mutationFn: async ({ attributes, editorLosesAccess }: SaveVariables) => {
			await saveRoomAttributes({ attributes });
			return editorLosesAccess;
		},
		onSuccess: (editorLosesAccess) => {
			dispatchToastMessage({ type: 'success', message: t('ABAC_Room_attributes_updated') });
			void queryClient.invalidateQueries({ queryKey: ABACQueryKeys.assignableAttributes(room._id) });

			if (editorLosesAccess) {
				router.navigate('/home');
				return;
			}

			onSaved();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	if (previewAttributes) {
		return (
			<>
				<ContextualbarHeader>
					<ContextualbarBack onClick={() => setPreviewAttributes(undefined)} />
					<ContextualbarTitle>{t('ABAC_Members_preview')}</ContextualbarTitle>
					<ContextualbarClose onClick={onClose} />
				</ContextualbarHeader>
				<AbacRoomMembershipPreview
					rid={room._id}
					roomName={room.fname || room.name || room._id}
					attributes={previewAttributes}
					onBack={() => setPreviewAttributes(undefined)}
					onSave={(editorLosesAccess) => saveMutation.mutateAsync({ attributes: previewAttributes, editorLosesAccess })}
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
					<Box fontScale='p2' color='hint' marginBlockEnd={16}>
						{t('ABAC_Manage_attributes_description')}
					</Box>
					<AbacAttributesStep
						requiredKeys={requiredKeys}
						assignable={assignable.data}
						isPending={assignable.isPending}
						error={assignable.error}
						assignabilityError={undefined}
						showTitle={false}
					/>
				</ContextualbarScrollableContent>
			</FormProvider>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onBack}>{t('Back')}</Button>
					<Button primary type='submit' form={formId} disabled={!canReview}>
						{t('ABAC_Review_changes')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AbacAttributesManage;
