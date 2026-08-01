import { Box, RadioButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import ActionButton from './ActionButton';
import { CALL_LANGUAGES } from '../utils/callLanguages';

type ChevronButtonProps = {
	small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// Same wrapper trick as DevicePicker: strip the rogue `small: true` that
// GenericMenu passes when disabled and stamp the chevron icon.
const ChevronButton = forwardRef<HTMLButtonElement, ChevronButtonProps>(function ChevronButton({ small: _small, ...props }, ref) {
	return <ActionButton flexShrink={1} flexGrow={0} {...props} label='Language options' icon='chevron-up' tiny ref={ref} />;
});

export type CaptionsLanguageMenuProps = {
	currentCode: string;
	onChange: (languageCode: string) => void;
};

/**
 * Transcription-language menu living in the CC split-button chevron — same
 * pattern as the device pickers, so language never requires a settings trip.
 */
// eslint-disable-next-line react/no-multi-comp
const CaptionsLanguageMenu = ({ currentCode, onChange }: CaptionsLanguageMenuProps) => {
	const { t } = useTranslation();

	const sections = [
		{
			title: t('Call_language'),
			items: CALL_LANGUAGES.map((language) => ({
				id: language.code,
				content: (
					<Box is='span' fontSize={14}>
						{language.label}
					</Box>
				),
				addon: <RadioButton onChange={() => undefined} checked={language.code === currentCode} />,
			})),
		},
	];

	return (
		<GenericMenu
			title={t('Call_language')}
			sections={sections}
			placement='top-end'
			selectionMode='single'
			onAction={(id: unknown) => {
				if (typeof id === 'string') {
					onChange(id);
				}
			}}
			button={<ChevronButton />}
		/>
	);
};

export default CaptionsLanguageMenu;
