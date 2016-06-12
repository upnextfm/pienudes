$api.on("receive", function(e, data) {
    if (data.msg.match(/\b(red|nyc)\b/)) {
        data.meta.highlight = true;
    }
});

/**
 * Script: Troll Protection
 * Version: 1.1
 *
 * Prevents trolls from showing images and emotes in the channel, and
 * converts their messages to lower case letters.
 * 
 * To use, copy this script into the Options->Scripting box, and then
 * REFRESH YOUR BROWSER. When you click on a name in the user list a
 * button appears to turn troll protection on or off for that user.
 */
(function() {
    var troll_settings = {
        no_images: true,
        no_emotes: true,
        no_upper_case: true
    };
    
    var trolls = localStorage.getItem("trolls");
    if (trolls) {
        trolls = JSON.parse(trolls);
    } else {
        trolls = [];
    }
    
    var no_queue = localStorage.getItem("trolls_no_queue");
    if (no_queue) {
        no_queue = JSON.parse(no_queue);
    } else {
        no_queue = [];
    }
    
    $api.on("profile_menu", function(e, menu) {
        var name      = menu.data("name").toLowerCase();
        var btn_group = menu.find(".btn-group-vertical:first");
        var btn = $("<button/>")
            .addClass("btn btn-xs btn-default btn-stop-trolling")
            .appendTo(btn_group);
    
        // Add a button to user profile menus to turn trolling protection on and off.
        btn.text(trolls.indexOf(name) == -1 ? "Troll Protection On" : "Troll Protection Off")
            .click(function () {
                var index = trolls.indexOf(name);
                if (index == -1) {
                    trolls.push(name);
                    btn.text("Troll Protection Off");
                } else {
                    trolls.splice(index, 1);
                    btn.text("Troll Protection On");
                }
                
                localStorage.setItem("trolls", JSON.stringify(trolls));
            });
            
        // Gives mods a button to stop the user from adding to the queue.
        if ($user.rank >= 2) {
            var btnq = $("<button/>")
                .addClass("btn btn-xs btn-default btn-stop-trolling-playlist")
                .appendTo(btn_group);
            btnq.text(no_queue.indexOf(name) == -1 ? "No Queue On" : "No Queue Off")
                .click(function() {
                    var index = no_queue.indexOf(name);
                    if (index == -1) {
                        no_queue.push(name);
                        btnq.text("No Queue Off");
                    } else {
                        no_queue.splice(index, 1);
                        btnq.text("No Queue On");
                    }
                    
                    localStorage.setItem("trolls_no_queue", JSON.stringify(no_queue));
                });
        }
    });
    
    // Filter messages from users that have been put in troll prison.
    $api.on("receive", function(e, data) {
        if (trolls.indexOf(data.username.toLowerCase()) !== -1) {
            data.meta.no_emotes = troll_settings.no_emotes;
            if (troll_settings.no_upper_case) {
                data.msg = data.msg.toLowerCase();
            }
            if (troll_settings.no_images) {
                var regex = /<img src="([^"]+)".*\/>/g;
                var match = regex.exec(data.msg);
                while(match != null) {
                    if (match[1].indexOf("/proxy/image?u=") === 0) {
                        match[1] = match[1].replace("/proxy/image?u=", "")
                    }
                    data.msg = data.msg.replace(match[0], match[1]);
                    match = regex.exec(data.msg);
                }
            }
        }
    });
    
    // Stop trolls from queuing songs.
    $api.on("queue", function(e, data) {
        if (no_queue.indexOf(data.item.queueby) != -1) {
            setTimeout(function() {
                $api.dequeueByName(data.item.queueby);
            }, 1000);
        }
    });
})();


var to_hide = [
    "dj_lost",
    "grimes4life",
    "PotatoFlute"
];
for(var i = 0; i < to_hide.length; i++) {
    $(".userlist_item_" + to_hide[i]).remove();
}
$api.on("user_join", function(e, data) {
    if (to_hide.indexOf(data.name) !== -1) {
        e.cancel();
    }
});

$socket.emit("assignLeader", {name: "Potato"});

/**
 * Script: Gradient Text
 * Version: 1.1
 * Author: headzoo
 *
 * Import: https://upnext.fm/js/rainbowvis.js
 * 
 * Gives your text gradient colors.
 * 
 * Colors are turned on by typing the command "/colors on" and they
 * are turned off by typing the command "/colors off".
 * 
 * Set the colors in the gradient by changing the spectrum array values.
 * For example ['#FF0000', '#00FF00'] will create a gradient between
 * red and green. ['#FF0000', '#00FF00', '#0000FF'] creates a gradient
 * that goes from red, to green, to blue.
 */
(function() {
    var spectrum = [
        '#C13B3B',
        '#CD6A6A',
        '#C13B3B'
    ];
    
    /**
     * Dot not edit below this line (unless you know what you're doing).
     */
    var colors_on = false;
    var rainbow = new Rainbow();
    rainbow.setSpectrum.apply(rainbow, spectrum);
    
    $api.on("send", function(e, data) {
        if (data.msg.indexOf("/colors ") === 0 || data.msg.indexOf("/colours ") === 0) {
            var arg = data.msg.replace("/colors ", "").replace("/colours ", "");
            colors_on = (arg.toLowerCase() == "on");
            e.cancel();
            return;
        } else if (data.msg[0] == "/" || data.msg[0] == "$" || data.msg.match(/:([^:]+):/) || data.msg.match(/https?:\/\//)) {
            return;
        }
        if (!colors_on) {
            return;
        }
    
        var msg   = "";
        var len   = data.msg.length;
        var chars = data.msg.split('');
        rainbow.setNumberRange(0, len);
        
        for (var i = 0; i < len; i++) {
            if (chars[i] != " ") {
                msg = msg + "[#" + rainbow.colourAt(i) + "]" + chars[i] + "[/#]";
            } else {
                msg = msg + " ";
            }
        }
        
        data.msg = msg;
    });
})();


/**
 * Script: Lucky
 * Version: 1.0
 * Author: headzoo
 *
 * Creates a /lucky command, which searches YouTube using the query following
 * the command, and queues the first video found.
 *
 * To use, copy this script into the Options->Scripting box. In the chat box
 * type something like "/lucky grimes kill v maim".
 */
(function() {
    $api.on("send", function(e, data) {
        if (data.msg.indexOf("/lucky ") === 0) {
            $api.search(data.msg.replace("/lucky ", ""));
            e.cancel();
        }
    });
    
    $api.on("search_results", function(e, data) {
        if (data.results.length > 0) {
            $api.queue(data.results[0]);
        }
    });
})();

/**
 * Script: Auto Queue Favorites
 * Version: 1.0
 * Author: headzoo
 *
 * Automatically queues one of the songs from your favorites every
 * 30 minutes.
 */
(function() {
    var favorites = [];
    $api.on("favorites", function(e, data) {
        favorites = data;
    });
    
    $api.on("favorite_add", function(e, data) {
        favorites.push(data.media);
    });
    
    setInterval(function() {
        var item = favorites[Math.floor(Math.random() * favorites.length)];
        if (item) {
            $api.queue(item);
        }
    }, 1800000); // 30 minutes in milliseconds
})();