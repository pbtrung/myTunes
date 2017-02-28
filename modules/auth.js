var config = require("../data/config.json");
var google = require("googleapis");
var OAuth2 = google.auth.OAuth2;
var request = require("request");
var fs = require("fs");

var DRIVE_CLIENT_ID;
var DRIVE_CLIENT_SECRET;
var REDIRECT_URL;
var fileName;

if(process.argv.length == 2) {
    DRIVE_CLIENT_ID = config["web"]["client_id"];
    DRIVE_CLIENT_SECRET = config["web"]["client_secret"];
    REDIRECT_URL = config["web"]["redirect_uris"][0];
    fileName = "./data/tokens.json";
} else if(process.argv.length == 3 && process.argv[2] === "local") {
    DRIVE_CLIENT_ID = config["local"]["client_id"];
    DRIVE_CLIENT_SECRET = config["local"]["client_secret"];
    REDIRECT_URL = config["local"]["redirect_uris"][0];
    fileName = "./data/tokens_test.json";
}

module.exports = {
    getAuthUrl: function() {
        var oauth2Client = this.getOAuthClient();
        var scopes = ["https://www.googleapis.com/auth/drive.readonly"];

        var url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes
        });

        return url;
    },

    periodicCheckAuth: function() {
        var tokens, flag = 0;
        if(process.argv.length == 2) {
            var fn1 = "./data/tokens.json";
            var fn2 = "../data/tokens.json";
            if(fs.existsSync(fn1)) {
                tokens = require(fn2);
                flag = 1;
            }
        } else if(process.argv.length == 3 && process.argv[2] === "local") {
            var fn1 = "./data/tokens_test.json";
            var fn2 = "../data/tokens_test.json";
            if(fs.existsSync(fn1)) {
                tokens = require(fn2);
                flag = 1;
            }
        }

        if(flag == 1) {
            var options = {
                url: "https://www.googleapis.com/oauth2/v4/token" +
                     "?refresh_token=" +
                     encodeURIComponent(tokens["refresh_token"]) +
                     "&client_id=" +
                     encodeURIComponent(DRIVE_CLIENT_ID) +
                     "&client_secret=" +
                     encodeURIComponent(DRIVE_CLIENT_SECRET) +
                     "&grant_type=refresh_token",
                method: "POST"
            };
            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var info = JSON.parse(body);
                    var accessToken = info.access_token;
                    var newTokens = {
                        access_token: accessToken,
                        refresh_token: tokens["refresh_token"],
                        token_type: tokens["token_type"],
                        expiry_date: tokens["expiry_date"],
                        expires_in: info.expires_in
                    };
                    fs.writeFile(fileName, JSON.stringify(newTokens), function(err) {
                        if (err) return console.log(err);
                        console.log(JSON.stringify(newTokens));
                    });
                }
            });
        } else {
            console.log("WAITING...");
        }
    },

    getOAuthClient: function() {
        return new OAuth2(DRIVE_CLIENT_ID, DRIVE_CLIENT_SECRET, REDIRECT_URL);
    }
};