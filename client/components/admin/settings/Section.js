import { useToggle } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { Button } from '../../basic/Button';
import { Icon } from '../../basic/Icon';
import { useTranslation } from '../../providers/TranslationProvider';
import { useBulkActions } from './EditingState';
import { Field } from './Field';

export function Section({ children, hasReset = true, help, section, solo }) {
	const [collapsed, toggleCollapsed] = useToggle(!!section.name);
	const t = useTranslation();
	const { reset } = useBulkActions();

	const handleTitleClick = () => {
		toggleCollapsed();
	};

	const handleResetSectionClick = () => {
		reset(section);
	};

	if (solo || !section.name) {
		return <div className='section'>
			{section.name && <div className='section-title'>
				<div className='section-title-text'>{t(section.name)}</div>
			</div>}

			<div className='section-content border-component-color'>
				{help && <div className='section-helper'>{help}</div>}

				{section.fields.map((field) => <Field key={field._id} field={field} />)}

				{hasReset && <div className='input-line double-col'>
					<label className='setting-label'>{t('Reset_section_settings')}</label>
					<div className='setting-field'>
						<Button cancel data-section={section.name} className='reset-group' onClick={handleResetSectionClick}>
							{t('Reset')}
						</Button>
					</div>
				</div>}

				{children}
			</div>
		</div>;
	}

	return <div className={['section', collapsed && 'section-collapsed'].filter(Boolean).join(' ')}>
		{section.name && <div className='section-title' onClick={handleTitleClick}>
			<div className='section-title-text'>{t(section.name)}</div>
			<div className='section-title-right'>
				<Button nude title={collapsed ? t('Expand') : t('Collapse')}>
					<Icon icon={collapsed ? 'icon-angle-down' : 'icon-angle-up'} />
				</Button>
			</div>
		</div>}

		<div className='section-content border-component-color'>
			{help && <div className='section-helper'>{help}</div>}

			{section.fields.map((field) => <Field key={field._id} field={field} />)}

			{hasReset && <div className='input-line double-col'>
				<label className='setting-label'>{t('Reset_section_settings')}</label>
				<div className='setting-field'>
					<Button cancel data-section={section.name} className='reset-group' onClick={handleResetSectionClick}>
						{t('Reset')}
					</Button>
				</div>
			</div>}

			{children}
		</div>
	</div>;
}
