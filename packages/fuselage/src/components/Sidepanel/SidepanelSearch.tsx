import { cx } from '../../helpers/composeClassNames.js';
import { Box } from '../Box/index.js';
import { Icon } from '../Icon/index.js';
import { TextInput, type TextInputProps } from '../TextInput/index.js';

export type SidepanelSearchProps = Omit<TextInputProps, 'startAddon' | 'endAddon'> & {
	variant?: 'default' | 'rooms-list';
};

const variantProps = {
	'default': {},
	'rooms-list': { flexShrink: 0, paddingBlock: 'x8', paddingInline: 'x12' },
} as const;

const SidepanelSearch = ({ variant = 'default', className, ...props }: SidepanelSearchProps) => (
	<Box className={cx('rcx-sidepanel-section', className)} {...variantProps[variant]}>
		<TextInput endAddon={<Icon name='magnifier' size='x18' />} {...props} />
	</Box>
);

export default SidepanelSearch;
