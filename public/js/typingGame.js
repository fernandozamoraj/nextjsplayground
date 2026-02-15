//Author: Fernando Zamorajimenez
//
//The key to this pen is the referenced files simpleGame.js and simpleGameExtensions.js
//the libaries are referenced in the pen's settings in the javaScript tag
//SimpleGame.js is a resource that belongs to A. Harris, 
//author of HTML Game 5 Development for Dummies http://aharrisbooks.net/h5g/
//
//simple_game_extensions.js is a library I created to add additional functionality to 
//simpleGame.js.
//https://pacroids.apphb.com/js/lib/simpleGame.js
//https://pacroids.apphb.com/js/lib/simple_game_extension.js

function Score(){
    var _kills = 0;
    var _losses = 0;
    var _killStreak = 0;
  
    this.addLoss = function(){
      _losses += 1;
      _killStreak = 0;
    };
    
    this.addKill = function(){
      _kills += 1;
      _killStreak += 1;
    };

    this.getTotalWords = function(){
      return _kills + _losses;
    }
    
    this.getScoreString = function(){
        return "KILLS: " + _kills + "              STREAK: " + _killStreak + "             LOSSES: " + _losses;
    };
}

function GameState(){
    this.NOT_STARTED = 0;
    this.PLAYING = 2, 
    this.OVER = 4;
  
    var _currentState = this.NOT_STARTED;

    this.changeState = function(){
      _currentState += 2;
      if(_currentState > OVER){
        _currentState = NOT_STARTED;
      }      
    }
    
    this.getState = function(){
      return _currentState;
    }    
}

function Game(){

  var DOWN_ANGLE = 180;
  var SCREEN_HEIGHT = 600;
  var SCREEN_WIDTH = 1200;
  var WORD_LENGTH = 7;
  var SCORE_FONT = "Orbitron";
  var GAME_FONT = "Josefin Slab";
  var _scene;
  var _sentinels = [];
  
  var _currentWord =  false;
  var _scoreSprite = false;
  var _killedLetters = [];
  var MAX_WORDS = 50;  
  
  
  function getRandomChar(){
    return String.fromCharCode(Math.floor(Math.random()*26)+97);
  }
  
  function getRandomString(){
    
    var randomLength = Math.floor(Math.random()*WORD_LENGTH)+1;
    var randomString = "";
    try{
        while(randomLength > 0){
            randomString += getRandomChar();
            randomLength--;
        }
    }
    catch(error){
        console.log(error.message);
    }
  
    return randomString;
  }
  
  function createScoreSprite(){
    
      //normally sprites use img files but I am just using it to write text
      //in whatever positiong the sprite happens to be in
      var temp = new EnhancedSprite(_scene, '', 136, 34);

      temp.setMoveAngle(DOWN_ANGLE);
      temp.setSpeed(0);  
      temp.score = new Score();

      //not sure that this matters since I am not using an image
      temp.loadAnimation(136, 34, 34, 34);

      //normally you don't need this with Sprite but you do
      //with EnhancedSprite... it's to cycle through the imamges
      //in the image map.  I have to do it here since I used 
      //EnhancedSprite but normally you don't need it
      temp.generateAnimationCycles();
      temp.renameCycles(new Array("east"));
      temp.setAnimationSpeed(200);
      temp.setCurrentCycle("east");

      //space our the sentinels across the screen
      temp.setPosition(20, 20);
      
      temp.addKill = function(){
          this.score.addKill();
      };
      
      temp.addLoss = function(){
          this.score.addLoss();
      };
      
      temp.baseUpdate = temp.update;
    
      temp.update = function(){
            var fontFamily = SCORE_FONT;
            var fontSize = "25";
            var fontColor = "#dddddd";

            this.baseUpdate();
            this.writeText(fontFamily, fontSize, fontColor, this.score.getScoreString(), this.x, this.y);
      };

      _scoreSprite = temp;
  }
  
  function createCurrentWordSprite(){
    
    //normally sprites use img files but I am just using it to write text
    //in whatever positiong the sprite happens to be in
    var temp = new EnhancedSprite(_scene, '', 136, 34);

    temp.setMoveAngle(DOWN_ANGLE);
    temp.setSpeed(0);  
    temp.randomString = "Start typing what you see - backspace to clear"; 

    //not sure that this matters since I am not using an image
    temp.loadAnimation(136, 34, 34, 34);

    //normally you don't need this with Sprite but you do
    //with EnhancedSprite... it's to cycle through the imamges
    //in the image map.  I have to do it here since I used 
    //EnhancedSprite but normally you don't need it
    temp.generateAnimationCycles();
    temp.renameCycles(new Array("east"));
    temp.setAnimationSpeed(200);
    temp.setCurrentCycle("east");

    //space our the sentinels across the screen
    temp.setPosition(SCREEN_WIDTH / 2 - 100, SCREEN_HEIGHT - 100);

    _currentWord = temp;
  }
  
  function getRandomXPosition(){
    try{
      var xPosition = (Math.floor(Math.random()*(SCREEN_WIDTH-250))+50);
      xPosition = xPosition - (xPosition%100);

      return xPosition;
    }
    catch(error){
      console.log(error.message);
    }

    return 0;
  }
  
  function getRandomYPosition(){
    try{
      var position = (Math.floor(Math.random()*100));
      position = position - (position%100);
    
      return position;
    }
    catch(error){
      console.log(error.message);
    }

    return 0;
  }

  //TODO: this deserves its own object/class
  function createKilledLetters(){

    try{
      var temp;
      
      var MAX_LETTERS = 100;

      for(var i = 0; i < MAX_LETTERS; i++){
          
          //normally sprites use img files but I am just using it to write text
          //in whatever positiong the sprite happens to be in
          temp = new EnhancedSprite(_scene, '', 136, 34);
          
          temp.setMoveAngle(DOWN_ANGLE);
          temp.setSpeed(Math.floor(Math.random()*10)+1);  
          temp.randomString = "";       
        
          //not sure that this matters since I am not using an image
          temp.loadAnimation(136, 34, 34, 34);
        
          //normally you don't need this with Sprite but you do
          //with EnhancedSprite... it's to cycle through the imamges
          //in the image map.  I have to do it here since I used 
          //EnhancedSprite but normally you don't need it
          temp.generateAnimationCycles();
          temp.renameCycles(new Array("east"));
          temp.setAnimationSpeed(200);
          temp.setCurrentCycle("east");
          
          //space our the sentinels across the screen
          temp.setPosition(100, -100);
          temp.alive = false;
          temp.spawn = function(x, y, charValue){

              this.setPosition(x, y);
              this.randomString = charValue;
            
              var moveAngle = (Math.floor(Math.random()*45)) -12;
              this.setMoveAngle(moveAngle);
              this.setSpeed((Math.floor(Math.random()*10)) + 8);
              this.alive = true;
          };

          temp.baseUpdate = temp.update;

          temp.update = function(){
            try{

              this.setDY(this.dy + 1);
              if(this.y > SCREEN_HEIGHT){
                this.alive = false;
                this.setDY(0);
                this.setSpeed(0);
                this.setPosition(100, -100);
              }

              var fontFamily = GAME_FONT;
              var fontSize = "25";
              var fontColors = ["#ff5555", "#ffff00", "#aaaa00"];
              var fontColor = fontColors[Math.floor(Math.random()*fontColors.length)];

              this.baseUpdate();
              if(this.alive){
                  this.writeText(fontFamily, fontSize, fontColor, this.randomString, this.x, this.y);
              }
            }
            catch(error){
              console.log(error.message);
            }

          };

          //this allows the text to go off the screen
          temp.setBoundAction(CONTINUE);
          _killedLetters.push(temp);
      }
    }
    catch(e){
      console.log(e.message);
    }
}
                       
function createSentinels(){
      
    try{
      var temp;
      
      var MAX_SENTINELS = 5;

      for(var i = 0; i < MAX_SENTINELS; i++){
          
          //normally sprites use img files but I am just using it to write text
          //in whatever positiong the sprite happens to be in
          temp = new EnhancedSprite(_scene, '', 136, 34);
          
          temp.setMoveAngle(DOWN_ANGLE);
          temp.setSpeed(Math.floor(Math.random()*10)+1);  
          temp.randomString = getRandomString();       
        
          //not sure that this matters since I am not using an image
          temp.loadAnimation(136, 34, 34, 34);
        
          //normally you don't need this with Sprite but you do
          //with EnhancedSprite... it's to cycle through the imamges
          //in the image map.  I have to do it here since I used 
          //EnhancedSprite but normally you don't need it
          temp.generateAnimationCycles();
          temp.renameCycles(new Array("east"));
          temp.setAnimationSpeed(200);
          temp.setCurrentCycle("east");
          
          //space our the sentinels across the screen
          temp.setPosition(getRandomXPosition(), -100);
          temp.alive = true;

          //this allows the text to go off the screen
          temp.setBoundAction(CONTINUE);
          _sentinels.push(temp);
      }
    }
    catch(e){
      console.log(e.message);
    }

  }
    
  
  function writeTextInAShadeOfGreen(sprite, text, offset){
    var fontFamily = GAME_FONT;
    var fontSize = "25";
    var fontColor = "#ddddff";

    var shadesOfGreen = ["#ffeeee", "#00dd00", "#aadd00", "#00dd00", "#00dddd"];
    var fontColor = shadesOfGreen[Math.floor(Math.random()*shadesOfGreen.length)];    
    sprite.writeText(fontFamily, fontSize, fontColor, text, sprite.x +(offset*25), sprite.y);
  }

  function getKeyDownChar(){
    var key = "";
    var i = 0;
    
    for(i = 0; i < 255; i++){
      if(keysDown[i]){
        key = String.fromCharCode(i);
        keysDown[i] = false;  //clear the keysdown
        break;
      }
    }
    return key;
  }
  
  function gameIsOver(){
    if(_scoreSprite.score.getTotalWords() >= MAX_WORDS){
        if(_scoreSprite){
           _scoreSprite.update();
        }
        return true;
      }

    return false;
  }


  function updateCurrentWord(){
    if(_currentWord){
        
        //if backspace is pressed clear the word
        if(keysDown[8] || keysDown[32]){

          if(_currentWord.randomString == "Start typing what you see - backspace to clear")
            _currentWord.randomString = "";
          if( _currentWord.randomString.length == 1) _currentWord.randomString = "";
          if(_currentWord.randomString.length > 1){
             _currentWord.randomString = 
               _currentWord.randomString.substring(0, _currentWord.randomString.length-1);
           }

        }
        else{
          
          var keyDown = getKeyDownChar();
          if(keyDown != "" && _currentWord.randomString == "Start typing what you see - backspace to clear")
            _currentWord.randomString = "";

          _currentWord.randomString += keyDown;
        }

          _currentWord.update();          
        writeTextInAShadeOfGreen(_currentWord, _currentWord.randomString.toLowerCase(), 0);
      }
  }

  function updateKilledLetters(){
    for(i=0;i<_killedLetters.length;i++){
        _killedLetters[i].update();
      }
  }

  function checkForHit(sentinel){
    if(sentinel.randomString.toUpperCase() == _currentWord.randomString.toUpperCase()){
      
      var word = sentinel.randomString;
      var j=0, k=0, l=0;

      //spawn killed word
      for(k = 0; k < word.length; k++){
        var l = 0;
        for(l =0; l < _killedLetters.length; l++){
          if(_killedLetters[l].alive == false){
              _killedLetters[l].spawn(sentinel.x + (k*20), sentinel.y, word.substring(k, k+1));
              break;
          }
        }
      }

      //TODO: destroy sentinel
      sentinel.randomString = "";
      _currentWord.randomString = "";
      sentinel.y += SCREEN_HEIGHT;
      sentinel.alive = false;
      _scoreSprite.addKill();   
    }
  }

  function resetSentinelWhenItGoesOffScreen(sentinel){
    //when it goes off screen, change the randomString
    //and speed.
    if(sentinel.y > SCREEN_HEIGHT + 100){
      sentinel.y = -100 - (Math.floor(Math.random()*100));
      sentinel.randomString = getRandomString();
      sentinel.setSpeed(Math.floor(Math.random()*5)+1);
      sentinel.x = getRandomXPosition();

      //dead _sentinels don't count as loss
      if(sentinel.alive === true){
        _scoreSprite.addLoss();                
      }

      //respawn
      sentinel.alive = true;
    }
  }
  
  this.init = function(){
     try{
        _scene = new Scene();
        //scene dimensions
        _scene.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        
        //scene background to black 
        _scene.setBG('#000000');
     }
     catch(e){
       console.log(e.message);
     }
  };
  
  this.start = function(){
    
    try{
       _scene.start();
      
      //There are somem dependencies on the scene
      //in order for the sentinels to be created.
      //That is why they are created here instead of
      //in the Game.init() 
      createCurrentWordSprite();
      createScoreSprite();
      createSentinels();
      createKilledLetters();
    }
    catch(e){
      console.log(e.message);
    }
  };
  


  //game loop - in this case it's just a screen saver
  //The update updates all positions
  //clears the screen
  //and redraws all images back to the screen.
  //This is basically each frame of the screen saver.
  //Or of a game if you decided to create a game.
  //
  //You may notice that the y position of each sprite is 
  //never updated.  That is because that is done automatically
  //by the engine based on the Sprite.speed and Sprite.moveAngle
  //Those values are set in createSentinel and later the speed
  //is changed in Game.update.
  this.update = function(){
    
    try{
      _scene.clear();
      //*****************
      var textValue = "*", i = 0, j = 0;

      if(gameIsOver()){
        return;
      }

      updateCurrentWord();  
      updateKilledLetters();
      for(i = 0; i < _sentinels.length; i++){
          _sentinels[i].update();          
          checkForHit(_sentinels[i]);
          writeTextInAShadeOfGreen(_sentinels[i], _sentinels[i].randomString, 0);
          resetSentinelWhenItGoesOffScreen(_sentinels[i]); 
      }
      
      if(_scoreSprite){
         _scoreSprite.update();
      }
    }
    catch(e){
      console.log(e.message);
    }
  };
}

var game;

function init(){
  game = new Game();
  game.init();
  game.start();
}

//update is called by the simmpleGame.js engine
function update(){
  game.update();
}

//this is normally placed on body onload
init();
