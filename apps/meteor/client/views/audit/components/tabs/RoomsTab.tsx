import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Field, FieldLabel, FieldRow, FieldError, Stack, Icon } from '@rocket.chat/fuselage';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoomAutoComplete from '../../../../components/RoomAutoComplete';
import type { AuditFields } from '../../hooks/useAuditForm';

export type RoomsTabProps = {
	form: UseFormReturn<AuditFields>;
	actions?: ReactNode;
	setSelectedRoom: Dispatch<SetStateAction<IRoom | undefined>>;
};

const RoomsTab = ({ form: { control }, actions, setSelectedRoom }: RoomsTabProps) => {
	const { t } = useTranslation();

	const { field: ridField, fieldState: ridFieldState } = useController({ name: 'rid', control, rules: { required: true } });

	return (
		<Box width='full'>
			<Field>
				<FieldLabel>{t('Channel_name')}</FieldLabel>
				<FieldRow>
					<Stack direction='row' align='center' grow gap={8}>
						<RoomAutoComplete
							scope='admin'
							setSelectedRoom={setSelectedRoom}
							value={ridField.value}
							error={!!ridFieldState.error}
							placeholder={t('Channel_Name_Placeholder')}
							onChange={ridField.onChange}
							renderRoomIcon={({ encrypted }) =>
								encrypted ? <Icon name='key' color='danger' title={t('Encrypted_content_will_not_appear_search')} /> : null
							}
						/>
						{actions}
					</Stack>
				</FieldRow>
				{ridFieldState.error?.type === 'required' && <FieldError>{t('Required_field', { field: t('Channel_name') })}</FieldError>}
				{ridFieldState.error?.type === 'validate' && <FieldError>{ridFieldState.error.message}</FieldError>}
			</Field>
		</Box>
	);
};

export default RoomsTab;
