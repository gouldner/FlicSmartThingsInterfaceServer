Installing FlicSmartThingsInterfaceServer

1) Install Node v6.13.0 (I recommend installing NVM-Node Version Manager)
    https://github.com/creationix/nvm#install-script
$curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
$nvm install v6.13.0

2) Copy source (easiest is clone repo using git)
$git clone git@github.com:gouldner/FlicSmartThingsInterfaceServer.git

3) setup config
$cp FST.config.sample FST.config
-modify port you want server to use
-enter SmartThings API token 
   Create HERE:https://account.smartthings.com/tokens
   Read more on API here:https://smartthings.developer.samsung.com/develop/api-ref/st-api.html
   or this thread:https://community.smartthings.com/t/example-using-new-smartthings-cloud-api/104304

4) start server
$startFlicSmartInterface.sh

Visit http://{server_ip}:{configured_port}/help for how to use the interface

NOTES:
--Your server should run on a machine with a fixed IP or dns lookup
--You will want to install as a service or add to startup on machine to assure server is always running


