# LDAP-Enterprise

This package enables the administrator option to map the roles used on your LDAP server with the Rocket.Chat server roles.
With the correspondent license for this product, a new "Roles" section will be enabled in the admin panel in the LDAP group, 
where the administrator can map LDAP roles to Rocket.Chat roles`(Admin panel -> LDAP -> Roles)`, following the pattern described below:

```
{
  "ldapRole": "["admin", "guest"], //must be an array of valid Rocket.Chat Users Roles
  "anotherLdapRole": "["anonymous"]
}

```
**Note:** If some mapping error occurs, be aware of the server log, that the error will be shown.
<br/>
<br/>
In addition to the options described above, still in the same section, there are other options such as:
* `LDAP_Enable_LDAP_Roles_To_RC_Roles`: Enable or disable this feature;
* `LDAP_Validate_Roles_For_Each_Login`: If the validation should occurs for each login (**Be careful with this setting because it will overwrite 
the user roles in each login, otherwise this will be validated only at the moment of user creation**);
* `LDAP_Default_Role_To_User`: The default Rocket.Chat role to be defined, if any LDAP role that the user has, is not mapped;
* `LDAP_Query_To_Get_User_Groups`: The LDAP query to get the LDAP groups that the user is part of;
