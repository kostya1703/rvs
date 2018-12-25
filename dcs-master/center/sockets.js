let gps_connected = false;
let enemy_connected = false;
let enemy = require('./data/Enemy');
let map = require('./data/map');
var isRight = true;
function startSocketServer() {
    const io = require('socket.io').listen(3030);
    io.sockets.on('connection', (socket) => {
        socket.on('connected_gps', () => {
            socket.json.emit('msg', {name: 'Server', value: 'GPS connected'});
            gps_connected = true;
        });

        socket.on('connected_enemy', () => {
            socket.json.emit('msg', {name: 'Server', value: 'Enemy connected'});
            enemy_connected = true;
        });

        socket.on('get_enemy', () => {
            get_enemy(socket);
        });

        socket.on('get_map', () => {
            get_map(socket);
        });

        socket.on('set_enemy', (msg) => {
            enemy = msg;
            set_enemy(socket);
        });
        socket.on('msg', (msg) => {
            let time = (new Date()).toLocaleTimeString();
            send(socket, `${msg.name}: ${msg.value}`, `${time}`);
        });
        socket.on('set_enemy_2', (msg) => {
            enemy = msg;
            socket.json.emit('dead', enemy);
            set_enemy(socket);
            socket.broadcast.json.emit('update_enemy');
        });

        socket.on('set_map', (msg) => {
            map = msg;
            set_map(socket);
        });
        socket.on('dead', (msg) => {
            enemy = msg;
        });


        socket.on('switch', () => {
            socket.broadcast.json.emit('change');
        });

    })
}

function get_enemy(socket){
    if (gps_connected && enemy_connected){
        socket.json.emit('enemy_data', enemy);
        socket.broadcast.json.emit('enemy_data', enemy);
    }
    else {
        setTimeout(function () {
            get_enemy(socket);
        }, 100);
    }
}

function get_map(socket){
    if (gps_connected && enemy_connected){
        socket.json.emit('map_data', map);
        socket.broadcast.json.emit('map_data', map);
    }
    else {
        setTimeout(function () {
            get_map(socket);
        }, 100);
    }
}

function set_enemy(socket){
    if (gps_connected && enemy_connected){
        socket.broadcast.json.emit('enemy_data', enemy);
    }
    else {
        setTimeout(function () {
            set_enemy(socket);
        }, 100);
    }
}

function set_map(socket){
    if (gps_connected && enemy_connected){
        socket.broadcast.json.emit('map_data', map);
    }
    else {
        setTimeout(function () {
            set_map(socket);
        }, 100);
    }
}
function send(socket, msg, time) {
    socket.json.emit('msg', {'message': msg, 'time': time});
    socket.broadcast.emit('msg', {'message': msg, 'time': time});
}
module.exports = { startSocketServer };