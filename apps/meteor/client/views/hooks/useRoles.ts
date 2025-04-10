import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type Props = {
	roles: string[];
};

export const useRoles = (options?: Props) => {
	const getRoles = useEndpoint('GET', '/v1/roles.list');

	return useQuery({
		queryKey: ['/v1/roles'],

		queryFn: async () => {
			const result = await getRoles();

			if (!options) {
				return result.roles;
			}

			return options.roles.length > 0
				? result.roles.filter((role) => {
						return options.roles.includes(role._id);
					})
				: result.roles;
		},
	});
};
