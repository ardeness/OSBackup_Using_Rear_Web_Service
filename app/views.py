# -*- coding: utf-8 -*-

import socket
import json
import time
import os

# for backup

# Create your views here.
from django.core.context_processors import csrf, request
from django.http import HttpResponse, Http404, HttpResponseRedirect, HttpResponseNotFound
from django.contrib.auth.models import User
from django.template import Context, loader
from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render_to_response
from app.models import *
from django.db import transaction
from django.utils import timezone

from django.contrib.auth.decorators import login_required

@csrf_exempt
def osbackup(request):
	servinfolist = []
	today = time.strftime("%y%m%d")

	if request.method == 'POST' :
		data = request.body
		json_data = json.loads(str(data))
		PORT = 10012	# ClientAgent listen Port / ServerAgent listen Port 10011

		for ip, cmd in json_data.items():
			query = ServerList.objects.get(serv_ip=ip)
			webSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

			send_msg = ''
			status = 0

			if cmd == 'run' and query.backup_status != 1:
				try :
					servname = query.serv_name
					backuppath = "/backup/"+servname+"_"+today
					if os.path.isdir(backuppath) :
						os.popen('chattr -a /backup')
						os.popen('rm -rf %s' % backuppath)
						os.popen('chattr +a /backup')
					webSocket.connect((ip, PORT))
					webSocket.sendall('backup')
				except Exception :
					query.agent_status = 0
					query.save()
				else :
					webSocket.close()
					query.agent_status = 1
					query.backup_status = 1
					query.backup_start = timezone.now()
					query.save()
		
	result = ServerList.objects.all()
	for row in result:
		servinfo = {}
		servinfo['servname'] = row.serv_name
		servinfo['servip'] = row.serv_ip
		servinfo['lastbackupinfo'] = row.last_backup_date
		servinfo['agentstatus'] = "OK" if row.agent_status else "ERR"
		servname = row.serv_name
		backuppath = "/backup/"+servname+"_"+today

		if row.backup_status :
			size = "-" if not os.path.isdir(backuppath) else \
				os.popen('du -sh %s' % backuppath).read().split()[0]
			servinfo['backupstatus'] = "Running ["+str(size)+"]"
		else :
			if os.path.isdir(backuppath) :
				servinfo['backupstatus'] = "Complete"
			else :
				servinfo['backupstatus'] = "None"

		servinfo['size'] = row.backup_size
		servinfo['excludedir'] = row.exclude_dir

		servinfolist.append(servinfo)

	response = HttpResponse(json.dumps(servinfolist))
	return response

def listbackup(request):
	backuplist = []

	if not 'hostname' in request.GET :
		return HttpResponseNotFound('hostname must be specified')

	hostname = request.GET['hostname']

	dirlist = os.listdir("/backup")

	for entry in dirlist :
		if os.path.isdir("/backup/"+entry) and hostname in entry :
			backuplist.append(entry)
	
	return HttpResponse(json.dumps(backuplist))

def usageinfo(request):
	unit = ['K','M','G','T']
	line = os.popen('df %s' % '/backup').read().split('\n')[1]
	use = float(line.split()[2])
	total = float(line.split()[1])
	useunit = ''
	totalunit = ''
	ratio = float((use/total)*100.0)
	use = int(use)
	total = int(total)
	ratio = int(ratio)

	unitindex=0
	while use > 1024 :
		use = int(use / 1024)
		unitindex = unitindex+1
	useunit=unit[unitindex]

	unitindex=0
	while total > 1024 :
		total = int(total / 1024)
		unitindex = unitindex+1
	totalunit=unit[unitindex]

	usageinfo = {}
	usageinfo['use'] = use
	usageinfo['useunit'] = useunit
	usageinfo['total'] = total
	usageinfo['totalunit'] = totalunit
	usageinfo['ratio'] = ratio

	response=HttpResponse(json.dumps(usageinfo))
	return response


@csrf_exempt
def conf(request):
	if request.method == 'POST' :
		data = request.body
		json_data = json.loads(str(data))
		PORT = 10012	# ClientAgent listen Port / ServerAgent listen Port 10011

		for ip, dirlist in json_data.items():
			query = ServerList.objects.get(serv_ip=ip)
			webSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

			try :
				webSocket.connect((ip, PORT))
				webSocket.sendall('conf:'+dirlist)
			except Exception :
				query.save()
			else :
				webSocket.close()
				query.exclude_dir=dirlist
				query.save()
		
	return HttpResponse('OK')

@csrf_exempt
def register(request):
	if request.method == 'POST' :
		data = request.body
		json_data = json.loads(str(data))

		if not 'name' in json_data :
			return HttpResponseNotFound('name or ip not specified')

		ip = None

		if 'ip' in json_data :
			ip = json_data['ip']

		else :
			x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

			if x_forwarded_for :
				ip = x_forwarded_for.split(',')[0]
			else :
				ip = request.META.get('REMOTE_ADDR')
			
		backupclient = None

		try :
			backupclient = ServerList.objects.get(serv_name=json_data['name'])
			backupclient.serv_ip = ip
			
		except Exception as e :
			backupclient = ServerList(
					serv_name=json_data['name'],
					serv_ip=ip,
					agent_status = True,
					backup_status = False)

		backupclient.save()

	return HttpResponse('')					

@csrf_exempt
def reply(request):
	if request.method == 'POST' :
		data = request.body
		json_data = json.loads(str(data))
		hostname = json_data['hostname'].split('.')[0]

		try :
			backupclient = ServerList.objects.get(serv_name=hostname)

			if json_data['cmd'] == 'backup' :
				lastdate = time.strftime('%y%m%d')
				lastbackuppath = "/backup/"+hostname+"_"+lastdate
				size = "-" if not os.path.isdir(lastbackuppath) else \
						os.popen('du -sh %s' % lastbackuppath).read().split()[0]

				backupclient.last_backup_date	= time.strftime('%y%m%d')
				backupclient.backup_size	= str(size)
				backupclient.backup_status	= False
				backupclient.save()
				return HttpResponse('')

		except Exception as e:
			return HttpResponseNotFound('Unable to find host')

		return HttpResponse('')

	return HttpResponse('')
			
			
@login_required(login_url='/login/')
def default(request):
	return HttpResponse(get_template("index.html").render(Context()))
