#!/bin/bash

#setup nvm since we run this script as a service
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --no-use  # This loads nvm
#Note: This may be slow but it will select correct version of node
nvm use v6.13.0

BASEDIR=`dirname $0`
if [ ! -f ${BASEDIR}/FST.config ]
then
    echo "Error:  Configuration file not found [${configLocation}/FST.config]"
    echo "Copy FST.config.sample to FST.config and edit your settings"
    exit 1
fi
echo "Loading config from ${BASEDIR}/FST.config"
source ${BASEDIR}/FST.config
echo "Starting Node" 
node --version
node main.js >> ${BASEDIR}/FST.log 2>&1
#node main.js >> ${BASEDIR}/FST.log 2>&1 &
#pid=$!
#echo "Flic Server Started process id=$pid"
#echo $pid > ${BASEDIR}/running.pid
