import type { HTMLAttributes } from 'preact/compat';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type TextInputProps =
	| ({
			className?: string;
			small?: boolean;
			error?: boolean;
			multiline?: false;
	  } & HTMLAttributes<HTMLInputElement>)
	| ({
			className?: string;
			small?: boolean;
			error?: boolean;
			multiline: true;
	  } & HTMLAttributes<HTMLTextAreaElement>);

export const TextInput = memo((props: TextInputProps) => {
	if (props.multiline) {
		const { small, error, className, disabled, ...rest } = props;

		return (
			<textarea
				className={createClassName(styles, 'text-input', { disabled, error, small, multiline: true }, [className])}
				disabled={disabled}
				{...rest}
			/>
		);
	}

	const { small, error, className, disabled, ...rest } = props;

	return (
		<input
			type='text'
			className={createClassName(styles, 'text-input', { disabled, error, small }, [className])}
			disabled={disabled}
			{...rest}
		/>
	);
});
