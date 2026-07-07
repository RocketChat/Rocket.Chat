import { Box, Skeleton, Tile, Option } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef, useEffect, useId, useImperativeHandle } from 'react';

import type { ComposerBoxPopupProps } from './ComposerBoxPopup';
import { useChat } from '../contexts/ChatContext';

type ComposerBoxPopupPreviewItem = { _id: string; type: 'image' | 'video' | 'audio' | 'text' | 'other'; value: string; sort?: number };

const SAFE_MEDIA_SCHEMES = new Set(['http:', 'https:', 'data:', 'blob:']);

const safeMediaSrc = (value: string): string | undefined => {
	try {
		const { protocol } = new URL(value, window.location.origin);
		return SAFE_MEDIA_SCHEMES.has(protocol) ? value : undefined;
	} catch {
		return undefined;
	}
};

type ComposerBoxPopupPreviewProps = ComposerBoxPopupProps<ComposerBoxPopupPreviewItem> & {
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
			<Tile padding={0} role='menu' mbe={8} overflow='hidden' aria-labelledby={id}>
				{title && (
					<Box bg='tint' pi={16} pb={8} id={id}>
						{title}
					</Box>
				)}
				<Box display='flex' padding={8}>
					<Box role='listbox' display='flex' overflow='auto' fontSize={0} width={0} flexGrow={1} aria-busy={isLoading}>
						{isLoading &&
							Array(5)
								.fill(5)
								.map((_, index) => <Skeleton variant='rect' h='100px' w='120px' m={2} key={index} />)}

						{!isLoading &&
							itemsFlat.map((item) => {
								const mediaSrc =
									item.type === 'image' || item.type === 'audio' || item.type === 'video' ? safeMediaSrc(item.value) : undefined;
								return (
									<Box
										onClick={() => select(item)}
										role='option'
										className={['popup-item', item === focused && 'selected'].filter(Boolean).join(' ')}
										id={`popup-item-${item._id}`}
										key={item._id}
										bg={item === focused ? 'selected' : undefined}
										borderColor={item === focused ? 'highlight' : 'transparent'}
										tabIndex={item === focused ? 0 : -1}
										aria-selected={item === focused}
										m={2}
										borderWidth='default'
										borderRadius='x4'
									>
										{item.type === 'image' && mediaSrc && <img src={mediaSrc} alt={item._id} />}
										{item.type === 'audio' && mediaSrc && (
											<audio controls>
												<track kind='captions' />
												<source src={mediaSrc} />
												Your browser does not support the audio element.
											</audio>
										)}
										{item.type === 'video' && mediaSrc && (
											<video controls className='inline-video'>
												<track kind='captions' />
												<source src={mediaSrc} />
												Your browser does not support the video element.
											</video>
										)}
										{item.type === 'text' && <Option>{item.value}</Option>}
										{item.type === 'other' && <code>{item.value}</code>}
									</Box>
								);
							})}
					</Box>
				</Box>
			</Tile>
		</Box>
	);
});

export default ComposerBoxPopupPreview;
