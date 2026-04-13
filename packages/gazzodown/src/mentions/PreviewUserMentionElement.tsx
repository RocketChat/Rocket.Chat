import type { ReactElement } from 'react';
import { memo } from 'react';

type PreviewUserMentionElementProps = {
	mention: string;
};

const PreviewUserMentionElement = ({ mention }: PreviewUserMentionElementProps): ReactElement => <>@{mention}</>;

export default memo(PreviewUserMentionElement);
