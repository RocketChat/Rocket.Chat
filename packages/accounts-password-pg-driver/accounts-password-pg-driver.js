AccountsDBClientPG.prototype.getUserByUsername = function getUserByUsername(username) {
  const userId = this._getUserIdByService("password", "username", username);
  return this.getUserById(userId);
}

AccountsDBClientPG.prototype.getUserByEmail = function getUserByEmail(email) {
  const userRow = PG.await(PG.knex
    .first("users.*")
    .from("users")
    .leftJoin("users_emails", "users.id", "users_emails.user_id")
    .where({ "users_emails.address": email })
  );

  if (userRow && userRow.id) {
    return this.getUserById(userRow.id);
  } else {
    return null;
  }
}
