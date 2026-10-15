import { CheckBox } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { ContactsColumns } from './hooks/useContactsColumns';
import { CONTACT_COLUMNS } from './hooks/useContactsColumns';

export type ContactsColumnsMenuProps = {
	columns: ContactsColumns;
};

const ContactsColumnsMenu = ({ columns }: ContactsColumnsMenuProps) => {
	const { t } = useTranslation();

	return (
		<GenericMenu
			title={t('Show_columns')}
			icon='kebab'
			selectionMode='multiple'
			selectedKeys={CONTACT_COLUMNS.filter(({ key }) => columns.isVisible(key)).map(({ key }) => key)}
			sections={[
				{
					title: t('Show_columns'),
					items: CONTACT_COLUMNS.map(({ key, label }) => ({
						id: key,
						content: t(label),
						textValue: t(label),
						disabled: columns.isDisabled(key),
						addon: (
							<CheckBox
								checked={columns.isVisible(key)}
								disabled={columns.isDisabled(key)}
								onClick={(e) => {
									e.stopPropagation();
								}}
								tabIndex={-1}
								aria-hidden='true'
							/>
						),
						onClick: () => columns.toggle(key),
					})),
				},
			]}
		/>
	);
};

export default ContactsColumnsMenu;
