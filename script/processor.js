// MMP Video Uebung 02 - Filter, basierend auf:

//HTML5 Example: Chroma Key Filter
//(c) 2011-13
// Jürgen Lohr, lohr@beuth-hochschule.de
// Oliver Lietz, lietz@nanocosmos.de
//v1.4, May.2013

var isFirefox = /Firefox/.test(navigator.userAgent);
var isChrome = /Chrome/.test(navigator.userAgent);

var processor = {

    lastFrame: null,
    lastFrameChanges: [],

    // Returns an [r,g,b] array for a given coordinate out of a frame
    // if x or y is outside the image, it returns [0,0,0]
    getPixelRGB: function(frame, x, y) {
        if (x < 0 || x > frame.width || y < 0 || y > frame.height) {
            return [0, 0, 0];
        }
        i = y * frame.width + x;
        var r = frame.data[i * 4 + 0];
        var g = frame.data[i * 4 + 1];
        var b = frame.data[i * 4 + 2];
        return [r, g, b];
    },

    // applies weights to values and returns a sum scalar
    // values = [2,5,7], weights = [1,2,0] => 12
    applyFilter: function(values, weights) {
        sum = 0;
        for (var i = 0; i < values.length; i++) {
            sum += values[i] * weights[i];
        }
        return sum;
    },

    // computeFrame
    // do the image processing for one frame
    // reads frame data from rgb picture ctx
    // writes chroma key pictures to ctx1..3
    computeFrame: function() {

        videoTime = this.video.currentTime;

        if (videoTime != this.lastVideoTime) {  // don´t compute if the video is stopped
            // get the context of the canvas 1
            var ctx = this.ctx1;
            // draw current video frame to ctx
            ctx.drawImage(this.video, 0, 0, this.width - 1, this.height);
            // get frame RGB data bytes from context ctx
            var frame = {};
            var frame_diff = {};
            var length = 0;
            try {
                frame = ctx.getImageData(0, 0, this.width, this.height);
                frame_diff = ctx.getImageData(0, 0, this.width, this.height);
                length = (frame.data.length) / 4;
            } catch (e) {
                // catch and display error of getImageData fails
                this.browserError(e);
            }
            // do the image processing
            frame_delta = 0;
            if (this.lastFrame !== null) {
                for (var i = 0; i < length; i++) {
                    var x = i % frame.width;
                    var y = Math.floor(i / frame.width);
                    var now = this.getPixelRGB(frame, x, y);
                    var r_now = now[0];
                    var g_now = now[1];
                    var b_now = now[2];
                    var last = this.getPixelRGB(this.lastFrame, x, y);
                    var r_last = last[0];
                    var g_last = last[1];
                    var b_last = last[2];
                    // var Y_now = 0.3 * r_now + 0.59 * g_now + 0.11 * b_now;
                    // var Y_last = 0.3 * r_last + 0.59 * g_last + 0.11 * b_last;

                    R_diff = ((r_now - r_last) / 2) + 127.5;
                    G_diff = ((g_now - g_last) / 2) + 127.5;
                    B_diff = ((b_now - b_last) / 2) + 127.5;
                    frame_diff.data[i * 4 + 0] = R_diff;
                    frame_diff.data[i * 4 + 1] = G_diff;
                    frame_diff.data[i * 4 + 2] = B_diff;
                    frame_delta += Math.abs(r_now - r_last) + Math.abs(g_now - g_last) + Math.abs(b_now - b_last);
                }
            }
            // calculate average delta for last 20 frames
            sum = 0;
            for (var j = 0; j < this.lastFrameChanges.length; j++) {
                sum += this.lastFrameChanges[j];
            }
            avg_delta = sum / this.lastFrameChanges.length;
            if ((frame_delta / avg_delta) > 4) {
                this.print("Cut detected at second " + videoTime);
            }

            // write back to 3 canvas objects
            this.ctx1.putImageData(frame, 0, 0);
            this.ctx2.putImageData(frame_diff, 0, 0);
            this.lastFrame = frame;
            this.lastFrameChanges.push(frame_delta);
            this.lastVideoTime = videoTime;
            return;
        }

    },

    print: function(text) {
        var out = $("#output");
        var old_text = out.val();
        var new_text = text + '\r\n' + old_text;
        out.val(new_text);
    },
    timerCallback: function() {
        if (this.error) {
            alert("Error happened - processor stopped.");
            return;
        }

        // call the computeFrame function to do the image processing
        this.computeFrame();

        // call this function again after a certain time
        // (40 ms = 1/25 s)
        var timeoutMilliseconds = 40;
        var self = this;
        setTimeout(function() {
            self.timerCallback();
        }, timeoutMilliseconds);
    },


    // doLoad: needs to be called on load
    doLoad: function() {

        this.error = 0;

        // check for a compatible browser
        if (!this.browserChecked)
            this.browserCheck();

        try {

            // get the html <video> and <canvas> elements
            this.video = document.getElementById("video");

            this.c1 = document.getElementById("c1");
            // get the 2d drawing context of the canvas
            this.ctx1 = this.c1.getContext("2d");
            this.c2 = document.getElementById("c2");
            this.ctx2 = this.c2.getContext("2d");

            // show video width and height to log
            this.log("Found video: size " + this.video.videoWidth + "x" + this.video.videoHeight);

            // scale the video display
            this.video.width = this.video.videoWidth / 2;
            this.video.height = this.video.videoWidth / 2;

            // scaling factor for resulting canvas
            var factor = 1;
            // var factor = 2;
            w = this.video.videoWidth / factor;
            h = this.video.videoHeight / factor;

            if (!w || !this.video) {
                alert("No Video Object Found?");
            }
            this.ctx1.width = w;
            this.ctx1.height = h;
            this.c1.width = w + 1;
            this.c1.height = h;
            this.c2.width = w;
            this.c2.height = h;
            this.width = w;
            this.height = h;

        } catch (e) {
            // catch and display error
            alert("Erro: " + e);
            return;
        }

        // start the timer callback to draw frames
        this.timerCallback();

        this.ctx1.width = w;
        this.ctx1.height = h;
        this.output = $("#output");
    },

    // helper function: isCanvasSupported()
    // check if HTML5 canvas is available
    isCanvasSupported: function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    },

    // log(text)
    // display text in log area or console
    log: function(text) {
        var logArea = document.getElementById("log");
        if (logArea) {
            logArea.innerHTML += text + "<br>";
        }
        if (typeof console != "undefined") {
            console.log(text);
        }
    },

    // helper function: browserError()
    // displays an error message for incorrect browser settings
    browserError: function(e) {

        this.error = 1;

        //chrome security for local file operations
        if (isChrome)
            alert("Security Error\r\n - Call chrome with --allow-file-access-from-files\r\n\r\n" + e);
        else if (isFirefox)
            alert("Security Error\r\n - Open Firefox config (about: config) and set the value\r\nsecurity.fileuri.strict_origin_policy = false ");
        else
            alert("Error in getImageData " + e);
    },

    //helper function to check for browser compatibility
    browserCheck: function() {
        if (!this.isCanvasSupported()) {
            alert("No HTML5 canvas - use a newer browser please.");
            return false;
        }
        // check for local file access
        //if(location.host.length>1)
        //    return;
        this.browserChecked = true;
        return true;
    },
    browserChecked: false,
    error: 0
};
