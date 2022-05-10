#Drupal oAuth Integration module.
This module works in conjunction with the [Rocket.Chat+ Module for Drupal](https://www.drupal.org/project/rocket_chat) 
Version 7.x-1.1 or later.

A full set of instructions for how to connect the 2 are present in the drupal module's documentation.

Basically to connect the 2 you first setup the oAuth server connection in your drupal, with the proper permissions 
("Use OAuth2 Server" => "Anonymous User" = Checked).  

In the Rocket chat you have to do the following:
- fill in the 'Client ID'.  
  Bear in mind that the Client ID should not be guessable,but is seen in the URL when doing the login.
- fill in the 'Client Secret'.
  This should be treated as a Secret Key (like the Secret Key of a TLS certificate). it __must not__ be guesable or 
  derivable, and is best a Alphanumerical sequence between 16 and 48 cahracters long (longer would be better but longer 
  than 48 characters can be problem with long URI's) 
- fill in the  Drupal's BaseURL.
- on the Drupal use the "Restrict redirect URIs" Setting to limit possible exploits. and set the Redirect URI's to 
  whatever is in the Callback URL (like `https://Rocketchat.example.com/_oauth/drupal` and possibly also the 
  `https://Rocketchat.example.com/_oauth/drupal?close` URI.).
- Lastly do not forget to Enable the Drupal OAuth and `SAVE CHANGES`.   
  
When all is a Blue Button with a drupal like logo will apear on the login page of Rocket.Chat+
