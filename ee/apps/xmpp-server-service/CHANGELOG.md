# @rocket.chat/xmpp-server-service

## 0.2.1-rc.0

### Patch Changes

- <details><summary>Updated dependencies [9a6c98b451d84dd15d9cf7b628641b7bbb5924d1, 68c51e1a876bd00a7588d45014b682d9a154d722, 68c51e1a876bd00a7588d45014b682d9a154d722, 68c51e1a876bd00a7588d45014b682d9a154d722, 68c51e1a876bd00a7588d45014b682d9a154d722, 1cb836204af9f9e59b64db1dba9df53836e927a0, 46cba6391140d334aecbe764a0fc3341feb27ce9, 17b9f5a0a07f83c42e4b198c38a6bf2fc9d5589e, 25a232e58bd49fa2cbad86f13a8e935c0a703170, fe0c8f942f64643988f6f0a089c4402fcdb5a55b, c5122522318b69d930199043b89ce2aadcbf51ae, 42f9f7efa463480e5168ff054a66f9c086bbf809, 42f9f7efa463480e5168ff054a66f9c086bbf809]:</summary>
  - @rocket.chat/models@3.1.0-rc.0
  - @rocket.chat/core-services@1.1.0-rc.0
  - @rocket.chat/xmpp-server@0.2.1-rc.0
  - @rocket.chat/logger@1.0.3-rc.0
  - @rocket.chat/network-broker@0.2.42-rc.0

  </details>

## 0.2.0

### Minor Changes

- ([#42501](https://github.com/RocketChat/Rocket.Chat/pull/42501)) Adds a native XMPP server (Enterprise, federation module) that federates directly with other XMPP servers over server-to-server connections. Rocket.Chat users can message any XMPP address, exchange presence with remote contacts, and join rooms on remote servers; remote XMPP users can join dedicated XMPP rooms hosted by Rocket.Chat. It runs as the `xmpp-server-service` microservice and is configured under **Administration → Settings → Federation → XMPP Server (Native)**.

### Patch Changes

- <details><summary>Updated dependencies [1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 687d88ff58975ac7d21ec059a0d151dcb75d8bd6, 6bb0d3bca9b5da401050697d51bc99e89871bbb7, 857482ad1e0c6330fb57f96db40d2b08676bbf7e, 575d467b826f8057995e4cabad4c8369cfd45409, 575d467b826f8057995e4cabad4c8369cfd45409, 203d5ff96b613a12f85d9e59c57b4d177a4858c0, 6be3614cd2660ab4024635802fdf9cd7dd7b502f, 3dcddc61941c7896bc750220220cc7d5b72b9b46, 588311c49bfce08e7106e7c0bb32741334fa5321, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, cdd948cb67ecf282f6cc8f411615c3de0db0b9f1, 4c152661022d34bfbe9bf78811eac286a31c47a5, eaf5cedcce9f8e800415b4c49bce242f661462ea, 1df95ff2d31f1e077084596f0024c3e2c53ca1df, f3fa7abd6b9d311f76619d0fe27793ac68f6d208, 40243c4ba0ed19120a571d37883aec203af1b747, 39a6e6e1397e1e89bc631fe4ab1cc10fa93b59e8, eb808dd70cfbd41a127d8655c62a21c4658fd2c0, bff76c34b21caddbc316d69b62fac858a73d7164, 857482ad1e0c6330fb57f96db40d2b08676bbf7e, a39b03fe5c248079365162e31994e1dece63e7c2]:</summary>
  - @rocket.chat/core-services@1.0.0
  - @rocket.chat/models@3.0.0
  - @rocket.chat/xmpp-server@0.2.0
  - @rocket.chat/network-broker@0.2.41
  - @rocket.chat/logger@1.0.2

  </details>

## 0.2.0-rc.0

### Minor Changes

- ([#42501](https://github.com/RocketChat/Rocket.Chat/pull/42501)) Adds a native XMPP server (Enterprise, federation module) that federates directly with other XMPP servers over server-to-server connections. Rocket.Chat users can message any XMPP address, exchange presence with remote contacts, and join rooms on remote servers; remote XMPP users can join dedicated XMPP rooms hosted by Rocket.Chat. It runs as the `xmpp-server-service` microservice and is configured under **Administration → Settings → Federation → XMPP Server (Native)**.

### Patch Changes

- <details><summary>Updated dependencies [1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 6bb0d3bca9b5da401050697d51bc99e89871bbb7, 857482ad1e0c6330fb57f96db40d2b08676bbf7e, 575d467b826f8057995e4cabad4c8369cfd45409, 575d467b826f8057995e4cabad4c8369cfd45409, 6be3614cd2660ab4024635802fdf9cd7dd7b502f, 588311c49bfce08e7106e7c0bb32741334fa5321, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, cdd948cb67ecf282f6cc8f411615c3de0db0b9f1, eaf5cedcce9f8e800415b4c49bce242f661462ea, 1df95ff2d31f1e077084596f0024c3e2c53ca1df, f3fa7abd6b9d311f76619d0fe27793ac68f6d208, 40243c4ba0ed19120a571d37883aec203af1b747, 39a6e6e1397e1e89bc631fe4ab1cc10fa93b59e8, eb808dd70cfbd41a127d8655c62a21c4658fd2c0, 857482ad1e0c6330fb57f96db40d2b08676bbf7e, a39b03fe5c248079365162e31994e1dece63e7c2]:</summary>
  - @rocket.chat/core-services@1.0.0-rc.0
  - @rocket.chat/models@3.0.0-rc.0
  - @rocket.chat/xmpp-server@0.2.0-rc.0
  - @rocket.chat/network-broker@0.2.41-rc.0
  - @rocket.chat/logger@1.0.2-rc.0

  </details>
