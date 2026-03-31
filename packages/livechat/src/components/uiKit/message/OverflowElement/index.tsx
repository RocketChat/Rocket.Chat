import type * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { memo, useCallback } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import KebabIcon from '../../../../icons/kebab.svg';
import { Button } from '../../../Button';
import Menu, { PopoverMenu } from '../../../Menu';
import { usePerformAction } from '../Block';
import styles from './styles.scss';

type OverflowTriggerProps = {
	loading: boolean;
	onClick: () => void;
};

const OverflowTrigger = ({ loading, onClick }: OverflowTriggerProps) => {
	const handleMouseUp = useCallback(({ currentTarget }: TargetedEvent<HTMLElement>) => {
		currentTarget.blur();
	}, []);

	return (
		<Button
			className={createClassName(styles, 'uikit-overflow__trigger')}
			disabled={loading}
			outline
			secondary
			onClick={onClick}
			onMouseUp={handleMouseUp}
		>
			<KebabIcon width={20} height={20} />
		</Button>
	);
};

type OverflowOptionProps = uikit.Option & {
	confirm: boolean;
	parser: uikit.SurfaceRenderer<ComponentChild>;
	onClick: (value: string) => void;
};

const OverflowOption = ({ confirm, text, value, url, parser, onClick }: OverflowOptionProps) => {
	const handleClick = useCallback(
		async (event: TargetedEvent<HTMLElement, MouseEvent>) => {
			event.preventDefault();

			if (confirm) {
				// TODO
			}

			if (url) {
				const newTab = window.open();
				if (!newTab) {
					throw new Error('Could not open new tab');
				}
				newTab.opener = null;
				newTab.location = url;
				return;
			}

			await onClick(value);
		},
		[confirm, onClick, url, value],
	);

	return <Menu.Item onClick={handleClick}>{parser.text(text)}</Menu.Item>;
};

type OverflowElementProps = uikit.OverflowElement & {
	parser: uikit.SurfaceRenderer<ComponentChild>;
};

const OverflowElement = ({ actionId, confirm, options, parser }: OverflowElementProps) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleClick = useCallback(
		async (value: TargetedEvent<HTMLElement, MouseEvent>) => {
			await performAction({ value });
		},
		[performAction],
	);

	return (
		<PopoverMenu trigger={({ pop }) => <OverflowTrigger loading={performingAction} onClick={pop} />}>
			<Menu.Group>
				{Array.isArray(options) &&
					options.map((option, i) => <OverflowOption key={i} {...option} confirm={confirm} parser={parser} onClick={handleClick} />)}
			</Menu.Group>
		</PopoverMenu>
	);
};

export default memo(OverflowElement);
