# -*- coding: utf-8 -*-
#!/usr/bin/python

import threading
import atexit
import os
import socket
import sys, time
import subprocess
from daemon import Daemon
from subprocess import call

available_cmd=['ls','df','openstack-service','uptime']
HOST = ''
PORT = 10012

FEEDBACKHOST = '10.12.17.60' # Server Agent IP 정보
FEEDBACKPORT = 10011
AgentSocket = 0

class ClientAgent(Daemon):
	
	def run(self):
		
		pid = str(os.getpid())
		file(self.pidfile, 'w+').write("%s\n" % pid)
		
		#-- Open a Socket, for Django 
		AgentSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		AgentSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
		if AgentSocket < 0 :
			sys.stderr.write("Unable to open socket\n")
			sys.exit()		
		AgentSocket.bind((HOST, PORT))
		AgentSocket.listen(1)
		
		#-- Waiting for the command from the Django
		while True:
			try :
				(CommandServerSocket, address) = AgentSocket.accept()
				data = CommandServerSocket.recv(1024)
				cmd = data.split(':')
				
				#-- Excute 'rear Backup'
				if(cmd[0] == 'backup') :
					#backup_cmd = ('sleep', '15')
					backup_cmd = ('rear', 'mkbackup')
					self.call_thread(CommandServerSocket,backup_cmd, cmd[0])
					
				#-- Check Agent status
				elif (cmd[0] == 'echo'):
					echo_cmd = 'date'
					#CommandServerSocket.sendall('ok\n')
					self.call_thread(CommandServerSocket,echo_cmd, cmd[0])
					
				#-- Modify rear config file
				elif (cmd[0] == 'conf'):
					mod_file = ''
					if len(cmd) == 2:
						mod_file = '(%s)' % cmd[1]
					mod_file = mod_file.replace('/', '\/')
					conf_cmd = ('sed', '-ri', 's/EXCLUDE_MOUNTPOINTS=(.*)$/EXCLUDE_MOUNTPOINTS=%s/g' % mod_file , '/etc/rear/local.conf')
					self.call_thread(CommandServerSocket, conf_cmd, cmd[0])

				#-- log parse program : the-great-GetloG is comming!
				elif (cmd[0] == 'GetloG') :
					th = threading.Thread(target=self.read_and_return_log, args=(CommandServerSocket,cmd[1]))
					th.daemon = True
					th.start()
					
			except socket.error, e:
				continue
				
				
	def call_thread(self, CommandServerSocket, cmd, msg):
		
		th = threading.Thread(target=self.run_command, args=(CommandServerSocket,cmd,msg))
		th.daemon = True
		th.start()
		
	def read_and_return_log(self, CommandServerSocket, path) :
		filedata = ""
		file = open(path)
		for line in f:
			filedata += line

		CommandServerSocket.send(filedata)
		CommandServerSocket.close()
		
	def run_command(self, CommandServerSocket,cmd,msg) :
		
		#-- Excute command 'subprocess'
		process = subprocess.call(cmd, shell=False) #*********************************** CHECK CHECK!!!!!!
		
		#-- Connect to ServerAgent
		FeedbackSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		FeedbackSocket.connect((FEEDBACKHOST, FEEDBACKPORT))
		
		#-- The result is the response to the ServerAgent
		if FeedbackSocket < 0 :
			sys.stderr.write('Feedback Socket creation failed')
			
		else :
			if process == 0 :
				#-- Success
				FeedbackSocket.sendall('%s,%s,%s,%s\n' % (time.ctime(),socket.gethostname(),msg,'TRUE'))
			else :
				#-- Fail
				FeedbackSocket.sendall('%s,%s,%s,%s\n' % (time.ctime(),socket.gethostname(),msg,'FALSE'))
		
		#-- The result is the response to the Django
		CommandServerSocket.send(msg)
		CommandServerSocket.close()
		
#-- Main
if __name__ == "__main__":
	daemon = ClientAgent('/tmp/ClientAgent.pid')
	if len(sys.argv) == 2:
		if 'start' == sys.argv[1]:
			daemon.start()
		elif 'stop' == sys.argv[1]:
			daemon.stop()
		elif 'restart' == sys.argv[1]:
			daemon.restart()
		else:
			print "Unknown command"
			sys.exit(2)
		sys.exit(0)
	else:
		print "usage: %s start|stop|restart" % sys.argv[0]
		sys.exit(2)
