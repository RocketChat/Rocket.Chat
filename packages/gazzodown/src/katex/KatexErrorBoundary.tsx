import colors from '@rocket.chat/fuselage-tokens/colors.json';
import styled from '@rocket.chat/styled';
import { PropsWithChildren, ReactElement, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type KatexErrorBoundaryProps = PropsWithChildren<{ code: string }>;

const Fallback = styled('span')`
	text-decoration: underline;
	text-decoration-color: ${colors.r400};
`;

const KatexErrorBoundary = ({ children, code }: KatexErrorBoundaryProps): ReactElement => {
	const [error, setError] = useState<Error | null>(null);
	return <ErrorBoundary children={children} onError={setError} fallback={<Fallback title={error?.message}>{code}</Fallback>} />;
};

export default KatexErrorBoundary;
