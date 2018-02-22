/*jslint browser this */
/*global _, player, computer, utils */

(function () {
    "use strict";

    var game = {
        PHASE_INIT_PLAYER: "PHASE_INIT_PLAYER",
        PHASE_INIT_OPPONENT: "PHASE_INIT_OPPONENT",
        PHASE_PLAY_PLAYER: "PHASE_PLAY_PLAYER",
        PHASE_PLAY_OPPONENT: "PHASE_PLAY_OPPONENT",
        PHASE_GAME_OVER: "PHASE_GAME_OVER",
        PHASE_WAITING: "waiting",

        currentPhase: "",
        phaseOrder: [],
        // garde une référence vers l'indice du tableau phaseOrder qui correspond à la phase de jeu pour le joueur humain
        playerTurnPhaseIndex: 2,

        // l'interface utilisateur doit-elle être bloquée ?
        waiting: false,

        // garde une référence vers les noeuds correspondant du dom
        grid: null,
        miniGrid: null,

        // liste des joueurs
        players: [],

        // fin de jeu
        win: false,
        // lancement du jeu
        init: function () {

            // initialisation
            this.grid = document.querySelector('.board .main-grid');
            this.miniGrid = document.querySelector('.mini-grid');

            // défini l'ordre des phase de jeu

            this.phaseOrder = [
                this.PHASE_INIT_PLAYER,
                this.PHASE_INIT_OPPONENT,
                this.PHASE_PLAY_PLAYER,
                this.PHASE_PLAY_OPPONENT,
                this.PHASE_GAME_OVER
            ];
            this.playerTurnPhaseIndex = 0;

            // initialise les joueurs
            this.setupPlayers();

            // ajoute les écouteur d'événement sur la grille
            this.addListeners();
            // c'est parti !
            this.goNextPhase();
        },
        setupPlayers: function () {
            // donne aux objets player et computer une réference vers l'objet game
            player.setGame(this);
            computer.setGame(this);

            // todo : implémenter le jeu en réseaux
            this.players = [player, computer];

            this.players[0].init();
            this.players[1].init();
        },
        goNextPhase: function () {
            // récupération du numéro d'index de la phase courante
            var ci = this.phaseOrder.indexOf(this.currentPhase);
            var self = this;
            if(this.win === true) {
                this.currentPhase = this.phaseOrder[4];
            }
            else if (ci !== this.phaseOrder.length - 1) {
                this.currentPhase = this.phaseOrder[ci + 1];
            }
            switch (this.currentPhase) {
            case this.PHASE_GAME_OVER:
                // detection de la fin de partie
                if (!this.gameIsOver()) {
                    this.currentPhase = this.phaseOrder[2];
                    utils.info("A vous de jouer, choisissez une case !");
                    // le jeu n'est pas terminé on recommence un tour de jeu
                }
                else {
                    utils.info("Game Over");
                }
                break;
            case this.PHASE_INIT_PLAYER:
                utils.info("Placez vos bateaux");
                break;
            case this.PHASE_INIT_OPPONENT:
                this.wait();
                utils.info("En attente de votre adversaire");
                this.players[1].areShipsOk(function () {
                    self.stopWaiting();
                    self.goNextPhase();
                });
                break;
            case this.PHASE_PLAY_PLAYER:
                utils.info("A vous de jouer, choisissez une case !");
                break;
            case this.PHASE_PLAY_OPPONENT:
                utils.info("A votre adversaire de jouer...");
                this.players[1].play();
                break;
            }

        },
        gameIsOver: function () {
            return game.win;
        },
        getPhase: function () {
            if (this.waiting) {
                return this.PHASE_WAITING;
            }
            return this.currentPhase;
        },
        // met le jeu en mode "attente" (les actions joueurs ne doivent pas être pris en compte si le jeu est dans ce mode)
        wait: function () {
            this.waiting = true;
        },
        // met fin au mode mode "attente"
        stopWaiting: function () {
            this.waiting = false;
        },
        addListeners: function () {
            // on ajoute des acouteur uniquement sur la grid (délégation d'événement)
            this.grid.addEventListener('mousemove', _.bind(this.handleMouseMove, this));
            this.grid.addEventListener('click', _.bind(this.handleClick, this));
            this.grid.addEventListener('contextmenu', _.bind(this.handleRightClick, this));
        },
        displayPreview: function (ship, e) {
            if(ship.getDirection() === "horizontal") {
                ship.dom.style.top = "" + (utils.eq(e.target.parentNode)) * utils.CELL_SIZE + "px";
                ship.dom.style.left = "" + utils.eq(e.target) * utils.CELL_SIZE - Math.floor(ship.getLife() / 2) * utils.CELL_SIZE + "px";
            }
            else {
                ship.dom.style.top = "" + (utils.eq(e.target.parentNode)) * utils.CELL_SIZE - Math.floor(ship.getLife() / 2) * utils.CELL_SIZE + "px";
                ship.dom.style.left = "" + utils.eq(e.target) * utils.CELL_SIZE + "px";
            }
        },
        handleMouseMove: function (e) {
            // on est dans la phase de placement des bateau
            if (this.getPhase() === this.PHASE_INIT_PLAYER && e.target.classList.contains('cell')) {
                var ship = this.players[0].fleet[this.players[0].activeShip];

                // si on a pas encore affiché (ajouté aux DOM) ce bateau
                if (!ship.dom.parentNode) {
                    this.grid.appendChild(ship.dom);
                    // passage en arrière plan pour ne pas empêcher la capture des événements sur les cellules de la grille
                    ship.dom.style.zIndex = -1;
                }

                // décalage visuelle, le point d'ancrage du curseur est au milieu du bateau
                this.displayPreview(ship, e);
            }
        },
        handleClick: function (e) {
            // self garde une référence vers "this" en cas de changement de scope
            var self = this;
            var ship = this.players[0].fleet[this.players[0].activeShip];

            // si on a cliqué sur une cellule (délégation d'événement)
            if (e.target.classList.contains('cell')) {
                // si on est dans la phase de placement des bateau
                if (this.getPhase() === this.PHASE_INIT_PLAYER && ship.dom.parentNode) {
                    // on enregistre la position du bateau, si cela se passe bien (la fonction renvoie true) on continue
                    if (this.players[0].setActiveShipPosition(utils.eq(e.target), utils.eq(e.target.parentNode))) {
                        // et on passe au bateau suivant (si il n'y en plus la fonction retournera false)
                        if (!this.players[0].activateNextShip()) {
                            this.wait();
                            utils.confirm("Confirmez le placement ?", function () {
                                // si le placement est confirmé
                                self.stopWaiting();
                                self.renderMiniMap();
                                self.players[0].clearPreview();
                                // console.log(self.players[0].grid);
                                var first = document.querySelector('input[name=start]:checked').value;
                                if(first === 'computer') {
                                    self.phaseOrder = [
                                        self.PHASE_INIT_PLAYER,
                                        self.PHASE_INIT_OPPONENT,
                                        self.PHASE_PLAY_OPPONENT,
                                        self.PHASE_PLAY_PLAYER,
                                        self.PHASE_GAME_OVER
                                    ];
                                }
                                else if(first === 'random') {
                                    if(utils.randomInt(1, 2) === 2) {
                                        self.phaseOrder = [
                                            self.PHASE_INIT_PLAYER,
                                            self.PHASE_INIT_OPPONENT,
                                            self.PHASE_PLAY_OPPONENT,
                                            self.PHASE_PLAY_PLAYER,
                                            self.PHASE_GAME_OVER
                                        ];
                                    }
                                }
                                document.querySelector('#radios').style.display = 'none';
                                self.goNextPhase();
                            }, function () {
                                self.stopWaiting();
                                // sinon, on efface les bateaux (les positions enregistrées), et on recommence
                                self.players[0].resetShipPlacement();

                            });
                        }
                    }
                // si on est dans la phase de jeu (du joueur humain)
                } else if (this.getPhase() === this.PHASE_PLAY_PLAYER) {
                    this.players[0].play(utils.eq(e.target), utils.eq(e.target.parentNode));
                }
            }
        },
        handleRightClick: function (e) {
            if(this.getPhase() === this.PHASE_INIT_PLAYER) {
                var ship = this.players[0].fleet[this.players[0].activeShip];
                if(ship.getDirection() === "horizontal") {
                    ship.setDirection("vertical");
                    ship.dom.style.height = "" + utils.CELL_SIZE * ship.life + "px";
                    ship.dom.style.width = "" + utils.CELL_SIZE + "px";
                }
                else {
                    ship.setDirection("horizontal");
                    ship.dom.style.height = "" + utils.CELL_SIZE + "px";
                    ship.dom.style.width = "" + utils.CELL_SIZE * ship.life + "px";
                }
                this.displayPreview(ship, e);
            }
        },
        // fonction utlisée par les objets représentant les joueurs (ordinateur ou non)
        // pour placer un tir et obtenir de l'adversaire l'information de réusssite ou non du tir
        fire: function (from, col, line, callback) {
            this.wait();
            var self = this;
            var msg = "";
            var animationHit = document.querySelector('#animationHit');
            var animationMiss = document.querySelector('#animationMiss');

            // determine qui est l'attaquant et qui est attaqué
            var target = this.players.indexOf(from) === 0
                ? this.players[1]
                : this.players[0];

            if (this.currentPhase === this.PHASE_PLAY_OPPONENT) {
                msg += "Votre adversaire vous a... ";
            }

            // on demande à l'attaqué si il a un bateaux à la position visée
            // le résultat devra être passé en paramètre à la fonction de callback (3e paramètre)
            utils.sound['fire'].play();
            setTimeout(function() {
                target.receiveAttack(col, line, function (hasSucceed) {
                    if (hasSucceed === 'alreadyHit') {
                        msg += "Déja touché...";
                        utils.sound['miss'].play();
                        // animationMiss.play();
                    }
                    else if (hasSucceed === 'alreadyMiss') {
                        msg += "Déja raté...";
                        utils.sound['miss'].play();
                        // animationMiss.play();
                    }
                    else if (hasSucceed === 'sunk') {
                        msg += "Touché coulé !";
                        utils.sound['hit'].play();
                        // animationHit.play();
                    }
                    else if (hasSucceed) {
                        msg += "Touché !";
                        utils.sound['hit'].play();
                        // animationHit.play();
                    }
                    else {
                        msg += "Manqué...";
                        utils.sound['miss'].play();
                        // animationMiss.play();
                    }
                    utils.info(msg);

                    // on invoque la fonction callback (4e paramètre passé à la méthode fire)
                    // pour transmettre à l'attaquant le résultat de l'attaque
                    callback(hasSucceed);
                    self.renderMap();
                    if (self.currentPhase === self.PHASE_PLAY_OPPONENT) {
                        self.players[0].renderShips(self.miniGrid, self.players[1].tries);
                        // console.log(self.players[0].fleet);
                        // console.log(self.players[1].fleet);
                    }

                    // on fait une petite pause avant de continuer...
                    // histoire de laisser le temps au joueur de lire les message affiché
                    setTimeout(function () {
                        self.stopWaiting();
                        self.goNextPhase();
                    }, 1000);
                });
            }, 1000);

        },
        renderMap: function () {
            // console.log(this.grid);
            this.players[0].renderTries(this.grid);
        },
        renderMiniMap: function () {
            this.players[0].renderMiniMap(this);
        }
    };
    // point d'entrée
    document.addEventListener('DOMContentLoaded', function () {
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        }, true);
        game.init();
    });

}());