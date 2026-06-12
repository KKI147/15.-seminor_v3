/**
 * 체육관 맵 900×900 PNG 생성 — node scripts/generate-gym-map.js
 * (canvas 패키지 필요: npm install canvas)
 */
const fs = require('fs');
const path = require('path');

const FIELD = 900;
const GRID = 10;
const CELL = 54;
const PATH_PAD = 82;
const GRID_ORIGIN = (FIELD - GRID * CELL) / 2;
const GRID_W = GRID * CELL;
const PATH_OX = GRID_ORIGIN - PATH_PAD;
const PATH_OY = GRID_ORIGIN - PATH_PAD;
const PATH_OW = GRID_W + PATH_PAD * 2;
const PATH_OH = GRID_W + PATH_PAD * 2;
const TRACK_W = 44;

const C = {
    hall: '#121018',
    seatDark: '#221820',
    seatLight: '#342430',
    innerMat: '#4a3828',
    trackFill: '#7a2830',
    trackEdge: '#4a1818',
    trackHi: '#b85058',
    woodLight: '#d8b880',
    woodDark: '#bc9a68',
    court: '#fff8e8',
    spawn: '#e83030'
};

function drawAudience(ctx) {
    let y;
    let x;
    let row;
    const stripeH = 10;

    for (y = 0; y < PATH_OY; y += stripeH) {
        row = Math.floor(y / stripeH);
        ctx.fillStyle = row % 2 === 0 ? C.seatDark : C.seatLight;
        ctx.fillRect(0, y, FIELD, Math.min(stripeH, PATH_OY - y));
    }
    for (y = PATH_OY + PATH_OH; y < FIELD; y += stripeH) {
        row = Math.floor(y / stripeH);
        ctx.fillStyle = row % 2 === 0 ? C.seatDark : C.seatLight;
        ctx.fillRect(0, y, FIELD, Math.min(stripeH, FIELD - y));
    }
    for (y = PATH_OY; y < PATH_OY + PATH_OH; y += stripeH) {
        row = Math.floor(y / stripeH);
        for (x = 0; x < PATH_OX; x += 10) {
            ctx.fillStyle = row % 2 === 0 ? C.seatDark : C.seatLight;
            ctx.fillRect(x, y, Math.min(10, PATH_OX - x), Math.min(stripeH, PATH_OY + PATH_OH - y));
        }
        for (x = PATH_OX + PATH_OW; x < FIELD; x += 10) {
            ctx.fillStyle = row % 2 === 0 ? C.seatDark : C.seatLight;
            ctx.fillRect(x, y, Math.min(10, FIELD - x), Math.min(stripeH, PATH_OY + PATH_OH - y));
        }
    }
}

function drawArena(ctx) {
    let row;
    let col;
    let px;
    let py;

    ctx.fillStyle = C.innerMat;
    ctx.fillRect(PATH_OX, PATH_OY, PATH_OW, PATH_OH);

    for (row = 0; row < GRID; row++) {
        for (col = 0; col < GRID; col++) {
            px = GRID_ORIGIN + col * CELL;
            py = GRID_ORIGIN + row * CELL;
            ctx.fillStyle = (row + col) % 2 === 0 ? C.woodLight : C.woodDark;
            ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        }
    }
}

function drawTrack(ctx) {
    const pts = [
        [PATH_OX, PATH_OY],
        [PATH_OX, PATH_OY + PATH_OH],
        [PATH_OX + PATH_OW, PATH_OY + PATH_OH],
        [PATH_OX + PATH_OW, PATH_OY]
    ];

    function strokePath(width, color, alpha) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.lineTo(pts[3][0], pts[3][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    strokePath(TRACK_W + 4, C.trackEdge, 0.85);
    strokePath(TRACK_W, C.trackFill, 1);
    strokePath(2, C.trackHi, 0.55);
}

function drawMarkings(ctx) {
    const gx = GRID_ORIGIN;
    const gy = GRID_ORIGIN;
    const cx = gx + GRID_W / 2;
    const cy = gy + GRID_W / 2;

    ctx.strokeStyle = C.court;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 3;
    ctx.strokeRect(gx + 2, gy + 2, GRID_W - 4, GRID_W - 4);
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawSpawn(ctx) {
    const x = PATH_OX;
    const y = PATH_OY;

    ctx.fillStyle = C.spawn;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 9, y - 2, 18, 4);
    ctx.strokeStyle = '#ffeecc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
}

function drawSpotlights(ctx) {
    const grad = ctx.createRadialGradient(FIELD / 2, 120, 20, FIELD / 2, 200, 420);
    grad.addColorStop(0, 'rgba(200, 60, 50, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD, FIELD);
}

function main() {
    let createCanvas;
    try {
        createCanvas = require('canvas').createCanvas;
    } catch (e) {
        console.error('canvas 패키지가 없습니다. 프로젝트 루트에서: npm install canvas');
        process.exit(1);
    }

    const canvas = createCanvas(FIELD, FIELD);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = C.hall;
    ctx.fillRect(0, 0, FIELD, FIELD);
    drawAudience(ctx);
    drawArena(ctx);
    drawTrack(ctx);
    drawMarkings(ctx);
    drawSpawn(ctx);
    drawSpotlights(ctx);

    const outDir = path.join(__dirname, '..', 'assets');
    const outPath = path.join(outDir, 'map-gym-field.png');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log('Written:', outPath);
}

main();
