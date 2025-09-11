#!/bin/bash

while true
do
    /usr/bin/php /home/michael/ellioth/backend/charging.php
    /usr/bin/php /home/michael/ellioth/backend/charge-logging.php
    sleep 1
done
