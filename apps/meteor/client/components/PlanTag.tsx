import { Box, Tag } from '@rocket.chat/fuselage';
import { useLicense } from '@rocket.chat/ui-client';

type PlanTag = {
	name: string;
	color?: string;
};

const developmentTag: PlanTag | null = process.env.NODE_ENV === 'development' ? { name: 'Development' } : null;

function PlanTag() {
	const license = useLicense();

	const tags: PlanTag[] = [
		...(developmentTag ? [developmentTag] : []),
		...(license.data?.tags ? license.data.tags.map(({ name, color }) => ({ name, color })) : []),
		...(!license.isLoading && !license.isError && !license.data?.license ? [{ name: 'Community' }] : []),
	];

	return (
		<>
			{tags.map(({ name }) => (
				<Box key={name} marginInline={4} display='inline-block' verticalAlign='middle'>
					<Tag variant='primary'>{name}</Tag>
				</Box>
			))}
		</>
	);
}

export default PlanTag;
