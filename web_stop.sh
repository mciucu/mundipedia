#!/usr/bin/env bash

PID=$(cat pid/gunicorn.pid)
kill ${PID}
while ps -p ${PID} > /dev/null; do sleep 1; done
