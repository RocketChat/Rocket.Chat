import { Box, Skeleton, Tile, Option } from '@rocket.chat/fuselage';
import { useMethod } from '@rocket.chat/ui-contexts';
import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef, useEffect, useId, useImperativeHandle } from 'react';

import type { ComposerBoxPopupProps } from './ComposerBoxPopup';
import { useChat } from '../contexts/ChatContext';

type ComposerBoxPopupPreviewItem = { _id: string; type: 'image' | 'video' | 'audio' | 'text' | 'other'; value: string; sort?: number };

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
	const executeSlashCommandPreviewMethod = useMethod('executeSlashCommandPreview');

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
					// TODO: Fix this solve the typing issue
					void executeSlashCommandPreviewMethod({ cmd, params, msg: { rid, tmid } }, { id: item._id, type: item.type, value: item.value });
					chat?.composer?.setText('');
				},
			}),
		}),
		[chat?.composer, executeSlashCommandPreviewMethod, rid, tmid, suspended],
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
							itemsFlat.map((item) => (
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
									{item.type === 'text' && <Option>{item.value}</Option>}
									{item.type === 'other' && <code>{item.value}</code>}
								</Box>
							))}
					</Box>
				</Box>
			</Tile>
		</Box>
	);
});

export default ComposerBoxPopupPreview;
