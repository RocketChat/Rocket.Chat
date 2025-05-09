import { Option, OptionColumn, OptionContent, OptionIcon, OptionInput } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

type ListItemCommonProps = {
	text: ReactNode;
	input?: ReactNode;
	loading?: boolean;
	children?: ReactNode;
} & ComponentProps<typeof Option>;

type ListItemConditionalProps =
	| {
			icon?: ComponentProps<typeof OptionIcon>['name'];
			gap?: never;
	  }
	| {
			icon?: never;
			gap?: boolean;
	  };

type ListItemProps = ListItemCommonProps & ListItemConditionalProps;

const ListItem = ({ icon, text, input, children, gap, ...props }: ListItemProps): ReactElement => (
	<Option {...props}>
		{icon && <OptionIcon name={icon} />}
		{gap && <OptionColumn />}
		<OptionContent>{text}</OptionContent>
		{input && <OptionInput>{input}</OptionInput>}
		{children && <OptionColumn>{children}</OptionColumn>}
	</Option>
);

export default ListItem;
