import type { ReactElement } from 'react';

type PreviewCodeElementProps = {
	code: string;
};

const PreviewCodeElement = ({ code }: PreviewCodeElementProps): ReactElement => <>{code}</>;

export default PreviewCodeElement;
