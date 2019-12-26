import { Text } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { BurgerMenuButton } from './BurgerMenuButton';

export function Header({
	children,
	hideHelp,
	rawSectionName,
	sectionName,
}) {
	const t = useTranslation();
	return <header className='rc-header'>
		<div className='rc-header__wrap'>
			<div className='rc-header__block rc-header--burger'>
				<BurgerMenuButton />
			</div>

			<span className='rc-header__block'>
				<Text is='h1' headline defaultColor>
					{rawSectionName || t(sectionName)}
				</Text>
			</span>

			{children}

			{!hideHelp && <div className='rc-header__section-help' />}
		</div>
	</header>;
}

Header.ActionBlock = (props) => <div className='rc-header__block rc-header__block-action' {...props} />;

Header.ButtonSection = (props) => <div className='rc-header__section-button' {...props} />;
