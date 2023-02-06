import { Box, Option, OptionContent, Tile } from '@rocket.chat/fuselage';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

type MessageBoxPopupProps<T> = {
	title?: string;
	focused?: T;
	items: UseQueryResult<T[]>;
	renderItem?: ({ item }: { item: T }) => ReactElement;
};

export const MessageBoxPopup = <T,>({
	title,
	items,
	focused,
	renderItem = ({ item }: { item: T }) => <>{JSON.stringify(item)}</>,
}: MessageBoxPopupProps<T>): ReactElement | null => {
	return (
		<div className='message-popup-position'>
			<Tile className='message-popup' padding={0}>
				{title && (
					<Box bg='tint' className='message-popup-title' pi='x16' pb='x8'>
						{title}
					</Box>
				)}
				{items.isSuccess && (
					<div className='message-popup-items'>
						{items.data?.map((item, index) => (
							<Option selected={item === focused} key={index}>
								<OptionContent>{renderItem({ item })}</OptionContent>
							</Option>
						))}
					</div>
				)}
				{items.isLoading && <div className='message-popup-loading'>Loading...</div>}
			</Tile>
		</div>
	);
};
