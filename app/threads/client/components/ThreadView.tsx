import React, { useCallback, useMemo, forwardRef } from 'react';
import { Modal, Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useLayoutContextualBarExpanded } from '../../../../client/providers/LayoutProvider';
import VerticalBar from '../../../../client/components/VerticalBar';

type ThreadViewProps = {
	title: string;
	expanded: boolean;
	following: boolean;
	onToggleExpand: (expanded: boolean) => void;
	onToggleFollow: (following: boolean) => void;
	onClose: () => void;
	onClickBack: () => void;
};

const ThreadView = forwardRef<Element, ThreadViewProps>(({
	title,
	expanded,
	following,
	onToggleExpand,
	onToggleFollow,
	onClose,
	onClickBack,
}, ref) => {
	const hasExpand = useLayoutContextualBarExpanded();

	const style = useMemo(() => (document.dir === 'rtl'
		? {
			left: 0,
			borderTopRightRadius: 4,
		}
		: {
			right: 0,
			borderTopLeftRadius: 4,
		}), []);

	const t = useTranslation();

	const expandLabel = expanded ? t('Collapse') : t('Expand');
	const expandIcon = expanded ? 'arrow-collapse' : 'arrow-expand';

	const handleExpandActionClick = useCallback(() => {
		onToggleExpand(expanded);
	}, [expanded, onToggleExpand]);

	const followLabel = following ? t('Following') : t('Not_Following');
	const followIcon = following ? 'bell' : 'bell-off';

	const handleFollowActionClick = useCallback(() => {
		onToggleFollow(following);
	}, [following, onToggleFollow]);

	return <>
		{hasExpand && expanded && <Modal.Backdrop onClick={onClose}/>}

		<Box flexGrow={1} position={expanded ? 'static' : 'relative'}>
			<VerticalBar
				className='rcx-thread-view'
				position={hasExpand && expanded ? 'fixed' : 'absolute'}
				display='flex'
				flexDirection='column'
				width={'full'}
				maxWidth={hasExpand && expanded ? 855 : undefined}
				overflow='hidden'
				zIndex={100}
				insetBlock={0}
				style={style} // workaround due to a RTL bug in Fuselage
			>
				<VerticalBar.Header>
					{onClickBack && <VerticalBar.Action onClick={onClickBack} title={t('Back_to_threads')} name='arrow-back' /> }
					<VerticalBar.Text dangerouslySetInnerHTML={{ __html: title }} />
					{hasExpand && <VerticalBar.Action title={expandLabel} name={expandIcon} onClick={handleExpandActionClick} />}
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
	</>;
});

export default ThreadView;
