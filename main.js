const url = require('url')
const http = require('http')
const fs = require('fs')
const express = require('express')
const app = express()

var switches
const token = process.env.SMARTTHINGS_API_TOKEN
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
    var targetid = ""
    if (switches != undefined) {
        for (var i = 0; i < switches.length; i++) {
            if (switches[i].label == devicename) {
                targetid = switches[i].deviceId
                break
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

function showDevices(request,response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<html>\n')
    response.write('<head>\n')
    response.write('</head>\n')
    response.write('<body>\n')
    response.write('<h1>Switches</h1>\n')
    response.write('<table>\n')
    if (switches != undefined) {
        for (var i = 0; i < switches.length; i++) {
            response.write('<tr>\n')
            response.write('<td><a id="' + switches[i].label + '-link" href="/toggle?deviceName=' + switches[i].label + '">toggle</a> ' + switches[i].label + '</td>\n')
            response.write('</tr>\n')
        }
    }
    response.write('</table>\n')
    response.write('</body>\n')
    response.write('</html>\n')
    response.end();
}

function loadDevices(request,response) {
    var http = require('https');
    var get_options = {
        hostname: 'api.smartthings.com',
        port    : '443',
        path    : '/v1/devices?capability=switch&max=200',
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
    });

    get_req.write("");
    get_req.end();
}

function toggleSwitch(request,response) {
    var queryData = url.parse(request.url, true).query
    var devicename = queryData.deviceName
    var targetid = ""
    if (switches != undefined) {
        for (var i = 0; i < switches.length; i++) {
            if (switches[i].label == devicename) {
                targetid = switches[i].deviceId
                break
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
    response.write('<html><h1>Help Details</h1>')
    response.write('<bl>')
    response.write('<li><a href="/reloadDevices">/reloadDevices</a> will send new request to SmartThings for all switches</li>');
    response.write('<li><a href="/showDevices">/showDevices</a> will display currently loaded devices</li>');
    response.write('<li>/toggle?deviceName={device name}} will toggle the on/off state of the device</li>')
    response.end();
}

app.get('/showDevices',showDevices)
app.get('/reloadDevices',loadDevices)
app.get('/toggle',toggleSwitch)
app.get('/switchOn',switchOn)
app.get('/switchOff',switchOff)
app.get('/help',help)
app.get('/',help)
app.listen(serverPort,loadDevices())