BASEDIR=`dirname $0`
PIDFILE=${BASEDIR}/running.pid

if [ -f ${PIDFILE} ]
then
    pid=""
    childpid=""
    grandchildpid=""
    read pid < ${PIDFILE}
    if ps -p ${pid} > /dev/null
    then
        childpid=`pgrep -P $pid`
    fi
    if [ "${childpid}" != "" ]
    then
        grandchildpid=`pgrep -P $childpid`
    fi
    echo "Attempting to kill processes pid=${pid} childpid=${childpid} grandchildpid=${grandchildpid}"
    if [ "${pid}" != "" ]
    then
        if ps -p ${pid} > /dev/null
        then
            echo "Killing primary pid:${pid}"
            kill $pid
            sleep 2
        else
            echo "Primary pid:${pid} wasn't running"
        fi
    fi
    if [ "${childpid}" != "" ]
    then
        if ps -p ${childpid} > /dev/null
        then
            echo "Killing Child pid:${childpid}"
            kill $childpid
            sleep 2
        else
            echo "Child pid:${Child} wasn't running"
        fi
    fi
    if [ "${grandchildpid}" != "" ]
    then
        if ps -p ${grandchildpid} > /dev/null
        then
            echo "Killing Grandchild pid:${grandchildpid}"
            kill $grandchildpid
        else
            echo "Grandchild pid:${grandchildpid} wasn't running"
        fi
    fi
    rm ${PIDFILE}
else
    echo "ERROR: Running Pid file [${PIDFILE}] is missing.  Is server already running ?  If so you need to manually kill processes"
fi
