/*jslint browser this */
/*global _, shipFactory, player, utils */

(function (global) {
    "use strict";

    // var sheep = {dom: {parentNode: {removeChild: function () {}}}};

    var player = {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        activeShip: 0,
        setGame: function (game) {
            this.game = game;
        },
        init: function () {
            // créé la flotte
            this.fleet.push(shipFactory.build(shipFactory.TYPE_BATTLESHIP));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_DESTROYER));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SUBMARINE));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SMALL_SHIP));

            // créé les grilles
            this.grid = utils.createGrid(10, 10);
            this.tries = utils.createGrid(10, 10);
        },
        play: function (col, line) {
            var self = this;
            // utils.sound['fire'].play();
            // appel la fonction fire du game, et lui passe une calback pour récupérer le résultat du tir
            self.game.fire(this, col, line, _.bind(function (hasSucced) {

                self.tries[line][col] = hasSucced;
            }, this));
        },
        // quand il est attaqué le joueur doit dire si il a un bateaux ou non à l'emplacement choisi par l'adversaire
        receiveAttack: function (col, line, callback) {
            var succeed = false;
            var cell = this.grid[line][col];
            var animationMiss = document.querySelector("#animationMiss");
            var animationHit = document.querySelector("#animationHit");
            // console.log(this.grid);
            // console.log("line : "+line);
            // console.log("col : "+col);
            // console.log("cell : "+cell);
            if (cell === "x" || cell === "." || cell === 0) {
                if (this.game.currentPhase === "PHASE_PLAY_PLAYER") {
                    animationMiss.style.display = "block";
                    animationMiss.play();
                    animationMiss.style.top = 1 + (60 * line) + "px";
                    animationMiss.style.left = 1 + (60 * col) + "px";
                    setTimeout(function () {
                        animationMiss.style.display = "none";
                    }, 1500);
                }
            } else {
                if (this.game.currentPhase === "PHASE_PLAY_PLAYER") {
                    animationHit.style.display = "block";
                    animationHit.play();
                    animationHit.style.top = 1 + (60 * line) + "px";
                    animationHit.style.left = 1 + (60 * col) + "px";
                    setTimeout(function () {
                        animationHit.style.display = "none";
                    }, 1200);
                }
            }
            if (cell === "x") {
                succeed = "alreadyHit";
            } else if (cell === ".") {
                succeed = "alreadyMiss";
            } else if (cell !== 0) {
                succeed = true;
                // console.log("cell : "+cell);
                if (cell > this.fleet.length) {
                    cell -= this.fleet.length;
                }
                // console.log("cell -- : "+cell);
                this.fleet[cell - 1].life -= 1;
                this.grid[line][col] = "x";
                if (this.fleet[cell - 1].life === 0) {
                    succeed = "sunk";
                    if (this.game.players[0].fleet[cell - 1].life === 0) {
                        var sunkShip = document.querySelector("." + this.fleet[cell - 1].getName());
                        sunkShip.className += " sunk";
                    }
                    if (this.checkGameOver() === true) {
                        // console.log("game Over : true");
                        this.game.win = true;
                    }
                }
            } else {
                this.grid[line][col] = ".";
            }
            callback.call(undefined, succeed);
        },
        checkGameOver: function () {
            var shipsAlives = this.fleet.length;
            this.fleet.forEach(function (ship) {
                // console.log("ship id : "+ship.getId()+" hp : "+ship.getLife());
                if (ship.getLife() <= 0) {
                    shipsAlives -= 1;
                }
                // console.log("vrai");
            });
            if (shipsAlives === 0) {
                return true;
            } else {
                return false;
            }
        },
        setActiveShipPosition: function (x, y) {
            var ship = this.fleet[this.activeShip];
            var i = 0;
            var j = 0;
            var math = Math.floor(ship.getLife() / 2);


            if (ship.getDirection() === "horizontal") {
                while (j < ship.getLife()) {
                    if (this.grid[y][x - math + j] !== 0) {
                        return false;
                    }
                    j += 1;
                }
                while (i < ship.getLife()) {
                    this.grid[y][x - math + i] = ship.getId();
                    i += 1;
                }
                // console.debug(ship);
                return true;
            } else {
                while (j < ship.getLife()) {
                    if (this.grid[y - math + j] === "undefined") {
                        return false;
                    }
                    if (this.grid[y - math + j][x] !== 0) {
                        return false;
                    }
                    j += 1;
                }
                while (i < ship.getLife()) {
                    this.grid[y - math + i][x] = ship.getId();
                    i += 1;
                }
                // console.debug(ship);
                return true;
            }
        },
        clearPreview: function () {
            this.fleet.forEach(function (ship) {
                if (ship.dom.parentNode) {
                    ship.dom.parentNode.removeChild(ship.dom);
                }
            });
        },
        resetShipPlacement: function () {
            this.clearPreview();

            this.activeShip = 0;
            this.grid = utils.createGrid(10, 10);
        },
        activateNextShip: function () {
            if (this.activeShip < this.fleet.length - 1) {
                this.activeShip += 1;
                return true;
            } else {
                return false;
            }
        },
        renderTries: function (grid) {
            this.tries.forEach(function (row, rid) {
                row.forEach(function (val, col) {
                    var node = grid.querySelector(".row:nth-child(" + (rid + 1) + ") .cell:nth-child(" + (col + 1) + ")");
                    if (val === true || val === "sunk") {
                        node.style.backgroundColor = "#e60019";
                    } else if (val === false) {
                        node.style.backgroundColor = "#aeaeae";
                    }
                });
            });
        },
        renderShips: function (grid, tries) {
            tries.forEach(function (row, rid) {
                row.forEach(function (val, col) {
                    var node = grid.querySelector(".row:nth-child(" + (col + 1) + ") .cell:nth-child(" + (rid + 1) + ")");
                    if (val === true || val === "sunk") {
                        node.style.backgroundColor = "#e60019";
                    }
                    // else if (val === false) {
                    //     node.style.backgroundColor = '#aeaeae';
                    // }
                });
            });
        },
        renderMiniMap: function (game) {
            var fleet = game.players[0].fleet;
            var minigrid = game.miniGrid;
            fleet.forEach(function (ship) {
                minigrid.innerHTML += ship.dom.outerHTML;
            });
        }
    };

    global.player = player;

}(this));