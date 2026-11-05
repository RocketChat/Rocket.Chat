import type { ComponentProps, ComponentType } from 'react';

import { Box, Icon } from '../src';
import { dark } from '../src/components/PaletteStyleTag/lib/themePalettes';

type PropsVariationSectionProps<TComponent extends ComponentType<any>> = {
	component: TComponent;
	common: ComponentProps<TComponent>;
	xAxis?: Record<string, Partial<ComponentProps<TComponent>>>;
	yAxis?: Record<string, Partial<ComponentProps<TComponent>>>;
};

export function PropsVariationSection<TComponent extends ComponentType<any>>({
	component: Component,
	common,
	xAxis = {},
	yAxis = {},
}: PropsVariationSectionProps<TComponent>) {
	return (
		<Box is='table' marginBlock={16} marginInline='auto' style={{ borderCollapse: 'collapse' }}>
			<Box is='thead'>
				<Box is='tr'>
					<Box is='td' aria-hidden />
					{Object.keys(xAxis).map((xVariation, key) => (
						<Box key={key} is='th' color='hint' fontScale='c1'>
							{xVariation}
						</Box>
					))}
				</Box>
			</Box>
			<Box is='tbody'>
				{Object.entries(yAxis).map(([yVariation, yProps], y) => (
					<Box key={y} is='tr'>
						<Box is='th' color='hint' fontScale='c1'>
							{yVariation}
						</Box>
						{Object.values(xAxis).map((xProps, x) => (
							<Box key={x} is='td' margin='none' paddingBlock={8} paddingInline={16}>
								<Box display='flex' alignItems='center' justifyContent='center'>
									<Component {...common} {...(xProps as typeof common)} {...(yProps as typeof common)} />
								</Box>
							</Box>
						))}
					</Box>
				))}
			</Box>
		</Box>
	);
}

export const exampleAvatar = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAA
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
v/L21v8BT/ZVoe1UItsAAAAASUVORK5CYII=`;

export const blankAvatar = `data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BA
AAAAAALAAAAAABAAEAAAICRAEAOw==`;

export const DECORATOR_ID = 'decoratorId';
export const DECORATOR_LABEL = 'Decorator Label';

export const menuOptions = () => ({
	makeAdmin: {
		label: (
			<Box display='flex' alignItems='center' gap='x4'>
				<Icon name='key' size='x16' />
				Make Admin
			</Box>
		),
		action: () => console.log('[...] is now admin'),
	},
	delete: {
		label: (
			<Box display='flex' alignItems='center' gap='x4' color='danger'>
				<Icon name='trash' size='x16' />
				Delete
			</Box>
		),
		action: () => console.log('[...] no longer exists'),
	},
});

export const surface = {
	sidebar: dark['surface-sidebar'],
	main: dark['surface-light'],
};
