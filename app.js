var express = require("express"),
    http = require("http"),
    app = express(),
    path = require("path"),
    session = require("express-session");

app.set("port", process.env.VCAP_APP_PORT || 4040);
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "pug");
app.use(session({ secret: "xRIqZ6KUBBKPySqNyZjJ", resave: true, saveUninitialized: true }));

var routes = require("./modules/routes");
routes.loginRoutes(app);
routes.dataRoutes(app);

var auth = require("./modules/auth.js");
setInterval(auth.periodicCheckAuth, 900000);

http.createServer(app).listen(app.get("port"), function() {
    console.log("Express server listening on port " + app.get("port"));
});