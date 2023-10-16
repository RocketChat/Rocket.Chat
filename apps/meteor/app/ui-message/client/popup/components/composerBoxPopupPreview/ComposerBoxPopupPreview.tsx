import { Box, Skeleton, Tile } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useMethod } from '@rocket.chat/ui-contexts';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';

import { useChat } from '../../../../../../client/views/room/contexts/ChatContext';
import type { ComposerBoxPopupProps } from '../../ComposerBoxPopup';

type ComposerBoxPopupPreviewItem = { _id: string; type: 'image' | 'video' | 'audio' | 'text' | 'other'; value: string; sort?: number };

const ComposerBoxPopupPreview = forwardRef<
	| {
			getFilter?: () => unknown;
			select?: (s: ComposerBoxPopupPreviewItem) => void;
	  }
	| undefined,
	ComposerBoxPopupProps<ComposerBoxPopupPreviewItem> & {
		rid: string;
		tmid?: string;
		suspended?: boolean;
	}
>(function ComposerBoxPopupPreview({ focused, items, rid, tmid, select, suspended }, ref) {
	const id = useUniqueId();
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
		<Box className='message-popup-position' position='relative'>
			<Tile className='message-popup' display='flex' padding={8} role='menu' mbe={8} aria-labelledby={id}>
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
										<source src={item.value} />
										Your browser does not support the audio element.
									</audio>
								)}
								{item.type === 'video' && (
									<video controls className='inline-video'>
										<source src={item.value} />
										Your browser does not support the video element.
									</video>
								)}
								{item.type === 'text' && <h4>{item.value}</h4>}
								{item.type === 'other' && <code>{item.value}</code>}
							</Box>
						))}
				</Box>
			</Tile>
		</Box>
	);
});

export default ComposerBoxPopupPreview;
