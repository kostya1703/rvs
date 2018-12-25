var express = require('express');
var router = express.Router();
var Enemiesinfo = require('../data/Enemy');
/* GET home page. */


var enemies = [];
for (key in Enemiesinfo) {
    enemies.push(Enemiesinfo[key]);
}

router.get('/', function (req, res) {
    res.render('index',
        {
            enemies: enemies,
        });
});
function getEnemy(fullObj) {
    return {
        x:fullObj.x,
        y:fullObj.y,
        alive:fullObj.alive,
        num_base:fullObg.num_base
    }
}
module.exports = router;
