from django.contrib import admin
from app.models import ServerList, BackupServer

admin.site.register(ServerList)
admin.site.register(BackupServer)
