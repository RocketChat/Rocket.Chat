import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type DeclinedCallsToggleProps = {
	count: number;
	expanded: boolean;
	onToggle: () => void;
};

/**
 * The way back to a call that was turned down, at the foot of the Ongoing calls group.
 *
 * Declining quiets a call rather than losing it: the row drops out of the list and waits under this, so a call
 * turned down by accident — or turned down and then wanted after all — is one click away rather than a trip to the
 * call history. It only exists while there is something behind it.
 */
const DeclinedCallsToggle = ({ count, expanded, onToggle }: DeclinedCallsToggleProps) => {
	const { t } = useTranslation();

	return (
		<Box paddingInline={16} paddingBlock={4}>
			<Button small secondary width='100%' onClick={onToggle}>
				{expanded ? t('Show_fewer') : t('Show__count__declined_calls', { count })}
			</Button>
		</Box>
	);
};

export default DeclinedCallsToggle;
