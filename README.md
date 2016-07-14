# Install Manual

## 0) Download zip or cloning repository. "REPO" below this line means downloaded directory.

## 1) Set environment variable "WEBROOT" to the directory of "/REPO/app/templates".

```
# export WEBROOT="/opt//app/templates"
```

## 2) Install Django package
```
# sudo yum -y install python-django
```

## 3) Run Django syncdb.
```
# cd /root/osbackup
# python manage.py syncdb
Creating tables ...
Creating table django_admin_log
Creating table auth_permission
Creating table auth_group_permissions
Creating table auth_group
Creating table auth_user_groups
Creating table auth_user_user_permissions
Creating table auth_user
Creating table django_content_type
Creating table django_session
Creating table app_serverlist
Creating table app_backupserver

You just installed Django's auth system, which means you don't have any superusers defined.
Would you like to create one now? (yes/no): yes
Username (leave blank to use 'root'): root
Email address: 
Password: 
Password (again): 
Superuser created successfully.
Installing custom SQL ...
Installing indexes ...
Installed 0 object(s) from 0 fixture(s)
```

## 4) Start service.
```
# nohup python manage.py runserver 0.0.0.0:portnumber &
```

## 5) Export NFS /backup directory.
```
# cat /etc/exportfs
/backup	*(rw,async,no_root_squash)
# systemctl start nfs
```

## 6) Set attribute of /backup directory to '+a' to prevent rear bug.
```
# chattr +a /backup
# lsattr /
......
......
-----a---------- ./backup
```
