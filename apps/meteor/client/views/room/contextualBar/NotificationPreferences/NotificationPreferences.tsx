import type { SelectOption } from '@rocket.chat/fuselage';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NotificationPreferencesForm from './NotificationPreferencesForm';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
} from '../../../../components/Contextualbar';

type NotificationPreferencesProps = {
	handleClose: () => void;
	handleSave: () => void;
	notificationOptions: {
		[key: string]: SelectOption[];
	};
	handlePlaySound: () => void;
};

const NotificationPreferences = ({
	handleClose,
	handleSave,
	notificationOptions,
	handlePlaySound,
}: NotificationPreferencesProps): ReactElement => {
	const { t } = useTranslation();
	const {
		formState: { isDirty, isSubmitting },
	} = useFormContext();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='bell' />
				<ContextualbarTitle>{t('Notifications_Preferences')}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<NotificationPreferencesForm notificationOptions={notificationOptions} handlePlaySound={handlePlaySound} />
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{handleClose && <Button onClick={handleClose}>{t('Cancel')}</Button>}
					<Button primary disabled={!isDirty} loading={isSubmitting} onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default NotificationPreferences;
