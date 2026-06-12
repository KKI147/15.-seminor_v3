/**
 * 관동 뽑기 풀 — 계열 깊이·역할별 확률 (가중 뽑기 + getRoleForBaseId 규칙)
 */
const GACHA_WEIGHT_STAGE3 = 4;
const GACHA_WEIGHT_STAGE2 = 1;
const GACHA_WEIGHT_NO_EVO = 1;

function getGachaLineDepthWeight(line) {
    if (!line || !line.length) {
        return GACHA_WEIGHT_NO_EVO;
    }
    if (line.length >= 3) {
        return GACHA_WEIGHT_STAGE3;
    }
    if (line.length === 2) {
        return GACHA_WEIGHT_STAGE2;
    }
    return GACHA_WEIGHT_NO_EVO;
}
const GEN1_GACHA_LINES = [
    [1, 2, 3], [4, 5, 6], [7, 8, 9],
    [10, 11, 12], [13, 14, 15], [16, 17, 18],
    [19, 20], [21, 22], [23, 24], [25, 26], [27, 28],
    [29, 30, 31], [32, 33, 34], [35, 36], [37, 38], [39, 40],
    [41, 42], [43, 44, 45], [46, 47], [48, 49], [50, 51],
    [52, 53], [54, 55], [56, 57], [58, 59], [60, 61, 62],
    [63, 64, 65], [66, 67, 68], [69, 70, 71], [72, 73],
    [74, 75, 76], [77, 78], [79, 80], [81, 82], [83], [84, 85],
    [86, 87], [88, 89], [90, 91], [92, 93, 94], [95], [96, 97],
    [98, 99], [100, 101], [102, 103], [104, 105], [106], [107],
    [108], [109, 110], [111, 112], [113], [114], [115], [116, 117],
    [118, 119], [120, 121], [122], [123], [124], [125], [126],
    [127], [128], [129, 130], [131], [132], [133, 134, 135, 136], [137], [138, 139],
    [140, 141], [142], [143], [147, 148, 149]
];

function getLineDepth(line) {
    if (line.length >= 3) {
        return '3단';
    }
    if (line.length === 2) {
        return '2단';
    }
    return '무진화';
}

function getRole(baseId, line) {
    if (line.length > 1) {
        const sub = baseId % 75;
        if (sub < 45) {
            return '단일';
        }
        return '범위';
    }
    const sub = baseId % 25;
    if (sub < 15) {
        return '슬로우';
    }
    return '버프';
}

function pct(n, total) {
    return (n / total * 100).toFixed(1);
}

const total = GEN1_GACHA_LINES.length;
const byDepth = { '3단': 0, '2단': 0, '무진화': 0 };
const byRole = { '단일': 0, '범위': 0, '슬로우': 0, '버프': 0 };
const cross = {};
const rows = [];

let i;
let line;
let baseId;
let depth;
let role;
let key;

for (i = 0; i < GEN1_GACHA_LINES.length; i++) {
    line = GEN1_GACHA_LINES[i];
    baseId = line[0];
    depth = getLineDepth(line);
    role = getRole(baseId, line);
    byDepth[depth]++;
    byRole[role]++;
    key = depth + '·' + role;
    cross[key] = (cross[key] || 0) + 1;
    rows.push({ baseId: baseId, depth: depth, role: role, lineLen: line.length });
}

let weightTotal = 0;
let w3 = 0;
let w2 = 0;
let w0 = 0;

for (i = 0; i < GEN1_GACHA_LINES.length; i++) {
    line = GEN1_GACHA_LINES[i];
    const w = getGachaLineDepthWeight(line);
    weightTotal += w;
    if (line.length >= 3) {
        w3 += w;
    } else if (line.length === 2) {
        w2 += w;
    } else {
        w0 += w;
    }
}

console.log('=== 관동 뽑기 풀 (GEN1_GACHA_LINES + 가중) ===');
console.log('총 계열 수:', total, '(전설 144~151 조합 전용 제외)');
console.log('가중치: 3단=' + GACHA_WEIGHT_STAGE3 + ', 2단=' + GACHA_WEIGHT_STAGE2 + ', 무진화=' + GACHA_WEIGHT_NO_EVO);
console.log('');
console.log('--- 가중 뽑기 1회 (계열 깊이) ---');
console.log('3단 진화형:', pct(w3, weightTotal) + '%');
console.log('2단 진화형:', pct(w2, weightTotal) + '%');
console.log('무진화:    ', pct(w0, weightTotal) + '%');
console.log('');
console.log('--- 균등(참고) 계열 수 ---');

console.log('--- 계열 깊이 (뽑기 1회 = 랜덤 1계열) ---');
console.log('3단 진화형:', byDepth['3단'], '계열', pct(byDepth['3단'], total) + '%');
console.log('2단 진화형:', byDepth['2단'], '계열', pct(byDepth['2단'], total) + '%');
console.log('무진화:    ', byDepth['무진화'], '계열', pct(byDepth['무진화'], total) + '%');
console.log('');

console.log('--- 역할 (전체) ---');
console.log('단일:', byRole['단일'], pct(byRole['단일'], total) + '%');
console.log('범위:', byRole['범위'], pct(byRole['범위'], total) + '%');
console.log('슬로우:', byRole['슬로우'], pct(byRole['슬로우'], total) + '%');
console.log('버프:', byRole['버프'], pct(byRole['버프'], total) + '%');
console.log('');

console.log('--- 교차 (깊이 × 역할) ---');
const crossKeys = Object.keys(cross).sort();
for (i = 0; i < crossKeys.length; i++) {
    key = crossKeys[i];
    console.log(key + ':', cross[key], '계열', pct(cross[key], total) + '%');
}
console.log('');

console.log('--- 진화형 내부 (단일:범위 = 45:30 on baseId%75) ---');
const evoTotal = byDepth['3단'] + byDepth['2단'];
console.log('진화형 합계:', evoTotal, '계열', pct(evoTotal, total) + '%');
console.log('  그중 단일:', byRole['단일'], pct(byRole['단일'], evoTotal) + '% of 진화형');
console.log('  그중 범위:', byRole['범위'], pct(byRole['범위'], evoTotal) + '% of 진화형');
console.log('');

console.log('--- 무진화 내부 (슬로우:버프 = 15:10 on baseId%25) ---');
const noEvo = byDepth['무진화'];
console.log('무진화 합계:', noEvo, '계열', pct(noEvo, total) + '%');
console.log('  그중 슬로우:', byRole['슬로우'], pct(byRole['슬로우'], noEvo) + '% of 무진화');
console.log('  그중 버프:', byRole['버프'], pct(byRole['버프'], noEvo) + '% of 무진화');
console.log('');

console.log('--- 3단 진화형 상세 ---');
for (i = 0; i < rows.length; i++) {
    if (rows[i].depth === '3단') {
        console.log('#' + rows[i].baseId, rows[i].role);
    }
}
console.log('');

console.log('--- 2단 진화형 상세 ---');
for (i = 0; i < rows.length; i++) {
    if (rows[i].depth === '2단') {
        console.log('#' + rows[i].baseId, rows[i].role);
    }
}
console.log('');

console.log('--- 무진화 (슬로우/버프) 상세 ---');
for (i = 0; i < rows.length; i++) {
    if (rows[i].depth === '무진화') {
        console.log('#' + rows[i].baseId, rows[i].role, '(id%25=' + (rows[i].baseId % 25) + ')');
    }
}
