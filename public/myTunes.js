// Format times as minutes and seconds.
var timeFormat = function(secs) {
    if (secs == undefined || isNaN(secs)) {
        return "0:00";
    }
    secs = Math.round(secs);
    var mins = "" + Math.round(secs / 60);
    secs = "" + secs % 60;
    if (secs.length < 2) {
        secs = "0" + secs;
    }
    return mins + ":" + secs;
};

$(function() {

    var Router = Backbone.Router.extend({
        routes: {
            "search/query/:query": "itemQuery"
        },
        itemQuery: function(query) {
            var queryUrl = "/search/query/" + encodeURIComponent($("#query").val());
            $.getJSON(queryUrl, function(data) {
                for (var i = 0; i < data.length; i++) {
                        data[i]["length"] = timeFormat(data[i]["length"]);
                        data[i]["bitrate"] = Math.round(data[i]["bitrate"]/1000);
                }
                var models = _.map(data, function(d) {
                    return new Item(d);
                });
                var results = new Items(models);
                app.showResults(results);
            });
        }
    });
    var router = new Router();
    Backbone.history.start();

    // Model.
    var Item = Backbone.Model.extend({
        urlRoot: "/item"
    });
    var Items = Backbone.Collection.extend({
        model: Item
    });

    var AppView = Backbone.View.extend({
        el: $("body"),
        events: {
            "submit #queryForm": "routeResults",
            "click #pause": "pauseTrack",
            "click #play": "playTrack"
        },

        pauseTrack: function(ev) {
            $("#player").get(0).pause();
        },

        playTrack: function(ev) {
            var playBtn = $(ev.currentTarget);
            var fileId = playBtn.data("path");
            var player = document.getElementById("player");
            var queryUrl = "/itemUrl?id=" + encodeURIComponent(fileId);

            $.ajax({
                type: "GET",
                url: queryUrl,
                dataType: "json",
                async: true,
                success: function(itemUrl) {
                    if(player.src !== itemUrl) {
                        $("#player").attr("src", itemUrl);
                        $("#player").get(0).play();
                    } else {
                        $("#player").get(0).play();
                    }
                }
            });
        },

        routeResults: function(ev) {
            ev.preventDefault();
            router.navigate("search/query/" + encodeURIComponent($("#query").val()), {trigger: true});
        },
        showResults: function(results) {
            var source = $("#result-template").html();
            var template = Handlebars.compile(source);
            var html;
            $("#results").empty();
            results.each(function(result) {
                html = template(result.toJSON());
                $("#results").append(html);
            });
            showHideDl();
            var options = {
                valueNames: ["searchSrc1", "searchSrc1"],
                page: 5,
                pagination: true
            };

            var userList = new List("content", options);
        }
    });

    var app = new AppView();
});

function showHideDl() {
    $("ul li").click(function(e) {
        var target = $(e.target);
        if(!target.is("#play") && !target.is("#pause") && !target.is("#download")) {
            if($(this).find("dl").hasClass("hidden")) {
                $("ul li dl").addClass("hidden");
                $(this).find("dl").removeClass("hidden");
            } else {
                $("ul li dl").addClass("hidden");
            }
        }
    });
}