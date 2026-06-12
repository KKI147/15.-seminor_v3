/**
 * PokeAPI/sprites CDN URL·게임 상수
 */
const PokemonConfig = (function () {
    const CDN = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

    /** 필드 적이 이 수 이상이면 게임오버 */
    const FIELD_LIMIT = 100;
    const LEAK_LIMIT = FIELD_LIMIT;
    const ID_MIN = 1;
    const ID_MAX = 1025;
    const GIF_MAX_OFFICIAL = 649;

    /** 적 이동 — 라운드와 무관 고정 (보스만 ×0.72) */
    const ENEMY_SPEED_BASE = 0.000034;
    /** @deprecated 라운드 가속 폐지 — 호환용 0 */
    const ENEMY_SPEED_PER_ROUND = 0;
    /** 적 HP — 라운드 r에 따라 상승 (이동 속도 대신 난이도) */
    const ENEMY_HP_BASE = 105;
    const ENEMY_HP_LINEAR = 42;
    const ENEMY_HP_QUAD = 1.9;
    const ENEMY_BOSS_HP_MUL = 6;
    /** 리롤 — 보관함 포켓몬 N마리 → 뽑기권 M장 */
    const REROLL_TRADE_COUNT = 3;
    const REROLL_REWARD_TICKETS = 1;
    const SPAWN_INTERVAL = 38;
    const NEXT_WAVE_DELAY_MS = 2800;
    const BOSS_EVERY_ROUNDS = 10;
    const GEN1_MIN = 1;
    const GEN1_MAX = 151;
    /** 뽑기 가중 — 3단 > 2단 ≥ 무진화 (계열당 가중치) */
    const GACHA_WEIGHT_STAGE3 = 4;
    const GACHA_WEIGHT_STAGE2 = 1;
    const GACHA_WEIGHT_NO_EVO = 1;
    // 조합 전용(랜덤 뽑기 제외): 프리져, 썬더, 파이어, 뮤츠, 뮤
    const GEN1_COMBO_ONLY_IDS = [144, 145, 146, 150, 151];

    /**
     * 전설 조합 레시피 — 보관함 재료 소모 후 resultId 획득
     * minStage: 0=해당 ID, 1=2단 이상, 2=3단(최종)
     */
    const LEGENDARY_COMBOS = [
        {
            id: 'articuno',
            resultId: 144,
            label: '프리져',
            role: 'single',
            hint: '얼음·물 계열 3종',
            ingredients: [
                { pokemonId: 131, minStage: 0, label: '라프라스' },
                { pokemonId: 124, minStage: 0, label: '냉룡' },
                { pokemonId: 87, minStage: 1, label: '덩구리' }
            ]
        },
        {
            id: 'zapdos',
            resultId: 145,
            label: '썬더',
            role: 'aoe',
            hint: '전기 계열 3종',
            ingredients: [
                { pokemonId: 26, minStage: 1, label: '라이츄' },
                { pokemonId: 125, minStage: 0, label: '에레브' },
                { pokemonId: 135, minStage: 1, label: '쥬피썬더' }
            ]
        },
        {
            id: 'moltres',
            resultId: 146,
            label: '파이어',
            role: 'aoe',
            hint: '불꽃 계열 3종',
            ingredients: [
                { pokemonId: 6, minStage: 2, label: '리자몽' },
                { pokemonId: 38, minStage: 1, label: '나인테일' },
                { pokemonId: 136, minStage: 1, label: '부스터' }
            ]
        },
        {
            id: 'mewtwo',
            resultId: 150,
            label: '뮤츠',
            role: 'single',
            hint: '삼새 전설 3종',
            ingredients: [
                { pokemonId: 144, minStage: 0, label: '프리져' },
                { pokemonId: 145, minStage: 0, label: '썬더' },
                { pokemonId: 146, minStage: 0, label: '파이어' }
            ]
        },
        {
            id: 'mew',
            resultId: 151,
            label: '뮤',
            role: 'aoe',
            hint: '뮤츠 + 드래곤 최종 + 낙지왕',
            ingredients: [
                { pokemonId: 150, minStage: 0, label: '뮤츠' },
                { pokemonId: 149, minStage: 2, label: '망나뇽' },
                { pokemonId: 113, minStage: 0, label: '낙지왕' }
            ]
        }
    ];

    /** 이브이(133) 분기 진화 — 1단 합성 후 선택 */
    const EEVEE_BASE_ID = 133;
    const EEVEE_BRANCHES = [
        { id: 134, label: '샤미드' },
        { id: 135, label: '쥬피썬더' },
        { id: 136, label: '부스터' }
    ];

    /**
     * 관동(1~151) 뽑기 라인
     * - 각 계열의 첫 단계만 뽑기에서 등장(line[0])
     * - line은 진화 정보 표시/확장용으로 유지
     */
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

    function pngUrl(id) {
        return CDN + '/' + id + '.png';
    }

    function gifUrl(id) {
        return CDN + '/versions/generation-v/black-white/animated/' + id + '.gif';
    }

    function likelyHasGif(id) {
        if (id >= ID_MIN && id <= GIF_MAX_OFFICIAL) {
            return true;
        }
        return false;
    }

    function randomId() {
        return Math.floor(Math.random() * (ID_MAX - ID_MIN + 1)) + ID_MIN;
    }

    /** 전체 진화 라인 목록 */
    function getEvolutionLines() {
        if (typeof POKEMON_EVOLUTION_LINES !== 'undefined') {
            return POKEMON_EVOLUTION_LINES;
        }
        return [];
    }

    /** 전설 여부 */
    function isLegendaryId(id) {
        return GEN1_COMBO_ONLY_IDS.indexOf(id) >= 0;
    }

    /** 전설 조합 레시피 목록 */
    function getLegendaryCombos() {
        return LEGENDARY_COMBOS.slice();
    }

    /** 결과 ID로 조합 레시피 조회 */
    function getLegendaryComboByResultId(resultId) {
        let i;
        for (i = 0; i < LEGENDARY_COMBOS.length; i++) {
            if (LEGENDARY_COMBOS[i].resultId === resultId) {
                return LEGENDARY_COMBOS[i];
            }
        }
        return null;
    }

    /**
     * 1세대 뽑기용 라인 구성
     * - 진화 라인: 1~151로 잘라낸 라인의 1단만 뽑히도록 line 유지
     * - 진화체 없는 포켓몬: [id] 단일 라인으로 포함
     */
    function getGen1GachaLines() {
        return GEN1_GACHA_LINES.slice();
    }

    /** 계열 깊이별 뽑기 가중치 */
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

    /** 가중 랜덤 — 3단 계열 우선 */
    function pickWeightedGachaLine(lines) {
        let total = 0;
        let roll;
        let i;
        let w;

        if (!lines || !lines.length) {
            return null;
        }
        for (i = 0; i < lines.length; i++) {
            total += getGachaLineDepthWeight(lines[i]);
        }
        if (total <= 0) {
            return lines[0];
        }
        roll = Math.random() * total;
        for (i = 0; i < lines.length; i++) {
            w = getGachaLineDepthWeight(lines[i]);
            roll -= w;
            if (roll <= 0) {
                return lines[i];
            }
        }
        return lines[lines.length - 1];
    }

    /** 뽑기 — 1세대(1~151) 기준 가중 랜덤 라인 */
    function randomGachaLine() {
        const lines = getGen1GachaLines();
        let picked;
        if (!lines.length) {
            return [Math.floor(Math.random() * GEN1_MAX) + 1];
        }
        picked = pickWeightedGachaLine(lines);
        return picked ? picked.slice() : lines[0].slice();
    }

    /** 뽑기 표시·배치용 1단(첫 번째) 도감 번호 */
    function randomGachaBaseId() {
        const line = randomGachaLine();
        return line[0];
    }

    /** 이브이 계열 1단(133) 여부 */
    function isEeveeLineBase(baseId) {
        return baseId === EEVEE_BASE_ID;
    }

    /** 이브이 분기 진화체(134~136) 여부 */
    function isEeveeEvolvedId(id) {
        let i;
        for (i = 0; i < EEVEE_BRANCHES.length; i++) {
            if (EEVEE_BRANCHES[i].id === id) {
                return true;
            }
        }
        return false;
    }

    /** 이브이 분기 진화 선택지 */
    function getEeveeBranches() {
        return EEVEE_BRANCHES.slice();
    }

    /** 이브이 계열 라인 정규화 — 뽑기/보관함용 */
    function normalizeEeveeLine(line) {
        if (!line || !line.length) {
            return [EEVEE_BASE_ID, 134, 135, 136];
        }
        if (line[0] === EEVEE_BASE_ID && line.length === 1) {
            return [EEVEE_BASE_ID, 134, 135, 136];
        }
        return line;
    }

    /** 분기 진화 최대 단계(0=이브이, 1=진화체) */
    function getBranchMaxStage(baseId) {
        if (isEeveeLineBase(baseId)) {
            return 1;
        }
        return -1;
    }

    /** 보스 풀 — 전설·환상 포켓몬 (라운드마다 순환) */
    const LEGENDARY_BOSS_IDS = [
        144, 145, 146, 150, 151,
        243, 244, 245, 249, 250, 251,
        377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
        480, 481, 482, 483, 484, 485, 486, 487, 488, 491, 492, 493,
        638, 639, 640, 641, 642, 643, 644, 645, 646,
        716, 717, 718,
        785, 786, 787, 788, 789, 790, 791, 792, 800,
        888, 889, 890
    ];

    function getBossIdPool() {
        return LEGENDARY_BOSS_IDS.slice();
    }

    /** 라운드별 보스 ID — 10·20·30…마다 풀에서 순환 (같은 라운드 구간은 동일) */
    function getBossIdForRound(roundNum) {
        const pool = LEGENDARY_BOSS_IDS;
        const r = Math.max(1, roundNum || 1);
        let idx;

        if (!pool.length) {
            return randomId();
        }
        idx = Math.floor(r / BOSS_EVERY_ROUNDS) - 1;
        if (idx < 0) {
            idx = 0;
        }
        return pool[idx % pool.length];
    }

    /** @deprecated getBossIdForRound 사용 */
    function randomBossId() {
        return getBossIdForRound(BOSS_EVERY_ROUNDS);
    }

    /** 보스 등장 라운드 여부 (10, 20, 30 …) */
    function isBossRound(roundNum) {
        return roundNum > 0 && roundNum % BOSS_EVERY_ROUNDS === 0;
    }

    /** 일반/보스 최대 HP — 라운드 r마다 상승 (2차 곡선) */
    function getEnemyMaxHp(roundNum, isBoss) {
        const r = Math.max(1, roundNum || 1);
        let hp = Math.round(ENEMY_HP_BASE + r * ENEMY_HP_LINEAR + r * r * ENEMY_HP_QUAD);
        if (isBoss) {
            hp = Math.round(hp * ENEMY_BOSS_HP_MUL);
        }
        return hp;
    }

    /** 적 이동속도 — 라운드 고정, 보스만 감속 */
    function getEnemySpeed(roundNum, isBoss) {
        let spd = ENEMY_SPEED_BASE;
        if (isBoss) {
            spd = spd * 0.72;
        }
        return spd;
    }

    /** 보스 처치 뽑기권 — 고정 5장 (`gameDemo.js` TICKET_BOSS_REWARD) */
    const BOSS_TICKET_REWARD = 5;

    function getBossTicketReward(roundNum) {
        return BOSS_TICKET_REWARD;
    }

    /** 리롤용 서로 다른 3라인 뽑기 */
    function randomGachaLineBatch(count) {
        const lines = getGen1GachaLines();
        const picks = [];
        const used = {};
        let attempts = 0;
        let line;
        let baseId;
        const max = count || 3;

        if (!lines.length) {
            return picks;
        }
        while (picks.length < max && attempts < max * 30) {
            attempts++;
            line = pickWeightedGachaLine(lines);
            if (!line) {
                continue;
            }
            baseId = line[0];
            if (used[baseId]) {
                continue;
            }
            used[baseId] = true;
            picks.push(line.slice());
        }
        return picks;
    }

    function lineCount() {
        return getGen1GachaLines().length;
    }

    return {
        CDN: CDN,
        FIELD_LIMIT: FIELD_LIMIT,
        LEAK_LIMIT: LEAK_LIMIT,
        ID_MIN: ID_MIN,
        ID_MAX: ID_MAX,
        ENEMY_SPEED_BASE: ENEMY_SPEED_BASE,
        ENEMY_SPEED_PER_ROUND: ENEMY_SPEED_PER_ROUND,
        SPAWN_INTERVAL: SPAWN_INTERVAL,
        NEXT_WAVE_DELAY_MS: NEXT_WAVE_DELAY_MS,
        pngUrl: pngUrl,
        gifUrl: gifUrl,
        likelyHasGif: likelyHasGif,
        randomId: randomId,
        GACHA_WEIGHT_STAGE3: GACHA_WEIGHT_STAGE3,
        GACHA_WEIGHT_STAGE2: GACHA_WEIGHT_STAGE2,
        GACHA_WEIGHT_NO_EVO: GACHA_WEIGHT_NO_EVO,
        getGachaLineDepthWeight: getGachaLineDepthWeight,
        pickWeightedGachaLine: pickWeightedGachaLine,
        randomGachaLine: randomGachaLine,
        randomGachaBaseId: randomGachaBaseId,
        getEvolutionLines: getEvolutionLines,
        getGen1GachaLines: getGen1GachaLines,
        isLegendaryId: isLegendaryId,
        GEN1_COMBO_ONLY_IDS: GEN1_COMBO_ONLY_IDS,
        LEGENDARY_COMBOS: LEGENDARY_COMBOS,
        getLegendaryCombos: getLegendaryCombos,
        getLegendaryComboByResultId: getLegendaryComboByResultId,
        EEVEE_BASE_ID: EEVEE_BASE_ID,
        EEVEE_BRANCHES: EEVEE_BRANCHES,
        isEeveeLineBase: isEeveeLineBase,
        isEeveeEvolvedId: isEeveeEvolvedId,
        getEeveeBranches: getEeveeBranches,
        normalizeEeveeLine: normalizeEeveeLine,
        getBranchMaxStage: getBranchMaxStage,
        BOSS_EVERY_ROUNDS: BOSS_EVERY_ROUNDS,
        LEGENDARY_BOSS_IDS: LEGENDARY_BOSS_IDS,
        getBossIdPool: getBossIdPool,
        getBossIdForRound: getBossIdForRound,
        randomBossId: randomBossId,
        isBossRound: isBossRound,
        getEnemyMaxHp: getEnemyMaxHp,
        getEnemySpeed: getEnemySpeed,
        getBossTicketReward: getBossTicketReward,
        randomGachaLineBatch: randomGachaLineBatch,
        REROLL_TRADE_COUNT: REROLL_TRADE_COUNT,
        REROLL_REWARD_TICKETS: REROLL_REWARD_TICKETS,
        lineCount: lineCount
    };
}());
