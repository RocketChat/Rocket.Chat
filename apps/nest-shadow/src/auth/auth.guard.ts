import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { MeteorError } from '@rocket.chat/core-services';
import { InjectModel, type Models } from '../database/models.js';
import { RestV1Unauthorized } from '../common/rest-v1.failure.js';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './authenticated-user.js';
import { hashLoginToken } from './login-token.js';

// Accepts the same personal credentials as the real API: the X-User-Id and
// X-Auth-Token headers of a resume login token.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@InjectModel('Users') private readonly users: Models['Users']) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.header('x-user-id');
    const authToken = request.header('x-auth-token');

    const user =
      userId && authToken
        ? await this.users.findOneByIdAndLoginToken(
            userId,
            hashLoginToken(authToken),
            { projection: { services: 0 } },
          )
        : null;

    if (!user) {
      throw new RestV1Unauthorized();
    }

    if (!user.username) {
      throw new MeteorError('error-unauthorized', 'Users must have a username');
    }

    request.user = user as AuthenticatedUser;
    return true;
  }
}
