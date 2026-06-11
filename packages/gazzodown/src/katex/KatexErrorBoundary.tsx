import colors from '@rocket.chat/fuselage-tokens/colors.json';
import styled from '@rocket.chat/styled';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type KatexErrorBoundaryProps = PropsWithChildren<{ code: string }>;

const Fallback = styled('span')`
	text-decoration: underline;
	text-decoration-color: ${colors.r400};
`;

const KatexErrorBoundary = ({ children, code }: KatexErrorBoundaryProps) => {
	const [error, setError] = useState<Error | null>(null);
	return (
		<ErrorBoundary onError={setError} fallback={<Fallback title={error?.message}>{code}</Fallback>}>
			{children}
		</ErrorBoundary>
	);
};

export default KatexErrorBoundary;
