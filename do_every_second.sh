#!/bin/bash

LOGFILE="/home/michael/debug.log"

while true
do
    echo "$(date) Running script..." >> "$LOGFILE"
    /usr/bin/php /home/michael/charging.php >> "$LOGFILE" 2>&1
    RETVAL=$?
    echo "$(date) Exit code: $RETVAL" >> "$LOGFILE"
    sleep 1
done