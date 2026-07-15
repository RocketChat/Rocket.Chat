import type { Decorator } from '@storybook/react';

const DefaultBodySize: Decorator = function DarkModeDecorator(Story) {
	return (
		<>
			<style>
				{`
					body {
						min-width: 1024px;
						min-height: 1280px;
					}
				`}
			</style>
			<Story />
		</>
	);
};

export default DefaultBodySize;
