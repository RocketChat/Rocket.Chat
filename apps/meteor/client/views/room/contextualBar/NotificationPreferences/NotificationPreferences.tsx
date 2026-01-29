import type { SelectOption } from '@rocket.chat/fuselage';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NotificationPreferencesForm from './NotificationPreferencesForm';

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
		reset,
	} = useFormContext();

	return (
		<ContextualbarDialog>
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
					<Button type='reset' disabled={!isDirty || isSubmitting} onClick={() => reset()}>
						{t('Reset')}
					</Button>
					<Button primary disabled={!isDirty} loading={isSubmitting} onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default NotificationPreferences;
