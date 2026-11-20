import { cx } from '../../helpers/composeClassNames';
import { Box } from '../Box';
import { Icon } from '../Icon';
import { TextInput, type TextInputProps } from '../TextInput';

export type SidepanelSearchProps = Omit<TextInputProps, 'startAddon' | 'endAddon'> & {
	variant?: 'default' | 'rooms-list';
};

const sectionProps = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'x8' } as const;

const variantProps = {
	'default': { padding: 'x16' },
	'rooms-list': { flexShrink: 0, paddingBlock: 'x8', paddingInline: 'x12' },
} as const;

const SidepanelSearch = ({ variant = 'default', className, ...props }: SidepanelSearchProps) => (
	<Box className={cx('rcx-sidepanel-section', className)} {...sectionProps} {...variantProps[variant]}>
		<TextInput endAddon={<Icon name='magnifier' size='x18' />} {...props} />
	</Box>
);

export default SidepanelSearch;
