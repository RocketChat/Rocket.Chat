# Publish commands

```
cd Rocket.Chat
vagrant-spk vm up && vagrant-spk dev
^C
vagrant-spk pack ../rocketchat.spk && vagrant-spk publish ../rocketchat.spk && vagrant-spk vm halt
```

# Reset commands

```
vagrant-spk vm halt && vagrant-spk vm destroy
```
