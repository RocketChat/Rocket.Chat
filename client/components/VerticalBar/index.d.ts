import { ActionButton, Box, Button, ButtonGroup, Icon, Scrollable } from '@rocket.chat/fuselage';
import {
	ComponentProps,
	FC,
	ForwardRefExoticComponent,
	PropsWithoutRef,
	RefAttributes,
} from 'react';

type VerticalBarType = FC<ComponentProps<typeof Box>> & {
	InnerContent: FC<ComponentProps<typeof Box>>;
	Icon: FC<ComponentProps<typeof Icon>>;
	Footer: ForwardRefExoticComponent<
		PropsWithoutRef<ComponentProps<typeof Box>> & RefAttributes<Element>
	>;
	Text: FC<ComponentProps<typeof Box>>;
	Action: FC<Omit<ComponentProps<typeof ActionButton>, 'icon'>>;
	Actions: FC<ComponentProps<typeof ButtonGroup>>;
	Header: FC<ComponentProps<typeof Box>>;
	Close: FC<Omit<ComponentProps<typeof ActionButton>, 'icon'>>;
	Content: ForwardRefExoticComponent<
		PropsWithoutRef<ComponentProps<typeof Box>> & RefAttributes<Element>
	>;

	ScrollableContent: ForwardRefExoticComponent<
		PropsWithoutRef<
			ComponentProps<typeof Scrollable>['onScrollContent'] &
				Omit<ComponentProps<typeof Box>, 'name'>
		> &
			RefAttributes<HTMLElement>
	>;
	Skeleton: FC<ComponentProps<typeof Box>>;
	Button: FC<ComponentProps<typeof Button>>;
	Back: FC<ComponentProps<typeof ActionButton>>;
};

declare const VerticalBar: VerticalBarType;

export = VerticalBar;
