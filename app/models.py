# -*- coding: utf-8 -*-

from django.db import models

# Create your models here.

#-- 백업 시스템[테스트용]
class ServerList(models.Model):
	serv_name 		= models.CharField(max_length=30, primary_key=True)
	serv_ip 		= models.CharField(max_length=20)
	agent_status 		= models.BooleanField(default=False)
	backup_status 		= models.BooleanField(default=False)
	backup_start		= models.DateTimeField(null=True, blank=True)
	last_backup_date 	= models.CharField(max_length=20, null=True, blank=True)
	backup_size		= models.CharField(max_length=20, null=True, blank=True)
	exclude_dir 		= models.CharField(max_length=1000, null=True, blank=True)
	
	def __unicode__(self):
		return self.serv_name

class BackupServer(models.Model):
	backup_serv_name = models.CharField(max_length=30)
	backup_serv_ip		= models.CharField(max_length=20)
	number_of_client	= models.IntegerField()
	backup_usage		= models.CharField(max_length=20)
	
	def __unicode__(self):
		return self.backup_serv_name	
