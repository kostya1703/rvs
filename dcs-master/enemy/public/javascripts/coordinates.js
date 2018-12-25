var socket;

var map;
var enemy;

var all_enemy = 0;
var distance_value;

$(document).ready(()=>{
    socket = io.connect('http://localhost:3030');
    socket.on('connect', () => {
        socket.json.emit('connected_enemy');
        socket.json.emit('get_enemy');
    });

    socket.on("enemy_data", (msg) => {
        enemy = msg;
    });

    socket.on("map_data", (msg) => {
        map = msg;
    });

    socket.on("update_enemy", () => {
        socket.json.emit('get_enemy');
        doitsjob();
    });
});


async function doitsjob() {
    socket.json.emit('get_map');
    await sleep(500);
    enemy_spawn();
    for(let i = 0; i < enemy.length; i++) {
        let min = 9999;
        for (let j = 0; j < map.base.length; j++) {
            if (min>distance(enemy[i], map.base[j])){
                min=distance(enemy[i], map.base[j]);
                enemy[i].num_base= j;
            }
        }
    }
    console.log(enemy);
    $('#log').empty().append(map).append(enemy);
    socket.json.emit('set_enemy', enemy);
}

function enemy_spawn() {
    while (all_enemy < 10) {
        if (enemy[all_enemy].isAlive === false) {
            enemy[all_enemy] = {
                x: Math.random()*1000,
                y: Math.random()*1000,
                isAlive: 1
            };
        }
        all_enemy++;
    }
}
function distance(enemy, base) {
    return distance_value = Math.sqrt( ((enemy.x - base.x)^2) +  ((enemy.y - base.y)^2))
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

