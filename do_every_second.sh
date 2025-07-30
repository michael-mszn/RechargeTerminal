#!/bin/bash

LOGFILE="/home/michael/debug.log"

while true
do
    echo "$(date) Running charging.php..." >> "$LOGFILE"
    /usr/bin/php /home/michael/charging.php >> "$LOGFILE" 2>&1
    RETVAL=$?
    echo "$(date) charging.php Exit code: $RETVAL" >> "$LOGFILE"

    echo "$(date) Running charge-logging.php..." >> "$LOGFILE"
    /usr/bin/php /home/michael/charge-logging.php >> "$LOGFILE" 2>&1
    RETVAL=$?
    echo "$(date) charge-logging.php Exit code: $RETVAL" >> "$LOGFILE"

    sleep 1
done
