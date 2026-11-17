import { cx } from '../../helpers/composeClassNames';
import { Icon } from '../Icon';
import { TextInput, type TextInputProps } from '../TextInput';

export type SidepanelSearchProps = Omit<TextInputProps, 'startAddon' | 'endAddon'> & {
	variant?: 'default' | 'rooms-list';
};

const SidepanelSearch = ({ variant = 'default', className, ...props }: SidepanelSearchProps) => (
	<div className={cx('rcx-sidepanel-search', variant === 'rooms-list' && 'rcx-sidepanel-search--rooms-list', className)}>
		<TextInput endAddon={<Icon name='magnifier' size='x18' />} {...props} />
	</div>
);

export default SidepanelSearch;
