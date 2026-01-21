import { useEndpoint, useRouteParameter, useLoginWithPassword } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useRegisterMethod = () => {
	const register = useEndpoint('POST', '/v1/users.register');
	const secret = useRouteParameter('hash');

	const login = useLoginWithPassword();

	const setPharmacy = useEndpoint('POST', '/v1/medsense/patient.pharmacy.set');

	return useMutation({
		mutationFn: async ({ pharmacyId, ...props }: Parameters<typeof register>[0] & { pharmacyId?: string }): Promise<ReturnType<typeof register>> => {
			const result = await register({ ...props, secret });
			await login(props.username, props.pass);
			if (pharmacyId) {
				try {
					await setPharmacy({ pharmacyId });
				} catch (error) {
					console.error('Failed to set pharmacy preference', error);
				}
			}
			return result;
		},
	});
};
