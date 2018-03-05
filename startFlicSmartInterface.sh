configLocation=`dirname $0`
if [ ! -f ${configLocation}/FST.config ]
then
    echo "Error:  Configuration file not found [${configLocation}/FST.config]"
    echo "Copy FST.config.sample to FST.config and edit your settings"
    exit 1
fi
source ${configLocation}/FST.config
node main.js
