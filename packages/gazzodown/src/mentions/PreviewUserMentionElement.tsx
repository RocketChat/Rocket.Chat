import { memo, ReactElement } from 'react';

type PreviewUserMentionElementProps = {
	mention: string;
};

const PreviewUserMentionElement = ({ mention }: PreviewUserMentionElementProps): ReactElement => <>@{mention}</>;

export default memo(PreviewUserMentionElement);
