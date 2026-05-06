const SIZE = 1920;
const HALF = SIZE * 0.5;
const SCALE = HALF * 0.3;
const TOTAL_POINTS = SIZE * SIZE;
const CHUNK_SIZE = 50000;
const ALPHA_PER_HIT = 7.5 / 255.0;

// === SHADER SOURCES ===

const pointVS = `#version 300 es
precision highp float;
in vec2 a_position;
uniform float u_half;
uniform float u_scale;
uniform float u_size;
void main() {
    vec2 pixel = vec2(u_half + a_position.x * u_scale, u_half + a_position.y * u_scale);
    vec2 clip = (pixel / u_size) * 2.0 - 1.0;
    clip.y = -clip.y;
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = 1.0;
}`;

const pointFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_alpha;
void main() {
    fragColor = vec4(u_alpha);
}`;

const compositeVS = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const compositeFS = `#version 300 es
precision highp float;
uniform sampler2D u_accum;
uniform vec3 u_bgColor;
uniform vec3 u_baseColor;
uniform float u_int;
uniform int u_xColor;
uniform int u_yColor;
in vec2 v_uv;
out vec4 fragColor;

void main() {
    float density = texture(u_accum, v_uv).r;
    float opacity = clamp(density, 0.0, 1.0);

    vec3 color = u_baseColor;

    float xNorm = v_uv.x;
    float xMod = xNorm > 0.5
        ? u_int - (xNorm / 0.5 * u_int)
        : -(u_int - (xNorm / 0.5 * u_int));
    float xBase = u_xColor == 0 ? color.r : (u_xColor == 1 ? color.g : color.b);
    float xHue = clamp(xBase + xMod, 0.0, 1.0);
    if (u_xColor == 0) color.r = xHue;
    else if (u_xColor == 1) color.g = xHue;
    else color.b = xHue;

    float yNorm = v_uv.y;
    float yMod = yNorm > 0.5
        ? u_int - (yNorm / 0.5 * u_int)
        : -(u_int - (yNorm / 0.5 * u_int));
    float yBase = u_yColor == 0 ? color.r : (u_yColor == 1 ? color.g : color.b);
    float yHue = clamp(yBase + yMod, 0.0, 1.0);
    if (u_yColor == 0) color.r = yHue;
    else if (u_yColor == 1) color.g = yHue;
    else color.b = yHue;

    vec3 result = mix(u_bgColor, color, opacity);
    fragColor = vec4(result, 1.0);
}`;

// === UTILITIES ===

function randomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomColor() {
    let h = randomInterval(0, 360) * 0.01;
    let s = randomInterval(42, 98) * 0.01;
    let l = randomInterval(40, 90) * 0.01;
    let invertH = randomInterval(0, 1) > 0.5
        ? (h * 100 + 120 > 360 ? (h * 100 - 120) * 0.01 : (h * 100 + 120) * 0.01)
        : (h * 100 - 120 < 0 ? (h * 100 + 120) * 0.01 : (h * 100 - 120) * 0.01);
    let r, g, b, ir, ig, ib;
    if (s === 0) {
        r = g = b = l;
    } else {
        let hue2rgb = function (p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
        ir = hue2rgb(p, q, invertH + 1 / 3);
        ig = hue2rgb(p, q, invertH);
        ib = hue2rgb(p, q, invertH - 1 / 3);
    }
    return [
        Math.round(r * 255), Math.round(g * 255), Math.round(b * 255),
        Math.round(ir * 255), Math.round(ig * 255), Math.round(ib * 255)
    ];
}

// === WEBGL HELPERS ===

function createShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    let vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    let fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    let prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
    }
    return prog;
}

// === STATE ===

let storedColor, storedInt, storedXcolor, storedYcolor, storedA, storedF;
let generating = false;
let chunks = [];
let totalChunks = 0;
let lastX = 0, lastY = 0, lastT = 0;

// === INIT ===

let app = document.createElement("div");
app.id = "app";
document.body.appendChild(app);

let canvas = document.createElement("canvas");
canvas.width = canvas.height = SIZE;
app.appendChild(canvas);

let gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
if (!gl) {
    document.body.innerHTML = "<p>WebGL2 is required. Please use a modern browser.</p>";
    throw new Error("WebGL2 not supported");
}

gl.getExtension("EXT_color_buffer_float");

let pointProg = createProgram(gl, pointVS, pointFS);
let compositeProg = createProgram(gl, compositeVS, compositeFS);

// Point program uniforms
let u_point_half = gl.getUniformLocation(pointProg, "u_half");
let u_point_scale = gl.getUniformLocation(pointProg, "u_scale");
let u_point_size = gl.getUniformLocation(pointProg, "u_size");
let u_point_alpha = gl.getUniformLocation(pointProg, "u_alpha");

// Composite program uniforms
let u_comp_accum = gl.getUniformLocation(compositeProg, "u_accum");
let u_comp_bgColor = gl.getUniformLocation(compositeProg, "u_bgColor");
let u_comp_baseColor = gl.getUniformLocation(compositeProg, "u_baseColor");
let u_comp_int = gl.getUniformLocation(compositeProg, "u_int");
let u_comp_xColor = gl.getUniformLocation(compositeProg, "u_xColor");
let u_comp_yColor = gl.getUniformLocation(compositeProg, "u_yColor");

// Point buffer
let pointBuffer = gl.createBuffer();
let pointVAO = gl.createVertexArray();
gl.bindVertexArray(pointVAO);
gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
gl.bufferData(gl.ARRAY_BUFFER, CHUNK_SIZE * 2 * 4, gl.DYNAMIC_DRAW);
let aPos = gl.getAttribLocation(pointProg, "a_position");
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

// Accumulation framebuffer
let accumTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, accumTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIZE, SIZE, 0, gl.RGBA, gl.HALF_FLOAT, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

let accumFBO = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, accumFBO);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, accumTex, 0);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

// Fullscreen quad
let quadVAO = gl.createVertexArray();
gl.bindVertexArray(quadVAO);
let quadBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
let aQuadPos = gl.getAttribLocation(compositeProg, "a_pos");
gl.enableVertexAttribArray(aQuadPos);
gl.vertexAttribPointer(aQuadPos, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

// === GENERATION ===

function composite() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.useProgram(compositeProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accumTex);
    gl.uniform1i(u_comp_accum, 0);
    gl.uniform3f(u_comp_bgColor, storedColor[3] / 255, storedColor[4] / 255, storedColor[5] / 255);
    gl.uniform3f(u_comp_baseColor, storedColor[0] / 255, storedColor[1] / 255, storedColor[2] / 255);
    gl.uniform1f(u_comp_int, storedInt / 255);
    gl.uniform1i(u_comp_xColor, storedXcolor);
    gl.uniform1i(u_comp_yColor, storedYcolor);
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function renderChunk(positions, count) {
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);

    gl.useProgram(pointProg);
    gl.uniform1f(u_point_half, HALF);
    gl.uniform1f(u_point_scale, SCALE);
    gl.uniform1f(u_point_size, SIZE);
    gl.uniform1f(u_point_alpha, ALPHA_PER_HIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, accumFBO);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindVertexArray(pointVAO);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disable(gl.BLEND);
}

function renderToStep(step) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, accumFBO);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < step; i++) {
        renderChunk(chunks[i].positions, chunks[i].count);
    }
    composite();
}

function generate() {
    if (generating) return;
    generating = true;
    chunks = [];
    totalChunks = Math.ceil(TOTAL_POINTS / CHUNK_SIZE);
    slider.max = totalChunks;
    slider.value = 0;

    let A = storedA.map(Number);
    let F = storedF.map(Number);
    let sin = Math.sin;
    let cos = Math.cos;

    // Clear accumulation buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, accumFBO);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let x = 0, y = 0, T = 0, V = 0.001;
    let done = 0;

    function processChunk() {
        let count = Math.min(CHUNK_SIZE, TOTAL_POINTS - done);
        let positions = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            let nx = A[0] * sin(F[0] * x) + A[1] * cos(F[1] * y) + A[2] * sin(F[2] * T);
            let ny = A[3] * sin(F[3] * x) + A[4] * cos(F[4] * y) + A[5] * sin(F[5] * T);
            x = nx;
            y = ny;
            T += V;
            positions[i * 2] = x;
            positions[i * 2 + 1] = y;
        }

        chunks.push({ positions, count });
        renderChunk(positions, count);
        composite();
        done += count;
        slider.value = chunks.length;
        slider.max = chunks.length;
        lastX = x; lastY = y; lastT = T;

        if (done < TOTAL_POINTS) {
            requestAnimationFrame(processChunk);
        } else {
            generating = false;
        }
    }

    requestAnimationFrame(processChunk);
}

function continueGenerating() {
    if (generating) return;
    generating = true;

    let A = storedA.map(Number);
    let F = storedF.map(Number);
    let sin = Math.sin;
    let cos = Math.cos;

    renderToStep(chunks.length);

    let x = lastX, y = lastY, T = lastT, V = 0.001;
    let done = 0;

    function processChunk() {
        let count = Math.min(CHUNK_SIZE, TOTAL_POINTS - done);
        let positions = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            let nx = A[0] * sin(F[0] * x) + A[1] * cos(F[1] * y) + A[2] * sin(F[2] * T);
            let ny = A[3] * sin(F[3] * x) + A[4] * cos(F[4] * y) + A[5] * sin(F[5] * T);
            x = nx;
            y = ny;
            T += V;
            positions[i * 2] = x;
            positions[i * 2 + 1] = y;
        }

        chunks.push({ positions, count });
        renderChunk(positions, count);
        composite();
        done += count;
        slider.value = chunks.length;
        slider.max = chunks.length;
        lastX = x; lastY = y; lastT = T;

        if (done < TOTAL_POINTS) {
            requestAnimationFrame(processChunk);
        } else {
            generating = false;
        }
    }

    requestAnimationFrame(processChunk);
}

function changeAll() {
    let bound = Math.PI / 2;
    storedA = Array.from({ length: 6 }, () => (-bound + Math.random() * bound * 2).toFixed(4));
    storedF = Array.from({ length: 6 }, () => (-Math.PI + Math.random() * Math.PI * 2).toFixed(4));
    storedColor = randomColor();
    storedInt = randomInterval(1, 255);
    storedXcolor = randomInterval(0, 2);
    storedYcolor = randomInterval(0, 2);
    generate();
}

function changeShape() {
    let bound = Math.PI / 2;
    storedA = Array.from({ length: 6 }, () => (-bound + Math.random() * bound * 2).toFixed(4));
    storedF = Array.from({ length: 6 }, () => (-Math.PI + Math.random() * Math.PI * 2).toFixed(4));
    generate();
}

function changeColor() {
    storedColor = randomColor();
    storedInt = randomInterval(1, 255);
    storedXcolor = randomInterval(0, 2);
    storedYcolor = randomInterval(0, 2);
    generate();
}

function download() {
    let link = document.createElement("a");
    link.download = "universe.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// === UI ===

let controls = document.createElement("div");
controls.id = "controls";
app.appendChild(controls);

let buttonsContainer = document.createElement("div");
buttonsContainer.id = "buttons";
controls.appendChild(buttonsContainer);

let buttons = [
    ["Restart", () => changeAll()],
    ["New Shape", () => changeShape()],
    ["New Color", () => changeColor()],
    ["Densify", () => continueGenerating()],
    ["Download", download]
];

buttons.forEach(([label, handler]) => {
    let btn = document.createElement("button");
    btn.textContent = label;
    btn.addEventListener("click", handler);
    buttonsContainer.appendChild(btn);
});

let slider = document.createElement("input");
slider.type = "range";
slider.min = 0;
slider.max = 0;
slider.value = 0;
slider.step = 1;
controls.appendChild(slider);

slider.addEventListener("input", function () {
    if (generating) return;
    renderToStep(Number(this.value));
});

// === RESIZE ===

function syncControlsWidth() {
    let canvasRect = canvas.getBoundingClientRect();
    controls.style.width = canvasRect.width + "px";
}

window.addEventListener("resize", syncControlsWidth);
new ResizeObserver(syncControlsWidth).observe(canvas);

// === START ===

changeAll();
