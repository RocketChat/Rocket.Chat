import type * as uikit from '@rocket.chat/ui-kit';
import { Fragment } from 'preact';

import Block from '../Block';
import ContextActionButton from './ContextActionButton';
import { cx } from './helpers';

export const ContextActionsBlock = ({ appId, blockId, elements }: uikit.ContextActionsBlock) => (
	<Block appId={appId} blockId={blockId}>
		<div className={cx('uikit-context-actions')}>
			{elements.map((element, key) => {
				if (element.type === 'feedback_buttons') {
					return (
						<Fragment key={key}>
							<ContextActionButton
								actionId={element.actionId}
								glyph={'\u{1F44D}'}
								label={element.positive_button.accessibility_label ?? element.positive_button.text.text}
								value={element.positive_button.value}
							/>
							<ContextActionButton
								actionId={element.actionId}
								glyph={'\u{1F44E}'}
								label={element.negative_button.accessibility_label ?? element.negative_button.text.text}
								value={element.negative_button.value}
							/>
						</Fragment>
					);
				}

				return (
					<ContextActionButton
						key={key}
						actionId={element.actionId}
						glyph={element.label ?? element.icon.icon}
						label={element.label ?? element.icon.icon}
						value={element.value}
						url={element.url}
					/>
				);
			})}
		</div>
	</Block>
);
