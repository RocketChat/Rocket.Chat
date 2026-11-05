import type { ComponentType } from 'react';

import { Box } from '../src/components/Box';

function PropsVariation({
	component: Component,
	common = {},
	xAxis = {},
	yAxis = {},
}: {
	component: ComponentType;
	common?: Record<string, unknown>;
	xAxis?: Record<string, Record<string, unknown>>;
	yAxis?: Record<string, Record<string, unknown>>;
}) {
	return (
		<Box is='table' marginBlock={16} marginInline='auto' style={{ borderCollapse: 'collapse' }}>
			<Box is='thead'>
				<Box is='tr'>
					<Box is='th' />
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
									<Component {...common} {...xProps} {...yProps} />
								</Box>
							</Box>
						))}
					</Box>
				))}
			</Box>
		</Box>
	);
}

export default PropsVariation;
