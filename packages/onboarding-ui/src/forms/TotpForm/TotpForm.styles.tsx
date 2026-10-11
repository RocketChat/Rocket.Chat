import styled from '@rocket.chat/styled';

export const TotpActionsWrapper = styled('div')`
	width: 100%;
	box-sizing: border-box;
	display: flex;
	flex-flow: column nowrap;
	align-items: flex-start;
	justify-content: stretch;

	a {
		margin-block-start: 16px;
	}

	@media (min-width: 1440px) {
		flex-flow: row nowrap;
		padding: 0;
		width: 100%;
		align-items: center;
		max-width: 1152px;

		a {
			padding-inline: 8px;
			margin-block-start: 0;
		}
	}
`;
