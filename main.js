const url = require('url')
const http = require('http')
var devices
const token = process.env.SMARTTHINGS_API_TOKEN
const serverPort = process.env.SERVER_PORT || 9090
const app = http.createServer((request, response) => {
    var urlPath = url.parse(request.url).pathname
    if (request.url == "/showDevices") {
        showDevices(response)
    } else if(request.url === "/reloadDevices") {
        loadDevices(response)
    } else if(request.url === "/help" || request.url === "/") {
        response.write('<html><h1>Help Details</h1>')
        response.write('<bl>')
        response.write('<li>/reloadDevices will send new request to SmartThings for all switches</li>');
        response.write('<li>/showDevices will display currently loaded devices</li>');
        response.write('<li>/toggle?deviceName={device name}} will toggle the on/off state of the device</li>')
        response.end();
    } else if(urlPath === "/toggle") {
        var queryData = url.parse(request.url, true).query;
        var deviceName = queryData.deviceName
        var targetId = ""
        if (devices != undefined) {
            for (var i = 0; i < devices.items.length; i++) {
                if (devices.items[i].label == deviceName) {
                    targetId = devices.items[i].deviceId
                    break
                }
            }
            if (targetId != "") {
                toggle(targetId)
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write('<h1>Success found switch and requested toggle</h1>')
                response.write('<br>request=' + request.url + '');
                response.write('<br>deviceName=' + deviceName + '');
                response.write('<br>targetId=' + targetId + '');
                response.end();
            } else {
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write('<br>request=' + request.url + '');
                response.write('<br>deviceName=' + deviceName + '');
                response.write('<br>targetId=' + 'Not Found');
                response.end();
            }
        } else {
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(`<br>request=` + request.url + '');
            response.write(`<br>deviceName=` + deviceName + '');
            response.write(`<br>targetId=` + 'No Devices Loaded Check Server');
            response.end();
        }
    } else {
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write('<h1>Unknown Request.</h1><br>');
        response.write('request=' + request.url + '');
        response.end();
    }
});


function postSmartThingsRequest(deviceId,currentStatus) {
    var commandString = (currentStatus == 'on') ? 'off' : 'on';
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
            postSmartThingsRequest(deviceId,currentStatus)
        });
    });

    get_req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    get_req.write("");
    get_req.end();
}

function showDevices(response) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("<html>")
    response.write("<table>")
    for (var i = 0; i < devices.items.length; i++) {
        response.write("<tr>")
        response.write("<td>" + devices.items[i].label + '</td>')
        response.write("<td>" + devices.items[i].deviceId + '</td>')
        response.write("</tr>")
    }
    response.write("</table>")
    response.write("</html>")
    response.end();
}

function loadDevices(response) {
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
            devices = JSON.parse(data)
            if (response != undefined) {

                response.writeHead(200, {"Content-Type": "text/html"});
                response.write("<html>")
                response.write("<table>")
                for (var i = 0; i < devices.items.length; i++) {
                    response.write("<tr>")
                    response.write("<td>" + devices.items[i].label + '</td>')
                    response.write("<td>" + devices.items[i].deviceId + '</td>')
                    response.write("</tr>")
                }
                response.write("</table>")
                response.write("</html>")
                response.write(data)
                response.end();
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

app.listen(serverPort);
loadDevices();
