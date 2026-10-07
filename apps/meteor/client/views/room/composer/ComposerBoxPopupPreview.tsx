import { css } from '@rocket.chat/css-in-js';
import { Box, Item, ItemContent, ItemGroupHeader, ItemGroupTitle, ItemTitle, Skeleton, Tile } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef, useEffect, useId, useImperativeHandle } from 'react';

import type { ComposerBoxPopupProps } from './ComposerBoxPopup';
import { useChat } from '../contexts/ChatContext';

type ComposerBoxPopupPreviewItem = { _id: string; type: 'image' | 'video' | 'audio' | 'text' | 'other'; value: string; sort?: number };

const optionsStyle = css`
	& > * {
		flex-shrink: 0;
	}
`;

export type ComposerBoxPopupPreviewProps = ComposerBoxPopupProps<ComposerBoxPopupPreviewItem> & {
	title?: ReactNode;
	rid: string;
	tmid?: string;
	suspended: boolean;
};

const ComposerBoxPopupPreview = forwardRef(function ComposerBoxPopupPreview(
	{ focused, items, title, rid, tmid, select, suspended }: ComposerBoxPopupPreviewProps,
	ref: ForwardedRef<
		| {
				getFilter?: () => unknown;
				select?: (s: ComposerBoxPopupPreviewItem) => void;
		  }
		| undefined
	>,
) {
	const id = useId();
	const chat = useChat();
	const executeSlashCommandPreviewEndpoint = useEndpoint('POST', '/v1/commands.preview');

	useImperativeHandle(
		ref,
		() => ({
			getFilter: () => {
				const value = chat?.composer?.substring(0, chat?.composer?.selection.start);
				if (!value) {
					throw new Error('No value');
				}
				const matches = value.match(/(\/[\w\d\S]+ )([^]*)$/);

				if (!matches) {
					throw new Error('No matches');
				}

				const cmd = matches[1].replace('/', '').trim().toLowerCase();

				const params = matches[2];
				return { cmd, params, msg: { rid, tmid } };
			},
			...(!suspended && {
				select: (item) => {
					const value = chat?.composer?.substring(0, chat?.composer?.selection.start);
					if (!value) {
						throw new Error('No value');
					}
					const matches = value.match(/(\/[\w\d\S]+ )([^]*)$/);

					if (!matches) {
						throw new Error('No matches');
					}

					const cmd = matches[1].replace('/', '').trim().toLowerCase();

					const params = matches[2];
					void executeSlashCommandPreviewEndpoint({
						command: cmd,
						params,
						roomId: rid,
						...(tmid && { tmid }),
						triggerId: Random.id(),
						previewItem: { id: item._id, type: item.type, value: item.value },
					});
					chat?.composer?.setText('');
				},
			}),
		}),
		[chat?.composer, executeSlashCommandPreviewEndpoint, rid, tmid, suspended],
	);

	const itemsFlat = items
		.flatMap((item) => {
			if (item.isSuccess) {
				return item.data;
			}
			return [];
		})
		.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));

	const isLoading = items.some((item) => item.isLoading && item.fetchStatus !== 'idle');

	useEffect(() => {
		if (focused) {
			const element = document.getElementById(`popup-item-${focused._id}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}
	}, [focused]);

	if (suspended) {
		return null;
	}

	return (
		<Box position='relative'>
			<Tile padding={0} marginBlockEnd={8} overflow='hidden'>
				{title && (
					<Box backgroundColor='tint'>
						<ItemGroupHeader inset='md'>
							<ItemGroupTitle id={id}>{title}</ItemGroupTitle>
						</ItemGroupHeader>
					</Box>
				)}
				<Box
					role='listbox'
					display='flex'
					overflow='auto'
					padding={8}
					gap={4}
					className={optionsStyle}
					aria-orientation='horizontal'
					aria-labelledby={title ? id : undefined}
					aria-busy={isLoading}
				>
					{isLoading &&
						Array(5)
							.fill(5)
							.map((_, index) => <Skeleton variant='rect' height='100px' width='120px' key={index} />)}

					{!isLoading &&
						itemsFlat.map((item) => (
							<Item
								key={item._id}
								id={`popup-item-${item._id}`}
								role='option'
								aria-selected={item === focused}
								tabIndex={-1}
								onClick={() => select(item)}
								selected={item === focused}
								focusVisible={item === focused}
							>
								{item.type === 'image' && <img src={item.value} alt={item._id} />}
								{item.type === 'audio' && (
									<audio controls>
										<track kind='captions' />
										<source src={item.value} />
										Your browser does not support the audio element.
									</audio>
								)}
								{item.type === 'video' && (
									<video controls className='inline-video'>
										<track kind='captions' />
										<source src={item.value} />
										Your browser does not support the video element.
									</video>
								)}
								{item.type === 'text' && (
									<ItemContent>
										<ItemTitle>{item.value}</ItemTitle>
									</ItemContent>
								)}
								{item.type === 'other' && <code>{item.value}</code>}
							</Item>
						))}
				</Box>
			</Tile>
		</Box>
	);
});

export default ComposerBoxPopupPreview;
