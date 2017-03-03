var sqlite3 = require("sqlite3").verbose();
var config = require("../data/config.json");
var auth = require("./auth.js");
var request = require("request");
var fs = require("fs");

var db, fileName;
if(process.argv.length == 2) {
    db = new sqlite3.Database(config["server_db_path"], sqlite3.OPEN_READONLY);
    fileName = "./data/tokens.json";
} else if(process.argv.length == 3 && process.argv[2] === "local") {
    db = new sqlite3.Database(config["local_db_path"], sqlite3.OPEN_READONLY);
    fileName = "./data/tokens_test.json";
}

module.exports = {
    loginRoutes: function(app) {
        app.get("/", function(req, res) {
            if(fs.existsSync(fileName)) {
                res.render("player");
            } else {
                var url = auth.getAuthUrl();
                res.render("login", { authUrl: url });
            }
        });

        app.get("/auth/google-drive/callback", function(req, res) {

            var oauth2Client = auth.getOAuthClient();
            var code = req.query.code;
            oauth2Client.getToken(code, function(err, ton) {
                if(!err) {
                    fs.writeFile(fileName, JSON.stringify(ton), function(err) {
                        if(err) return console.log(err);
                        console.log(JSON.stringify(ton));
                    });
                    res.redirect("/");                    
                } else {
                    res.redirect("/");
                }
            });
        });
    },

    dataRoutes: function(app) {
        app.get("/numTracks", function(req, res) {
            var stmt = "SELECT COUNT(*) AS numTracks FROM items";
            db.all(stmt, function(err, rows) {
                res.send(JSON.stringify(rows));
            });
        });

        app.get("/numAlbums", function(req, res) {
            var stmt = "SELECT COUNT(*) AS numAlbums FROM albums";
            db.all(stmt, function(err, rows) {
                res.send(JSON.stringify(rows));
            });
        });

        app.get("/search/query/:query", function(req, res) {

            var stmt = "SELECT id, album, albumartist, title, path, track, tracktotal, format, length, bitrate, mb_trackid, lyrics"
                     + " FROM items WHERE title LIKE ? OR albumartist LIKE ?" 
                     + " OR album LIKE ? ORDER BY title COLLATE NOCASE ASC LIMIT 1000";
            var searchTerm = "%" + req.params.query + "%";
            db.all(stmt, [searchTerm, searchTerm, searchTerm], function(err, items) {
                for (var i = 0; i < items.length; i++) {
                    items[i]["path"] = items[i]["path"].toString();
                }
                res.send(JSON.stringify(items));
            });
        });

        app.get("/itemUrl", function(req, res) {

            var tokens;
            if(process.argv.length == 2) {
                tokens = require("../data/tokens.json");
            } else if(process.argv.length == 3 && process.argv[2] === "local") {
                tokens = require("../data/tokens_test.json");
            }

            var accessToken = tokens["access_token"];
            var bearer = "Bearer " + accessToken;
            var options = {
                url: "https://www.googleapis.com/drive/v2/files/" + req.query.id,
                headers: {
                    Authorization: bearer
                }
            };
            request(options, function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    var info = JSON.parse(body);
                    var itemUrl = info.downloadUrl + "&access_token=" + encodeURIComponent(accessToken);
                    res.send(JSON.stringify(itemUrl));
                }
            });
        });

        app.get("/item/:id", function(req, res) {
            var id = req.params.id;
            var stmt = "SELECT * FROM items WHERE id = ?";
            db.all(stmt, [id], function(err, rows) {
                res.send(JSON.stringify(rows[0]));
            });
        });
    }
};