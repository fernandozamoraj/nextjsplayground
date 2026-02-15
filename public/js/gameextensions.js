// simple_game_extensions.js
// Minimal extensions needed by typingGame.js

function EnhancedSprite(scene, imageFile, width, height) {
    Sprite.call(this, scene, imageFile, width, height);

    this.writeText = function(fontFamily, fontSize, fontColor, text, x, y) {
        var ctx = this.context;
        ctx.save();
        ctx.fillStyle = fontColor;
        ctx.font = fontSize + "px " + fontFamily;
        ctx.textBaseline = "top";
        ctx.fillText(text, x, y);
        ctx.restore();
    };
}

EnhancedSprite.prototype = Object.create(Sprite.prototype);
EnhancedSprite.prototype.constructor = EnhancedSprite;
