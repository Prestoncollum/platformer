const CELL_DIM = 20; // cell dimension

// Create the state that will contain the whole game
var mainState = {
  preload: function() {
    // Here we preload the assets
    game.load.spritesheet('player', 'assets/robot.png', 80, 111, 38);
    game.load.image('wall', 'assets/wall.png');
    game.load.spritesheet('coin', 'assets/battery.png', 80, 111, 28);
    game.load.image('enemy', 'assets/saw.png');
    game.load.image('background', "assets/background.jpg");
    game.load.image('lasers', 'assets/lazer.png');
  },

  create: function() {
    clearInterval(this.movingWallIntervalId);
    this.game = game;

    // Generates and animates background
    this.tileSprite = game.add.tileSprite(0, 0, 2000, 1000, 'background');
    this.tileSprite.autoScroll(-7,7);


    // Start the Arcade physics system (for movements and collisions)
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Add the physics engine to all game objects
    game.world.enableBody = true;

    // Variable to store the arrow key pressed
    this.cursor = game.input.keyboard.createCursorKeys();


    // Create the player in the middle of the game
    this.player = game.add.sprite(100, 150, 'player');
    this.player.width = 35;
    this.player.height = 35;

    // Creates player animations
    this.player.animations.add('walk', [10,11,12,13,14,15,16], 12,true);
    this.player.animations.add('idle', [0,1,2,3,4,5,6,7,8,9], 12,true);
    this.player.animations.add('walk-left', [20,21,22,23,24,25,26,], 12,true);
    this.player.animations.add('idle-left', [29,30,31,32,33,34,35,36,37], 12,true);

    // Add gravity to make it fall
    this.player.body.gravity.y = 850;

    // Create 3 groups that will contain our objects
    this.walls = game.add.group();
    this.coins = game.add.group();
    this.enemies = game.add.group();
    this.specialWalls = game.add.group();
    this.specialCoin = null;
    this.removeableEnemies = [];
    this.removeableWalls = [];
    this.mysteryWalls = [];
    this.movingWall = null;
    this.movingWallIntervalId = null;
    this.hiddenEnemySpriteCoords = [];
    this.visibleHiddenEnemies = [];
    this.lastMovedDirection = null;

    // Design the level. x = wall, o = coin, ! = lava.
    var level = [
       'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 
       'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
       'x!                                    x',
       'x! hhhh  h       hhh  h  h hhhh   s   x',
       'x! h             h    h  h h  h       x',
       'x! h hhh h h   h hhh  h  h hhhh       x',
       ' r h  h  h  h h  h    h  h h  o h  h  x',
       'or hhhh  h   h   hhh  hhhh h    h xh  x',
       ' r                              h  h  x',
       'x!                        m     h  h tx',
       'x!                     o        h  h  x',
       'xxxxxxxx!  !xxx!!!!!!!!q!!!!!!!!!!!!!!x',
       'xxxxxxxx!  !xxxxxxxxxxxxxxxxxxxxxxxxxxx',
       '      xx!  !xx        				   ',
       '      xx!  !xx        			       ',
       '      xx!  !xx        				   ',
       '      xx!  !xx        				   ',
       '      xx! o!xx        				   ',
       '      xxxxxxxx         				   ',
    ];

    // Create the level by going through the array
    for (var i = 0; i < level.length; i++) {
      for (var j = 0; j < level[i].length; j++) {

          // Create a wall and add it to the 'walls' group
          if (level[i][j] == 'x') {
              var wall = game.add.sprite(30+20*j, 30+20*i, 'wall');
              wall.width = CELL_DIM;
              wall.height = CELL_DIM;
              this.walls.add(wall);
              wall.body.immovable = true;
          }

          // Create a coin and add it to the 'coins' group
          else if (level[i][j] == 'o') {
              var coin = game.add.sprite(30+20*j, 30+20*i, 'coin');
              coin.width = 20;
              coin.height = 20;
              this.coins.add(coin);
          }


          // Create a enemy and add it to the 'enemies' group
          else if (level[i][j] == '!') {
              var enemy = game.add.sprite(30+20*j, 30+20*i, 'enemy');
              enemy.width = CELL_DIM;
              enemy.height = CELL_DIM;
              this.enemies.add(enemy);
          }

          else if (level[i][j] == 's') {
              var specialCoin = game.add.sprite(30+20*j, 30+20*i, 'coin');
              specialCoin.width = CELL_DIM;
              specialCoin.height = CELL_DIM;
              this.specialCoin = specialCoin;
          }

          else if (level[i][j] == 'r') {
            var removeableEnemy = game.add.sprite(30+20*j, 30+20*i, 'enemy');
            removeableEnemy.width = CELL_DIM;
            removeableEnemy.height = CELL_DIM;
            this.removeableEnemies.push(removeableEnemy);
            this.enemies.add(removeableEnemy);
          }

          else if (level[i][j] == 'd') {
            var removeableWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            removeableWall.width = CELL_DIM;
            removeableWall.height = CELL_DIM;
            this.removeableWalls.push(removeableWall);
            this.walls.add(removeableWall);
            removeableWall.body.immovable = true;
          }

          else if (level[i][j] == 'q') {
            var mysteryWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            mysteryWall.width = CELL_DIM;
            mysteryWall.height = CELL_DIM;
            this.mysteryWalls.push(mysteryWall);
            this.walls.add(mysteryWall);
            mysteryWall.body.immovable = true;
          }

          else if (level[i][j] == 'm') {
            var movingWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            movingWall.width = CELL_DIM;
            movingWall.height = CELL_DIM;
            this.movingWall = movingWall;
            this.walls.add(this.movingWall);
            this.movingWall.body.immovable = true;
          }

          else if (level[i][j] == 't') {
            var specialWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            specialWall.width = CELL_DIM;
            specialWall.height = CELL_DIM;
            this.specialWalls.add(specialWall);
            specialWall.body.immovable = true;
          }

          else if (level[i][j] == 'h') {
            this.hiddenEnemySpriteCoords.push([ 30+20*j, 30+20*i ]);
          }
      }
    }


    // Animates the battery
    this.coins.callAll('animations.add','animations', 'charge', [0,1,2,3,4,5,6,7,8], 8, true);
    this.coins.callAll('animations.play', 'animations', 'charge');

    // Animates special coin batteries
    this.specialCoin.animations.add('charge', [0,1,2,3,4,5,6,7,8], 8, true);
    this.specialCoin.animations.play('charge');
  },

  update: function() {
    // Make the player and the walls collide
    game.physics.arcade.collide(this.player, this.walls);
    game.physics.arcade.collide(this.player, this.specialWalls, this.handleSpecialWallCollision, null, this);

    // Call the 'takeCoin' function when the player takes a coin
    game.physics.arcade.overlap(this.player, this.coins, this.takeCoin, null, this);

    // Call the 'takeCoin' function when the player takes a coin
    game.physics.arcade.overlap(this.player, this.specialCoin, this.takeSpecialCoin, null, this);

    // Call the 'restart' function when the player touches the enemy
    game.physics.arcade.overlap(this.player, this.enemies, this.restart, null, this);

    // Here we update the game 60 times per second
    // Move the player when an arrow key is pressed

     if (this.cursor.right.isDown){
      this.player.animations.play('walk', 12, false);
      this.player.body.velocity.x = 200;
      this.lastMovedDirection = 'left';
    }

    else if (this.cursor.left.isDown){
      this.player.animations.play('walk-left', 12, false);
      this.player.body.velocity.x = -200;
      this.lastMovedDirection = 'right';
    }
    else{
      this.player.body.velocity.x = 0;
      if (this.lastMovedDirection === 'right') {
        this.player.animations.play('idle-left', 12, false);
      } else {
        this.player.animations.play('idle', 12, false);
      }
    }

    // Make the player jump if he is touching the ground
    if (this.cursor.up.isDown && this.player.body.touching.down){
       this.player.body.velocity.y = -300;
    }
  },

  // Function to kill a coin
  takeCoin: function(player, coin) {
    coin.kill();
  },

  takeSpecialCoin: function(player, specialCoin) {
    console.log(this.hiddenEnemySpriteCoords)

    specialCoin.kill();
    this.removeableEnemies.forEach(enemy => enemy.kill());
    this.removeableWalls.forEach(wall => wall.kill());
    this.mysteryWalls.forEach(mysteryWall => {
      const x = mysteryWall.world.x;
      const y = mysteryWall.world.y;
      mysteryWall.kill();

      const enemy = this.game.add.sprite(x, y, 'enemy');
      enemy.width = CELL_DIM;
      enemy.height = CELL_DIM;
      this.enemies.add(enemy);
    });

    setTimeout(() => {
      this.hiddenEnemySpriteCoords.forEach(([x,y]) => {
        const enemy = this.game.add.sprite(x, y, 'enemy');
        enemy.width = CELL_DIM;
        enemy.height = CELL_DIM;
        this.enemies.add(enemy);
        this.visibleHiddenEnemies.push(enemy);
      });
    })
  },

  handleSpecialWallCollision: function(player, wall) {
    if (this.movingWallIntervalId) {
      return;
    }

    this.visibleHiddenEnemies.forEach(enemy => enemy.kill());

    const moveTime = 500; // ms
    const moveWallLeft = ({ numSpaces }) => {
      const x = this.movingWall.world.x;
      const y = this.movingWall.world.y;

      this.game.physics.arcade.moveToXY(this.movingWall, x - numSpaces * CELL_DIM, y, 0, moveTime);
    }

    const moveWallRight = ({ numSpaces }) => {
      const x = this.movingWall.world.x;
      const y = this.movingWall.world.y;

      this.game.physics.arcade.moveToXY(this.movingWall, x + numSpaces * CELL_DIM, y, 0, moveTime);
    }

    moveWallLeft({ numSpaces: 2 });

    let shouldMoveRightNext = true;
    this.movingWallIntervalId = setInterval(() => {
      if (shouldMoveRightNext) {
        shouldMoveRightNext = false;
        moveWallRight({ numSpaces: 4 });
      } else {
        shouldMoveRightNext = true;
        moveWallLeft({ numSpaces: 4 });
      }
    }, moveTime);
  },

  // Function to restart the game
  restart: function() {
    clearInterval(this.movingWallIntervalId);
    game.state.start('main');
  }
};

// Initialize the game and start our state
var game = new Phaser.Game(900, 450, Phaser.AUTO);
game.state.add('main', mainState);
game.state.start('main');
