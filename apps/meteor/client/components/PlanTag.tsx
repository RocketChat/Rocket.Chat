import { Box, Tag } from '@rocket.chat/fuselage';
import { isTruthy } from '@rocket.chat/tools';
import { useLicense } from '@rocket.chat/ui-client';

const developmentTag = process.env.NODE_ENV === 'development' ? 'Development' : null;
function PlanTag() {
	const license = useLicense();

	const tags = [
		developmentTag && { name: developmentTag },
		...(license.data?.tags ?? []),
		!license.isLoading && !license.isError && !license.data?.license && { name: 'Community' },
	].filter(isTruthy);

	return (
		<>
			{tags.map(({ name }) => (
				<Box marginInline={4} display='inline-block' verticalAlign='middle' key={name}>
					<Tag variant='primary'>{name}</Tag>
				</Box>
			))}
		</>
	);
}

export default PlanTag;
