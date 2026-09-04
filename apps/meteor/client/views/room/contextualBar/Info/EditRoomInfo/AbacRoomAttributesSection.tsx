import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAbacAttributeEditFlow } from '../../../../../components/ABAC/AbacAttributeEditor/useAbacAttributeEditFlow';
import AbacMembershipPreview from '../../../../../components/ABAC/AbacMembershipPreview/AbacMembershipPreview';
import RoomFormAttributeFields from '../../../../admin/ABAC/ABACRoomsTab/RoomFormAttributeFields';
import { useIsABACAvailable } from '../../../../admin/ABAC/hooks/useIsABACAvailable';

const MAX_ATTRIBUTE_ROWS = 10;

export type AbacRoomAttributesSectionProps = {
	room: IRoom;
};

/**
 * "Room attributes (ABAC)" in the room's own Edit channel panel (ABAC-P4 M3, Figma 4543:33798) —
 * the self-service route by which an entitled member unlocks a room.
 *
 * Self-contained on purpose. The surrounding panel saves room settings through
 * `saveRoomSettings`, whereas attributes are committed through the ABAC endpoint *after* their
 * membership impact has been confirmed, so the two cannot share one submit. That is also why the
 * primary action here is Next rather than Save.
 *
 * The preview and the confirmation come from the same component and hook the admin panel uses, so
 * the two surfaces cannot disagree about impact.
 */
const AbacRoomAttributesSection = ({ room }: AbacRoomAttributesSectionProps) => {
	const { t } = useTranslation();

	const isAbacAvailable = useIsABACAvailable();
	const canEditAttributes = usePermission('edit-room-abac-attributes', room._id);

	const methods = useForm<{ attributes: { key: string; values: string[] }[] }>({
		defaultValues: {
			attributes: room.abacAttributes?.length ? room.abacAttributes.map(({ key, values }) => ({ key, values })) : [{ key: '', values: [] }],
		},
		mode: 'onChange',
	});

	const {
		control,
		watch,
		formState: { isValid, isDirty },
	} = methods;

	const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

	const attributes = watch('attributes');

	const attributeMap = useMemo(
		() =>
			Object.fromEntries(attributes.filter(({ key, values }) => key && values.length).map(({ key, values }) => [key, values])) as Record<
				string,
				string[]
			>,
		[attributes],
	);

	const editFlow = useAbacAttributeEditFlow({
		rid: room._id,
		roomName: room.fname ?? room.name,
		attributes: attributeMap,
	});

	if (!isAbacAvailable || !canEditAttributes) {
		return null;
	}

	return (
		<FormProvider {...methods}>
			{editFlow.phase === 'preview' ? (
				<AbacMembershipPreview
					variant='impact'
					data={editFlow.preview.data}
					isPending={editFlow.preview.isPending}
					error={editFlow.preview.error ?? undefined}
				/>
			) : (
				<>
					<Box marginBlockEnd={8} color='hint' fontScale='c1'>
						{t('ABAC_Room_attributes_edit_hint')}
					</Box>
					<RoomFormAttributeFields fields={fields} remove={remove} />
					<Button
						type='button'
						width='full'
						marginBlockStart={8}
						disabled={fields.length >= MAX_ATTRIBUTE_ROWS}
						onClick={() => {
							append({ key: '', values: [] });
						}}
					>
						{t('ABAC_Add_Attribute')}
					</Button>
				</>
			)}

			<Box marginBlockStart={16}>
				<ButtonGroup stretch>
					{editFlow.phase === 'preview' ? (
						<>
							<Button type='button' onClick={editFlow.backToEdit}>
								{t('Back')}
							</Button>
							<Button type='button' primary onClick={editFlow.requestSave} disabled={!editFlow.canSave} loading={editFlow.isSaving}>
								{t('Save_changes')}
							</Button>
						</>
					) : (
						<Button type='button' primary onClick={editFlow.goToPreview} disabled={!isValid || !isDirty}>
							{t('Next')}
						</Button>
					)}
				</ButtonGroup>
			</Box>
		</FormProvider>
	);
};

export default AbacRoomAttributesSection;
