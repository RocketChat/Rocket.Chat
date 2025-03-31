import type { IDiscussionMessage } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, MouseEvent, RefObject } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import DiscussionsListRow from './DiscussionsListRow';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarContent,
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarTitle,
	ContextualbarSection,
} from '../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../components/CustomScrollbars';
import { goToRoomById } from '../../../../lib/utils/goToRoomById';

type DiscussionsListProps = {
	total: number;
	discussions: Array<IDiscussionMessage>;
	loadMoreItems: (start: number, end: number) => void;
	loading: boolean;
	onClose: () => void;
	error: unknown;
	text: string;
	onChangeFilter: (e: ChangeEvent<HTMLInputElement>) => void;
};

function DiscussionsList({
	total = 10,
	discussions = [],
	loadMoreItems,
	loading,
	onClose,
	error,
	text,
	onChangeFilter,
}: DiscussionsListProps) {
	const { t } = useTranslation();
	const showRealNames = useSetting('UI_Use_Real_Name', false);
	const inputRef = useAutoFocus(true);

	const onClick = useCallback((e: MouseEvent<HTMLElement>) => {
		const { drid } = e.currentTarget.dataset;
		if (drid) goToRoomById(drid);
	}, []);

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='discussion' />
				<ContextualbarTitle>{t('Discussions')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search_Messages')}
					value={text}
					onChange={onChangeFilter}
					ref={inputRef as RefObject<HTMLInputElement>}
					addon={<Icon name='magnifier' size='x20' />}
				/>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0} ref={ref}>
				{loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}

				{error instanceof Error && (
					<Callout mi={24} type='danger'>
						{error.toString()}
					</Callout>
				)}

				{!loading && total === 0 && <ContextualbarEmptyContent title={t('No_Discussions_found')} />}

				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{!error && total > 0 && discussions.length > 0 && (
						<VirtualizedScrollbars>
							<Virtuoso
								style={{
									height: blockSize,
									width: inlineSize,
									overflow: 'hidden',
								}}
								totalCount={total}
								endReached={loading ? () => undefined : (start) => loadMoreItems(start, Math.min(50, total - start))}
								overscan={25}
								data={discussions}
								itemContent={(_, data) => <DiscussionsListRow discussion={data} showRealNames={showRealNames} onClick={onClick} />}
							/>
						</VirtualizedScrollbars>
					)}
				</Box>
			</ContextualbarContent>
		</>
	);
}

export default DiscussionsList;
