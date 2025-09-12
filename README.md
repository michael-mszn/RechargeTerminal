# How to setup the app for a unix environment

-Clone the repo

-Get permissions on the linux start file: 

> chmod +x [YOUR PATH]/start_linux.sh
> 
> chmod +x [YOUR PATH]/do_every_second.sh
> 
-Adapt the paths inside the aforementioned linux scripts to your environment

-Install dependencies (vite, typescript, php, preact):
-  node:
> sudo apt update
> 
> sudo apt install -y nodejs npm php

- dependencies:
> cd [YOUR PATH]/ellioth

> npm install
- Create a config.php file in /backend based on the example config file template and set your preferences there. Also, set your DeepSeek API username and password.

- Set up a ellioth.conf file with sudo nano /etc/apache2/sites-available/ellioth.conf

```
<VirtualHost *:80>
     ServerName ellioth.othdb.de
 
     DocumentRoot [YOUR PATH]/dist
     <Directory [YOUR PATH]/dist>
         Options Indexes FollowSymLinks
         AllowOverride All
         Require all granted
     
         # Redirect all non-file requests to index.html
         <IfModule mod_rewrite.c>
             RewriteEngine On
             RewriteBase /
     
             # Don’t rewrite requests for real files or directories
             RewriteCond %{REQUEST_FILENAME} !-f
             RewriteCond %{REQUEST_FILENAME} !-d
     
             # Send everything else to index.html
             RewriteRule . /index.html [L]
         </IfModule>
     </Directory>
 
     Alias /api [YOUR PATH]/backend
     <Directory [YOUR PATH]/backend>
         Options Indexes FollowSymLinks
         AllowOverride All
         Require all granted
     </Directory>
 
     ErrorLog ${APACHE_LOG_DIR}/ellioth_error.log
     CustomLog ${APACHE_LOG_DIR}/ellioth_access.log combined
> </VirtualHost>
```

- Run these commands:
  
> sudo a2enmod proxy
> 
> sudo a2enmod proxy_http
> 
> sudo a2enmod rewrite
> 
> sudo a2ensite ellioth.conf

- Set tokens.db permissions:
> sudo chown -R [YOUR SYSTEM USERNAME]:www-data [YOUR PATH]/backend
> 
> sudo chmod 775 [YOUR PATH]/backend

-Go into the backend directory and install composer:
> php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
> 
> php composer-setup.php
> 
> php -r "unlink('composer-setup.php');"
> 
> sudo mv composer.phar /usr/local/bin/composer
> 

-Go into the backend directory of the project and generate VAPID keys for the push notifications
> php gen-vapid-keys.php

-You will get a Private and Public key output. Enter both in your config.php. Additionally, go to src > hooks > usePush.ts and enter your Public key there as well.

-Install these extensions:
> sudo apt install php-mbstring php-gmp php-bcmath

Locate your servers php.ini and uncomment these extensions:
> extension=mbstring
> 
> extension=gmp
> 
> extension=bcmath

- Restart apache with sudo systemctl restart apache2

- Start the server with ./start_linux.sh in the projects directory
  
- if ./start_linux.sh throws "cannot execute: required file not found", do:
> dos2unix start_linux.sh

-The setup has finished here. Go to https://ellioth.othdb.de/. You should be able to access the following routes: /, /test, /login, /charging, /profile
