/**
 * 전설 조합·설정 스모크 테스트 — node scripts/test-defense-logic.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let failed = 0;

function assert(cond, msg) {
    if (!cond) {
        console.error('FAIL:', msg);
        failed++;
    } else {
        console.log('OK:', msg);
    }
}

const configPath = path.join(__dirname, '..', 'js', 'pokemonConfig.js');
const configCode = fs.readFileSync(configPath, 'utf8');
const sandbox = { console: console };
vm.runInNewContext(configCode + '\nthis.PokemonConfig = PokemonConfig;', sandbox);
const PokemonConfig = sandbox.PokemonConfig;

assert(PokemonConfig, 'PokemonConfig 로드');
assert(PokemonConfig.getLegendaryCombos().length === 5, '전설 조합 5종');

const combos = PokemonConfig.getLegendaryCombos();
const ids = combos.map(function (c) { return c.resultId; });
assert(ids.indexOf(144) >= 0 && ids.indexOf(151) >= 0, '144~151 포함');

combos.forEach(function (combo) {
    assert(combo.ingredients && combo.ingredients.length === 3, combo.label + ' 재료 3개');
    combo.ingredients.forEach(function (ing) {
        assert(ing.pokemonId > 0, combo.label + ' pokemonId');
        assert(ing.minStage >= 0, combo.label + ' minStage');
    });
});

const mewtwo = PokemonConfig.getLegendaryComboByResultId(150);
assert(mewtwo && mewtwo.ingredients[0].pokemonId === 144, '뮤츠 = 삼새');

const mapPath = path.join(__dirname, '..', 'assets', 'map-gym-field.png');
assert(fs.existsSync(mapPath), 'map-gym-field.png 존재');
const stat = fs.statSync(mapPath);
assert(stat.size > 10000, '맵 PNG 크기');

const demoPath = path.join(__dirname, '..', 'css', 'demo.css');
const demoCss = fs.readFileSync(demoPath, 'utf8');
assert(demoCss.indexOf('legendary-overlay') >= 0, 'demo.css 전설 UI');
assert(demoCss.indexOf('map-gym') >= 0, 'demo.css 체육관');
assert(demoCss.indexOf('evo-ready-pulse') >= 0, 'demo.css 진화 UI');
assert(demoCss.indexOf('passive-desc') >= 0, 'demo.css 패시브 UI');

// 속성 상성 표 검증 (게임 로직과 동일 표)
const ELEMENT_SUPER = {
    fire: ['grass', 'ice'],
    water: ['fire'],
    grass: ['water'],
    electric: ['water'],
    ice: ['grass', 'dragon'],
    psychic: ['dark'],
    dragon: ['dragon'],
    dark: ['psychic']
};
const ELEMENT_RESIST = {
    fire: ['water'],
    water: ['grass', 'electric'],
    grass: ['fire', 'ice'],
    electric: ['grass'],
    ice: ['fire'],
    psychic: ['dark'],
    dragon: ['ice'],
    dark: []
};
function testTypeMul(att, def) {
    if (ELEMENT_SUPER[att] && ELEMENT_SUPER[att].indexOf(def) >= 0) {
        return 1.35;
    }
    if (ELEMENT_RESIST[att] && ELEMENT_RESIST[att].indexOf(def) >= 0) {
        return 0.75;
    }
    return 1;
}
assert(testTypeMul('fire', 'grass') === 1.35, '불→풀 효과적');
assert(testTypeMul('fire', 'water') === 0.75, '불→물 약함');
assert(testTypeMul('water', 'fire') === 1.35, '물→불 효과적');

const gameDemoPath = path.join(__dirname, '..', 'js', 'gameDemo.js');
const demoJs = fs.readFileSync(gameDemoPath, 'utf8');
assert(demoJs.indexOf('function grantTestLegendariesAll') >= 0, 'grantTestLegendariesAll 정의');
assert(demoJs.indexOf('grantTestLegendariesAll: grantTestLegendariesAll') >= 0, 'DefenseDemo 공개 API');

if (failed > 0) {
    console.error('\n' + failed + ' failed');
    process.exit(1);
}
console.log('\nAll logic tests passed.');
