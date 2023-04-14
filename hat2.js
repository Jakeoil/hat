// Sqrt 3
const r3 = 1.7320508075688772;
const hr3 = 0.8660254037844386;
const ident = [1, 0, 0, 0, 1, 0];

let to_screen = [10, 0, 100, 0, -10, 100];
let lw_scale = 1;
let tiles;
let level;

function pt(x, y) {
    return { x: x, y: y };
}

function hexPt(x, y) {
    return pt(x + 0.5 * y, hr3 * y);
}

// Affine matrix inverse
function inv(T) {
    const det = T[0] * T[4] - T[1] * T[3];
    return [
        T[4] / det,
        -T[1] / det,
        (T[1] * T[5] - T[2] * T[4]) / det,
        -T[3] / det,
        T[0] / det,
        (T[2] * T[3] - T[0] * T[5]) / det,
    ];
}

// Affine matrix multiply
function mul(A, B) {
    return [
        A[0] * B[0] + A[1] * B[3],
        A[0] * B[1] + A[1] * B[4],
        A[0] * B[2] + A[1] * B[5] + A[2],

        A[3] * B[0] + A[4] * B[3],
        A[3] * B[1] + A[4] * B[4],
        A[3] * B[2] + A[4] * B[5] + A[5],
    ];
}

function padd(p, q) {
    return { x: p.x + q.x, y: p.y + q.y };
}

function psub(p, q) {
    return { x: p.x - q.x, y: p.y - q.y };
}

// Rotation matrix
function trot(ang) {
    const c = cos(ang);
    const s = sin(ang);
    return [c, -s, 0, s, c, 0];
}

// degree to radians
// 180 = PI

function tHour(hour) {
    return trot((hour * PI) / 6);
}

// Translation matrix
function ttrans(tx, ty) {
    return [1, 0, tx, 0, 1, ty];
}

function rotAbout(p, ang) {
    return mul(ttrans(p.x, p.y), mul(trot(ang), ttrans(-p.x, -p.y)));
}

// Matrix * point
function transPt(M, P) {
    return pt(M[0] * P.x + M[1] * P.y + M[2], M[3] * P.x + M[4] * P.y + M[5]);
}

// Match unit interval to line segment p->q
function matchSeg(p, q) {
    return [q.x - p.x, p.y - q.y, p.x, q.y - p.y, q.x - p.x, p.y];
}

// Match line segment p1->q1 to line segment p2->q2
function matchTwo(p1, q1, p2, q2) {
    return mul(matchSeg(p2, q2), inv(matchSeg(p1, q1)));
}

function intersect(p1, q1, p2, q2) {
    const d = (q2.y - p2.y) * (q1.x - p1.x) - (q2.x - p2.x) * (q1.y - p1.y);

    const uA =
        ((q2.x - p2.x) * (p1.y - p2.y) - (q2.y - p2.y) * (p1.x - p2.x)) / d;
    const uB =
        ((q1.x - p1.x) * (p1.y - p2.y) - (q1.y - p1.y) * (p1.x - p2.x)) / d;

    return pt(p1.x + uA * (q1.x - p1.x), p1.y + uA * (q1.y - p1.y));
}
function drawPolygon(shape, T, f, s, w) {
    if (f != null) {
        fill(...f);
    } else {
        noFill();
    }
    if (s != null) {
        stroke(...s);
        // strokeWeight
    } else {
        noStroke();
    }
    beginShape();
    for (let p of shape) {
        const tp = transPt(T, p);
        vertex(tp.x, tp.y);
    }
    endShape(CLOSE);
}

const hat_outline = [
    hexPt(0, 0),
    hexPt(-1, -1),
    hexPt(0, -2),
    hexPt(2, -2),
    hexPt(2, -1),
    hexPt(4, -2),
    hexPt(5, -1),
    hexPt(4, 0),
    hexPt(3, 0),
    hexPt(2, 2),
    hexPt(0, 3),
    hexPt(0, 2),
    hexPt(-1, 2),
];

const hexagon = [
    hexPt(0, 0),
    hexPt(2, 0),
    hexPt(3, 1),
    hexPt(2, 2),
    hexPt(2, 0),
    hexPt(1, -1),
];

const ell = [
    hexPt(0, 0),
    hexPt(2, 0),
    hexPt(2, 3),
    hexPt(5, 3),
    hexPt(5, 4),
    hexPt(0, 4),
];

class Geom {
    constructor(pgon, fill, stroke) {
        this.shape = pgon;
        this.fill = fill;
        this.stroke = stroke;
        this.width = 1.0;
        this.children = [];
        //this.svg_id = null;
    }
    draw(S) {
        //console.log(`draw polygon ${S}`);
        drawPolygon(this.shape, S, this.fill, this.stroke, this.width);
    }
}

// Some static text.
function captions(text) {
    let p = createP(text);
    p.style("font-size", "16px");
    return p;
}
function standardize_color(str) {
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = str;
    return ctx.fillStyle;
}
//let to_screen = [10, 0, 100, 0, -10, 100];
let scale = 20;

/*****************************************
 * Callbacks
 */
function setup() {
    createCanvas(windowWidth, windowHeight);
    noLoop();
    //frameRate(0.5);
}
const dblue = [0, 137, 212];
const bblack = [0, 0, 0];

function draw() {
    background("white");
    stroke(0);
    let offX = scale * 4 * r3,
        offY = scale * 6 * 0.5;
    const geom1 = new Geom(hat_outline, dblue, [0, 0, 0]);
    const geom2 = new Geom(hexagon, dblue, bblack);
    const m = [
        scale,
        0, //
        offX, //
        0,
        -scale, //
        offY,
    ];
    const m0 = [
        scale, // cos x
        0, //     sin x
        offX + 100, //
        0, //
        scale, //
        offY,
    ];

    drawGrid();
    geom1.draw(mul(ident, m));
    geom1.draw(m0);
    drawHex(pt(offX + 200, offY), 3);
    let cap = captions("plain old 25");
    cap.position(10, 20);

    //m[2 = ]
    //console.log(PI / 4);
    //geom1.draw(mul(trot(PI / 2), m));
    //console.log(standardize_color("red"));
}
function drawGrid() {
    stroke(200);
    for (let y = 0; y < windowHeight; y += scale * hr3) {
        //

        line(0, y, windowWidth, y);
    }
    for (let x = 0; x < windowWidth; x += scale * 0.5) {
        //
        line(x, 0, x, windowHeight);
    }
}

function drawHex(pt, hour) {
    console.log(`prams: ${pt.x}, ${pt.y} hour: ${hour}`);
    let angle = tHour(hour);
    console.log("angle" + angle);
    let m = [scale, 0, pt.x, 0, scale, pt.y];
    console.log(`m: ${m}`);
}
function windowResized() {
    console.log("resized");
    resizeCanvas(windowWidth, windowHeight);
}

//function mousePressed() {
//    console.log("pressed");
//}
