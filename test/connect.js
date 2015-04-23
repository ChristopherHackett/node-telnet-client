var telnet = process.env.NODETELNETCLIENT_COV 
  ? require('../lib-cov/telnet-client')
  : require('../lib/telnet-client');
var nodeunit = require('nodeunit');
var net = require('net');

var socket, server, callbackCount;

exports.socket = {
  setUp: function(callback) {
    socket = new telnet();
    callbackCount = 0;
    server = net.createServer(function(c) {
      callbackCount++;
      c.end();
    })
    server.listen(2323, function(err) {
      callback();
    });
  },

  tearDown: function(callback) {
    server.close(function() {
      callback();
    });
  },

  "connect": function(test) {
    socket.connect({
      host: '127.0.0.1',
      port: 2323 //not using 23 is a service port could need sudo 
    });
    socket.on('close', function() {
      test.ok(callbackCount == 1, "Client did connect");
      test.done();
    });
  }
};

var msgs, serverPrompts, sentCount, addMessageTestToSocketClose;
exports.login = {
  setUp: function(callback) {
    callbackCount = 0;
    sentCount = 0;
    
    socket = new telnet();
    msgs = [];
    serverPrompts = [];

    server = net.createServer(function(c) {
      var timeout = setTimeout(function() {
        c.end();
      }, 150);

      c.on('data', function (d) {
        msgs.push(String(d));        
        if (sentCount < serverPrompts.length) {
          c.write(serverPrompts[sentCount]);
          sentCount = sentCount + 1;
        }
      });

      sentCount = 1;
      c.write(serverPrompts[0]);
    });
    server.listen(2323, function(err) {
      callback();
    });
    
    addMessageTestToSocketClose = function (test, socket, expectedMsgs){
      socket.on('error', function(err) {
        test.ok(false, err);
        test.done();
      });
      socket.on('close', function() {
        test.ok(msgs.length === 2, "Number of messages match expected");
        expectedMsgs.forEach(function(expected, index) {
          test.ok(msgs[index] === expected, 'Expected messages sent by client');
        });
        test.done();
      });
      return socket;
    }
  },

  tearDown: function(callback) {
    server.close(function() {
      callback();
    });
  },

  "defaults": function(test) {
    serverPrompts = ['login: ', 'password: '];
    socket = addMessageTestToSocketClose(
      test,
      socket,
      ['root\n', 'guest\n']
    );
    socket.connect({
      host: '127.0.0.1',
      port: 2323 //not using 23 is a service port could need sudo 
    });
  },

  "with custom username": function(test) {
    serverPrompts = ['login: ', 'password: '];
    socket = addMessageTestToSocketClose(
      test,
      socket,
      ['test\n', 'guest\n']
    );
    socket.connect({
      username: 'test',
      host: '127.0.0.1',
      port: 2323 //not using 23 is a service port could need sudo 
    });
  },

  "with custom password": function(test) {
    serverPrompts = ['login: ', 'password: '];
    socket = addMessageTestToSocketClose(
      test,
      socket,
      ['root\n', '123\n']
    );
    socket.connect({
      password: '123',
      host: '127.0.0.1',
      port: 2323 //not using 23 is a service port could need sudo 
    });
  },

  "with custom username and password": function(test) {
    serverPrompts = ['login: ', 'password: '];
    
    socket = addMessageTestToSocketClose(
      test,
      socket,
      ['auser\n', '123\n']
    );
    socket.connect({
      username: 'auser',
      password: '123',
      host: '127.0.0.1',
      port: 2323 //not using 23 is a service port could need sudo 
    });
  }
};



