import { Field, ToggleSwitch, FieldLabel, FieldRow, FieldHint } from '@rocket.chat/fuselage-forms';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type CreateChannelSecurityFieldsProps = {
	canUseFederation: boolean;
	federationFieldHint: TranslationKey;
	canSetReadOnly: boolean;
	e2eDisabled: boolean;
	encryptedHint: string;
};

/**
 * The Security and permissions controls of the Create channel flow.
 *
 * Extracted so the same fields render in the single-page flow's Advanced settings accordion and as
 * step 3 of the ABAC flow (ABAC-P4 M2, Figma 5392:50527) from one definition.
 */
const CreateChannelSecurityFields = ({
	canUseFederation,
	federationFieldHint,
	canSetReadOnly,
	e2eDisabled,
	encryptedHint,
}: CreateChannelSecurityFieldsProps) => {
	const { t } = useTranslation();
	const { control, watch } = useFormContext<{
		isPrivate: boolean;
		readOnly: boolean;
		broadcast: boolean;
		federated: boolean;
		encrypted: boolean;
		isAbacManaged: boolean;
	}>();

	const { readOnly, broadcast, federated, isAbacManaged } = watch();

	return (
		<>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Federation_Matrix_Federated')}</FieldLabel>
					<Controller
						control={control}
						name='federated'
						render={({ field: { value, ...field } }) => (
							// ABAC restrictions are not applied to federated rooms (ABAC-P4/D8), so an
							// ABAC-managed room cannot also be federated.
							<ToggleSwitch {...field} checked={value} disabled={!canUseFederation || isAbacManaged} />
						)}
					/>
				</FieldRow>
				<FieldHint>{isAbacManaged ? t('ABAC_Federation_not_available_for_abac_rooms') : t(federationFieldHint)}</FieldHint>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Encrypted')}</FieldLabel>
					<Controller
						control={control}
						name='encrypted'
						render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} disabled={e2eDisabled} />}
					/>
				</FieldRow>
				<FieldHint>{encryptedHint}</FieldHint>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Read_only')}</FieldLabel>
					<Controller
						control={control}
						name='readOnly'
						render={({ field: { value, ...field } }) => (
							<ToggleSwitch {...field} checked={value} disabled={!canSetReadOnly || broadcast || federated} />
						)}
					/>
				</FieldRow>
				<FieldHint>{readOnly ? t('Read_only_field_hint_enabled', { roomType: 'channel' }) : t('Anyone_can_send_new_messages')}</FieldHint>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Broadcast')}</FieldLabel>
					<Controller
						control={control}
						name='broadcast'
						render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} disabled={!!federated} />}
					/>
				</FieldRow>
				{broadcast && <FieldHint>{t('Broadcast_hint_enabled', { roomType: 'channel' })}</FieldHint>}
			</Field>
		</>
	);
};

export default CreateChannelSecurityFields;
