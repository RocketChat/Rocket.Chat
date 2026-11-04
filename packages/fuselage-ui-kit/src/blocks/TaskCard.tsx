import { Box, Icon } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { useTranslation } from 'react-i18next';

import RichTextBlock from './RichTextBlock';
import type { BlockProps } from '../utils/BlockProps';

export type TaskCardProps = Omit<BlockProps<UiKit.RichTextBlock>, 'block'> & {
	task: UiKit.TaskCard;
};

const statusIcons = {
	pending: { icon: 'clock', color: 'hint' },
	in_progress: { icon: 'loading', color: 'status-font-on-info' },
	complete: { icon: 'circle-check', color: 'status-font-on-success' },
	error: { icon: 'circle-exclamation', color: 'status-font-on-danger' },
} as const satisfies Record<UiKit.TaskStatus, { icon: string; color: string }>;

export const TaskCard = ({ className, task, context, index, surfaceRenderer }: TaskCardProps) => {
	const { t } = useTranslation();
	const statusLabels = {
		pending: t('Pending'),
		in_progress: t('In_progress'),
		complete: t('Completed'),
		error: t('Error'),
	} as const satisfies Record<UiKit.TaskStatus, string>;

	const status = statusIcons[task.status] ?? statusIcons.pending;
	const sources = task.sources?.filter((source) => UiKit.isSafeUrl(source.url)) ?? [];

	return (
		<Box className={className} display='flex' flexDirection='column' gap={4} padding={12}>
			<Box display='flex' alignItems='center' gap={8}>
				<Icon name={status.icon} color={status.color} size='x20' />
				{!task.hide_title && (
					<Box flexGrow={1} fontScale='p2b' color='default'>
						{task.title}
					</Box>
				)}
				<Box fontScale='c1' color={status.color}>
					{statusLabels[task.status] ?? statusLabels.pending}
				</Box>
			</Box>
			{task.details && <RichTextBlock block={task.details} context={context} index={index} surfaceRenderer={surfaceRenderer} />}
			{task.output && <RichTextBlock block={task.output} context={context} index={index} surfaceRenderer={surfaceRenderer} />}
			{sources.length > 0 && (
				<Box display='flex' alignItems='center' flexWrap='wrap' gap={8} fontScale='c1' color='hint'>
					{t('Sources')}
					{sources.map((source, sourceIndex) => (
						<Box key={sourceIndex} is='a' href={source.url} target='_blank' rel='noopener noreferrer'>
							{source.text}
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};
