import { OptionTitle, Button, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

function MarkReadList(): ReactElement {
	const t = useTranslation();

	const handleClick = (): void => {
		console.log('Undo Mark Read');
	};

	return (
		<>
			<OptionTitle>{t('Action')}</OptionTitle>
			<Button
				{...({
					style: {
						borderRadius: '0',
						width: '100%',
					},
				} as any)}
				onClick={(): void => {
					handleClick();
				}}
			>
				<Icon name={'flag'} size='x20' margin='4x' />
				<span style={{ marginLeft: '8px' }}>{'Mark All Read'}</span>
			</Button>
		</>
	);
}

export default MarkReadList;
