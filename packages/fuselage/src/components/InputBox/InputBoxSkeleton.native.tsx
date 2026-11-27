import type { InputBoxSkeletonProps } from './InputBoxSkeleton';
import { inputBoxChrome } from './inputBoxStyleProps';
import { Box } from '../Box';

/** The native twin of `InputBoxSkeleton`: the frame of an input, without the placeholder bar. */
const InputBoxSkeleton = (props: InputBoxSkeletonProps) => <Box rcx-skeleton__input {...inputBoxChrome({})} paddingBlock={11} {...props} />;

export default InputBoxSkeleton;
