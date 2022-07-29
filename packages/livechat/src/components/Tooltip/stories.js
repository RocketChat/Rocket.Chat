import { withKnobs, boolean, select, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import Tooltip, { withTooltip } from '.';
import { centered } from '../../helpers.stories';
import { Button } from '../Button';

const tooltipText = 'A simple tool tip';
const tooltipHidden = false;
const placements = [null, 'left', 'top', 'right', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

storiesOf('Components/Tooltip', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('inline', () => (
		<Tooltip
			hidden={boolean('hidden', tooltipHidden)}
			placement={select('placement', placements)}
		>
			{text('text', tooltipText)}
		</Tooltip>
	))
	.add('placements', () => (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			{placements.map((placement) => (
				<Tooltip hidden={boolean('hidden', tooltipHidden)} placement={placement}>{text('text', tooltipText)}</Tooltip>
			))}
		</div>
	))
	.add('connected to another component', () => (
		<Tooltip.Container>
			<Tooltip.Trigger content={text('text', tooltipText)}>
				<Button>A simple button</Button>
			</Tooltip.Trigger>
		</Tooltip.Container>
	))
	.add('withTooltip()', () => {
		const MyButton = withTooltip(Button);

		return (
			<Tooltip.Container>
				<MyButton tooltip={text('tooltip', tooltipText)}>A simple button</MyButton>
			</Tooltip.Container>
		);
	});
