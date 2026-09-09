import { Admin, AdminSectionsHref } from './admin';

export class AdminMailer extends Admin {
	protected readonly route = AdminSectionsHref.mailer;

	protected readonly title = 'Mailer';
}
