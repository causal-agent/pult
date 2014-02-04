#!/usr/bin/env node

var fs = require('fs');
var http = require('http');
var spawn = require('child_process').spawn;

var argv = process.argv.slice(2);

var name = '', method = 'PORT';

while (argv[0] && argv[0][0] == '-') {
  switch (argv[0]) {
  case '-k':
    return http.request({ hostname: 'pult.dev', method: 'DELETE' },
      function httpDelete(res) {
        process.exit();
      }).end();
  case '-n':
    name = argv[1];
    argv = argv.slice(2);
    break;
  case '-p':
  case '-P':
    method = argv.shift();
    break;
  default:
    console.log('unknown option ' + argv[0]);
    process.exit(1);
  }
}

if (!name && argv.length > 0) {
  fs.readFile('.pult', { encoding: 'utf8' }, function readDotPult(err, data) {
    if (!err)
      name = data.trim();
    else
      name = process.cwd().split('/').reverse()[0];
    getPort();
  });
} else {
  getPort();
}

function getPort() {
  http.get('http://pult.dev/' + name, function httpGet(res) {
    var package = require('./package.json');
    if (res.headers['x-pult-version'] != package.version)
      console.log('warning: pult-server has different version: ' +
        res.headers['x-pult-version'] + ' != ' + package.version);

    res.setEncoding('utf8');
    res.on('data', function httpGetData(data) {
      var ports = JSON.parse(data);
      for (var host in ports)
        if (name)
          spawnWithPort(ports[host]);
        else
          console.log(host + ' ' + ports[host]);
    });
  });
}

function spawnWithPort(port) {
  if (method == 'PORT')
    process.env.PORT = port;
  else
    argv.push(method, port);
  spawn(argv[0], argv.slice(1), { stdio: 'inherit' });
}
