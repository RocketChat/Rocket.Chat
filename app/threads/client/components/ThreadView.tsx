import React, { useCallback, useMemo, forwardRef } from 'react';
import { Modal, Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

type ThreadViewProps = {
	title: string;
	expanded: boolean;
	following: boolean;
	onToggleExpand: (expanded: boolean) => void;
	onToggleFollow: (following: boolean) => void;
	onClose: () => void;
};

const ThreadView = forwardRef<Element, ThreadViewProps>(({
	title,
	expanded,
	following,
	onToggleExpand,
	onToggleFollow,
	onClose,
}, ref) => {
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

	const expandLabel = expanded ? t('collapse') : t('expand');
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
		{expanded && <Modal.Backdrop onClick={onClose}/>}

		<Box width='380px' flexGrow={1} position={expanded ? 'static' : 'relative'}>
			<VerticalBar
				className='rcx-thread-view'
				position='absolute'
				display='flex'
				flexDirection='column'
				width={expanded ? 'full' : 380}
				maxWidth={855}
				overflow='hidden'
				zIndex={100}
				insetBlock={0}
				// insetInlineEnd={0}
				// borderStartStartRadius={4}
				style={style} // workaround due to a RTL bug in Fuselage
			>
				<VerticalBar.Header>
					<VerticalBar.Icon name='thread' />
					<VerticalBar.Text dangerouslySetInnerHTML={{ __html: title }} />
					<VerticalBar.Action aria-label={expandLabel} name={expandIcon} onClick={handleExpandActionClick} />
					<VerticalBar.Action aria-label={followLabel} name={followIcon} onClick={handleFollowActionClick} />
					<VerticalBar.Close onClick={onClose} />
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
