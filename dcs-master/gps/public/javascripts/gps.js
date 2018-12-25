var socket;

var enemies;
var maps;
var isRight = true;
var app_running = false;

$(document).ready(()=>{
    socket = io.connect('http://localhost:3030');
    socket.on('connect', () => {
        socket.json.emit('connected_gps');
        init(socket);
    });

    socket.on("enemy_data", (msg) => {
        enemies = msg;
    });

    socket.on("map_data", (msg) => {
        maps = msg;
    });

    socket.on("change", () => {
        app_running = !app_running;
    });
    socket.on('msg', function (msg) {
        if (isRight) {
            $('#users1').append(`<div class="container"><p style="word-wrap: break-word;">${msg.message}</p>
                                        <span class="time-right">${msg.time}</span></div>`)
            isRight = false;
        } else {
            $('#users1').append(`<div class="container darker"><p style="word-wrap: break-word;">
                                        ${msg.message}</p><span class="time-left">${msg.time}</span></div>`)
            isRight = true;
        }
    });

});





class Base
{
    constructor(base)
    {
        this.x = base.x;
        this.y = base.y;
        this.enemies = 0;
        this.from = 0;
        this.attended = false;
    }
}

class Tank
{
    constructor()
    {
        this.onMission = false;
        this.position = 0;
        this.path = [];

        this.assignPath = this.assignPath.bind(this);
        this.moveForward = this.moveForward.bind(this);
    }

    assignPath(map)
    {
        socket.json.emit('msg', {name: 'Tank', value: 'Calculating next mission'});
        let current_max = 0;
        let current_dest = 0;
        map.scan();
        for (let i = 0; i < map.bases.length; i++)
        {
            if ((map.bases[i].enemies/map.dijkstra[i] > current_max) && (i != this.position))
            {
                current_max = map.bases[i].enemies / map.dijkstra[i];
                current_dest = i;
            }
        }
        socket.json.emit('msg', {name: 'Tank', value: 'Mission assigned. Calculating path'});
        this.path[0] = current_dest;
        while (this.path[0] !== this.position)
        {
            this.path.unshift(map.bases[this.path[0]].from);
        }
        this.path.shift();
        this.onMission = true;
        socket.json.emit('msg', {name: 'Tank', value: 'Path calculated'});
    }

    moveForward()
    {
        this.position = this.path[0];
        this.path.shift();
        sleep(2500);
    }
}

class Enemy
{
    constructor(data)
    {
        this.x =  data.x;
        this.y =  data.y;
        this.isAlive = data.alive;
        this.belongs = data.num_base;

        this.respawn = this.respawn.bind(this);
    }

    respawn(data)
    {
        this.x = data.x;
        this.y = data.y;
        this.isAlive = true;
        this.belongs = data.num_base;
        socket.json.emit('msg', {name: 'Enemy', value: 'New enemy located'});
    }
}

class Karta {

    constructor(data, enemies)
    {
        this.enemies = [];
        this.bases = [];

        this.spawnBases = this.spawnBases.bind(this);
        this.spawnEnemies = this.spawnEnemies.bind(this);
        this.dijkstrify = this.dijkstrify.bind(this);
        this.sectorClear = this.sectorClear.bind(this);
        this.createDijkstra = this.createDijkstra.bind(this);
        this.scan = this.scan.bind(this);
        this.hasUnattended = this.hasUnattended.bind(this);

        this.spawnEnemies(enemies);
        this.spawnBases(data.base);
        this.initial = data.initial;
        this.dijkstra = [];
        this.createDijkstra();
    }

    spawnEnemies(data)
    {
        for (let i = 0; i < data.length; i++)
        {
            this.enemies[i] = new Enemy(data[i]);
        }
    }

    scan()
    {
        for (let i = 0; i < this.bases.length; i++)
        {
            this.bases[i].enemies = 0;
        }
        for (let j = 0; j < this.enemies.length; j++)
        {
            this.bases[this.enemies[j].belongs].enemies += 1;
        }
    }

    spawnBases(data)
    {
        for (let i = 0; i < data.length; i++)
        {
            this.bases[i] = new Base(data[i]);
        }
    }

    hasUnattended()
    {
        for (let i = 0; i < this.bases.length; i++) {
            if (!this.bases[i].attended) return true;
        }
        return false;
    }

    dijkstrify(gde_tank)
    {
        this.dijkstra[gde_tank] = 0;
        while (this.hasUnattended())
        {
            for (let i = 0; i < this.bases.length; i++) {
                for (let j = 0; j < this.bases.length; j++) {
                    if (this.dijkstra[i] > this.dijkstra[j] + this.initial[i][j])
                    {
                        this.dijkstra[i] = this.dijkstra[j] + this.initial[i][j];
                        this.bases[i].from = j;
                        this.bases[j].attended = false;
                    }
                }
                this.bases[i].attended = true;
            }
        }
    }

    sectorClear(sector)
    {
        for (let i = 0; i < this.enemies.length; i++)
        {
            if (this.enemies[i].belongs === sector)
            {
                this.enemies[i].isAlive = false;
                socket.json.emit('set_enemy_2', this.enemies)
            }
        }
        socket.json.emit('msg', {name: 'Tank', value: "Sector " + sector + "clear!"});
    }

    createDijkstra()
    {
        for (let i = 0; i < this.initial.length; i++) {
            for (let j = 0; j < this.initial.length; j++) {
                this.initial[i][j] = this.initial[i][j]*distance(this.bases[i], this.bases[j]);
                if (this.initial[i][j] == 0)
                    this.initial[i][j] = 999999;
            }
        }
        for (let i = 0; i < this.bases.length; i++) {
            this.dijkstra[i] = 999999;
        }
    }
}

async function init(socket)
{
    if (app_running) {
        socket.json.emit('get_map');
        socket.json.emit('get_enemy');
        await sleep(500);
        let map = new Karta(maps, enemies);
        let tank = new Tank();
        task(map, tank, socket);
    }
    else {
        setTimeout(function () {
            init(socket);
        }, 100);
    }
}

async function task(map, tank, socket) {
    map.dijkstrify(tank.position);
    tank.assignPath(map);
    while (tank.path.length !== 0)
    {
        tank.moveForward();
        socket.json.emit('msg', {name: 'Tank', value: "Moved to base " + tank.position});
        /*тут танк едет*/
    }
    map.sectorClear(tank.position);
    await sleep(1000);
    socket.json.emit('get_enemy');
    for (let i = 0; i < map.enemies.length; i++)
    {
        if (!map.enemies[i].isAlive) map.enemies[i].respawn(enemies[i]);
    }
    await sleep(2000);
    init(socket);
}

function distance(enemy, base) {
    return Math.sqrt(Math.pow((enemy.x - base.x), 2) + Math.pow((enemy.y - base.y), 2)).toFixed(3);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}