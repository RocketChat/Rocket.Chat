import LabelBase, { type LabelBaseProps } from './LabelBase';

export type LabelProps = Omit<LabelBaseProps, 'field'>;

/**
 * A caption for an input component.
 */
function Label(props: LabelProps) {
	return <LabelBase {...props} />;
}

export default Label;
