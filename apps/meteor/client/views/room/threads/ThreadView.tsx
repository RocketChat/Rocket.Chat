import { Modal, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, useCallback, useMemo, forwardRef } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useDir } from '../../../hooks/useDir';

type ThreadViewProps = {
	title: string | null;
	canExpand: boolean;
	expanded: boolean;
	following: boolean;
	onToggleExpand: () => void;
	onToggleFollow: (following: boolean) => void;
	onClose: () => void;
	onClickBack: (e: unknown) => void;
} & Omit<ComponentProps<typeof Box>, 'title'>;

const ThreadView = forwardRef<HTMLElement, ThreadViewProps>(function ThreadView(
	{ title, canExpand, expanded, following, onToggleExpand, onToggleFollow, onClose, onClickBack },
	ref,
) {
	const dir = useDir();

	const style = useMemo(
		() =>
			dir === 'rtl'
				? {
						left: 0,
						borderTopRightRadius: 4,
				  }
				: {
						right: 0,
						borderTopLeftRadius: 4,
				  },
		[dir],
	);

	const t = useTranslation();

	const expandLabel = expanded ? t('Collapse') : t('Expand');
	const expandIcon = expanded ? 'arrow-collapse' : 'arrow-expand';

	const followLabel = following ? t('Following') : t('Not_Following');
	const followIcon = following ? 'bell' : 'bell-off';

	const handleFollowActionClick = useCallback(() => {
		onToggleFollow(following);
	}, [following, onToggleFollow]);

	return (
		<>
			{canExpand && expanded && <Modal.Backdrop onClick={onClose} />}

			<Box flexGrow={1} position={expanded ? 'static' : 'relative'}>
				<VerticalBar
					className='rcx-thread-view'
					position={canExpand && expanded ? 'fixed' : 'absolute'}
					display='flex'
					flexDirection='column'
					width={'full'}
					maxWidth={canExpand && expanded ? 855 : undefined}
					overflow='hidden'
					zIndex={100}
					insetBlock={0}
					style={style} // workaround due to a RTL bug in Fuselage
				>
					<VerticalBar.Header>
						{onClickBack && <VerticalBar.Action onClick={onClickBack} title={t('Back_to_threads')} name='arrow-back' />}
						<VerticalBar.Text dangerouslySetInnerHTML={{ __html: title ?? '' }} />
						{canExpand && <VerticalBar.Action title={expandLabel} name={expandIcon} onClick={(): void => onToggleExpand()} />}
						<VerticalBar.Actions>
							<VerticalBar.Action title={followLabel} name={followIcon} onClick={handleFollowActionClick} />
							<VerticalBar.Close onClick={onClose} />
						</VerticalBar.Actions>
					</VerticalBar.Header>
					<VerticalBar.Content
						ref={ref}
						{...{
							flexShrink: 1,
							flexGrow: 1,
							paddingInline: 0,
						}}
					/>
				</VerticalBar>
			</Box>
		</>
	);
});

export default ThreadView;
