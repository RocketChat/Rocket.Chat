import { Button, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, ReactElement } from 'react';

function ResetSettingButton(props: ComponentProps<typeof Button>): ReactElement {
	const t = useTranslation();

	return (
		<Button aria-label={t('Reset')} danger ghost small title={t('Reset')} style={{ padding: 0 }} {...props}>
			<Icon name='undo' />
		</Button>
	);
}

export default ResetSettingButton;
