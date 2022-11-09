import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, UIEvent } from 'react';

import { isTruthy } from '../../../../../lib/isTruthy';

type NewMessagesButtonProps = {
	visible: boolean;
	onClick: (event: UIEvent) => void;
};

const NewMessagesButton = ({ visible, onClick }: NewMessagesButtonProps): ReactElement => {
	const t = useTranslation();

	return (
		<button
			type='button'
			className={[`new-message`, `background-primary-action-color`, `color-content-background-color`, !visible && 'not']
				.filter(isTruthy)
				.join(' ')}
			onClick={onClick}
		>
			<i className='icon-down-big' />
			{t('New_messages')}
		</button>
	);
};

export default NewMessagesButton;
