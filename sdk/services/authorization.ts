import { IAuthorization } from '../types/IAuthorization';
import { ServiceClass } from '../types/ServiceClass';

// Register as class
export class Authorization extends ServiceClass implements IAuthorization {
	protected name = 'authorization';

	hasPermission(permission: string, user: string): boolean {
		console.log('hasPermission called');
		return permission === 'createUser' && user != null;
	}

	hasPermission2(permission: string, user: string, bla: number): number {
		console.log('hasPermission2 called');
		return permission === 'createUser' && user != null && bla === 1 ? 1 : 0;
	}
}
