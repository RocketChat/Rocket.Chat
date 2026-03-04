import type * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { useCallback } from 'preact/compat';

import { MenuItem } from '../../../Menu';

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

	return <MenuItem onClick={handleClick}>{parser.renderTextObject(text, 0)}</MenuItem>;
};

export default OverflowOption;
