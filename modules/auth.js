var config = require("../data/config.json");
var google = require("googleapis");
var OAuth2 = google.auth.OAuth2;

var DRIVE_CLIENT_ID;
var DRIVE_CLIENT_SECRET;
var REDIRECT_URL;

if(process.argv.length == 2) {
    DRIVE_CLIENT_ID = config["web"]["client_id"];
    DRIVE_CLIENT_SECRET = config["web"]["client_secret"];
    REDIRECT_URL = config["web"]["redirect_uris"][0];
} else if(process.argv.length == 3 && process.argv[2] === "local") {
    DRIVE_CLIENT_ID = config["local"]["client_id"];
    DRIVE_CLIENT_SECRET = config["local"]["client_secret"];
    REDIRECT_URL = config["local"]["redirect_uris"][0];
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

    getOAuthClient: function() {
        return new OAuth2(DRIVE_CLIENT_ID, DRIVE_CLIENT_SECRET, REDIRECT_URL);
    }
};