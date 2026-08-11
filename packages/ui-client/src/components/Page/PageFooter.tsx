import type { BoxProps } from '@rocket.chat/fuselage';
import { AnimatedVisibility, Box } from '@rocket.chat/fuselage';

export type PageFooterProps = { isDirty: boolean } & BoxProps;

const PageFooter = ({ children, isDirty, ...props }: PageFooterProps) => {
	return (
		<AnimatedVisibility visibility={isDirty ? AnimatedVisibility.VISIBLE : AnimatedVisibility.HIDDEN}>
			<Box elevation='1' borderWidth={0} borderColor='transparent' minHeight='x64' paddingBlock={8} {...props}>
				<Box
					height='100%'
					marginInline={24}
					display='flex'
					flexDirection='row'
					flexWrap='wrap'
					alignItems='center'
					justifyContent='end'
					color='default'
					{...props}
				>
					{children}
				</Box>
			</Box>
		</AnimatedVisibility>
	);
};

export default PageFooter;
