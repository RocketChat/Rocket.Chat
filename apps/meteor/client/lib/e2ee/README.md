# End-to-End Encryption

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

