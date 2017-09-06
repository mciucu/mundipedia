#!/bin/bash

SOCKFILE=/websites/mundipedia/mundipedia.sock

mkdir -p pid
mkdir -p log
gunicorn mundipedia.wsgi --bind=unix:$SOCKFILE --limit-request-line 65535 --pid pid/gunicorn.pid --workers 3 --daemon
