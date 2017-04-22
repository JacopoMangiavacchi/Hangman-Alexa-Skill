// Hangman Javascript Class

// Jacopo Mangiavacchi.

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tryLetterResult;
(function (tryLetterResult) {
    tryLetterResult[tryLetterResult["invalidSecret"] = 0] = "invalidSecret";
    tryLetterResult[tryLetterResult["invalidWord"] = 1] = "invalidWord";
    tryLetterResult[tryLetterResult["alreadyTried"] = 2] = "alreadyTried";
    tryLetterResult[tryLetterResult["won"] = 3] = "won";
    tryLetterResult[tryLetterResult["lost"] = 4] = "lost";
    tryLetterResult[tryLetterResult["found"] = 5] = "found";
    tryLetterResult[tryLetterResult["notFound"] = 6] = "notFound";
})(tryLetterResult = exports.tryLetterResult || (exports.tryLetterResult = {}));
;
var loadGameResult;
(function (loadGameResult) {
    loadGameResult[loadGameResult["invalidJson"] = 0] = "invalidJson";
    loadGameResult[loadGameResult["won"] = 1] = "won";
    loadGameResult[loadGameResult["lost"] = 2] = "lost";
    loadGameResult[loadGameResult["ok"] = 3] = "ok";
})(loadGameResult = exports.loadGameResult || (exports.loadGameResult = {}));
;
var characterSet = "abcdefghijklmnopqrstuvwxyz";
var secretCharacter = "_";
var HangmanGame = (function () {
    function HangmanGame(secret, maxFail) {
        if (maxFail === void 0) { maxFail = 7; }
        this.maxFail = maxFail;
        this.lettersTried = "";
        this.failedAttempts = 0;
        this.singleWord = true;
        if (secret) {
            this.secret = this.clearPhrase(secret);
            if (this.secret.indexOf(' ') >= 0) {
                this.singleWord = false;
            }
        }
    }
    Object.defineProperty(HangmanGame.prototype, "discovered", {
        get: function () {
            var discovered = "";
            for (var pos in this.secret) {
                var word = this.secret[pos];
                if (word === ' ' || this.searchLetterInString(word, this.lettersTried)) {
                    discovered += word;
                }
                else {
                    discovered += secretCharacter;
                }
            }
            return discovered;
        },
        enumerable: true,
        configurable: true
    });
    ;
    ;
    HangmanGame.prototype.tryLetter = function (letter) {
        if (this.secret.length == 0) {
            return tryLetterResult.invalidSecret;
        }
        if (this.failedAttempts >= this.maxFail) {
            return tryLetterResult.lost;
        }
        var clearLetter = this.clearPhrase(letter);
        if (clearLetter.length != 1) {
            return tryLetterResult.invalidWord;
        }
        var clearWord = clearLetter[0];
        if (this.searchLetterInString(clearWord, this.lettersTried)) {
            return tryLetterResult.alreadyTried;
        }
        this.lettersTried += clearWord;
        if (this.searchLetterInString(clearWord, this.secret)) {
            if (this.searchLetterInString(secretCharacter, this.discovered)) {
                return tryLetterResult.found;
            }
            else {
                return tryLetterResult.won;
            }
        }
        this.failedAttempts = (Number(this.failedAttempts) + 1);
        if (this.failedAttempts >= this.maxFail) {
            return tryLetterResult.lost;
        }
        return tryLetterResult.notFound;
    };
    HangmanGame.prototype.save = function () {
        var game = { "maxFail": this.maxFail,
            "secret": this.secret,
            "lettersTried": this.lettersTried,
            "failedAttempts": this.failedAttempts };
        return game;
    };
    HangmanGame.prototype.saveToString = function () {
        return JSON.stringify(this.save());
    };
    HangmanGame.prototype.load = function (game) {
        this.maxFail = game.maxFail;
        this.secret = this.clearPhrase(game.secret);
        this.lettersTried = game.lettersTried;
        this.failedAttempts = game.failedAttempts;
        if (this.secret.length == 0) {
            return loadGameResult.invalidJson;
        }
        this.singleWord = true;
        if (this.secret.indexOf(' ') >= 0) {
            this.singleWord = false;
        }
        if (this.failedAttempts >= this.maxFail) {
            return loadGameResult.lost;
        }
        if (this.searchLetterInString(secretCharacter, this.discovered)) {
            return loadGameResult.ok;
        }
        else {
            return loadGameResult.won;
        }
    };
    HangmanGame.prototype.loadFromString = function (json) {
        return this.load(JSON.parse(json));
    };
    HangmanGame.prototype.searchLetterInString = function (letter, string) {
        return string.indexOf(letter) >= 0 ? true : false;
    };
    HangmanGame.prototype.clearPhrase = function (secret) {
        return secret.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, ' ');
    };
    return HangmanGame;
}());
exports.HangmanGame = HangmanGame;
//# sourceMappingURL=HangmanGame.js.map