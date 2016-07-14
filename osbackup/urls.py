from django.conf.urls import patterns, include, url
from app.views import *
from django.contrib import admin
admin.autodiscover()
import settings

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'sysmon.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', default),
    url(r'^osbackup/$', osbackup),
    url(r'^usageinfo/$', usageinfo),
    url(r'^conf/$', conf),
    url(r'^register/$', register),
    url(r'^listbackup/$', listbackup),
    url(r'^reply/$', reply),
    url(r'^login/$', 'django.contrib.auth.views.login', {'template_name':'login.html'}),
    url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
)
