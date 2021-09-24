function setPixel(imageData, x, y, r, g, b, int, xColor, yColor) {
    let id = ~~( x%imageData.width + ( imageData.width * ~~(y) ) ) * 4;
    let red, green, blue, xVar, yVar

    red = r
    green = g
    blue = b

    if (xColor === 0) {
        xVar = r
    }
    if (xColor === 1) {
        xVar = g
    }
    if (xColor === 2) {
        xVar = b
    }
    if (yColor === 0) {
        yVar = r
    }
    if (yColor === 1) {
        yVar = g
    }
    if (yColor === 2) {
        yVar = b
    }

    let xHue = (x / imageData.width) > .5 ? Math.round(xVar + (int - (x / imageData.width / .5 * int))) : Math.round(xVar - (int - (x / imageData.width / .5 * int)));
    xHue = xHue > 255 ? 255 : xHue
    xHue = xHue < 0 ? 0 : xHue

    let yHue = (y / imageData.height) > .5 ? Math.round(yVar + (int - (y / imageData.height / .5 * int))) : Math.round(yVar - (int - (y / imageData.height / .5 * int)));
    yHue = yHue > 255 ? 255 : yHue
    yHue = yHue < 0 ? 0 : yHue

    if (xColor === 0) {
        red = xHue
    }
    if (xColor === 1) {
        green = xHue
    }
    if (xColor === 2) {
        blue = xHue
    }
    if (yColor === 0) {
        red = yHue
    }
    if (yColor === 1) {
        green = yHue
    }
    if (yColor === 2) {
        blue = yHue
    }

    imageData.data[id++] = red
    imageData.data[id++] = green
    imageData.data[id++] = blue
    imageData.data[id] += 7.5
}

function randomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomColor() {
    let h = randomInterval(0, 360) * 0.01;
    let s = randomInterval(42, 98) * 0.01;
    let l = randomInterval(40, 90) * 0.01;
    let invertH = h*100 + 120 > 360 ? (h*100 - 120) * 0.01 : (h*100 + 120) * 0.01
    let r,g,b,ir,ig,ib
    if (s === 0){
        r = g = b = l;
    } else {
        let hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
        // Create inverted color for background
        ir = hue2rgb(p, q, invertH + 1/3);
        ig = hue2rgb(p, q, invertH);
        ib = hue2rgb(p, q, invertH - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(ir * 255), Math.round(ig * 255), Math.round(ib * 255)]
}

let size = 1920 //Math.min(window.innerWidth, window.innerHeight);
let half = size * 0.5;
let scale = half * 0.3;

let canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = canvas.height = size;
let ctx = canvas.getContext("2d");

let sin = Math.sin;
let cos = Math.cos;

let storedColor, storedInt, storedXcolor, storedYcolor, storedA, storedF

function compute() {
    ctx.clearRect(0, 0, size, size);
    let imageData = ctx.getImageData(0, 0, size, size);
    let bound = Math.PI / 2;
    let A = [0, 0, 0, 0, 0, 0].map(() => {
        return (-bound + Math.random() * bound * 2).toFixed(4);
    });
    let F = [0, 0, 0, 0, 0, 0].map(() => {
        return (-Math.PI + Math.random() * Math.PI * 2).toFixed(4);
    });

    let color = randomColor()
    let r = color[0]
    let g = color[1]
    let b = color[2]
    // create random interval for colors and which axis they affect
    let int = randomInterval(1, 255)
    let xColor = randomInterval(0,2)
    let yColor = randomInterval(0,2)

    let T = 0;
    let V = 0.001;
    let x = 0, y = 0, nx, ny;

    let i = size * size;
    while (i--) {
        nx = A[0] * sin(F[0] * x);
        nx += A[1] * cos(F[1] * y);
        nx += A[2] * sin(F[2] * T);

        ny = A[3] * sin(F[3] * x);
        ny += A[4] * cos(F[4] * y);
        ny += A[5] * sin(F[5] * T);

        x = nx;
        y = ny;
        T += V;

        // Draw pixels
        setPixel(imageData, half + x * scale, half + y * scale, r, g, b, int, xColor, yColor);
    }
    ctx.putImageData(imageData, 0, 0);
    // Add background color
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = `rgb(${color[3]},${color[4]},${color[5]})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //displays formula
    console.log("A = [" + A.toString() + "];\nF = [" + F + "];");
    storedColor = color
    storedInt = int
    storedXcolor = xColor
    storedYcolor = yColor
    storedA = A
    storedF = F
}

function changeShape() {
    ctx.clearRect(0, 0, size, size);
    let imageData = ctx.getImageData(0, 0, size, size);
    let bound = Math.PI / 2;
    let A = [0, 0, 0, 0, 0, 0].map(() => {
        return (-bound + Math.random() * bound * 2).toFixed(4);
    });
    let F = [0, 0, 0, 0, 0, 0].map(() => {
        return (-Math.PI + Math.random() * Math.PI * 2).toFixed(4);
    });

    let r = storedColor[0]
    let g = storedColor[1]
    let b = storedColor[2]

    let T = 0;
    let V = 0.001;
    let x = 0, y = 0, nx, ny;

    let i = size * size;
    while (i--) {
        nx = A[0] * sin(F[0] * x);
        nx += A[1] * cos(F[1] * y);
        nx += A[2] * sin(F[2] * T);

        ny = A[3] * sin(F[3] * x);
        ny += A[4] * cos(F[4] * y);
        ny += A[5] * sin(F[5] * T);

        x = nx;
        y = ny;
        T += V;

        // Draw pixels
        setPixel(imageData, half + x * scale, half + y * scale, r, g, b, storedInt, storedColor, storedYcolor);
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = `rgb(${storedColor[3]},${storedColor[4]},${storedColor[5]})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    storedA = A
    storedF = F
}

function changeColor() {
    ctx.clearRect(0, 0, size, size);
    let imageData = ctx.getImageData(0, 0, size, size);
    let A = storedA
    let F = storedF

    let color = randomColor()
    let r = color[0]
    let g = color[1]
    let b = color[2]
    // create random interval for colors and which axis they affect
    let int = randomInterval(1, 255)
    let xColor = randomInterval(0,2)
    let yColor = randomInterval(0,2)

    let T = 0;
    let V = 0.001;
    let x = 0, y = 0, nx, ny;

    let i = size * size;
    while (i--) {
        nx = A[0] * sin(F[0] * x);
        nx += A[1] * cos(F[1] * y);
        nx += A[2] * sin(F[2] * T);

        ny = A[3] * sin(F[3] * x);
        ny += A[4] * cos(F[4] * y);
        ny += A[5] * sin(F[5] * T);

        x = nx;
        y = ny;
        T += V;

        // Draw pixels
        setPixel(imageData, half + x * scale, half + y * scale, r, g, b, int, xColor, yColor);
    }
    ctx.putImageData(imageData, 0, 0);
    // Add background color
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = `rgb(${color[3]},${color[4]},${color[5]})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //displays formula
    console.log("A = [" + A.toString() + "];\nF = [" + F + "];");
    storedColor = color
    storedInt = int
    storedXcolor = xColor
    storedYcolor = yColor
}

function download() {
    let hiddenLink = document.createElement('a'), e;
    hiddenLink.download = 'universe.png'
    hiddenLink.href = canvas.toDataURL("image/png;base64");
    if (document.createEvent) {
        e = document.createEvent("MouseEvents");
        e.initMouseEvent("click", true, true, window,
            0, 0, 0, 0, 0, false, false, false,
            false, 0, null);
        hiddenLink.dispatchEvent(e);
    }
}

let random = document.createElement("button");
let text = document.createTextNode("Shuffle");
random.appendChild(text)
document.body.appendChild(random);
random.addEventListener("click", compute, true);

let randomShape = document.createElement("button");
let randomShapeText = document.createTextNode("Shape Shuffle");
randomShape.appendChild(randomShapeText)
document.body.appendChild(randomShape);
randomShape.addEventListener("click", changeShape, true);

let randomColorButton = document.createElement("button");
let randomColorText = document.createTextNode("Color Shuffle");
randomColorButton.appendChild(randomColorText)
document.body.appendChild(randomColorButton);
randomColorButton.addEventListener("click", changeColor, true);

let save = document.createElement("button");
let saveText = document.createTextNode("Download");
save.appendChild(saveText)
document.body.appendChild(save);
save.addEventListener("click", download);

compute();