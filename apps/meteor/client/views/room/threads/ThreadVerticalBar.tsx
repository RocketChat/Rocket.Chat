import { Box, ModalBackdrop } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, useMemo } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import VerticalBarAction from '../../../components/VerticalBar/VerticalBarAction';
import VerticalBarActions from '../../../components/VerticalBar/VerticalBarActions';
import VerticalBarClose from '../../../components/VerticalBar/VerticalBarClose';
import VerticalBarHeader from '../../../components/VerticalBar/VerticalBarHeader';
import { useDir } from '../../../hooks/useDir';
import { useThreadExpansion } from './useThreadExpansion';

type ThreadVerticalBarProps = {
	title: ReactNode;
	actions?: ReactNode;
	children: ReactNode;
	onBack: () => void;
	onClose: () => void;
};

const ThreadVerticalBar = ({ title, actions = null, onBack, onClose, children }: ThreadVerticalBarProps): ReactElement => {
	const t = useTranslation();

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

	const [canExpand, expanded, toggleExpanded] = useThreadExpansion();

	const expandLabel = expanded ? t('Collapse') : t('Expand');
	const expandIcon = expanded ? 'arrow-collapse' : 'arrow-expand';

	return (
		<>
			{canExpand && expanded && <ModalBackdrop onClick={onClose} />}
			<Box flexGrow={1} position={canExpand && expanded ? 'static' : 'relative'}>
				<VerticalBar
					className='rcx-thread-view'
					position={canExpand && expanded ? 'fixed' : 'absolute'}
					display='flex'
					flexDirection='column'
					width='100%'
					maxWidth={canExpand && expanded ? 855 : undefined}
					overflow='hidden'
					zIndex={100}
					insetBlock={0}
					// insetInlineEnd={0}
					// borderStartStartRadius={4}
					style={style} // workaround due to a RTL bug in Fuselage
				>
					<VerticalBarHeader>
						<VerticalBarActions>
							<VerticalBarAction onClick={onBack} title={t('Back_to_threads')} name='arrow-back' />
						</VerticalBarActions>
						{title}
						<VerticalBarActions>
							{canExpand && <VerticalBarAction title={expandLabel} name={expandIcon} onClick={toggleExpanded} />}
							{actions}
							<VerticalBarClose onClick={onClose} />
						</VerticalBarActions>
					</VerticalBarHeader>
					{children}
				</VerticalBar>
			</Box>
		</>
	);
};

export default ThreadVerticalBar;
