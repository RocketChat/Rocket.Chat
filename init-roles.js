const roles = [
  { _id: "admin", name: "admin", scope: "Users", description: "Admin", mandatory2fa: false, protected: true },
  { _id: "moderator", name: "moderator", scope: "Subscriptions", description: "Moderator", mandatory2fa: false, protected: true },
  { _id: "leader", name: "leader", scope: "Subscriptions", description: "Leader", mandatory2fa: false, protected: true },
  { _id: "owner", name: "owner", scope: "Subscriptions", description: "Owner", mandatory2fa: false, protected: true },
  { _id: "user", name: "user", scope: "Users", description: "", mandatory2fa: false, protected: true },
  { _id: "federated-external", name: "federated-external", scope: "Users", description: "", mandatory2fa: false, protected: true },
  { _id: "bot", name: "bot", scope: "Users", description: "", mandatory2fa: false, protected: true },
  { _id: "app", name: "app", scope: "Users", description: "", mandatory2fa: false, protected: true },
  { _id: "guest", name: "guest", scope: "Users", description: "", mandatory2fa: false, protected: true },
  { _id: "anonymous", name: "anonymous", scope: "Users", description: "", mandatory2fa: false, protected: true },
  { _id: "livechat-agent", name: "livechat-agent", scope: "Users", description: "Livechat Agent", mandatory2fa: false, protected: true },
  { _id: "livechat-manager", name: "livechat-manager", scope: "Users", description: "Livechat Manager", mandatory2fa: false, protected: true }
];

for (const r of roles) {
  db.rocketchat_roles.updateOne({ _id: r._id }, { $setOnInsert: r }, { upsert: true });
}

print("Roles populated count: " + db.rocketchat_roles.countDocuments());
