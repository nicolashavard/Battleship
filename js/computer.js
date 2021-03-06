/*jslint browser this */
/*global _, player, utils */

(function (global) {
    "use strict";

    var computer = _.assign({}, player, {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        setGame: function (game) {
            this.game = game;
        },
        findEmpty: function () {
            var self = this;
            var i = 0;
            var empty = [];
            var coord = {};
            self.tries.forEach(function (test, line) {
                test.forEach(function (test2, col) {
                    if (test2 === 0) {
                        coord = {
                            "y": line,
                            "x": col
                        };
                        empty[i] = coord;
                        i += 1;
                    }
                });
            });
            // console.log(empty);
            return empty;
        },
        play: function () {
            var self = this;
            var empty = self.findEmpty();
            var emptyLength = empty.length;
            // console.log("emptylength : " + emptyLength);
            var index = utils.randomInt(0, emptyLength);
            var coords = empty[index];
            // console.log(self.game.IALevel);

            if (self.game.IALevel === "hard") {
                ///////////////////////////////////////////////
                setTimeout(function () {
                    self.game.fire(this, coords.x, coords.y, function (hasSucced) {
                        // console.log("enemy hit on : Y = " + coords.y + " X = " + coords.x);
                        self.tries[coords.y][coords.x] = hasSucced;
                    });
                }, 2000);
                ///////////////////////////////////////////////
            } else if (self.game.IALevel === "medium") {
                ///////////////////////////////////////////////
                setTimeout(function () {
                    self.game.fire(this, coords.x, coords.y, function (hasSucced) {
                        // console.log("enemy hit on : Y = " + coords.y + " X = " + coords.x);
                        self.tries[coords.y][coords.x] = hasSucced;
                    });
                }, 2000);
                ///////////////////////////////////////////////

            } else {
                var x;
                var y;
                x = utils.randomInt(0, 9);
                y = utils.randomInt(0, 9);
                setTimeout(function () {
                    self.game.fire(this, x, y, function (hasSucced) {
                        // console.log("enemy hit on : Y = " + y + " X = " + x);
                        self.tries[y][x] = hasSucced;
                    });
                }, 2000);
            }
        },
        areShipsOk: function (callback) {
            var self = this;

            this.fleet.forEach(function (ship) {
                var hp;
                var x = 9;
                var y = 9;
                var done = false;
                var coordX;
                var coordY;
                var ligne;
                var col;
                var i;
                while (!done) {
                    hp = ship.getLife();
                    // vertical
                    if (utils.randomInt(0, 1) === 1) {
                        y = 10 - hp;
                        coordX = utils.randomInt(0, x);
                        coordY = utils.randomInt(0, y);
                        // console.log("Vertical ship " + ship.getId() + " coordsY : " + coordY + " coordX : " + coordX);
                        if (self.grid[coordY][coordX] === 0) {
                            hp -= 1;
                            ligne = coordY;
                            while (hp > 0) {
                                if (self.grid[ligne + 1][coordX] !== 0) {
                                    // console.log("         /!\\ ship " + ship.getId() + " coordsY : " + (ligne + 1) + " coordX : " + coordX);
                                    break;
                                }
                                hp -= 1;
                                ligne += 1;
                            }
                            if (hp === 0) {
                                //Bateau ok, on pose
                                i = ship.getLife();
                                while (i > 0) {
                                    self.grid[coordY + i - 1][coordX] = ship.getId();
                                    done = true;
                                    i -= 1;
                                }
                            }
                        }
                    } else { /*Horizontal*/
                        x = 10 - hp;
                        coordX = utils.randomInt(0, x);
                        coordY = utils.randomInt(0, y);
                        // console.log("Horizontal ship " + ship.getId() + " coordsY : " + coordY + " coordX : " + coordX);
                        if (self.grid[coordY][coordX] === 0) {
                            hp -= 1;
                            col = coordX;
                            while (hp > 0) {
                                if (self.grid[coordY][col + 1] !== 0) {
                                    // console.log("           /!\\ ship " + ship.getId() + " coordsY : " + coordY + " coordX : " + (col + 1));
                                    break;
                                }
                                hp -= 1;
                                col += 1;
                            }

                            if (hp === 0) {
                                //Bateau ok, on pose
                                i = ship.getLife();
                                while (i > 0) {
                                    self.grid[coordY][coordX + i - 1] = ship.getId();
                                    done = true;
                                    i -= 1;
                                }
                            }
                        }
                    }
                }
            }, this);

            setTimeout(function () {
                callback();
            }, 500);
            // console.log(this.grid);
        }
    });

    global.computer = computer;

}(this));