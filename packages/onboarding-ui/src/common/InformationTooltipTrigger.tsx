import { Icon } from '@rocket.chat/fuselage';
import { TooltipWrapper } from '@rocket.chat/layout';

type InformationTooltipTriggerProps = {
	text: string;
};

const InformationTooltipTrigger = ({ text }: InformationTooltipTriggerProps) => (
	<TooltipWrapper text={text}>
		<Icon name='info' />
	</TooltipWrapper>
);

export default InformationTooltipTrigger;
