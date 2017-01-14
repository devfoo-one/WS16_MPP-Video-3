# MMP WS2016 / 2017 - Video Übung 3

- Robin Mehlitz (857946)
- Tom Oberhauser (859851)

## Implementierung

### 1. Differenzbild

Zur Ermittlung des Differenzbildes wird das Bild pixelweise mit dem vorherigen verglichen.
Beim ersten Frame bedeutet dies, dass der Frame dem Differenzbild entspricht.
Da das Differenzbild bei keinem Unterschied grau sein sollte wurden die Unterschiede pro Kanal mit der Formel

```javascript
R_diff = ((r_now - r_last) / 2) + 127.5;
```

berechnet. Dies sorgt für eine Ausgabe im Intervall `(0, 255)` mit einem "Ruhepunkt" von `127,5`, wenn keine Veränderung auftritt.
Dies stellt ebenfalls sicher, dass keine negativen Pixelwerte im Differenzbild auftreten.

```javascript
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
        R_diff = ((r_now - r_last) / 2) + 127.5;
        G_diff = ((g_now - g_last) / 2) + 127.5;
        B_diff = ((b_now - b_last) / 2) + 127.5;
        frame_diff.data[i * 4 + 0] = R_diff;
        frame_diff.data[i * 4 + 1] = G_diff;
        frame_diff.data[i * 4 + 2] = B_diff;
        frame_delta += Math.abs(r_now - r_last) + Math.abs(g_now - g_last) + Math.abs(b_now - b_last);
    }
}
```

### 2. Szenenerkennung

Für die Szenenerkennung werden pro Frame die Unterschiede für jeden Pixel ermittelt.
(Hier auf allen Kanälen, es sollte jedoch auch ein Kanal ausreichen.)

```javascript
frame_delta += Math.abs(r_now - r_last) + Math.abs(g_now - g_last) + Math.abs(b_now - b_last);
```

Die Variable `frame_delta` beinhaltet die Summe aller Pixelveränderungen.

```javascript
// calculate average delta for all frames
sum = 0;
for (var j = 0; j < this.lastFrameChanges.length; j++) {
    sum += this.lastFrameChanges[j];
}
avg_delta = sum / this.lastFrameChanges.length;
if ((frame_delta / avg_delta) > 4) {
    this.print("Cut detected at second " + videoTime);
}
```

Die `frame_delta` Werte aller Frames werden gespeichert um daraus einen Durchschnitt ermitteln zu können.
Sofern der aktuelle Frame um mehr als den Faktor 4 vom Durchschnitt aller Frame-Veränderungen abweicht, wird der Frame als Schnittbild klassifiziert.

Der Faktor 4 wurde durch Versuch an 2 Videos ermittelt.
Alternativ zum festen Faktor könnte das Video zunächst komplett analysiert, und im Anschluss die Schnittbilder ermittelt werden.
Ebenfalls könnte mehr Gewicht auf die Randpixel gelegt werden, da sich diese bei einem Schnitt stärker ändern als innerhalb einer normalen Szene.
