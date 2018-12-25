var enemy;
var map;
var isRight = true;
var socket;

$(document).ready(()=>{
    socket = io.connect('http://localhost:3030');
    socket.on('connect', () => {
    });

    socket.on("enemy_data", (msg) => {
        enemy = msg;
         $('#enemies').append(`<div class="container"><p style="word-wrap: break-word;">"X:" ${enemy.x} "Y:" ${msg.y} "Base:" ${msg.num_base}:</p></div>`)
    });
    socket.on("set_enemy_2", (msg) => {
        enemy = msg;
    });
    socket.on("map_data", (msg) => {
        map = msg;
    });
    socket.on('msg', function (msg) {
            $('#users').append(`<div class="container"><p style="word-wrap: break-word;">${msg.message}</p>
                                        <span class="time-right">${msg.time}</span></div>`)

    });
    socket.on('dead', function (msg) {
        $('#enemies').append(`<div class="container"><p style="word-wrap: break-word;">"X:" ${enemy.x} "Y:" ${msg.y} "Base:" ${msg.num_base}:</p></div>`)
    });

});

function appp() {
    socket.json.emit('switch');
}
$("#resizableFrame").draggable({
    cursor: "move",
    cursorAt: {
        top: 5,
        left: 2
    }
});

$("#resizableFrame").resizable({
    maxHeight: 723,
    maxWidth: 750,
    minHeight: 200,
    minWidth: 200
});