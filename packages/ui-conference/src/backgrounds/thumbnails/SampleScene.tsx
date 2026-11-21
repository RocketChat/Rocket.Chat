import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';

const fillStyles = css`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
`;

/** A drawn room with a person in front, to show an effect on; `blur` softens the room only. */
const SampleScene = ({ blur }: { blur?: number }) => (
	<>
		<Box
			is='svg'
			viewBox='0 0 160 90'
			preserveAspectRatio='xMidYMid slice'
			className={fillStyles}
			style={blur ? { filter: `blur(${blur}px)`, transform: 'scale(1.1)' } : undefined}
			aria-hidden
		>
			<rect width='160' height='90' fill='#D9CBB5' />
			<rect x='14' y='12' width='44' height='34' fill='#A9D3EE' stroke='#F5F1E8' strokeWidth='3' />
			<rect x='104' y='14' width='44' height='4' fill='#7A5A3A' />
			<rect x='106' y='6' width='6' height='8' fill='#C0504D' />
			<rect x='114' y='4' width='5' height='10' fill='#4F81BD' />
			<rect x='121' y='7' width='7' height='7' fill='#9BBB59' />
			<rect x='104' y='34' width='44' height='4' fill='#7A5A3A' />
			<rect x='108' y='25' width='10' height='9' fill='#F79646' />
			<rect x='130' y='24' width='6' height='10' fill='#8064A2' />
			<circle cx='22' cy='66' r='10' fill='#5E8C4A' />
			<rect x='18' y='70' width='8' height='14' fill='#8A6A4A' />
			<rect y='80' width='160' height='10' fill='#A88B6A' />
		</Box>
		<Box is='svg' viewBox='0 0 160 90' preserveAspectRatio='xMidYMid slice' className={fillStyles} aria-hidden>
			<circle cx='80' cy='42' r='14' fill='#3B4252' />
			<path d='M52 90 C52 66 66 60 80 60 C94 60 108 66 108 90 Z' fill='#3B4252' />
		</Box>
	</>
);

export default SampleScene;
