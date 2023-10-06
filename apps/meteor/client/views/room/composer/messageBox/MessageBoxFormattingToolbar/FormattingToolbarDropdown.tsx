import { Dropdown, IconButton, Option, OptionTitle, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';

import type { FormattingButton } from '../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';
import { useDropdownVisibility } from '../../../../../sidebar/header/hooks/useDropdownVisibility';

type FormattingToolbarDropdownProps = {
	composer: ComposerAPI;
	items: FormattingButton[];
};

const FormattingToolbarDropdown = ({ composer, items, ...props }: FormattingToolbarDropdownProps) => {
	const t = useTranslation();
	const reference = useRef(null);
	const target = useRef(null);

	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	return (
		<>
			<IconButton {...props} small ref={reference} icon='meatballs' onClick={() => toggle()} />
			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='bottom-start'>
					<OptionTitle>{t('Message_Formatting_Toolbox')}</OptionTitle>
					{items.map((formatter, index) => {
						const handleFormattingAction = () => {
							if ('link' in formatter) {
								window.open(formatter.link, '_blank', 'rel=noreferrer noopener');
								return;
							}
							composer.wrapSelection(formatter.pattern);
						};

						return (
							<Option
								key={index}
								onClick={() => {
									handleFormattingAction();
									toggle();
								}}
							>
								<OptionIcon name={'icon' in formatter ? formatter.icon : 'link'} />
								<OptionContent>{t(formatter.label)}</OptionContent>
							</Option>
						);
					})}
				</Dropdown>
			)}
		</>
	);
};

export default FormattingToolbarDropdown;
