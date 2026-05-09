import { Meteor } from 'meteor/meteor';
import { Roles } from '@rocket.chat/models';
import type { IRole } from '@rocket.chat/core-typings';

Meteor.startup(async () => {
    const roleName = 'important-message-marker';

    // Проверяем, есть ли уже роль
    const existingRole: IRole | null = await Roles.findOne({ name: roleName });

    if (!existingRole) {
        // Создаём новую роль с нужными полями для комнат (scope: 'Subscriptions')
        await Roles.insertOne({
            name: roleName,
            description: 'Role to allow marking messages as important in rooms',
            scope: 'Subscriptions',  // Ключевой момент для комнатной роли
            protected: false,        // необязательная, можно удалить
            mandatory2fa: false,     // необязательная, можно удалить
        });
        console.log(`Role ${roleName} created`);
    } else {
        // Если роль уже есть, можно обновить описание
        await Roles.updateOne(
            { _id: existingRole._id },
            { $set: { description: 'Role to allow marking messages as important in rooms', scope: 'Subscriptions' } }
        );
        console.log(`Role ${roleName} already exists and updated`);
    }
});