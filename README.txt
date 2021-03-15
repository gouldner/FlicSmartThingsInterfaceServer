Installing FlicSmartThingsInterfaceServer

1) Install Node (I recommend installing NVM-Node Version Manager)
    https://github.com/creationix/nvm#install-script
$curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
$nvm install v8.10.0

2) Copy source (easiest is clone repo using git)
$cd /home/pi
$git clone https://github.com/gouldner/FlicSmartThingsInterfaceServer.git

3) build to get required node_modules
nvm use v8.10.0
npm install

4) setup config
$cp FST.config.sample FST.config
-modify port you want server to use
-enter SmartThings API token 
   Create HERE:https://account.smartthings.com/tokens
   Read more on API here:https://smartthings.developer.samsung.com/develop/api-ref/st-api.html
   or this thread:https://community.smartthings.com/t/example-using-new-smartthings-cloud-api/104304

5) Install as a service and start
sudo cp /home/pi/FlicSmartThingsInterfaceServer/FST.service /etc/systemd/system/FST.service
sudo systemctl enable FST.service
sudo systemctl start FST.service

This next step is optional and your milage may vary.  I had issues getting avahi working on my pi zero and stopped using it.  It worked at first but would stop working.....Also newer versions of raspbien already expose the {hostname}.local address so this may be unnecessary.  I just use a fixed IP now instead.
6) If you want to configure avahi to {hostname}.local address
sudo apt-get install avahi-daemon
sudo insserv avahi-daemon
cp ./avahi.multiple.service /etc/avahi/services/multiple.service
sudo /etc/init.d/avahi-daemon restart
NOTE: if you change port from 9090 you need to edit multiple.service with correct port

Visit http://{server_ip}:{configured_port}/help for how to use the interface


NOTES:
--Your server should run on a machine with a fixed IP or dns lookup
--You will want to install as a service or add to startup on machine to assure server is always running
--If you are not using raspberry pi, your user isn't pi, your home directory isn't /home/pi etc things will not work without your editing the service and start scripts
-- NVM is really slow on pi zero making login really slow, so to fix you can alter the required .bashrc
   includes for nvm with the --no-use option 
   this will case nvm to not load node on every login which is fine since I load it in the startup script


