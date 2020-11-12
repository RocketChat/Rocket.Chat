import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from './VerticalBar';


const KeyboardShortcuts = () => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='keyboard'/>
				<VerticalBar.Text>{t('Keyboard_Shortcuts_Title')}</VerticalBar.Text>
				<VerticalBar.Close />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent className='contextual-bar__content'>
				<Box is='section' className='section'>
					<h2>{t('Keyboard_Shortcuts_Open_Channel_Slash_User_Search')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_1') }} />
				</Box>
				<Box is='section' section>
					<h2>{t('Keyboard_Shortcuts_Mark_all_as_read')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_8') }} />
				</Box>
				<Box is='section' section>
					<h2>{t('Keyboard_Shortcuts_Edit_Previous_Message')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_2') }} />
				</Box>
				<Box is='section' section>
					<h2>{t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_3') }} />
				</Box>
				<Box is='section' section>
					<h2>{t('Keyboard_Shortcuts_Move_To_Beginning_Of_Message')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_4') }} />
				</Box>
				<Box is='section' section>
					<h2>{t('Keyboard_Shortcuts_Move_To_End_Of_Message')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_5') }} />
				</Box>
				<Box is='section' section>
					<h2>{t('Keyboard_Shortcuts_Move_To_End_Of_Message')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_6') }} />
				</Box>
				<Box is='section' section>
					<h2>{t('Keyboard_Shortcuts_New_Line_In_Message')}</h2>
					<hr />
					<Box dangerouslySetInnerHTML={{ __html: t('Keyboard_Shortcuts_Keys_7') }} />
				</Box>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default React.memo(KeyboardShortcuts);
