import { Button, ButtonGroup, CodeSnippet, Stack, Text } from '@rocket.chat/fuselage';
import { useClipboard, useToggle } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

type LicenseDiagnosticsTextProps = {
	summaryText: string;
	defaultExpanded: boolean;
};

const LicenseDiagnosticsText = ({ summaryText, defaultExpanded }: LicenseDiagnosticsTextProps) => {
	const { t } = useTranslation();
	const { copy, hasCopied } = useClipboard(summaryText);
	const [expanded, toggleExpanded] = useToggle(defaultExpanded);

	return (
		<Stack gap={12}>
			<Stack direction='row' justify='space-between' align='center' gap={12} wrap>
				<Stack gap={4}>
					<Text is='h5' fontScale='h5'>
						{t('License_diagnostics_text')}
					</Text>
					<Text fontScale='c1' color='hint'>
						{t('License_diagnostics_text_hint')}
					</Text>
				</Stack>
				<ButtonGroup>
					<Button icon='copy' onClick={() => copy()}>
						{hasCopied ? t('Copied') : t('Copy')}
					</Button>
					<Button icon={expanded ? 'chevron-up' : 'chevron-down'} aria-expanded={expanded} onClick={() => toggleExpanded()}>
						{expanded ? t('Hide') : t('License_diagnostics_show_text')}
					</Button>
				</ButtonGroup>
			</Stack>
			{expanded && <CodeSnippet>{summaryText}</CodeSnippet>}
		</Stack>
	);
};

export default LicenseDiagnosticsText;
