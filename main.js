const url = require('url')
const http = require('http')
const fs = require('fs')
const express = require('express')
const app = express()
const oneMinute = 60000

var switches
const token = process.env.SMARTTHINGS_API_TOKEN
const hassPW = process.env.HASS_PW
const hassApiToken = process.env.HASS_FLIC_INTERFACE_TOKEN
const hassHost = process.env.HASS_HOST
const serverPort = process.env.SERVER_PORT || 9090

function postSmartThingsRequest(deviceId,commandString) {
    var http = require('https');

    var post_req  = null,
        post_data = [
            {
                command: commandString,
                capability: 'switch',
                component: 'main',
                arguments: []
            }
        ];

    var post_options = {
        hostname: 'api.smartthings.com',
        //hostname: 'requestb.in',
        port    : '443',
        path    : '/v1/devices/' + deviceId + '/commands',
        //path : '/13sgkba1',
        method  : 'POST',
        headers : {
            'Content-Type': 'application/json',
            "Authorization": "Bearer: " + token
        }
    };

    post_req = http.request(post_options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ', chunk);
        });
    });

    post_req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    post_req.write(JSON.stringify(post_data));
    post_req.end();
}

function toggle(deviceId) {
    var http = require('https');
    var get_options = {
        hostname: 'api.smartthings.com',
        //hostname: 'requestb.in',
        port    : '443',
        path    : '/v1/devices/' + deviceId + '/components/main/capabilities/switch/status',

        //path : '/13sgkba1',
        method  : 'GET',
        headers : {
            "Authorization": "Bearer: " + token
        }
    };
    var get_req = http.request(get_options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        console.log(res.data);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ', chunk);
            var reply = JSON.parse(chunk)
            var currentStatus = reply.switch.value;
            postSmartThingsRequest(deviceId,(currentStatus == 'on') ? 'off' : 'on')
        });
    });

    get_req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    get_req.write("");
    get_req.end();
}

function switchOn(request,response) {
    switchOnOff(request,response,"on")
}

function switchOff(request,response) {
    switchOnOff(request,response,"off")
}

function switchOnOff(request,response,commandString) {
    var queryData = url.parse(request.url, true).query
    var devicename = queryData.deviceName
    var deviceId = queryData.deviceId
    var targetid = ""
    if (switches != undefined) {
        if (deviceId != undefined) {
            targetid=deviceId;
        }
        if (devicename != undefined) {
            for (var i = 0; i < switches.length; i++) {
                if (switches[i].label == devicename) {
                    targetid = switches[i].deviceId
                    break
                }
            }
        }
        if (targetid != "") {
            postSmartThingsRequest(targetid,commandString)
            response.writeHead(200, {"content-type": "text/html"});
            response.write('<h1>success found switch and requested switch "' + commandString + '"</h1>')
            response.write('<br>request=' + request.url + '');
            response.write('<br>devicename=' + devicename + '');
            response.write('<br>targetid=' + targetid + '');
            response.end();
        } else {
            response.writeHead(200, {"content-type": "text/html"});
            response.write('<br>request=' + request.url + '');
            response.write('<br>devicename=' + devicename + '');
            response.write('<br>deviceId=' + deviceId + '');
            response.write('<br>targetid=' + 'not found');
            response.end();
        }
    } else {
        response.writeHead(200, {"content-type": "text/html"});
        response.write(`<br>request=` + request.url + '');
        response.write(`<br>devicename=` + devicename + '');
        response.write('<br>deviceId=' + deviceId + '');
        response.write(`<br>targetid=` + 'no devices loaded check server');
        response.end();
    }
}

function showDevices(request,response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<html>\n')
    response.write('<head>\n')
    response.write(addCss())
    response.write('</head>\n')
    response.write('<body>\n')
    response.write('<h1>Switches (with Name based links)</h1>\n')
    response.write('<h3>NOTE:Spaces don\'t work with Flic Internet Request so use <a href="/showDevicesId">ID based links</a>)</h3>\n')


    response.write('<table>\n')
    if (switches != undefined) {
        for (var i = 0; i < switches.length; i++) {
            response.write('<tr class="spacedRow">\n')
            response.write('<td><h3 style="text-align: right;">' + switches[i].label + '</h3></td>\n')
            response.write('<td>&nbsp &nbsp &nbsp</td>')
            response.write('<td><a class=button href="/toggle?deviceName=' + switches[i].label + '">toggle</a></td>\n')
            response.write('<td>&nbsp &nbsp &nbsp</td>')
            response.write('<td><a class=button href="/switchOn?deviceName=' + switches[i].label + '">switchOn</a></td>\n')
            response.write('<td>&nbsp &nbsp &nbsp</td>')
            response.write('<td><a class=button href="/switchOff?deviceName=' + switches[i].label + '">switchOff</a></td>\n')
            response.write('</tr>\n')
        }
    }
    response.write('</table>\n')
    response.write('</body>\n')
    response.write('</html>\n')
    response.end();
}

function addCss() {
    var css = "";
    css = css.concat('<style>\n')
    css = css.concat('a.button {\n' +
        '    background-color: #4CAF50; /* Green */\n' +
        '    border: none;\n' +
        '    color: white;\n' +
        '    padding: 15px 32px;\n' +
        '    text-align: center;\n' +
        '    text-decoration: none;\n' +
        '    display: inline-block;\n' +
        '    font-size: 16px;' +
        '}\n' +
        'tr.spacedRow>td {\n' +
        '  padding-bottom: 1em;\n' +
        '  padding-top: 1em;\n' +
        '}')
    css = css.concat('</style>\n')
    return css
}

function showDevicesId(request,response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<html>\n')
    response.write('<head>\n')
    response.write(addCss())
    response.write('</head>\n')
    response.write('<body>\n')
    response.write('<h1>Switches (with ID based links)</h1>\n')
    response.write('<table>\n')
    if (switches != undefined) {
        for (var i = 0; i < switches.length; i++) {
            response.write('<tr class="spacedRow">\n')
            response.write('<td><h3 style="text-align: right;">' + switches[i].label + '</h3></td>\n')
            response.write('<td>&nbsp &nbsp &nbsp</td>')
            response.write('<td><a class=button href="/toggle?deviceId=' + switches[i].deviceId + '">toggle</a></td>\n')
            response.write('<td>&nbsp &nbsp &nbsp</td>')
            response.write('<td><a class=button href="/switchOn?deviceId=' + switches[i].deviceId + '">switchOn</a></td>\n')
            response.write('<td>&nbsp &nbsp &nbsp</td>')
            response.write('<td><a class=button href="/switchOff?deviceId=' + switches[i].deviceId + '">switchOff</a></td>\n')
            response.write('</tr>\n')
        }
    }
    response.write('</table>\n')
    response.write('</body>\n')
    response.write('</html>\n')
    response.end();
}


function loadDevices(request,response) {
    getDevicesFromSmartThings(request,response,0);
}

function getDevicesFromSmartThings(request,response,retryWaitTime) {
    var https = require('https');
    var get_options = {
        hostname: 'api.smartthings.com',
        port    : '443',
        path    : '/v1/devices?capability=switch&max=200',
        method  : 'GET',
        headers : {
            "Authorization": "Bearer: " + token
        }
    };
    var get_req = https.request(get_options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        console.log(res.data);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ', chunk);

        });
        let data = ""

        res.on('data', function(chunk) {
            data += chunk;
        }).on('end', function() {
            var devices = JSON.parse(data)
            function compareElements(a, b) {
                var alabel=a.label.toLowerCase()
                var blabel=b.label.toLowerCase()
                if (alabel < blabel)
                    return -1;
                if (alabel > blabel)
                    return 1;
                return 0;
            }
            var items = devices.items
            switches = items.sort(compareElements);
            if (response != undefined) {
                showDevices(request,response)
            } else {
                console.log(devices);
            }
        });

    });

    get_req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        // if retryWait is 0 then don't retry, this is used for user requested load
        // if retryWait reaches 1hr then stop retrying
        // otherwise keep retrying on a logorithmic basis 1->2->4->8->16->32->64
        if (retryWaitTime!=0 && retryWaitTime < oneMinute*60) {
            setTimeout(getDevicesFromSmartThings, retryWaitTime, request, response, retryWaitTime * 2)
        }
    });

    get_req.write("");
    get_req.end();
}

function toggleSwitch(request,response) {
    var queryData = url.parse(request.url, true).query
    var devicename = queryData.deviceName
    var deviceId = queryData.deviceId
    var targetid = ""
    if (switches != undefined) {
        if (deviceId != undefined) {
            targetid=deviceId;
        }
        if (devicename != undefined) {

            for (var i = 0; i < switches.length; i++) {
                if (switches[i].label == devicename) {
                    targetid = switches[i].deviceId
                    break
                }
            }
        }
        if (targetid != "") {
            toggle(targetid)
            response.writeHead(200, {"content-type": "text/html"});
            response.write('<h1>success found switch and requested toggle</h1>')
            response.write('<br>request=' + request.url + '');
            response.write('<br>devicename=' + devicename + '');
            response.write('<br>targetid=' + targetid + '');
            response.end();
        } else {
            response.writeHead(200, {"content-type": "text/html"});
            response.write('<br>request=' + request.url + '');
            response.write('<br>devicename=' + devicename + '');
            response.write('<br>targetid=' + 'not found');
            response.end();
        }
    } else {
        response.writeHead(200, {"content-type": "text/html"});
        response.write(`<br>request=` + request.url + '');
        response.write(`<br>devicename=` + devicename + '');
        response.write(`<br>targetid=` + 'no devices loaded check server');
        response.end();
    }
}

function help(request,response) {
    response.write('<html>')
    response.write('<head>\n')
    response.write(addCss())
    response.write('</head>\n')
    response.write('<body>\n')
    response.write('<h1>Help Details</h1>')
    response.write('<table>\n')
    response.write('<tr class="spacedRow"><tr><td><a class=button href="/reloadDevices">/reloadDevices</a> will send new request to SmartThings for all switches</td></tr></tr>');
    response.write('<tr class="spacedRow"><td><a class=button href="/showDevices">/showDevices</a> will display currently loaded devices</td></tr>');
    response.write('<tr class="spacedRow"><td><a class=button href="/showDevicesId">/showDevicesId</a> will display currently loaded devices</td></tr>');
    response.write('<tr class="spacedRow"><td>/toggle?deviceName={device name}} will toggle the on/off state of the device</td></tr>')
    response.write('<tr class="spacedRow"><td>/toggle?deviceId={device id}} will toggle the on/off state of the device</td></tr>')
    response.write('<tr class="spacedRow"><td>/switchOn?deviceName={device name}} will switch device On</td></tr>')
    response.write('<tr class="spacedRow"><td>/switchOn?deviceId={device id}} will switch device On</td></tr>')
    response.write('<tr class="spacedRow"><td>/switchOff?deviceName={device name}} will switch device Off</td></tr>')
    response.write('<tr class="spacedRow"><td>/switchOff?deviceId={device id}} will switch device Off</td></tr>')
    response.write('</table>')
    response.write('</body>\n')
    response.end();
}

function hassApi(request,response) {
    var queryData = url.parse(request.url, true).query
    var entityId = queryData.entity_id
    var apiCommand = queryData.api_command
    
/*
curl -X POST -H "x-ha-access: YOUR_PASSWORD" \
       -H "Content-Type: application/json" \
       -d '{"entity_id": "switch.christmas_lights"}' \
       http://localhost:8123/api/services/switch/turn_on
*/
    var http = require('http');

    var post_req  = null,
        post_data = {
                entity_id: entityId
            } ;

    var post_options = {
        hostname: hassHost,
        port    : '8123',
        path    : '/api/' + apiCommand,
        method  : 'POST',
        headers : {
            'Content-Type': 'application/json',
            //'x-ha-access': hassPW
            'Authorization': "Bearer " + hassApiToken
        }
    };

    console.log('PostOptions: ', post_options);
    console.log('PostData: ', post_data);

    post_req = http.request(post_options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ', chunk);
        });
    });

    post_req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    post_req.write(JSON.stringify(post_data));
    post_req.end();
    response.write('<html>')
    response.write('<body>\n')
    response.write('OK\n')
    response.write('</body>\n')
    response.write('</html>')
    response.end();
}

//app.get('/showDevicesId',showDevicesId)
//app.get('/showDevices',showDevices)
//app.get('/reloadDevices',loadDevices)
//app.get('/toggle',toggleSwitch)
//app.get('/switchOn',switchOn)
//app.get('/switchOff',switchOff)
app.get('/hassApi',hassApi)
//app.get('/help',help)
app.get('/',help)
//app.listen(serverPort,getDevicesFromSmartThings(undefined,undefined,oneMinute))
app.listen(serverPort)
