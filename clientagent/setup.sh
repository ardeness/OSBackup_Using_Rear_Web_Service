#!/bin/bash

# version 0.1 (2016.01.26)

# check args & files 

if [ $# -ne 1 ]
then
	echo "Usage : $0 \$SERVER_IP"
	echo "ex) $0 10.20.30.40"
	exit 1
fi

SERVER=$1
file1="/etc/rear/local.conf"
file2="/usr/share/rear/conf/default.conf"
file3="/opt/osbackup_client/ClientAgent.py"
file4="/opt/osbackup_client/daemon.py"

if [ ! -f $file1 ]
then
	echo "$file1 is not found. Install ReaR first."
	exit 1
fi

if [ ! -f $file2 ]
then
	echo "$file2 is not found. Install ReaR first."
	exit 1
fi

if [ ! -f $file3 ]
then
	echo "$file3 is not found. Move ClientAgent.py file to $file3."
	exit 1
fi

if [ ! -f $file4 ]
then
	echo "$file4 is not found. Move daemon.py file to $file4."
	exit 1
fi

# overwrite /etc/rear/local.conf

echo "OUTPUT=ISO" > /etc/rear/local.conf
echo "BACKUP=NETFS" >> /etc/rear/local.conf
echo "NETFS_URL=nfs://${SERVER}/backup" >> /etc/rear/local.conf
echo "NETFS_KEEP_OLD_BACKUP_COPY=" >> /etc/rear/local.conf
echo "BACKUP_OPTIONS=" >> /etc/rear/local.conf
echo "EXCLUDE_MOUNTPOINTS=" >> /etc/rear/local.conf
echo "Success : update /etc/rear/local.conf"

# update /opt/osbackup_client/ClientAgent.py

sed -i "s/^FEEDBACKHOST.*/FEEDBACKHOST = \"$SERVER\"/g" /opt/osbackup_client/ClientAgent.py
echo "Success : update /opt/osbackup_client/ClientAgent.py"

# update /usr/share/rear/conf/default.conf

sed -i 's/^OUTPUT_PREFIX=.*/OUTPUT_PREFIX="$HOSTNAME"_`date +%y%m%d`/g' /usr/share/rear/conf/default.conf
sed -i 's/^NETFS_PREFIX=.*/NETFS_PREFIX="$HOSTNAME"_`date +%y%m%d`/g' /usr/share/rear/conf/default.conf
echo "Success : update /usr/share/rear/conf/default.conf"