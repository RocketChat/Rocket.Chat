# Notes

## 1. Summary

### 1.1 User Identity & Master Key
A BIP39 Mnemonic (from high-entropy randomness) is passed through PBKDF2 (with a salt and high iteration count) to create a strong, memorable master key.

### 1.2 Long-Term Identity Keys
A long-term RSA key pair is generated randomly. The private key is then encrypted with the master key for secure server backup and recovery. The public key is shared with others.

### 1.3 Message Encryption
For any given chat, a symmetric AES-GCM key is generated. This key is used to encrypt the actual messages because it's extremely fast and efficient.

### 1.4 Key Distribution & Group Management
When a member needs the AES key (either to start a chat or join a group), an existing member encrypts it using the recipient's Public RSA key.

### 1.5 Forward Secrecy (NOT implemented)
Whenever a group's membership changes (a user is added or removed), a completely new AES-GCM key is generated and securely distributed to all current members. This protects the integrity of the conversation going forward.

## 2. History
- [[NEW] Support for end to end encryption](https://github.com/RocketChat/Rocket.Chat/pull/10094)
- [Fix: Change wording on e2e to make a little more clear](https://github.com/RocketChat/Rocket.Chat/pull/12124)
- [Fix: e2e password visible on always-on alert message](https://github.com/RocketChat/Rocket.Chat/pull/12139)
- [New: Option to change E2E key](https://github.com/RocketChat/Rocket.Chat/pull/12169)
- [Improve: Moved the e2e password request to an alert instead of a popup](https://github.com/RocketChat/Rocket.Chat/pull/12172)
- [Improve: Decrypt last message](https://github.com/RocketChat/Rocket.Chat/pull/12173)
- [Improve: Rename E2E methods](https://github.com/RocketChat/Rocket.Chat/pull/12175)
- [Improve: Do not start E2E Encryption when accessing admin as embedded](https://github.com/RocketChat/Rocket.Chat/pull/12192)
- [[FIX] E2E data not cleared on logout](https://github.com/RocketChat/Rocket.Chat/pull/12254)
- [[NEW] Option to reset e2e key](https://github.com/RocketChat/Rocket.Chat/pull/12483)
- [Remove directly dependency between lib and e2e](https://github.com/RocketChat/Rocket.Chat/pull/13115)
- [[FIX] E2E messages not decrypting in message threads](https://github.com/RocketChat/Rocket.Chat/pull/14580)
- [[FIX] Not possible to read encrypted messages after disable E2E on channel level](https://github.com/RocketChat/Rocket.Chat/pull/18101)
- [[NEW] Encrypted Discussions and new Encryption Permissions](https://github.com/RocketChat/Rocket.Chat/pull/20201)
- [[FIX] E2E issues](https://github.com/RocketChat/Rocket.Chat/pull/20704)
- [[FIX] Ensure E2E is enabled/disabled on sending message](https://github.com/RocketChat/Rocket.Chat/pull/21084)
- [Regression: Fix non encrypted rooms failing sending messages](https://github.com/RocketChat/Rocket.Chat/pull/21287)
- [Chore: Replace `promises` helper](https://github.com/RocketChat/Rocket.Chat/pull/23488)
- [[NEW] E2E password generator](github.com/RocketChat/Rocket.Chat/pull/24114)
- [[IMPROVE] Quotes on E2EE Messages](https://github.com/RocketChat/Rocket.Chat/pull/26303)
- [[IMPROVE] Require acceptance when setting new E2E Encryption key for another user](https://github.com/RocketChat/Rocket.Chat/pull/27556)
- [refactor: Replace `Notifications` in favor of `sdk.stream`;](https://github.com/RocketChat/Rocket.Chat/issues/31409)
- [chore: don't `ignoreUndefined`](https://github.com/RocketChat/Rocket.Chat/pull/31497)
- [feat: Un-encrypted messages not allowed in E2EE rooms](https://github.com/RocketChat/Rocket.Chat/pull/32040)
- [feat(E2EE): Async E2EE keys exchange](https://github.com/RocketChat/Rocket.Chat/pull/32197)
- [feat(E2EEncryption): File encryption support](https://github.com/RocketChat/Rocket.Chat/pull/32316)
- [regression(E2EEncryption): Service Worker not installing on first load](https://github.com/RocketChat/Rocket.Chat/pull/32674)
- [fix: Disabled E2EE room instances creation](https://github.com/RocketChat/Rocket.Chat/pull/32857)
- [feat!: Allow E2EE rooms to reset its room key](https://github.com/RocketChat/Rocket.Chat/pull/33328)
- [refactor!: Room's Key ID generation](https://github.com/RocketChat/Rocket.Chat/pull/33329)
- [feat: E2EE room key reset modal](https://github.com/RocketChat/Rocket.Chat/pull/33503)
- [chore: Upgrade `@tanstack/query` to v5](https://github.com/RocketChat/Rocket.Chat/pull/33898)
- [fix: Allow any user in e2ee room to create and propagate room keys](https://github.com/RocketChat/Rocket.Chat/pull/34038)
- [chore: bump meteor and node version](https://github.com/RocketChat/Rocket.Chat/pull/)
- [chore: Update types of `e2e.room` file](https://github.com/RocketChat/Rocket.Chat/pull/34944)
- [fix: Quote chaining in E2EE room not limiting quote depth](https://github.com/RocketChat/Rocket.Chat/pull/36143)
- [fix: stale data after login expired](https://github.com/RocketChat/Rocket.Chat/pull/36338)
- [chore: Rooms store](https://github.com/RocketChat/Rocket.Chat/pull/36439)
- [chore(deps-dev): bump typescript to 5.9.2](https://github.com/RocketChat/Rocket.Chat/pull/36645)
- [chore: Move E2E Encryption startup](https://github.com/RocketChat/Rocket.Chat/pull/36722)
- [feat: Allow reset E2E key from `EnterE2EPassword` modal](https://github.com/RocketChat/Rocket.Chat/pull/36778)
- [feat: Improve E2E encryption UI texts](https://github.com/RocketChat/Rocket.Chat/pull/36923)
