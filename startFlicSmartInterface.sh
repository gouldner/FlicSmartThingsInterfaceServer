BASEDIR=`dirname $0`
if [ ! -f ${BASEDIR}/FST.config ]
then
    echo "Error:  Configuration file not found [${configLocation}/FST.config]"
    echo "Copy FST.config.sample to FST.config and edit your settings"
    exit 1
fi
source ${BASEDIR}/FST.config
node main.js >> ${BASEDIR}/FST.log 2>&1 &
pid=$!
echo $pid > ${BASEDIR}/running.pid
