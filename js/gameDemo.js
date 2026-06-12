/**
 * 포켓몬 디펜스 — PixiJS + PokeAPI 스프라이트 + 뽑기 배치
 */
const DefenseDemo = (function () {
    /* #wrap 설계 높이(1020) 안에 맞춤 — CSS game-stage·Pixi FIELD 900×900 동일 */
    const FIELD = 900;
    const GRID = 10;
    const CELL = 54;
    const PATH_PAD = 82;

    /** 체육관 맵 색상 */
    const GYM_COLORS = {
        hall: 0x121018,
        seatDark: 0x221820,
        seatLight: 0x342430,
        innerMat: 0x4a3828,
        trackFill: 0x7a2830,
        trackEdge: 0x4a1818,
        trackHighlight: 0xb85058,
        woodLight: 0xd8b880,
        woodDark: 0xbc9a68,
        courtLine: 0xfff8e8,
        spawnFill: 0xe83030,
        spawnRing: 0xffeecc
    };

    const GYM_TRACK_WIDTH = 44;
    const MAP_BG_URL = 'assets/map-gym-field.png';
    const UNIT_SCALE = 0.52;
    const ENEMY_SCALE = 0.46;
    const UNIT_RANGE = 210;
    const ATTACK_LOCK_MS = 450;
    const MERGE_REQUIRED_STAGE1 = 2;
    const MERGE_REQUIRED_STAGE2 = 3;
    const TICKET_TIMER_REWARD = 3;
    const TICKET_SKIP_REWARD = 3;
    const TICKET_BOSS_REWARD = 5;
    const STAGE_LABELS = ['1단', '2단', '3단'];
    const STAGE_STATS = [
        { damage: 26, range: 186, cooldownMax: 58, scale: 0.50 },
        { damage: 44, range: 210, cooldownMax: 48, scale: 0.58 },
        { damage: 82, range: 252, cooldownMax: 34, scale: 0.68 }
    ];

    // 진화·개체 등급 배율 — 라인 깊이(2단/3단/무진화)별 1단·최종 단계 분리
    const POWER_TIER_MUL = {
        evo_stage1_line3: 0.79,
        evo_stage1_line2: 0.86,
        no_evo: 0.82,
        stage2: 1.0,
        stage2_max2: 1.06,
        stage3: 1.22,
        legendary: 1.16
    };

    const BOSS_VIS = {
        scaleMul: 1.78,
        ringR: 36,
        barW: 64,
        barH: 6,
        barY: -44,
        labelY: -54
    };

    // 라운드당 제한 시간 (1분)
    const ROUND_LIMIT_MS = 60000;
    const ROLE_BADGE_OFFSET = { x: 18, y: 16 };
    // 무진화 강화 숫자 — 스프라이트 우상단 바깥 (역할 뱃지·얼굴 가리지 않음)
    const UTILITY_LEVEL_BADGE_OFFSET = { x: 22, y: -14 };

    // 공격 연출 타입 (포켓몬 ID + 역할로 분기)
    const ATTACK_STYLE = {
        LASER: 'laser',
        GALAGA: 'galaga',
        BURST: 'burst',
        SPLASH: 'splash',
        FROST: 'frost',
        SPARK: 'spark'
    };

    // ID % 5 — 공격 속도 계수 (낮을수록 쿨 짧음 = 빠름)
    const SPEED_TIER_COOLDOWN_MUL = [1.12, 1.0, 0.92, 0.84, 0.76];

    // 역할 타입(원랜디식 역할 분리)
    const ROLE = {
        SINGLE: 'single',
        AOE: 'aoe',
        SLOW: 'slow',
        BUFF: 'buff'
    };

    const ROLE_LABEL = {
        single: '단일',
        aoe: '범위',
        slow: '슬로우',
        buff: '버프'
    };

    // 단일 역할 전용 속성 (버프·슬로우·범위는 속성 없음)
    const ELEMENT_TYPES = ['fire', 'water', 'grass', 'electric', 'ice', 'psychic', 'dragon', 'dark'];
    const ELEMENT_LABEL = {
        fire: '불',
        water: '물',
        grass: '풀',
        electric: '전기',
        ice: '얼음',
        psychic: '에스퍼',
        dragon: '드래곤',
        dark: '악'
    };
    const ELEMENT_BEAM_COLORS = {
        fire: 0xff6644,
        water: 0x4488ff,
        grass: 0x66cc55,
        electric: 0xffee44,
        ice: 0x88eeff,
        psychic: 0xcc88ff,
        dragon: 0x9966ff,
        dark: 0x886688
    };

    // 역할별 기본 스탯 보정(단계 스탯에 곱연산)
    const ROLE_PROFILE = {
        single: {
            damageMul: 1.4,
            rangeMul: 1.0,
            cooldownMul: 1.0,
            deployWeight: 1.0,
            desc: '단일: 높은 1대상 화력 · 레이저/속사'
        },
        aoe: {
            damageMul: 0.52,
            rangeMul: 1.06,
            cooldownMul: 1.05,
            deployWeight: 1.2,
            desc: '범위: 몹 위치 스플래시 폭발'
        },
        slow: {
            damageMul: 0.62,
            rangeMul: 1.14,
            cooldownMul: 1.0,
            deployWeight: 1.4,
            desc: '슬로우: 빙결탄 · 피격 적 감속'
        },
        buff: {
            damageMul: 0.38,
            rangeMul: 0.94,
            cooldownMul: 0.92,
            deployWeight: 1.6,
            desc: '버프: 스파크 · 주변 타워 강화'
        }
    };

    // 버프/슬로우 오라 색
    const AURA_BUFF_FILL = 0xff66cc;
    const AURA_BUFF_LINE = 0xff44aa;
    const AURA_BUFF_LINE_ALPHA = 0.72;
    const AURA_BUFF_LINE_WIDTH = 2.5;
    const AURA_LEGENDARY_LINE = 0xffcc44;
    const AURA_LEGENDARY_FILL = 0xffee88;
    const LEGENDARY_AURA_RADIUS = 24;
    const AURA_SLOW_FILL = 0x2288cc;
    const AURA_SLOW_LINE = 0xaaeeff;

    // 역할별 전투 파라미터 (단순·가벼운 버전)
    const AOE_RADIUS = 80;
    const AOE_RATIO = 0.78;
    const SLOW_FACTOR = 0.5;
    const SLOW_MS = 1800;
    const BUFF_RADIUS = 120;
    const BUFF_AURA_RADIUS = 20;
    const BUFF_MAX_STACK = 3;
    const BUFF_PER_STACK = 0.28;

    // 무진화 슬로우·버프 — 보관함 2합성 강화 (최대 티어 2)
    const UTILITY_MERGE_REQUIRED = 2;
    const UTILITY_MAX_TIER = 2;
    const UTILITY_SLOW_MS_PER_TIER = 400;
    const UTILITY_BUFF_STACK_PER_TIER = 0.5;

    // 속성 상성 — 단일 역할 전용
    const TYPE_SUPER_MUL = 1.35;
    const TYPE_WEAK_MUL = 0.75;
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

    // 역할 패시브 (상세: docs/type-passives.md)
    const ROLE_PASSIVE = {
        single: {
            label: '속성 상성',
            desc: '효과적 ×1.35 · 약함 ×0.75'
        },
        aoe: {
            label: '스플래시 강화',
            splashMul: 1.12
        },
        slow: {
            label: '강화 감속',
            slowMsBonus: 500,
            slowFactor: 0.42
        },
        buff: {
            label: '버프 광역',
            buffRadiusBonus: 28
        }
    };

    // 역할별 빔 색 (Pixi 0xRRGGBB)
    const ROLE_BEAM_COLORS = {
        single: 0xffdd66,
        aoe: 0xffaa44,
        slow: 0x66ddff,
        buff: 0xff99ee
    };

    let app = null;
    let gridLayer = null;
    let unitLayer = null;
    let enemyLayer = null;
    let fxLayer = null;
    let uiLayer = null;
    let auraLayer = null;
    let fieldMaskGfx = null;

    let pathPoints = [];
    let pathLength = 0;
    const gridOrigin = { x: 0, y: 0 };

    let units = [];
    let enemies = [];
    let projectiles = [];
    let effects = [];
    let auraPulse = 0;

    let hoverCell = null;
    let rangePreview = null;
    let selectedRangePreview = null;
    let $gridOverlay = null;

    const textureCache = {};
    let initialized = false;
    let $root = null;

    let storageItems = [];
    let storageUidCounter = 1;
    let storageDragUid = null;
    let storageHoverCell = null;
    let selectedStorageGroupKey = null;
    let selectedStorageGroup = null;
    let dragUnit = null;
    let dragStartCell = null;
    let dragDidMove = false;
    let selectedUnit = null;
    let activeWaves = [];
    let waveUidCounter = 1;
    let rerollSelectedUids = null;

    const state = {
        round: 1,
        fieldLimit: PokemonConfig.FIELD_LIMIT,
        totalKills: 0,
        gachaTickets: 5,
        gameStarted: false,
        waveTotal: 30,
        spawnInterval: PokemonConfig.SPAWN_INTERVAL,
        nextWaveDelay: 0,
        roundTimerMs: 0,
        gameOver: false,
        gachaLoading: false
    };

    const $hud = {};

    /** 데모 초기화 */
    function init($container) {
        if (initialized) {
            return Promise.resolve();
        }

        $root = $container;
        buildHud();
        bindHudEvents();

        return initPixi().then(function () {
            buildPath();
            setupAuraClip();
            return drawField();
        }).then(function () {
            buildDomGrid();
            bindDomGridEvents();
            updateDeployGridUi();
            updateHud();
            bindStorageEvents();
            setMessage('[뽑기] → 보관함 · 보관함에서 말판으로 드래그 · [게임 시작]');
            app.ticker.add(onTick);
            initialized = true;
        }).catch(function (err) {
            const errMsg = err && err.message ? err.message : String(err);
            let hint = '';
            if (window.location.protocol === 'file:') {
                hint = ' — index.html을 로컬 서버로 열어주세요.';
            }
            setMessage('초기화 실패: ' + errMsg + hint);
        });
    }

    /** HUD DOM */
    function buildHud() {
        let html = '';
        html += '<div id="defense-demo">';
        html += '  <div class="demo-bg"></div>';
        html += '  <div class="gacha-panel" id="gacha-panel">';
        html += '    <div class="gacha-title">포켓몬 보관함</div>';
        html += '    <div class="gacha-toolbar">';
        html += '      <button type="button" id="btn-storage-sort" class="sort">정렬</button>';
        html += '      <button type="button" id="btn-storage-deploy-all" class="deploy-all">일괄배치</button>';
        html += '      <button type="button" id="btn-legendary-combo" class="legendary-combo">전설 조합</button>';
        html += '      <span class="storage-count" id="storage-count">0마리</span>';
        html += '    </div>';
        html += '    <div class="gacha-tray" id="gacha-tray">';
        html += '      <span class="gacha-placeholder">보관함 비어 있음 · [뽑기]로 채우기</span>';
        html += '    </div>';
        html += '    <div class="gacha-info" id="gacha-info">[뽑기] 남은 권 전부 보관함 · 드래그로 말판 배치</div>';
        html += '  </div>';
        html += '  <div class="hud-right">';
        html += '    <div class="hud-status">';
        html += '      <div class="status-line">현재 몹 <span id="demo-enemies">0</span></div>';
        html += '      <div class="status-line">필드 적 <span id="demo-field-count">0</span> / <span id="demo-field-limit">' + state.fieldLimit + '</span></div>';
        html += '      <div class="status-line">처치 <span id="demo-kill-count">0</span></div>';
        html += '      <div class="status-line">뽑기권 <span id="demo-gacha-tickets">5</span> <span class="ticket-hint">(제한시간·SKIP·보스)</span></div>';
        html += '      <div class="status-line">웨이브 <span id="demo-wave-info">—</span></div>';
        html += '      <div class="status-line round-timer-line">라운드 제한 <span id="demo-round-timer" class="round-timer-value">—</span></div>';
        html += '    </div>';
        html += '    <div class="role-guide" id="role-guide">';
        html += '      <p class="role-guide-title">타워 역할 (맵 우하단 아이콘)</p>';
        html += '      <ul class="role-guide-list">';
        html += '        <li><span class="role-icon-mini icon-single" aria-hidden="true"></span><span class="role-guide-text"><strong>단일</strong> — 속성 빔 · <em>패시브: 상성 ×1.35/×0.75</em></span></li>';
        html += '        <li><span class="role-icon-mini icon-aoe" aria-hidden="true"></span><span class="role-guide-text"><strong>범위</strong> — 폭발 · <em>패시브: 스플래시 ×1.12</em></span></li>';
        html += '        <li><span class="role-icon-mini icon-slow" aria-hidden="true"></span><span class="role-guide-text"><strong>슬로우</strong> — 감속 · <em>패시브: 2.3초·속도×0.42</em></span></li>';
        html += '        <li><span class="role-icon-mini icon-buff" aria-hidden="true"></span><span class="role-guide-text"><strong>버프</strong> — 주변 강화 · <em>패시브: 버프 사거리+28</em></span></li>';
        html += '      </ul>';
        html += '    </div>';
        html += '    <div class="tower-panel" id="tower-panel">';
        html += '      <div class="tower-placeholder" id="tower-placeholder">맵의 타워를 클릭하세요<br><span class="placeholder-sub">타워 우하단 아이콘으로 역할 확인</span></div>';
        html += '      <div class="tower-body" id="tower-body" style="display:none">';
        html += '        <div class="tower-panel-title">타워 강화</div>';
        html += '        <p class="tower-help">같은 계열·같은 단계 — 1단×' + MERGE_REQUIRED_STAGE1 + '→2단, 2단×' + MERGE_REQUIRED_STAGE2 + '→3단</p>';
        html += '        <div class="evo-compare">';
        html += '          <div class="evo-card evo-current">';
        html += '            <span class="evo-label">현재</span>';
        html += '            <img id="tower-cur-img" src="" alt="" width="80" height="80">';
        html += '            <span class="evo-stage" id="tower-cur-stage">1단</span>';
        html += '            <span class="utility-lv-tag" id="tower-cur-utility-lv" style="display:none" title="유틸 강화"></span>';
        html += '            <span class="evo-no" id="tower-cur-no">#0</span>';
        html += '          </div>';
        html += '          <div class="evo-arrow">→</div>';
        html += '          <div class="evo-card evo-next">';
        html += '            <span class="evo-label">진화 후</span>';
        html += '            <img id="tower-next-img" src="" alt="" width="80" height="80">';
        html += '            <span class="evo-stage" id="tower-next-stage">2단</span>';
        html += '            <span class="evo-no" id="tower-next-no">#0</span>';
        html += '          </div>';
        html += '        </div>';
        html += '        <div class="evo-branch-wrap" id="tower-branch-wrap" style="display:none"></div>';
        html += '        <div class="evo-stats" id="tower-stats"></div>';
        html += '        <button type="button" id="btn-upgrade" class="upgrade">합성 진화</button>';
        html += '        <p class="tower-max-msg" id="tower-max-msg" style="display:none">최대 3단 진화 완료</p>';
        html += '      </div>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="game-stage map-gym" id="game-stage">';
        html += '    <div class="pixi-wrap"></div>';
        html += '    <div class="reroll-overlay" id="reroll-overlay" style="display:none">';
        html += '      <div class="reroll-panel">';
        html += '        <p class="reroll-title">보관함 <strong>3마리</strong> 선택 → <span class="reroll-cost">뽑기권 1장</span></p>';
        html += '        <div class="reroll-cards" id="reroll-cards"></div>';
        html += '        <p class="reroll-pick-count" id="reroll-pick-count">0 / 3 선택</p>';
        html += '        <div class="reroll-actions">';
        html += '          <button type="button" id="btn-reroll-confirm" class="reroll-confirm" disabled>교환</button>';
        html += '          <button type="button" id="btn-reroll-cancel" class="reroll-cancel">취소</button>';
        html += '        </div>';
        html += '      </div>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="legendary-overlay" id="legendary-overlay" style="display:none">';
        html += '    <div class="legendary-panel">';
        html += '      <p class="legendary-title">전설 조합 <span class="legendary-sub">보관함 재료 소모</span></p>';
        html += '      <div class="legendary-recipes" id="legendary-recipes"></div>';
        html += '      <button type="button" id="btn-legendary-close" class="legendary-close">닫기</button>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="hud-bottom">';
        html += '    <button type="button" id="btn-gacha" class="primary">뽑기 GACHA</button>';
        html += '    <button type="button" id="btn-reroll" class="reroll">리롤 (3→1장)</button>';
        html += '    <button type="button" id="btn-start" class="start">게임 START</button>';
        html += '    <button type="button" id="btn-skip" class="skip">웨이브 SKIP</button>';
        html += '    <button type="button" id="btn-reset">리셋</button>';
        html += '  </div>';
        html += '  <div class="hud-msg" id="demo-msg"></div>';
        html += '</div>';

        $root.html(html);

        $hud.fieldCount = $('#demo-field-count');
        $hud.fieldLimit = $('#demo-field-limit');
        $hud.killCount = $('#demo-kill-count');
        $hud.enemies = $('#demo-enemies');
        $hud.gachaTickets = $('#demo-gacha-tickets');
        $hud.waveInfo = $('#demo-wave-info');
        $hud.roundTimer = $('#demo-round-timer');
        $hud.msg = $('#demo-msg');
        $hud.btnGacha = $('#btn-gacha');
        $hud.btnReroll = $('#btn-reroll');
        $hud.btnStart = $('#btn-start');
        $hud.btnReset = $('#btn-reset');
        $hud.btnSkip = $('#btn-skip');
        $hud.gachaPanel = $('#gacha-panel');
        $hud.gachaTray = $('#gacha-tray');
        $hud.gachaInfo = $('#gacha-info');
        $hud.btnStorageSort = $('#btn-storage-sort');
        $hud.btnStorageDeployAll = $('#btn-storage-deploy-all');
        $hud.storageCount = $('#storage-count');
        $hud.towerPlaceholder = $('#tower-placeholder');
        $hud.towerBody = $('#tower-body');
        $hud.towerCurImg = $('#tower-cur-img');
        $hud.towerNextImg = $('#tower-next-img');
        $hud.towerCurStage = $('#tower-cur-stage');
        $hud.towerCurUtilityLv = $('#tower-cur-utility-lv');
        $hud.towerNextStage = $('#tower-next-stage');
        $hud.towerCurNo = $('#tower-cur-no');
        $hud.towerNextNo = $('#tower-next-no');
        $hud.towerStats = $('#tower-stats');
        $hud.towerBranchWrap = $('#tower-branch-wrap');
        $hud.towerMaxMsg = $('#tower-max-msg');
        $hud.btnUpgrade = $('#btn-upgrade');
        $hud.rerollOverlay = $('#reroll-overlay');
        $hud.rerollCards = $('#reroll-cards');
        $hud.rerollPickCount = $('#reroll-pick-count');
        $hud.btnRerollConfirm = $('#btn-reroll-confirm');
        $hud.btnRerollCancel = $('#btn-reroll-cancel');
        $hud.btnLegendaryCombo = $('#btn-legendary-combo');
        $hud.legendaryOverlay = $('#legendary-overlay');
        $hud.legendaryRecipes = $('#legendary-recipes');
        $hud.btnLegendaryClose = $('#btn-legendary-close');
        updateGachaButton();
        updateRerollButton();
        updateSkipButton();
        renderStorageTray();
    }

    /** HUD 이벤트 */
    function bindHudEvents() {
        $hud.btnGacha.on('click', function () {
            if (!canGacha()) {
                if (state.gachaTickets <= 0) {
                    setMessage('뽑기권이 없습니다. 제한시간·SKIP(+3) 또는 보스 처치(+5) 시 지급됩니다.');
                }
                return;
            }
            doGacha();
        });

        $hud.btnReroll.on('click', function () {
            openRerollPanel();
        });

        $hud.btnLegendaryCombo.on('click', function () {
            openLegendaryPanel();
        });

        $hud.btnLegendaryClose.on('click', function () {
            closeLegendaryPanel();
        });

        $hud.legendaryRecipes.off('click.legendaryCraft').on('click.legendaryCraft', '.btn-legendary-craft', function () {
            const comboId = $(this).attr('data-combo-id');
            if (!comboId) {
                return;
            }
            performLegendaryCombo(comboId);
        });

        $hud.btnRerollCancel.on('click', function () {
            closeRerollPanel();
        });

        $hud.rerollCards.off('click.rerollPick').on('click.rerollPick', '.reroll-card', function () {
            const uid = $(this).attr('data-uid');
            if (!uid) {
                return;
            }
            toggleRerollSelection(uid);
        });

        $hud.btnRerollConfirm.on('click', function () {
            confirmRerollExchange();
        });

        // 보관함 정렬 버튼(클릭이 씹히는 케이스 대비: 위임 바인딩)
        $(document).off('click.storageSort').on('click.storageSort', '#btn-storage-sort', function (e) {
            e.preventDefault();
            sortStorageItems(true);
        });

        // 보관함 일괄 배치
        $(document).off('click.storageDeployAll').on('click.storageDeployAll', '#btn-storage-deploy-all', function (e) {
            e.preventDefault();
            deployAllFromStorage();
        });

        $hud.btnStart.on('click', function () {
            if (state.gameOver || state.gameStarted) {
                return;
            }
            if (units.length === 0) {
                setMessage('보관함에서 말판으로 배치한 뒤 [게임 시작]을 누르세요.');
                return;
            }
            beginGame();
        });

        $hud.btnReset.on('click', function () {
            resetGame();
        });

        $hud.btnSkip.on('click', function () {
            skipToNextWave();
        });

        $hud.btnUpgrade.on('click', function () {
            if (selectedStorageGroupKey && selectedStorageGroup) {
                upgradeStorageGroup(selectedStorageGroupKey);
                return;
            }
            if (selectedUnit) {
                upgradeUnit(selectedUnit);
            }
        });

        $hud.towerBody.off('click.evoBranch').on('click.evoBranch', '.branch-card:not(.is-disabled)', function () {
            const branchId = parseInt($(this).attr('data-branch-id'), 10);
            if (!branchId) {
                return;
            }
            if (selectedUnit && isEeveeBranchEvolveTarget(
                resolveEvolutionLine(selectedUnit)[0],
                getUnitStage(selectedUnit),
                selectedUnit.pokemonId
            )) {
                performEeveeBranchMerge(selectedUnit, branchId);
                return;
            }
            if (selectedStorageGroupKey) {
                performEeveeBranchStorageMerge(selectedStorageGroupKey, branchId);
            }
        });
    }

    /** Pixi 앱 생성 */
    function initPixi() {
        if (typeof PIXI === 'undefined') {
            return Promise.reject(new Error('PixiJS가 로드되지 않았습니다.'));
        }
        if (typeof PokemonConfig === 'undefined') {
            return Promise.reject(new Error('pokemonConfig.js가 로드되지 않았습니다.'));
        }

        app = new PIXI.Application({
            width: FIELD,
            height: FIELD,
            backgroundColor: 0x121018,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        $root.find('.pixi-wrap').append(app.view);

        gridLayer = new PIXI.Container();
        unitLayer = new PIXI.Container();
        enemyLayer = new PIXI.Container();
        fxLayer = new PIXI.Container();
        uiLayer = new PIXI.Container();

        app.stage.addChild(gridLayer);
        app.stage.addChild(unitLayer);
        app.stage.addChild(enemyLayer);
        app.stage.addChild(fxLayer);
        app.stage.addChild(uiLayer);

        gridOrigin.x = (FIELD - GRID * CELL) / 2;
        gridOrigin.y = (FIELD - GRID * CELL) / 2;

        return Promise.resolve();
    }

    /** 버프 오라 — 10×10 말판 영역 밖은 잘림 */
    function setupAuraClip() {
        if (!unitLayer) {
            return;
        }
        if (fieldMaskGfx) {
            if (fieldMaskGfx.parent) {
                fieldMaskGfx.parent.removeChild(fieldMaskGfx);
            }
            fieldMaskGfx.destroy();
            fieldMaskGfx = null;
        }
        if (auraLayer) {
            if (auraLayer.parent) {
                auraLayer.parent.removeChild(auraLayer);
            }
            while (auraLayer.children.length) {
                auraLayer.removeChildAt(0).destroy();
            }
            auraLayer.destroy({ children: true });
            auraLayer = null;
        }

        fieldMaskGfx = new PIXI.Graphics();
        fieldMaskGfx.beginFill(0xffffff);
        fieldMaskGfx.drawRect(gridOrigin.x, gridOrigin.y, GRID * CELL, GRID * CELL);
        fieldMaskGfx.endFill();

        auraLayer = new PIXI.Container();
        auraLayer.mask = fieldMaskGfx;

        unitLayer.addChild(fieldMaskGfx);
        unitLayer.addChild(auraLayer);
    }

    /** PNG 텍스처 캐시 로드 */
    function loadPokemonTexture(id) {
        const key = 'png_' + id;
        if (!textureCache[key]) {
            textureCache[key] = PIXI.Assets.load(PokemonConfig.pngUrl(id));
        }
        return textureCache[key];
    }

    /** 진화 가능 뽑기 라인 여부 (2마리 이상 계열) */
    function canEvolveGachaLine(line) {
        return !!(line && line.length > 1);
    }

    /** 슬로우·버프 역할 여부 */
    function isUtilityRole(role) {
        return role === ROLE.SLOW || role === ROLE.BUFF;
    }

    /** 무진화 라인 — 보관함 강화 합성 대상 */
    function canUtilityMergeLine(line) {
        if (!line || line.length !== 1 || canEvolveGachaLine(line)) {
            return false;
        }
        return !PokemonConfig.isLegendaryId(line[0]);
    }

    /** 말판 타워 스프라이트 유효 여부 — 제거·destroy 후 비동기 콜백 방어 */
    function isUnitSpriteLive(unit) {
        return !!(unit && unit.sprite && !unit.sprite.destroyed);
    }

    /** 말판 오버레이 UI 레이어 — 스프라이트·버프 마스크 위에 표시 */
    function getFieldUiLayer() {
        return uiLayer || unitLayer;
    }

    /** 보관함 항목 PNG 텍스처 (없으면 CDN 로드) */
    function ensureStorageItemTexture(item) {
        if (!item) {
            return Promise.reject(new Error('no item'));
        }
        if (item.texture && !item.texture.destroyed) {
            return Promise.resolve(item.texture);
        }
        return loadPokemonTexture(item.pokemonId).then(function (tex) {
            item.texture = tex;
            return tex;
        });
    }

    /** 유틸 강화 티어 (0=기본) */
    function getUtilityTier(itemOrUnit) {
        let t;
        if (!itemOrUnit) {
            return 0;
        }
        t = itemOrUnit.utilityTier;
        if (!t || t < 1) {
            return 0;
        }
        return Math.min(UTILITY_MAX_TIER, Math.floor(t));
    }

    /** 유틸 강화 티어 라벨 (메시지·로그용) */
    function formatUtilityTierLabel(tier) {
        if (!tier) {
            return '';
        }
        return '강화+' + tier;
    }

    /** 유틸 강화 단계 — UI·말판 숫자만 (1, 2) */
    function formatUtilityLevelUi(tier) {
        const t = getUtilityTier({ utilityTier: tier });
        if (!t) {
            return '';
        }
        return String(t);
    }

    /** 유틸 Lv 태그 CSS 클래스 — 2단계 강조 */
    function getUtilityLevelTagClass(tier) {
        const t = getUtilityTier({ utilityTier: tier });
        let cls = 'utility-lv-tag';
        if (t >= 2) {
            cls += ' utility-lv-2';
        }
        return cls;
    }

    /** 유틸 Lv 태그 HTML (타워 패널·보관함) */
    function buildUtilityLevelTagHtml(tier) {
        const label = formatUtilityLevelUi(tier);
        if (!label) {
            return '';
        }
        return '<span class="' + getUtilityLevelTagClass(tier) + '" title="유틸 강화">' + label + '</span>';
    }

    /** 타워 패널 — 현재 카드 Lv 뱃지 */
    function setTowerUtilityLevelTag(tier) {
        let label;
        if (!$hud.towerCurUtilityLv || !$hud.towerCurUtilityLv.length) {
            return;
        }
        label = formatUtilityLevelUi(tier);
        if (label) {
            $hud.towerCurUtilityLv
                .attr('class', getUtilityLevelTagClass(tier))
                .text(label)
                .show();
        } else {
            $hud.towerCurUtilityLv.hide().text('');
        }
    }

    /** 슬로우 지속(ms) — 패시브·티어 반영 */
    function getSlowDurationMsForTier(passive, utilityTier) {
        let ms = SLOW_MS;
        const p = passive || ROLE_PASSIVE.slow;
        const tier = utilityTier || 0;
        ms += p.slowMsBonus || 0;
        if (tier > 0) {
            ms += tier * UTILITY_SLOW_MS_PER_TIER;
        }
        return ms;
    }

    /** 버프 1기당 스택 가중 — 티어 반영 */
    function getBuffStackWeightForTier(utilityTier) {
        let w = 1;
        const tier = utilityTier || 0;
        if (tier > 0) {
            w += tier * UTILITY_BUFF_STACK_PER_TIER;
        }
        return w;
    }

    /** 말판 슬로우 타워 — 감속 지속(ms) */
    function getSlowDurationMs(attackerUnit) {
        if (!attackerUnit || attackerUnit.role !== ROLE.SLOW) {
            return SLOW_MS;
        }
        return getSlowDurationMsForTier(ROLE_PASSIVE.slow, getUtilityTier(attackerUnit));
    }

    /** 전설 5종 — 조합표 role 또는 단일·범위(45:30), 슬로우·버프 제외 */
    function getRoleForLegendaryId(baseId) {
        const combo = PokemonConfig.getLegendaryComboByResultId(baseId);
        if (combo && combo.role === 'aoe') {
            return ROLE.AOE;
        }
        if (combo && combo.role === 'single') {
            return ROLE.SINGLE;
        }
        if (baseId % 75 < 45) {
            return ROLE.SINGLE;
        }
        return ROLE.AOE;
    }

    /**
     * 역할 — 진화 가능: 단일·범위(45:30) / 무진화: 슬로우·버프(15:10) / 전설: 단일·범위만
     */
    function getRoleForBaseId(baseId, evolutionLine) {
        const line = evolutionLine || [baseId];
        let sub;

        if (PokemonConfig.isLegendaryId(baseId)) {
            return getRoleForLegendaryId(baseId);
        }
        if (canEvolveGachaLine(line)) {
            sub = baseId % 75;
            if (sub < 45) {
                return ROLE.SINGLE;
            }
            return ROLE.AOE;
        }
        sub = baseId % 25;
        if (sub < 15) {
            return ROLE.SLOW;
        }
        return ROLE.BUFF;
    }

    /** 보관함 그룹 — 유틸 강화 합성 가능 */
    function canUtilityMergeStorageGroup(g) {
        let line;
        let tier;
        if (!g || !isUtilityRole(g.role)) {
            return false;
        }
        line = g.line || [g.pokemonId];
        if (!canUtilityMergeLine(line)) {
            return false;
        }
        tier = g.utilityTier || 0;
        if (tier >= UTILITY_MAX_TIER) {
            return false;
        }
        return g.count >= UTILITY_MERGE_REQUIRED;
    }

    /** 말판 타워 — 유틸 강화 합성 가능 */
    function canUtilityMergeUnit(unit) {
        let line;
        if (!unit || !isUtilityRole(unit.role)) {
            return false;
        }
        line = resolveEvolutionLine(unit);
        if (!canUtilityMergeLine(line)) {
            return false;
        }
        if (getUtilityTier(unit) >= UTILITY_MAX_TIER) {
            return false;
        }
        return countUtilityMergeSiblings(unit) >= UTILITY_MERGE_REQUIRED;
    }

    /** 단계별 합성 필요 수 — 1단→2단은 2마리, 2단→3단은 3마리 */
    function getMergeRequired(stage) {
        if (stage === undefined || stage === null || stage <= 0) {
            return MERGE_REQUIRED_STAGE1;
        }
        return MERGE_REQUIRED_STAGE2;
    }

    /** 진화 라인 최대 단계 인덱스 (0=무진화, 1=2단까지, 2=3단까지) */
    function getLineEvolutionDepth(line, pokemonId) {
        return getMaxEvolutionStageForLine(line || [pokemonId], pokemonId);
    }

    /** 단일 역할만 속성 부여 */
    function getElementForUnit(baseId, role) {
        if (role !== ROLE.SINGLE) {
            return null;
        }
        return getElementFromPokemonId(baseId);
    }

    /** 도감 ID → 8속성 (타워·적 공통) */
    function getElementFromPokemonId(pokemonId) {
        const n = ELEMENT_TYPES.length;
        let idx = pokemonId % n;
        if (idx < 0) {
            idx += n;
        }
        return ELEMENT_TYPES[idx];
    }

    function getEnemyElement(enemy) {
        if (!enemy) {
            return null;
        }
        if (enemy.element) {
            return enemy.element;
        }
        return getElementFromPokemonId(enemy.pokemonId || 1);
    }

    /** 속성 상성 배율 — 단일 vs 적 */
    function getTypeDamageMul(attackerElement, defenderElement) {
        let list;
        if (!attackerElement || !defenderElement) {
            return 1;
        }
        list = ELEMENT_SUPER[attackerElement];
        if (list && list.indexOf(defenderElement) >= 0) {
            return TYPE_SUPER_MUL;
        }
        list = ELEMENT_RESIST[attackerElement];
        if (list && list.indexOf(defenderElement) >= 0) {
            return TYPE_WEAK_MUL;
        }
        return 1;
    }

    function getRolePassiveLabel(role) {
        const p = ROLE_PASSIVE[role];
        if (!p) {
            return '';
        }
        return p.label;
    }

    /** 피해 패시브 — 버프 이후·상성·범위 직격 */
    function applyPassiveDamageMods(attackerUnit, targetEnemy, baseDmg) {
        let dmg = baseDmg;
        let typeMul;
        const role = attackerUnit && attackerUnit.role ? attackerUnit.role : ROLE.SINGLE;

        if (!attackerUnit || !targetEnemy || dmg < 1) {
            return Math.max(1, dmg);
        }
        if (role === ROLE.SINGLE && attackerUnit.element) {
            typeMul = getTypeDamageMul(attackerUnit.element, getEnemyElement(targetEnemy));
            dmg = Math.max(1, Math.round(dmg * typeMul));
        }
        return dmg;
    }

    function getTypeMatchLabel(attackerElement, defenderElement) {
        const mul = getTypeDamageMul(attackerElement, defenderElement);
        if (mul >= TYPE_SUPER_MUL - 0.01) {
            return '효과적';
        }
        if (mul <= TYPE_WEAK_MUL + 0.01) {
            return '약함';
        }
        return '보통';
    }

    /** 효과적 타격 플로팅 텍스트 */
    function spawnTypeEffectiveText(x, y) {
        let label;
        if (!uiLayer) {
            return;
        }
        label = new PIXI.Text('효과적!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xffee66,
            stroke: 0x442200,
            strokeThickness: 3
        });
        label.anchor.set(0.5, 0.5);
        label.x = x;
        label.y = y - 28;
        uiLayer.addChild(label);
        effects.push({ gfx: label, life: 520, maxLife: 520, kind: 'type_text' });
    }

    function getElementLabel(element) {
        if (!element || !ELEMENT_LABEL[element]) {
            return '';
        }
        return ELEMENT_LABEL[element];
    }

    function getElementBeamColor(element) {
        if (element && ELEMENT_BEAM_COLORS[element] !== undefined) {
            return ELEMENT_BEAM_COLORS[element];
        }
        return ROLE_BEAM_COLORS.single;
    }

    /** 유닛 빔 색 — 단일은 속성색, 그 외 역할색 */
    function getUnitBeamColor(unit) {
        const role = unit && unit.role ? unit.role : ROLE.SINGLE;
        if (role === ROLE.SINGLE && unit && unit.element) {
            return getElementBeamColor(unit.element);
        }
        return getRoleBeamColor(role);
    }

    function formatUnitRoleLabel(role, element) {
        let label = getRoleLabel(role);
        if (role === ROLE.SINGLE && element) {
            label += ' · ' + getElementLabel(element);
        }
        return label;
    }

    function formatRoundTimer(ms) {
        const totalSec = Math.max(0, Math.ceil(ms / 1000));
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    /** 라운드 타이머 HUD */
    function updateRoundTimerDisplay() {
        if (!$hud.roundTimer || !$hud.roundTimer.length) {
            return;
        }
        if (!state.gameStarted || state.gameOver) {
            $hud.roundTimer.text('—');
            $hud.roundTimer.removeClass('timer-warn timer-critical');
            return;
        }
        if (state.nextWaveDelay > 0 && activeWaves.length === 0) {
            $hud.roundTimer.text('대기');
            $hud.roundTimer.removeClass('timer-warn timer-critical');
            return;
        }
        $hud.roundTimer.text(formatRoundTimer(state.roundTimerMs));
        $hud.roundTimer.removeClass('timer-warn timer-critical');
        if (state.roundTimerMs <= 10000) {
            $hud.roundTimer.addClass('timer-critical');
        } else if (state.roundTimerMs <= 20000) {
            $hud.roundTimer.addClass('timer-warn');
        }
    }

    /** 역할 뱃지 테두리 색 */
    function getRoleBadgeColor(role) {
        return getRoleBeamColor(role);
    }

    /** 역할 아이콘 도형 (타워 우하단) */
    function drawRoleIconShape(g, role) {
        g.clear();
        if (role === ROLE.AOE) {
            g.lineStyle(1.5, 0xffaa44, 1);
            g.drawCircle(0, 0, 5);
            g.beginFill(0xffaa44, 0.85);
            g.drawCircle(0, 0, 2);
            g.endFill();
            return;
        }
        if (role === ROLE.SLOW) {
            g.beginFill(0x66ddff, 0.95);
            g.moveTo(0, -5);
            g.lineTo(4, 3);
            g.lineTo(-4, 3);
            g.closePath();
            g.endFill();
            return;
        }
        if (role === ROLE.BUFF) {
            g.beginFill(0xff99ee, 0.95);
            g.drawCircle(0, -4, 2);
            g.drawCircle(-3, 2, 2);
            g.drawCircle(3, 2, 2);
            g.endFill();
            return;
        }
        g.lineStyle(2, 0xffdd66, 1);
        g.drawCircle(0, 0, 3);
        g.beginFill(0xffdd66, 0.9);
        g.drawCircle(0, 0, 1.5);
        g.endFill();
    }

    /** 타워 역할 뱃지 제거 */
    function removeRoleBadge(unit) {
        if (!unit || !unit.roleBadge) {
            return;
        }
        if (unit.roleBadge.parent) {
            unit.roleBadge.parent.removeChild(unit.roleBadge);
        }
        unit.roleBadge.destroy({ children: true });
        unit.roleBadge = null;
    }

    /** 타워 역할 뱃지 생성·부착 (uiLayer — 말판 위 항상 표시) */
    function attachRoleBadge(unit) {
        let bg;
        let icon;
        let outer;
        let tag;
        const role = unit.role || ROLE.SINGLE;
        const isLegend = PokemonConfig.isLegendaryId(unit.pokemonId);
        const layer = getFieldUiLayer();

        if (!isUnitSpriteLive(unit) || !layer) {
            return;
        }

        removeRoleBadge(unit);
        unit.roleBadge = new PIXI.Container();
        if (isLegend) {
            outer = new PIXI.Graphics();
            outer.lineStyle(2.5, 0xffcc44, 1);
            outer.drawRoundedRect(-11, -11, 22, 22, 5);
            unit.roleBadge.addChild(outer);
        }
        bg = new PIXI.Graphics();
        bg.beginFill(0x101820, 0.88);
        if (isLegend) {
            bg.lineStyle(1.5, getRoleBadgeColor(role), 1);
        } else {
            bg.lineStyle(1.5, getRoleBadgeColor(role), 0.95);
        }
        bg.drawRoundedRect(-9, -9, 18, 18, 4);
        bg.endFill();
        icon = new PIXI.Graphics();
        drawRoleIconShape(icon, role);
        unit.roleBadge.addChild(bg);
        unit.roleBadge.addChild(icon);
        if (isLegend) {
            tag = new PIXI.Text('★', {
                fontFamily: 'Arial, sans-serif',
                fontSize: 8,
                fontWeight: 'bold',
                fill: 0xffee88,
                stroke: 0x442200,
                strokeThickness: 2
            });
            tag.anchor.set(1, 0);
            tag.x = 10;
            tag.y = -10;
            unit.roleBadge.addChild(tag);
        }
        layer.addChild(unit.roleBadge);
        syncRoleBadgePosition(unit);
        syncUtilityLevelBadge(unit);
    }

    /** 말판 유닛 Lv 뱃지 제거 */
    function removeUtilityLevelBadge(unit) {
        if (!unit || !unit.utilityLvBadge) {
            return;
        }
        if (unit.utilityLvBadge.parent) {
            unit.utilityLvBadge.parent.removeChild(unit.utilityLvBadge);
        }
        unit.utilityLvBadge.destroy({ children: true });
        unit.utilityLvBadge = null;
    }

    /** 말판 강화 숫자 색 — 역할별 (버프는 분홍·흰, 슬로우는 청록) */
    function getUtilityLevelBadgeColors(unit) {
        const tier = getUtilityTier(unit);
        if (unit && unit.role === ROLE.BUFF) {
            if (tier >= 2) {
                return { line: 0xffcc44, fill: 0xffee88, stroke: 0x442200 };
            }
            return { line: 0xff66cc, fill: 0xffffff, stroke: 0x550022 };
        }
        if (tier >= 2) {
            return { line: 0xffcc44, fill: 0xffee88, stroke: 0x442200 };
        }
        return { line: 0x66ccff, fill: 0xaaeeff, stroke: 0x001822 };
    }

    /** 말판 강화 숫자 위치만 갱신 */
    function syncUtilityLevelBadgePosition(unit) {
        if (!isUnitSpriteLive(unit) || !unit.utilityLvBadge || unit.utilityLvBadge.destroyed) {
            return;
        }
        unit.utilityLvBadge.x = unit.sprite.x + UTILITY_LEVEL_BADGE_OFFSET.x;
        unit.utilityLvBadge.y = unit.sprite.y + UTILITY_LEVEL_BADGE_OFFSET.y;
    }

    /** 말판 유닛 — 무진화 강화 단계 숫자 (uiLayer — 버프 오라에 가리지 않음) */
    function syncUtilityLevelBadge(unit) {
        const tier = getUtilityTier(unit);
        const label = formatUtilityLevelUi(tier);
        let container;
        let bg;
        let txt;
        let fontSize;
        let colors;
        let boxHalf;
        let parentLayer;

        removeUtilityLevelBadge(unit);
        if (!isUnitSpriteLive(unit) || !label) {
            return;
        }
        fontSize = tier >= 2 ? 13 : 11;
        colors = getUtilityLevelBadgeColors(unit);
        boxHalf = tier >= 2 ? 9 : 8;

        container = new PIXI.Container();
        bg = new PIXI.Graphics();
        bg.beginFill(0x101820, 0.78);
        bg.lineStyle(1.5, colors.line, 0.9);
        bg.drawRoundedRect(-boxHalf, -boxHalf, boxHalf * 2, boxHalf * 2, 5);
        bg.endFill();

        txt = new PIXI.Text(label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: fontSize,
            fontWeight: 'bold',
            fill: colors.fill,
            stroke: colors.stroke,
            strokeThickness: 2
        });
        txt.anchor.set(0.5, 0.5);

        container.addChild(bg);
        container.addChild(txt);
        container.x = unit.sprite.x + UTILITY_LEVEL_BADGE_OFFSET.x;
        container.y = unit.sprite.y + UTILITY_LEVEL_BADGE_OFFSET.y;
        unit.utilityLvBadge = container;
        parentLayer = getFieldUiLayer();
        parentLayer.addChild(unit.utilityLvBadge);
    }

    /** 역할 뱃지 위치 — 스프라이트 우하단 */
    function syncRoleBadgePosition(unit) {
        if (!isUnitSpriteLive(unit) || !unit.roleBadge || unit.roleBadge.destroyed) {
            return;
        }
        unit.roleBadge.x = unit.sprite.x + ROLE_BADGE_OFFSET.x;
        unit.roleBadge.y = unit.sprite.y + ROLE_BADGE_OFFSET.y;
        syncUtilityLevelBadgePosition(unit);
    }

    function syncAllRoleBadges() {
        let i;
        for (i = 0; i < units.length; i++) {
            syncRoleBadgePosition(units[i]);
        }
    }

    /** 뽑기권 지급 (고정 장수) */
    function grantTickets(amount, reasonMsg) {
        let n;
        if (!amount || amount < 1) {
            return 0;
        }
        n = Math.floor(amount);
        state.gachaTickets += n;
        updateGachaButton();
        updateRerollButton();
        if (reasonMsg) {
            setMessage(reasonMsg + ' · 뽑기권 +' + n);
        }
        updateHud();
        return n;
    }

    /** 시간 초과 — 다음 라운드 웨이브 추가 */
    function advanceRoundByTimer() {
        let wave;
        if (!state.gameStarted || state.gameOver) {
            return;
        }
        wave = createWaveSlot(getNextStackRound());
        if (wave.round > state.round) {
            state.round = wave.round;
        }
        activeWaves.push(wave);
        trySpawnBossForWave(wave);
        state.roundTimerMs = ROUND_LIMIT_MS;
        state.nextWaveDelay = 0;
        updateDeployGridUi();
        updateSkipButton();
        grantTickets(TICKET_TIMER_REWARD, PokemonConfig.isBossRound(wave.round)
            ? '시간 초과 — ROUND ' + wave.round + ' BOSS 등장'
            : '시간 초과 — ROUND ' + wave.round + ' 시작');
    }

    /** 라운드 타이머 갱신 */
    function updateRoundTimer(delta) {
        if (!state.gameStarted || state.gameOver) {
            return;
        }
        if (state.nextWaveDelay > 0 && activeWaves.length === 0) {
            return;
        }
        if (state.roundTimerMs <= 0) {
            return;
        }
        state.roundTimerMs -= delta;
        if (state.roundTimerMs <= 0) {
            state.roundTimerMs = 0;
            advanceRoundByTimer();
        }
        updateRoundTimerDisplay();
    }

    /** 역할 설명 HTML (패널용 — 아이콘 포함) */
    function buildRoleDescLine(role) {
        const profile = getRoleProfile(role);
        return '<p class="role-desc role-desc-with-icon">' +
            '<span class="role-icon-mini icon-' + role + '" aria-hidden="true"></span> ' +
            profile.desc + '</p>';
    }

    /** 패시브 설명 HTML */
    function buildPassiveDescLine(role, element, utilityTier) {
        const p = ROLE_PASSIVE[role];
        let html = '';
        if (!p) {
            return '';
        }
        if (role === ROLE.SINGLE) {
            html = '<p class="passive-desc">패시브: ' + p.desc;
            if (element) {
                html += ' · 속성 <strong>' + getElementLabel(element) + '</strong>';
            }
            html += '</p>';
            return html;
        }
        if (role === ROLE.AOE) {
            return '<p class="passive-desc">패시브: 주변 스플래시 ×' + p.splashMul + '</p>';
        }
        if (role === ROLE.SLOW) {
            return '<p class="passive-desc">패시브: 감속 ' +
                (getSlowDurationMsForTier(p, utilityTier) / 1000).toFixed(1) +
                '초 · 이동 ×' + p.slowFactor + '</p>';
        }
        if (role === ROLE.BUFF) {
            return '<p class="passive-desc">패시브: 버프 사거리 ' + (BUFF_RADIUS + p.buffRadiusBonus) +
                'px · 스택 가중 +' + getBuffStackWeightForTier(utilityTier).toFixed(1) + '</p>';
        }
        return '';
    }

    function getRoleLabel(role) {
        return ROLE_LABEL[role] || ROLE_LABEL.single;
    }

    function getRoleProfile(role) {
        return ROLE_PROFILE[role] || ROLE_PROFILE.single;
    }

    /** 역할별 빔/히트 이펙트 색 */
    function getRoleBeamColor(role) {
        const key = role || ROLE.SINGLE;
        if (ROLE_BEAM_COLORS[key] !== undefined) {
            return ROLE_BEAM_COLORS[key];
        }
        return ROLE_BEAM_COLORS.single;
    }

    /** 진화·개체 등급 배율 — 라인 깊이·현재 단계 기준 */
    function getPowerTierMul(pokemonId, evolutionLine, stage) {
        const line = evolutionLine || [pokemonId];
        const st = stage || 0;
        const depth = getLineEvolutionDepth(line, pokemonId);

        if (st >= 2) {
            return POWER_TIER_MUL.stage3;
        }
        if (st >= 1) {
            if (depth === 1) {
                return POWER_TIER_MUL.stage2_max2;
            }
            return POWER_TIER_MUL.stage2;
        }
        if (depth <= 0) {
            return POWER_TIER_MUL.no_evo;
        }
        if (depth === 1) {
            return POWER_TIER_MUL.evo_stage1_line2;
        }
        return POWER_TIER_MUL.evo_stage1_line3;
    }

    /** 단계 스탯 + 역할 보정 + 개체 공속 + 등급 적용 */
    function getEffectiveStats(stage, role, pokemonId, evolutionLine) {
        const line = evolutionLine || [pokemonId];
        let stats;
        let tierMul;

        if (PokemonConfig.isLegendaryId(pokemonId)) {
            stats = getStageStats(Math.max(stage, 2));
            tierMul = POWER_TIER_MUL.legendary;
        } else {
            stats = getStageStats(stage);
            tierMul = getPowerTierMul(pokemonId, line, stage);
        }

        const profile = getRoleProfile(role);
        const speedMul = getPokemonSpeedMul(pokemonId);
        return {
            damage: Math.max(1, Math.round(stats.damage * profile.damageMul * tierMul)),
            range: Math.max(60, Math.round(stats.range * profile.rangeMul * (0.92 + tierMul * 0.08))),
            cooldownMax: Math.max(14, Math.round(stats.cooldownMax * profile.cooldownMul * speedMul / (0.85 + tierMul * 0.15)))
        };
    }

    /** 말판 유닛 실제 전투 수치 */
    function getUnitEffectiveStats(unit) {
        const role = unit && unit.role ? unit.role : ROLE.SINGLE;
        const pid = unit && unit.pokemonId ? unit.pokemonId : 1;
        return getEffectiveStats(getUnitStage(unit), role, pid, unit.evolutionLine);
    }

    /** 포켓몬별 공격 속도 계수 (ID % 5) */
    function getPokemonSpeedMul(pokemonId) {
        const tier = (pokemonId || 1) % SPEED_TIER_COOLDOWN_MUL.length;
        return SPEED_TIER_COOLDOWN_MUL[tier];
    }

    /** 역할 + ID 기반 공격 연출 */
    function resolveAttackStyle(unit) {
        const role = unit.role || ROLE.SINGLE;
        const variant = (unit.pokemonId || 1) % 3;

        if (role === ROLE.AOE) {
            return ATTACK_STYLE.SPLASH;
        }
        if (role === ROLE.BUFF) {
            return ATTACK_STYLE.SPARK;
        }
        if (role === ROLE.SLOW) {
            if (variant === 0) {
                return ATTACK_STYLE.FROST;
            }
            return ATTACK_STYLE.GALAGA;
        }
        if (variant === 0) {
            return ATTACK_STYLE.LASER;
        }
        if (variant === 1) {
            return ATTACK_STYLE.GALAGA;
        }
        return ATTACK_STYLE.BURST;
    }

    function getUnitAttackStyle(unit) {
        if (!unit.attackStyle) {
            unit.attackStyle = resolveAttackStyle(unit);
        }
        return unit.attackStyle;
    }

    /** 뽑기 가능 — 게임오버·로딩·권만 검사 (보관함으로만 추가) */
    function canGacha() {
        if (state.gameOver || state.gachaLoading) {
            return false;
        }
        return state.gachaTickets > 0;
    }

    /** 뽑기 버튼 라벨·활성 상태 */
    function updateGachaButton() {
        if (!$hud.btnGacha || !$hud.btnGacha.length) {
            return;
        }
        if (state.gachaTickets > 0) {
            $hud.btnGacha.text('뽑기 (' + state.gachaTickets + '장→보관함)');
        } else {
            $hud.btnGacha.text('뽑기 GACHA (0)');
        }
        $hud.btnGacha.prop('disabled', state.gachaLoading || !canGacha());
    }

    /** 리롤 버튼 상태 */
    function updateRerollButton() {
        if (!$hud.btnReroll || !$hud.btnReroll.length) {
            return;
        }
        $hud.btnReroll.text('리롤 (3→1장)');
        $hud.btnReroll.prop('disabled', !canReroll());
    }

    /** 리롤 가능 — 보관함 3마리 이상 */
    function canReroll() {
        if (state.gameOver || state.gachaLoading) {
            return false;
        }
        return storageItems.length >= PokemonConfig.REROLL_TRADE_COUNT;
    }

    /** 리롤 패널 — 보관함 목록에서 3마리 선택 */
    function openRerollPanel() {
        if (!canReroll()) {
            setMessage('리롤은 보관함 포켓몬 ' + PokemonConfig.REROLL_TRADE_COUNT + '마리 이상 필요합니다.');
            return;
        }
        rerollSelectedUids = [];
        renderRerollStorageCards();
        if ($hud.rerollOverlay && $hud.rerollOverlay.length) {
            $hud.rerollOverlay.show();
        }
        updateRerollButton();
    }

    /** 보관함 카드 — 리롤 선택 UI */
    function renderRerollStorageCards() {
        let html = '';
        let i;
        let item;
        let roleLabel;
        let stageLabel;
        let selected;

        if (!$hud.rerollCards || !$hud.rerollCards.length) {
            return;
        }
        if (!storageItems.length) {
            $hud.rerollCards.html('<span class="gacha-loading">보관함이 비어 있습니다.</span>');
            return;
        }
        for (i = 0; i < storageItems.length; i++) {
            item = storageItems[i];
            selected = rerollSelectedUids && rerollSelectedUids.indexOf(item.uid) >= 0;
            roleLabel = getRoleLabel(item.role || getRoleForBaseId((item.line && item.line[0]) || item.pokemonId, item.line));
            stageLabel = STAGE_LABELS[item.evolutionStage || 0] || '1단';
            html += '<button type="button" class="reroll-card' + (selected ? ' selected' : '') + '" data-uid="' + item.uid + '">';
            html += '<img src="' + PokemonConfig.pngUrl(item.pokemonId) + '" alt="" width="64" height="64">';
            html += '<span class="reroll-no">#' + item.pokemonId + ' · ' + stageLabel;
            if (getUtilityTier(item)) {
                html += buildUtilityLevelTagHtml(item.utilityTier);
            }
            html += '</span>';
            html += '<em class="role-badge role-' + (item.role || 'single') + '">' + roleLabel + '</em>';
            html += '</button>';
        }
        $hud.rerollCards.html(html);
        if ($hud.rerollPickCount && $hud.rerollPickCount.length) {
            $hud.rerollPickCount.text((rerollSelectedUids ? rerollSelectedUids.length : 0) + ' / ' +
                PokemonConfig.REROLL_TRADE_COUNT + ' 선택');
        }
        if ($hud.btnRerollConfirm && $hud.btnRerollConfirm.length) {
            $hud.btnRerollConfirm.prop('disabled',
                !rerollSelectedUids || rerollSelectedUids.length !== PokemonConfig.REROLL_TRADE_COUNT);
        }
    }

    /** 리롤 카드 선택 토글 */
    function toggleRerollSelection(uid) {
        let idx;
        if (!rerollSelectedUids) {
            rerollSelectedUids = [];
        }
        idx = rerollSelectedUids.indexOf(uid);
        if (idx >= 0) {
            rerollSelectedUids.splice(idx, 1);
        } else if (rerollSelectedUids.length < PokemonConfig.REROLL_TRADE_COUNT) {
            rerollSelectedUids.push(uid);
        } else {
            setMessage('최대 ' + PokemonConfig.REROLL_TRADE_COUNT + '마리까지 선택할 수 있습니다.');
            return;
        }
        renderRerollStorageCards();
    }

    /** 리롤 확정 — 보관함 3마리 제거 → 뽑기권 1장 */
    function confirmRerollExchange() {
        let i;
        let uid;
        if (!rerollSelectedUids || rerollSelectedUids.length !== PokemonConfig.REROLL_TRADE_COUNT) {
            setMessage(PokemonConfig.REROLL_TRADE_COUNT + '마리를 선택해 주세요.');
            return;
        }
        for (i = rerollSelectedUids.length - 1; i >= 0; i--) {
            uid = rerollSelectedUids[i];
            removeFromStorage(uid);
        }
        state.gachaTickets += PokemonConfig.REROLL_REWARD_TICKETS;
        closeRerollPanel();
        updateHud();
        updateGachaButton();
        updateRerollButton();
        updateDeployGridUi();
        $hud.gachaInfo.text('보관함 ' + storageItems.length + '마리 · 드래그로 말판 배치');
        setMessage('리롤 완료: 보관함 3마리 → 뽑기권 +' + PokemonConfig.REROLL_REWARD_TICKETS);
    }

    /** 리롤 패널 닫기 */
    function closeRerollPanel() {
        rerollSelectedUids = null;
        if ($hud.rerollOverlay && $hud.rerollOverlay.length) {
            $hud.rerollOverlay.hide();
        }
        if ($hud.rerollCards && $hud.rerollCards.length) {
            $hud.rerollCards.empty();
        }
        if ($hud.rerollPickCount && $hud.rerollPickCount.length) {
            $hud.rerollPickCount.text('0 / ' + PokemonConfig.REROLL_TRADE_COUNT + ' 선택');
        }
        if ($hud.btnRerollConfirm && $hud.btnRerollConfirm.length) {
            $hud.btnRerollConfirm.prop('disabled', true);
        }
        updateRerollButton();
    }

    /** 보관함 항목 정렬 키 — 계열 1단 ID 기준 */
    function getStorageSortKey(item) {
        const line = item.line || [item.pokemonId];
        const baseId = line[0];
        const role = item.role || getRoleForBaseId(baseId, line);
        let utSort = 0;
        if (canUtilityMergeLine(line) && isUtilityRole(role)) {
            utSort = getUtilityTier(item) * 3;
        }
        return baseId * 1000 + (item.evolutionStage || 0) * 10 + utSort + item.pokemonId;
    }

    /** 보관함 그룹 키 — 계열 1단 + 단계 (이브이 분기는 진화체 ID 포함) */
    function getStorageGroupKey(item) {
        const line = item.line || [item.pokemonId];
        const stage = item.evolutionStage || 0;
        const baseId = line[0];
        const role = item.role || getRoleForBaseId(baseId, line);
        let key;
        if (PokemonConfig.isEeveeLineBase(baseId) && stage >= 1) {
            return String(baseId) + '_s' + stage + '_id' + item.pokemonId;
        }
        key = String(baseId) + '_s' + stage;
        if (canUtilityMergeLine(line) && isUtilityRole(role)) {
            key += '_ut' + getUtilityTier(item);
        }
        return key;
    }

    /** 보관함 그룹 목록(정렬된 storageItems 기준) */
    function buildStorageGroups() {
        const groups = [];
        let i;
        let item;
        let key;
        let lastKey = null;
        let g;

        for (i = 0; i < storageItems.length; i++) {
            item = storageItems[i];
            key = getStorageGroupKey(item);
            if (lastKey !== key) {
                g = {
                    key: key,
                    baseId: (item.line && item.line.length) ? item.line[0] : item.pokemonId,
                    stage: item.evolutionStage || 0,
                    utilityTier: getUtilityTier(item),
                    line: item.line || [item.pokemonId],
                    pokemonId: item.pokemonId,
                    role: item.role || ROLE.SINGLE,
                    element: item.element || null,
                    legendary: !!item.legendary,
                    count: 0,
                    firstUid: item.uid
                };
                groups.push(g);
                lastKey = key;
            }
            groups[groups.length - 1].count++;
        }
        return groups;
    }

    /** 보관함 — 같은 계열·단계끼리 묶어 정렬 */
    function sortStorageItems(showMsg) {
        storageItems.sort(function (a, b) {
            const ka = getStorageSortKey(a);
            const kb = getStorageSortKey(b);
            if (ka !== kb) {
                return ka - kb;
            }
            return a.pokemonId - b.pokemonId;
        });
        renderStorageTray();
        if (showMsg) {
            setMessage('보관함 정렬 완료 (중복 계열 묶음)');
        }
    }

    /**
     * 테스트용 — 전설 조합 5종(144~146,150~151)을 보관함에 지급
     * @param {boolean} [force] true면 기보유여도 보관함에 1마리씩 추가
     * @returns {{ added: number, skipped: number, ids: number[] }}
     */
    function grantTestLegendariesAll(force) {
        const ids = PokemonConfig.GEN1_COMBO_ONLY_IDS.slice();
        let added = 0;
        let skipped = 0;
        let i;
        let id;

        for (i = 0; i < ids.length; i++) {
            id = ids[i];
            if (!force && hasLegendaryOwned(id)) {
                skipped++;
                continue;
            }
            addToStorage(id, [id], null, 0);
            added++;
        }
        syncLegendaryRoles();
        for (i = 0; i < storageItems.length; i++) {
            if (PokemonConfig.isLegendaryId(storageItems[i].pokemonId)) {
                ensureStorageItemTexture(storageItems[i]);
            }
        }
        renderStorageTray();
        renderLegendaryPanelIfOpen();
        setMessage(
            '테스트: 전설 ' + added + '종 보관함 지급' +
                (skipped ? ' (이미 보유 ' + skipped + '종 생략)' : '')
        );
        return { added: added, skipped: skipped, ids: ids };
    }

    /** 보관함에 추가 후 자동 정렬 */
    function addToStorage(pokemonId, line, texture, evolutionStage, utilityTier) {
        const baseId = (line && line.length) ? line[0] : pokemonId;
        const normLine = PokemonConfig.isEeveeLineBase(baseId)
            ? PokemonConfig.normalizeEeveeLine(line || [pokemonId])
            : (line || [pokemonId]);
        const role = getRoleForBaseId(baseId, normLine);
        storageItems.push({
            uid: 'st_' + (storageUidCounter++),
            pokemonId: pokemonId,
            line: normLine,
            texture: texture,
            evolutionStage: evolutionStage || 0,
            utilityTier: utilityTier ? Math.min(UTILITY_MAX_TIER, Math.floor(utilityTier)) : 0,
            role: role,
            element: getElementForUnit(baseId, role),
            legendary: PokemonConfig.isLegendaryId(pokemonId)
        });
        sortStorageItems(false);
        updateStorageCountLabel();
        renderLegendaryPanelIfOpen();
    }

    /** 전설 타워 역할·속성 보정 (구 슬로우·버프 데이터 정리) */
    function syncLegendaryRoles() {
        let i;
        let item;
        let unit;
        let role;
        let baseId;
        let line;

        for (i = 0; i < storageItems.length; i++) {
            item = storageItems[i];
            if (!PokemonConfig.isLegendaryId(item.pokemonId)) {
                continue;
            }
            baseId = item.pokemonId;
            line = item.line || [baseId];
            role = getRoleForBaseId(baseId, line);
            item.role = role;
            item.element = getElementForUnit(baseId, role);
            item.utilityTier = 0;
        }
        for (i = 0; i < units.length; i++) {
            unit = units[i];
            if (!PokemonConfig.isLegendaryId(unit.pokemonId)) {
                continue;
            }
            baseId = unit.pokemonId;
            line = unit.evolutionLine || [baseId];
            role = getRoleForBaseId(baseId, line);
            unit.role = role;
            unit.element = getElementForUnit(baseId, role);
            unit.utilityTier = 0;
            removeUtilityLevelBadge(unit);
            removeRoleBadge(unit);
            applyUnitStats(unit);
        }
    }

    /** 전설 조합 결과 — 보관함·말판 보유 위치 */
    function getLegendaryOwnedPlaces(resultId) {
        let i;
        const places = { storage: false, grid: false };
        for (i = 0; i < storageItems.length; i++) {
            if (storageItems[i].pokemonId === resultId) {
                places.storage = true;
                break;
            }
        }
        for (i = 0; i < units.length; i++) {
            if (units[i].pokemonId === resultId) {
                places.grid = true;
                break;
            }
        }
        return places;
    }

    function hasLegendaryOwned(resultId) {
        const places = getLegendaryOwnedPlaces(resultId);
        return places.storage || places.grid;
    }

    /** 전설 보유 위치 문구 (조합 패널) */
    function formatLegendaryOwnedLabel(places) {
        if (places.storage && places.grid) {
            return '보관함·말판 보유';
        }
        if (places.grid) {
            return '말판 배치 중';
        }
        if (places.storage) {
            return '보관함 보유';
        }
        return '';
    }

    /** 조합 재료 1개에 맞는 보관함 항목 */
    function findStorageItemForIngredient(ingredient, usedUids) {
        let i;
        let item;
        for (i = 0; i < storageItems.length; i++) {
            item = storageItems[i];
            if (usedUids[item.uid]) {
                continue;
            }
            if (item.pokemonId !== ingredient.pokemonId) {
                continue;
            }
            if ((item.evolutionStage || 0) < ingredient.minStage) {
                continue;
            }
            return item;
        }
        return null;
    }

    /** 전설 조합 충족 여부 */
    function evaluateLegendaryCombo(combo) {
        const usedUids = {};
        const matches = [];
        let i;
        let ing;
        let item;

        if (!combo) {
            return { ready: false, reason: 'invalid', matches: [] };
        }
        if (hasLegendaryOwned(combo.resultId)) {
            return { ready: false, reason: 'owned', matches: [] };
        }
        for (i = 0; i < combo.ingredients.length; i++) {
            ing = combo.ingredients[i];
            item = findStorageItemForIngredient(ing, usedUids);
            if (!item) {
                return { ready: false, reason: 'missing', matches: matches };
            }
            usedUids[item.uid] = true;
            matches.push({ ingredient: ing, item: item });
        }
        return { ready: true, reason: 'ok', matches: matches };
    }

    /** 전설 조합 패널 HTML */
    function renderLegendaryPanel() {
        const combos = PokemonConfig.getLegendaryCombos();
        let html = '';
        let i;
        let combo;
        let ev;
        let j;
        let ing;
        let hasIng;

        if (!$hud.legendaryRecipes || !$hud.legendaryRecipes.length) {
            return;
        }

        for (i = 0; i < combos.length; i++) {
            combo = combos[i];
            ev = evaluateLegendaryCombo(combo);
            const ownedPlaces = getLegendaryOwnedPlaces(combo.resultId);
            const ownedLabel = formatLegendaryOwnedLabel(ownedPlaces);
            let recipeCls = 'legendary-recipe';
            if (ev.reason === 'owned') {
                recipeCls += ' is-owned';
            } else if (ev.ready) {
                recipeCls += ' is-ready';
            }
            html += '<div class="' + recipeCls + '">';
            html += '<div class="legendary-recipe-head">';
            html += '<div class="legendary-result-wrap">';
            html += '<img class="legendary-result-img" src="' + PokemonConfig.pngUrl(combo.resultId) + '" alt="" width="48" height="48">';
            if (ev.reason === 'owned') {
                html += '<span class="legendary-owned-chip" title="' + ownedLabel + '">보유</span>';
            }
            html += '</div>';
            html += '<div class="legendary-recipe-meta">';
            html += '<strong>#' + combo.resultId + ' ' + combo.label + '</strong>';
            const resultRole = getRoleForBaseId(combo.resultId, [combo.resultId]);
            const resultElement = getElementForUnit(combo.resultId, resultRole);
            html += ' <em class="role-badge role-' + resultRole + '">' + getRoleLabel(resultRole) + '</em>';
            if (resultRole === ROLE.SINGLE && resultElement) {
                html += ' <em class="element-badge element-' + resultElement + '">' +
                    getElementLabel(resultElement) + '</em>';
            }
            if (ev.reason === 'owned' && ownedLabel) {
                html += '<span class="legendary-owned-loc">' + ownedLabel + '</span>';
            }
            html += '<span class="legendary-hint">' + combo.hint + '</span>';
            html += '</div></div>';
            html += '<ul class="legendary-ing-list">';
            for (j = 0; j < combo.ingredients.length; j++) {
                ing = combo.ingredients[j];
                hasIng = findStorageItemForIngredient(ing, {}) !== null;
                html += '<li class="' + (hasIng ? 'has-ing' : 'need-ing') + '">';
                html += '<img src="' + PokemonConfig.pngUrl(ing.pokemonId) + '" alt="" width="32" height="32">';
                html += '<span>#' + ing.pokemonId + ' ' + ing.label;
                if (ing.minStage > 0) {
                    html += ' <em>(' + (ing.minStage + 1) + '단↑)</em>';
                }
                html += '</span></li>';
            }
            html += '</ul>';
            if (ev.reason === 'owned') {
                html += '<p class="legendary-status owned">이미 보유 — ' + (ownedLabel || '조합 불필요') + '</p>';
            } else if (ev.ready) {
                html += '<button type="button" class="btn-legendary-craft" data-combo-id="' + combo.id + '">조합 실행</button>';
            } else {
                html += '<p class="legendary-status need">재료 부족</p>';
            }
            html += '</div>';
        }

        $hud.legendaryRecipes.html(html);
    }

    function renderLegendaryPanelIfOpen() {
        if ($hud.legendaryOverlay && $hud.legendaryOverlay.is(':visible')) {
            renderLegendaryPanel();
        }
    }

    function openLegendaryPanel() {
        if ($hud.rerollOverlay && $hud.rerollOverlay.is(':visible')) {
            closeRerollPanel();
        }
        renderLegendaryPanel();
        $hud.legendaryOverlay.show();
        setMessage('전설 조합 — 보관함 재료를 모아 획득 (상세: docs/legendary-combos.md)');
    }

    function closeLegendaryPanel() {
        if ($hud.legendaryOverlay) {
            $hud.legendaryOverlay.hide();
        }
    }

    /** 전설 조합 실행 */
    function performLegendaryCombo(comboId) {
        const combos = PokemonConfig.getLegendaryCombos();
        let combo = null;
        let i;
        let ev;
        let m;
        let tex;

        for (i = 0; i < combos.length; i++) {
            if (combos[i].id === comboId) {
                combo = combos[i];
                break;
            }
        }
        if (!combo) {
            return;
        }
        ev = evaluateLegendaryCombo(combo);
        if (!ev.ready) {
            if (ev.reason === 'owned') {
                setMessage('이미 #' + combo.resultId + ' ' + combo.label + ' 을(를) 보유 중입니다.');
            } else {
                setMessage('재료가 부족합니다. 보관함에 필요 포켓몬·단계를 확인하세요.');
            }
            renderLegendaryPanel();
            return;
        }

        for (i = 0; i < ev.matches.length; i++) {
            m = ev.matches[i];
            removeFromStorage(m.item.uid);
        }

        loadPokemonTexture(combo.resultId).then(function (loadedTex) {
            tex = loadedTex;
            addToStorage(combo.resultId, [combo.resultId], tex, 0);
            setMessage('전설 조합 성공! #' + combo.resultId + ' ' + combo.label + ' → 보관함');
            renderLegendaryPanel();
        }).catch(function () {
            addToStorage(combo.resultId, [combo.resultId], null, 0);
            setMessage('전설 조합 성공! #' + combo.resultId + ' ' + combo.label + ' → 보관함');
            renderLegendaryPanel();
        });
    }

    /** 보관함에서 제거 */
    function removeFromStorage(uid) {
        let i;
        for (i = storageItems.length - 1; i >= 0; i--) {
            if (storageItems[i].uid === uid) {
                storageItems.splice(i, 1);
                break;
            }
        }
        renderStorageTray();
        updateStorageCountLabel();
        renderLegendaryPanelIfOpen();
    }

    /** 보관함 항목 찾기 */
    function findStorageItem(uid) {
        let i;
        for (i = 0; i < storageItems.length; i++) {
            if (storageItems[i].uid === uid) {
                return storageItems[i];
            }
        }
        return null;
    }

    /** 보관함 개수 라벨 */
    function updateStorageCountLabel() {
        if ($hud.storageCount && $hud.storageCount.length) {
            $hud.storageCount.text(storageItems.length + '마리');
        }
    }

    /** 보관함 그룹 — 지금 합성 진화 가능 */
    function canEvolveStorageGroup(g) {
        let maxStage;
        if (!g) {
            return false;
        }
        if (canUtilityMergeStorageGroup(g)) {
            return false;
        }
        maxStage = getMaxEvolutionStageForLine(g.line || [g.pokemonId], g.pokemonId);
        if ((g.stage || 0) >= maxStage) {
            return false;
        }
        return g.count >= getMergeRequired(g.stage || 0);
    }

    /** 보관함 그룹 — 진화 라인 보유(최종 아님) */
    function hasEvolutionLine(g) {
        if (!g) {
            return false;
        }
        return (g.stage || 0) < getMaxEvolutionStageForLine(g.line || [g.pokemonId], g.pokemonId);
    }

    /** 보관함 UI 렌더 */
    function renderStorageTray() {
        syncLegendaryRoles();
        let html = '';
        let i;
        let groups;
        let g;
        let stageLabel;
        let cardClass;
        let depthLabel;

        if (!storageItems.length) {
            $hud.gachaTray.html('<span class="gacha-placeholder">보관함 비어 있음 · [뽑기]로 채우기</span>');
            updateStorageCountLabel();
            return;
        }

        groups = buildStorageGroups();
        for (i = 0; i < groups.length; i++) {
            g = groups[i];
            if (i > 0) {
                html += '<div class="storage-group-divider"></div>';
            }
            stageLabel = STAGE_LABELS[g.stage] || '1단';
            cardClass = 'storage-card';
            if (g.legendary) {
                cardClass += ' is-legendary';
            }
            if (canEvolveStorageGroup(g)) {
                cardClass += ' can-evolve';
            } else if (canUtilityMergeStorageGroup(g)) {
                cardClass += ' can-utility-merge';
            } else if (hasEvolutionLine(g)) {
                cardClass += ' evo-line';
            }
            depthLabel = '';
            if (hasEvolutionLine(g) || canEvolveStorageGroup(g)) {
                depthLabel = '<span class="evo-line-mark" title="진화 가능">↑</span>';
            }
            html += '<div class="' + cardClass + '" data-uid="' + g.firstUid + '" data-gkey="' + g.key + '" title="말판으로 드래그 / 클릭하면 강화">';
            if (canEvolveStorageGroup(g)) {
                html += '<span class="evo-ready-badge">진화!</span>';
            } else if (canUtilityMergeStorageGroup(g)) {
                html += '<span class="utility-ready-badge">강화!</span>';
            }
            html += depthLabel;
            if (g.utilityTier) {
                html += '<span class="utility-lv-badge' +
                    (getUtilityTier({ utilityTier: g.utilityTier }) >= 2 ? ' utility-lv-2' : '') + '">' +
                    formatUtilityLevelUi(g.utilityTier) + '</span>';
            }
            html += '<img src="' + PokemonConfig.pngUrl(g.pokemonId) + '" alt="" width="52" height="52">';
            html += '<span class="gacha-no">#' + g.pokemonId + ' <em class="gacha-stage">' + stageLabel + '</em>';
            html += ' <em class="role-badge role-' + g.role + '">' + getRoleLabel(g.role) + '</em>';
            if (g.role === ROLE.SINGLE && g.element) {
                html += ' <em class="element-badge element-' + g.element + '">' + getElementLabel(g.element) + '</em>';
            }
            if (g.legendary) {
                html += ' <em class="legendary-badge">전설</em>';
            }
            if (g.count > 1) {
                html += ' <em class="gacha-count">x' + g.count + '</em>';
            }
            html += '</span></div>';
        }
        $hud.gachaTray.html(html);
        updateStorageCountLabel();
        updateRerollButton();
    }

    /** 화면 좌표 아래의 그리드 칸 (보관함 드래그용) */
    function getGridCellFromPoint(clientX, clientY) {
        const el = document.elementFromPoint(clientX, clientY);
        let node = el;
        let col;
        let row;

        while (node) {
            if (node.classList && node.classList.contains('grid-cell')) {
                col = parseInt(node.getAttribute('data-col'), 10);
                row = parseInt(node.getAttribute('data-row'), 10);
                if (!isNaN(col) && !isNaN(row)) {
                    return {
                        col: col,
                        row: row,
                        occupied: node.classList.contains('occupied')
                    };
                }
                return null;
            }
            node = node.parentNode;
        }
        return null;
    }

    /** 보관함 드롭 대상 칸 하이라이트 */
    function highlightStorageDropCell(col, row, occupied) {
        let $cell;
        if (!$gridOverlay || !$gridOverlay.length) {
            return;
        }
        $gridOverlay.find('.grid-cell.storage-drop-target').removeClass('storage-drop-target');
        if (col === undefined || row === undefined || occupied) {
            return;
        }
        $cell = $gridOverlay.find('.grid-cell[data-col="' + col + '"][data-row="' + row + '"]');
        if ($cell.length && !$cell.hasClass('occupied')) {
            $cell.addClass('storage-drop-target');
        }
    }

    /** 포인터가 보관함 패널 위인지 */
    function isPointerOverStorage(e) {
        const panel = document.getElementById('gacha-panel');
        let rect;
        if (!panel || !e) {
            return false;
        }
        rect = panel.getBoundingClientRect();
        return e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom;
    }

    /** 보관함 드래그 종료 */
    function finishStorageDrag(e) {
        const uid = storageDragUid;
        const item = findStorageItem(uid);
        let placed = false;
        let targetCell = storageHoverCell;
        let hit;

        if (!uid) {
            return;
        }

        if (e && (!targetCell || getUnitAt(targetCell.col, targetCell.row))) {
            hit = getGridCellFromPoint(e.clientX, e.clientY);
            if (hit && !hit.occupied) {
                targetCell = { col: hit.col, row: hit.row };
            }
        }

        if (item && targetCell && !getUnitAt(targetCell.col, targetCell.row)) {
            placed = placeFromStorage(uid, targetCell.col, targetCell.row);
        }

        if (!placed && item && e && isPointerOverStorage(e)) {
            sortStorageItems(false);
        }

        storageDragUid = null;
        storageHoverCell = null;
        if ($hud.gachaPanel && $hud.gachaPanel.length) {
            $hud.gachaPanel.removeClass('is-storage-drag');
        }
        if ($gridOverlay && $gridOverlay.length) {
            $gridOverlay.removeClass('is-storage-place');
            $gridOverlay.find('.grid-cell').removeClass('storage-drop-target');
        }
        $(document).off('mousemove.storageDrag');
    }

    /** 드래그 중 포인터 아래 그리드 칸 갱신 */
    function updateStorageDragHover(e) {
        let hit;
        if (!storageDragUid || !e) {
            return;
        }
        hit = getGridCellFromPoint(e.clientX, e.clientY);
        if (hit) {
            storageHoverCell = { col: hit.col, row: hit.row };
            highlightStorageDropCell(hit.col, hit.row, hit.occupied);
        }
    }

    /** 보관함 → 말판 배치 */
    function placeFromStorage(uid, col, row) {
        const item = findStorageItem(uid);

        if (!item || getUnitAt(col, row)) {
            return false;
        }

        if (!item.texture || item.texture.destroyed) {
            ensureStorageItemTexture(item).then(function () {
                placeFromStorage(uid, col, row);
            }).catch(function () {
                setMessage('스프라이트 로드 실패 #' + item.pokemonId);
            });
            return true;
        }

        removeFromStorage(uid);
        placeUnit(col, row, {
            id: item.pokemonId,
            texture: item.texture,
            line: item.line,
            evolutionStage: item.evolutionStage,
            utilityTier: item.utilityTier,
            role: item.role,
            element: item.element
        }, true);
        syncAllGridCells();
        updateDeployGridUi();
        setMessage('No.' + item.pokemonId + ' [' + getRoleLabel(item.role) + '] 말판 배치 (' + col + ',' + row + ')');
        return true;
    }

    /** 보관함 전체를 말판 빈 칸에 일괄 배치 */
    function deployAllFromStorage() {
        const cells = getEmptyCellList();
        let max;
        let roleOrder;
        let itemsByRole;
        let itemsToPlaceByRole;
        let roleTake;
        let placedUidSet;
        let usedCellSet;
        let cellInfos;
        let slowCells;
        let aoeCells;
        let buffCells;
        let singleCells;
        let placedCount;
        let fieldCenterX;
        let fieldCenterY;
        let i;

        if (!storageItems.length) {
            setMessage('보관함이 비어 있습니다.');
            return;
        }
        if (!cells.length) {
            setMessage('말판 빈 칸이 없습니다.');
            return;
        }

        max = Math.min(storageItems.length, cells.length);
        placedUidSet = {};
        placedCount = 0;
        roleOrder = [ROLE.SLOW, ROLE.BUFF, ROLE.AOE, ROLE.SINGLE];

        itemsByRole = {};
        itemsByRole[ROLE.SLOW] = [];
        itemsByRole[ROLE.AOE] = [];
        itemsByRole[ROLE.BUFF] = [];
        itemsByRole[ROLE.SINGLE] = [];

        for (i = 0; i < storageItems.length; i++) {
            const it = storageItems[i];
            if (!it) {
                continue;
            }
            const r = it.role || ROLE.SINGLE;
            itemsByRole[r].push(it);
        }

        itemsToPlaceByRole = {};
        roleTake = {};
        let remaining = max;
        for (i = 0; i < roleOrder.length; i++) {
            const r = roleOrder[i];
            const available = itemsByRole[r].length;
            const take = Math.min(available, remaining);
            roleTake[r] = take;
            itemsToPlaceByRole[r] = itemsByRole[r].slice(0, take);
            remaining -= take;
        }

        // 경로/중심 거리로 빈 칸 후보 정렬 (heuristic)
        fieldCenterX = gridOrigin.x + (GRID * CELL) / 2;
        fieldCenterY = gridOrigin.y + (GRID * CELL) / 2;

        function getPoint2ForCell(col, row) {
            const x = gridOrigin.x + col * CELL + CELL / 2;
            const y = gridOrigin.y + row * CELL + CELL / 2;
            return { x: x, y: y };
        }

        function distPointToSegment2(px, py, x1, y1, x2, y2) {
            let vx;
            let vy;
            let wx;
            let wy;
            let c1;
            let c2;
            let t;
            let cx;
            let cy;
            let dx;
            let dy;

            vx = x2 - x1;
            vy = y2 - y1;
            wx = px - x1;
            wy = py - y1;
            c1 = wx * vx + wy * vy;
            if (c1 <= 0) {
                dx = px - x1;
                dy = py - y1;
                return dx * dx + dy * dy;
            }
            c2 = vx * vx + vy * vy;
            if (c2 <= c1) {
                dx = px - x2;
                dy = py - y2;
                return dx * dx + dy * dy;
            }
            t = c1 / c2;
            cx = x1 + vx * t;
            cy = y1 + vy * t;
            dx = px - cx;
            dy = py - cy;
            return dx * dx + dy * dy;
        }

        function getCellDistToPath2(col, row) {
            let p;
            let minD2;
            let a;
            let b;
            let d2;
            let j;

            p = getPoint2ForCell(col, row);
            minD2 = Infinity;
            for (j = 0; j < pathPoints.length; j++) {
                a = pathPoints[j];
                b = pathPoints[(j + 1) % pathPoints.length];
                d2 = distPointToSegment2(p.x, p.y, a.x, a.y, b.x, b.y);
                if (d2 < minD2) {
                    minD2 = d2;
                }
            }
            return minD2;
        }

        cellInfos = [];
        for (i = 0; i < cells.length; i++) {
            const c = cells[i];
            const pt = getPoint2ForCell(c.col, c.row);
            const distCenter2 = (pt.x - fieldCenterX) * (pt.x - fieldCenterX) + (pt.y - fieldCenterY) * (pt.y - fieldCenterY);
            cellInfos.push({
                col: c.col,
                row: c.row,
                distPath2: getCellDistToPath2(c.col, c.row),
                distCenter2: distCenter2
            });
        }

        function scoreDeployCell(ci, role) {
            const profile = getRoleProfile(role);
            const w = profile.deployWeight || 1;
            const pathNear = Math.max(0, 2000 - ci.distPath2);
            const centerNear = Math.max(0, 1500 - ci.distCenter2);
            const pathFar = Math.min(ci.distPath2, 2000);

            if (role === ROLE.SLOW) {
                return w * 1000 + pathNear * 2;
            }
            if (role === ROLE.BUFF) {
                return w * 1000 + centerNear * 2 + pathFar * 0.5;
            }
            if (role === ROLE.AOE) {
                return w * 1000 + pathNear * 1.5;
            }
            return w * 1000 + pathNear;
        }

        function takeCellsForRole(count, role) {
            let list = [];
            let k;
            let j;
            let ci;
            let best;
            let bestScore;
            let score;
            let key;

            for (k = 0; k < count; k++) {
                best = null;
                bestScore = -Infinity;
                for (j = 0; j < cellInfos.length; j++) {
                    ci = cellInfos[j];
                    key = ci.col + ',' + ci.row;
                    if (usedCellSet[key]) {
                        continue;
                    }
                    score = scoreDeployCell(ci, role);
                    if (score > bestScore) {
                        bestScore = score;
                        best = ci;
                    }
                }
                if (!best) {
                    break;
                }
                usedCellSet[best.col + ',' + best.row] = true;
                list.push(best);
            }
            return list;
        }

        usedCellSet = {};
        slowCells = takeCellsForRole(roleTake[ROLE.SLOW] || 0, ROLE.SLOW);
        buffCells = takeCellsForRole(roleTake[ROLE.BUFF] || 0, ROLE.BUFF);
        aoeCells = takeCellsForRole(roleTake[ROLE.AOE] || 0, ROLE.AOE);
        singleCells = takeCellsForRole(roleTake[ROLE.SINGLE] || 0, ROLE.SINGLE);

        // 실제 배치
        function placeItemList(items, targetCells) {
            let k;
            let len;
            if (!items || !targetCells) {
                return;
            }
            len = Math.min(items.length, targetCells.length);
            for (k = 0; k < len; k++) {
                const it = items[k];
                const cell = targetCells[k];
                placeUnit(cell.col, cell.row, {
                    id: it.pokemonId,
                    texture: it.texture,
                    line: it.line,
                    evolutionStage: it.evolutionStage,
                    role: it.role,
                    element: it.element
                }, true);
                placedUidSet[it.uid] = true;
                placedCount++;
            }
        }

        placeItemList(itemsToPlaceByRole[ROLE.SLOW], slowCells);
        placeItemList(itemsToPlaceByRole[ROLE.BUFF], buffCells);
        placeItemList(itemsToPlaceByRole[ROLE.AOE], aoeCells);
        placeItemList(itemsToPlaceByRole[ROLE.SINGLE], singleCells);

        // 보관함에서 배치된 것 제거
        storageItems = storageItems.filter(function (it) {
            return !placedUidSet[it.uid];
        });

        if (selectedStorageGroupKey) {
            selectedStorageGroupKey = null;
            selectedStorageGroup = null;
        }

        syncAllGridCells();
        updateDeployGridUi();
        sortStorageItems(false);
        updateStorageCountLabel();
        setMessage(placedCount + '마리 역할별 일괄 배치 완료 (슬로우→버프→범위→단일 우선)');
    }

    /** 말판 → 보관함 회수 */
    function returnUnitToStorage(unit) {
        const stage = getUnitStage(unit);
        let tex;

        if (!unit || !unit.sprite) {
            return;
        }
        tex = unit.sprite.texture;
        addToStorage(unit.pokemonId, unit.evolutionLine, tex, stage);
        removeUnitFromGrid(unit);
        syncAllGridCells();
        updateDeployGridUi();
        setMessage('No.' + unit.pokemonId + ' 보관함으로 회수');
    }

    /** 보관함·말판 간 드래그 이벤트 */
    function bindStorageEvents() {
        if (!$hud.gachaTray || !$hud.gachaTray.length) {
            return;
        }

        // 클릭(선택) vs 드래그(배치) 구분
        let downUid = null;
        let downX = 0;
        let downY = 0;
        let moved = false;

        $hud.gachaTray.off('mousedown.storageSelect').on('mousedown.storageSelect', '.storage-card', function (e) {
            downUid = $(this).attr('data-uid');
            downX = e.clientX;
            downY = e.clientY;
            moved = false;
        });

        $(document).off('mousemove.storageSelect').on('mousemove.storageSelect', function (e) {
            if (!downUid) {
                return;
            }
            if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) {
                moved = true;
            }
        });

        $hud.gachaTray.off('mouseup.storageSelect').on('mouseup.storageSelect', '.storage-card', function () {
            const $card = $(this);
            const gkey = $card.attr('data-gkey');
            if (!downUid || moved) {
                return;
            }
            selectStorageGroup(gkey);
        });

        $hud.gachaTray.off('mousedown.storageCard').on('mousedown.storageCard', '.storage-card', function (e) {
            if (state.gameOver) {
                return;
            }
            storageDragUid = $(this).attr('data-uid');
            storageHoverCell = null;
            if ($hud.gachaPanel && $hud.gachaPanel.length) {
                $hud.gachaPanel.addClass('is-storage-drag');
            }
            if ($gridOverlay && $gridOverlay.length) {
                $gridOverlay.addClass('is-storage-place');
            }
            $(document).off('mousemove.storageDrag').on('mousemove.storageDrag', function (ev) {
                updateStorageDragHover(ev);
            });
            e.preventDefault();
        });

        $hud.gachaTray.off('touchstart.storageCard').on('touchstart.storageCard', '.storage-card', function (e) {
            const touch = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0];
            if (!touch) {
                return;
            }
            $(this).trigger('mousedown');
            e.preventDefault();
        });

        $(document).off('mouseup.storageDrag').on('mouseup.storageDrag', function (e) {
            if (storageDragUid) {
                finishStorageDrag(e);
            }
        });

        $(document).off('touchend.storageDrag').on('touchend.storageDrag', function (e) {
            const touch = e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0];
            if (!storageDragUid || !touch) {
                return;
            }
            finishStorageDrag({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            e.preventDefault();
        });
    }

    /** 보관함 그룹 선택 — 오른쪽 패널에 표시 */
    function selectStorageGroup(groupKey) {
        const groups = buildStorageGroups();
        let i;
        let g = null;

        for (i = 0; i < groups.length; i++) {
            if (groups[i].key === groupKey) {
                g = groups[i];
                break;
            }
        }
        if (!g) {
            return;
        }

        selectedStorageGroupKey = groupKey;
        selectedStorageGroup = g;
        selectedUnit = null;
        clearSelectedRangePreview();
        if ($gridOverlay && $gridOverlay.length) {
            $gridOverlay.find('.grid-cell').removeClass('tower-selected');
        }
        updateTowerPanelForStorage(g);
        setMessage('보관함 선택: No.' + g.pokemonId + ' ' + (STAGE_LABELS[g.stage] || '1단') + ' x' + g.count);
    }

    /** 보관함용 오른쪽 패널 */
    function updateTowerPanelForStorage(g) {
        const line = g.line || [g.pokemonId];
        const stage = g.stage || 0;
        const mergeNeed = getMergeRequired(stage);
        const nextStage = stage + 1;
        const nextId = line[nextStage];
        const maxStage = getMaxEvolutionStageForLine(line, g.pokemonId);
        const canEvolve = stage < maxStage;
        const profile = getRoleProfile(g.role);
        let statsHtml = '';
        const curEff = getEffectiveStats(stage, g.role, g.pokemonId, g.line);

        if (!$hud.towerBody || !$hud.towerBody.length) {
            return;
        }

        $hud.towerPlaceholder.hide();
        $hud.towerBody.show();
        hideBranchPick();
        $hud.towerCurImg.attr('src', PokemonConfig.pngUrl(g.pokemonId));
        $hud.towerCurStage.text(STAGE_LABELS[stage] || (stage + 1) + '단');
        setTowerUtilityLevelTag(g.utilityTier);
        $hud.towerCurNo.text('#' + g.pokemonId + ' (보관함) · ' + formatUnitRoleLabel(g.role, g.element));
        statsHtml += buildRangeBadgeHtml(curEff.range);

        if (isEeveeBranchEvolveTarget(g.baseId, stage, g.pokemonId)) {
            $hud.towerBody.find('.evo-next').hide();
            $hud.towerBody.find('.evo-arrow').hide();
            statsHtml += '<p class="merge-count">이브이 보유 <strong>' + g.count + ' / ' + mergeNeed + '</strong></p>';
            statsHtml += buildRoleDescLine(g.role);
            statsHtml += '<div class="stat-row max-only"><span>공격 ' + curEff.damage +
                ' · 사거리 ' + curEff.range + ' · 쿨 ' + curEff.cooldownMax + '</span></div>';
            $hud.towerStats.html(statsHtml);
            $hud.towerBranchWrap.html(buildBranchPickHtml(g.count >= mergeNeed)).show();
            $hud.towerMaxMsg.hide();
            $hud.btnUpgrade.hide();
            return;
        }

        if (canEvolve && nextId && !PokemonConfig.isEeveeLineBase(line[0])) {
            $hud.towerNextImg.attr('src', PokemonConfig.pngUrl(nextId));
            $hud.towerNextStage.text(STAGE_LABELS[nextStage] || (nextStage + 1) + '단');
            $hud.towerNextNo.text('#' + nextId);
            $hud.towerBody.find('.evo-next').show();
            $hud.towerBody.find('.evo-arrow').show();

            statsHtml += '<p class="merge-count">동일 ' + (STAGE_LABELS[stage] || '1단') + ' 보유 <strong>' +
                g.count + ' / ' + mergeNeed + '</strong></p>';
            statsHtml += buildRoleDescLine(g.role);
            statsHtml += buildStatRow('공격력', curEff.damage, getEffectiveStats(nextStage, g.role, nextId, g.line).damage, '');
            statsHtml += buildStatRow('사거리', curEff.range, getEffectiveStats(nextStage, g.role, nextId, g.line).range, '');
            statsHtml += buildStatRow('쿨다운', curEff.cooldownMax, getEffectiveStats(nextStage, g.role, nextId, g.line).cooldownMax, ' 프레임');
            $hud.towerStats.html(statsHtml);

            $hud.towerMaxMsg.hide();
            $hud.btnUpgrade.show();
            if (g.count >= mergeNeed) {
                $hud.btnUpgrade.text('진화 가능! (' + g.count + '/' + mergeNeed + ')');
                $hud.btnUpgrade.prop('disabled', false);
            } else {
                $hud.btnUpgrade.text('진화 불가 (' + g.count + '/' + mergeNeed + ')');
                $hud.btnUpgrade.prop('disabled', true);
            }
        } else if (canUtilityMergeLine(line) && isUtilityRole(g.role)) {
            const ut = g.utilityTier || 0;
            const utNeed = UTILITY_MERGE_REQUIRED;
            const canUt = canUtilityMergeStorageGroup(g);
            $hud.towerBody.find('.evo-next').hide();
            $hud.towerBody.find('.evo-arrow').hide();
            statsHtml += '<p class="merge-count">동일 강화 단계 <strong>' + g.count + ' / ' + utNeed + '</strong></p>';
            statsHtml += buildRoleDescLine(g.role);
            statsHtml += buildPassiveDescLine(g.role, g.element, ut);
            statsHtml += '<div class="stat-row max-only"><span>공격 ' + curEff.damage +
                ' · 사거리 ' + curEff.range + ' · 쿨 ' + curEff.cooldownMax + '</span></div>';
            $hud.towerStats.html(statsHtml);
            if ((g.utilityTier || 0) >= UTILITY_MAX_TIER) {
                $hud.towerMaxMsg.show();
                $hud.btnUpgrade.hide();
            } else {
                $hud.towerMaxMsg.hide();
                $hud.btnUpgrade.show();
                if (canUt) {
                    $hud.btnUpgrade.text('강화 가능! (' + g.count + '/' + utNeed + ')');
                    $hud.btnUpgrade.prop('disabled', false);
                } else {
                    $hud.btnUpgrade.text('강화 불가 (' + g.count + '/' + utNeed + ')');
                    $hud.btnUpgrade.prop('disabled', true);
                }
            }
        } else {
            $hud.towerBody.find('.evo-next').hide();
            $hud.towerBody.find('.evo-arrow').hide();
            $hud.towerStats.html(
                buildRoleDescLine(g.role) +
                '<div class="stat-row max-only"><span>공격 ' + curEff.damage +
                ' · 사거리 ' + curEff.range + ' · 쿨 ' + curEff.cooldownMax + '</span></div>'
            );
            $hud.towerMaxMsg.show();
            $hud.btnUpgrade.hide();
        }
    }

    /** 보관함 합성 진화 — 같은 그룹 3개 -> 다음 단계 1개 */
    function upgradeStorageGroup(groupKey) {
        const groups = buildStorageGroups();
        let i;
        let g = null;

        for (i = 0; i < groups.length; i++) {
            if (groups[i].key === groupKey) {
                g = groups[i];
                break;
            }
        }
        if (!g) {
            return;
        }

        // 이브이 — 분기 버튼으로 진화
        if (isEeveeBranchEvolveTarget(g.baseId, g.stage, g.pokemonId)) {
            updateTowerPanelForStorage(g);
            if (g.count >= getMergeRequired(g.stage)) {
                setMessage('이브이 진화 가능! 아래에서 진화할 포켓몬을 선택하세요.');
            } else {
                setMessage('이브이 진화 불가: 같은 단계 ' + getMergeRequired(g.stage) + '개 필요 (현재 ' + g.count + '개)');
            }
            return;
        }

        if (canUtilityMergeStorageGroup(g)) {
            performUtilityStorageMerge(groupKey);
            return;
        }

        if (!g.line || (g.stage >= getMaxEvolutionStageForLine(g.line, g.pokemonId))) {
            if (canUtilityMergeLine(g.line || [g.pokemonId]) && isUtilityRole(g.role) &&
                    (g.utilityTier || 0) >= UTILITY_MAX_TIER) {
                setMessage('유틸 강화 최대 단계입니다.');
            } else {
                setMessage('최대 진화 단계입니다.');
            }
            updateTowerPanelForStorage(g);
            return;
        }
        if (g.count < getMergeRequired(g.stage)) {
            setMessage('진화 불가: 같은 단계 ' + getMergeRequired(g.stage) + '개 필요 (현재 ' + g.count + '개)');
            updateTowerPanelForStorage(g);
            return;
        }
        performStorageMerge(groupKey);
    }

    /** 뽑기 — 남은 권 전부 뽑아 보관함에 추가 후 자동 정렬 */
    function doGacha() {
        const draws = [];
        const texById = {};
        const uniqueBases = [];
        let promises = [];
        let drawCount;
        let i;
        let line;
        let baseId;
        let loadedMap;
        let added;

        if (!canGacha()) {
            return;
        }

        drawCount = state.gachaTickets;
        state.gachaTickets = 0;
        updateHud();
        updateGachaButton();

        for (i = 0; i < drawCount; i++) {
            line = PokemonConfig.randomGachaLine();
            baseId = line[0];
            draws.push({ baseId: baseId, line: line });
            if (!texById[baseId]) {
                texById[baseId] = true;
                uniqueBases.push(baseId);
            }
        }

        state.gachaLoading = true;
        updateGachaButton();
        $hud.gachaTray.html('<span class="gacha-loading">' + drawCount + '마리 로딩…</span>');

        for (i = 0; i < uniqueBases.length; i++) {
            baseId = uniqueBases[i];
            promises.push((function (bid) {
                return loadPokemonTexture(bid).then(function (tex) {
                    return { baseId: bid, texture: tex };
                });
            })(baseId));
        }

        Promise.all(promises).then(function (loaded) {
            loadedMap = {};
            for (i = 0; i < loaded.length; i++) {
                loadedMap[loaded[i].baseId] = loaded[i].texture;
            }
            for (i = 0; i < draws.length; i++) {
                line = PokemonConfig.isEeveeLineBase(draws[i].baseId)
                    ? PokemonConfig.normalizeEeveeLine(draws[i].line)
                    : draws[i].line;
                const drawRole = getRoleForBaseId(draws[i].baseId, draws[i].line);
                storageItems.push({
                    uid: 'st_' + (storageUidCounter++),
                    pokemonId: draws[i].baseId,
                    line: line,
                    texture: loadedMap[draws[i].baseId],
                    evolutionStage: 0,
                    role: drawRole,
                    element: getElementForUnit(draws[i].baseId, drawRole),
                    legendary: PokemonConfig.isLegendaryId(draws[i].baseId)
                });
            }
            added = draws.length;
            sortStorageItems(false);
            state.gachaLoading = false;
            updateDeployGridUi();
            updateGachaButton();
            updateRerollButton();
            $hud.gachaInfo.text('보관함 ' + storageItems.length + '마리 · 드래그로 말판 배치');
            setMessage(added + '마리 보관함 추가 · [정렬] 또는 드래그로 배치');
        }).catch(function () {
            state.gachaLoading = false;
            state.gachaTickets += drawCount;
            updateHud();
            updateGachaButton();
            updateRerollButton();
            renderStorageTray();
            setMessage('스프라이트 로드 실패. 뽑기권을 돌려드렸습니다.');
        });
    }

    /** 빈 칸 목록 */
    function getEmptyCellList() {
        const list = [];
        let row;
        let col;
        for (row = 0; row < GRID; row++) {
            for (col = 0; col < GRID; col++) {
                if (!getUnitAt(col, row)) {
                    list.push({ col: col, row: row });
                }
            }
        }
        return list;
    }

    /** 스폰 기준 경로: 아래 → 오른쪽 → 위 → 왼쪽 */
    function buildPath() {
        const gridW = GRID * CELL;
        const ox = gridOrigin.x - PATH_PAD;
        const oy = gridOrigin.y - PATH_PAD;
        const ow = gridW + PATH_PAD * 2;
        const oh = gridW + PATH_PAD * 2;
        let j;
        let next;

        pathPoints = [
            { x: ox, y: oy },
            { x: ox, y: oy + oh },
            { x: ox + ow, y: oy + oh },
            { x: ox + ow, y: oy }
        ];

        pathLength = 0;
        for (j = 0; j < pathPoints.length; j++) {
            next = pathPoints[(j + 1) % pathPoints.length];
            pathLength += dist(pathPoints[j], next);
        }
    }

    /** 체육관 관중석 띠 (경로 바깥 영역) */
    function drawGymAudienceStripes(g, pathOx, pathOy, pathOw, pathOh) {
        let y;
        let x;
        let row;
        const stripeH = 10;
        const stripeW = 10;

        for (y = 0; y < pathOy; y += stripeH) {
            row = Math.floor(y / stripeH);
            g.beginFill(row % 2 === 0 ? GYM_COLORS.seatDark : GYM_COLORS.seatLight, 0.95);
            g.drawRect(0, y, FIELD, Math.min(stripeH, pathOy - y));
            g.endFill();
        }

        for (y = pathOy + pathOh; y < FIELD; y += stripeH) {
            row = Math.floor(y / stripeH);
            g.beginFill(row % 2 === 0 ? GYM_COLORS.seatDark : GYM_COLORS.seatLight, 0.95);
            g.drawRect(0, y, FIELD, Math.min(stripeH, FIELD - y));
            g.endFill();
        }

        for (y = pathOy; y < pathOy + pathOh; y += stripeH) {
            row = Math.floor(y / stripeH);
            for (x = 0; x < pathOx; x += stripeW) {
                g.beginFill(row % 2 === 0 ? GYM_COLORS.seatDark : GYM_COLORS.seatLight, 0.95);
                g.drawRect(x, y, Math.min(stripeW, pathOx - x), Math.min(stripeH, pathOy + pathOh - y));
                g.endFill();
            }
            for (x = pathOx + pathOw; x < FIELD; x += stripeW) {
                g.beginFill(row % 2 === 0 ? GYM_COLORS.seatDark : GYM_COLORS.seatLight, 0.95);
                g.drawRect(x, y, Math.min(stripeW, FIELD - x), Math.min(stripeH, pathOy + pathOh - y));
                g.endFill();
            }
        }
    }

    /** 경로 안쪽 바닥(배틀 존 외곽 매트) */
    function drawGymInnerMat(g, pathOx, pathOy, pathOw, pathOh) {
        g.beginFill(GYM_COLORS.innerMat, 0.92);
        g.drawRect(pathOx, pathOy, pathOw, pathOh);
        g.endFill();
    }

    /** 체육관 나무 마루 배틀 존 */
    function drawGymArenaFloor(g) {
        let row;
        let col;
        let px;
        let py;

        for (row = 0; row < GRID; row++) {
            for (col = 0; col < GRID; col++) {
                px = gridOrigin.x + col * CELL;
                py = gridOrigin.y + row * CELL;
                if ((row + col) % 2 === 0) {
                    g.beginFill(GYM_COLORS.woodLight, 0.98);
                } else {
                    g.beginFill(GYM_COLORS.woodDark, 0.98);
                }
                g.drawRect(px + 1, py + 1, CELL - 2, CELL - 2);
                g.endFill();
            }
        }
    }

    /** 적 이동 경로(도장 트랙) */
    function drawGymPathTrack(g, points, width) {
        let i;
        let px;
        let py;

        g.lineStyle(width + 4, GYM_COLORS.trackEdge, 0.85);
        g.moveTo(points[0].x, points[0].y);
        for (i = 1; i <= points.length; i++) {
            px = points[i % points.length].x;
            py = points[i % points.length].y;
            g.lineTo(px, py);
        }

        g.lineStyle(width, GYM_COLORS.trackFill, 1);
        g.moveTo(points[0].x, points[0].y);
        for (i = 1; i <= points.length; i++) {
            px = points[i % points.length].x;
            py = points[i % points.length].y;
            g.lineTo(px, py);
        }

        g.lineStyle(2, GYM_COLORS.trackHighlight, 0.55);
        g.moveTo(points[0].x, points[0].y);
        for (i = 1; i <= points.length; i++) {
            px = points[i % points.length].x;
            py = points[i % points.length].y;
            g.lineTo(px, py);
        }

        g.lineStyle(0);
    }

    /** 배틀 존 라인(코트 테두리·중앙 원) */
    function drawGymArenaMarkings(g) {
        const gx = gridOrigin.x;
        const gy = gridOrigin.y;
        const gw = GRID * CELL;
        const cx = gx + gw / 2;
        const cy = gy + gw / 2;

        g.lineStyle(3, GYM_COLORS.courtLine, 0.55);
        g.drawRect(gx + 2, gy + 2, gw - 4, gw - 4);
        g.lineStyle(2, GYM_COLORS.courtLine, 0.22);
        g.drawCircle(cx, cy, 78);
        g.lineStyle(0);
    }

    /** 스폰(입구) 마커 */
    function drawGymSpawnMarker(g, x, y) {
        g.beginFill(GYM_COLORS.spawnFill, 0.95);
        g.drawCircle(x, y, 9);
        g.endFill();
        g.beginFill(0xffffff, 0.95);
        g.drawRect(x - 9, y - 2, 18, 4);
        g.endFill();
        g.lineStyle(2, GYM_COLORS.spawnRing, 1);
        g.drawCircle(x, y, 10);
        g.lineStyle(0);
    }

    /** 체육관 맵 — Graphics 폴백 */
    function drawFieldGraphicsFallback() {
        const g = new PIXI.Graphics();
        const gridW = GRID * CELL;
        const pathOx = gridOrigin.x - PATH_PAD;
        const pathOy = gridOrigin.y - PATH_PAD;
        const pathOw = gridW + PATH_PAD * 2;
        const pathOh = gridW + PATH_PAD * 2;

        g.beginFill(GYM_COLORS.hall);
        g.drawRect(0, 0, FIELD, FIELD);
        g.endFill();

        drawGymAudienceStripes(g, pathOx, pathOy, pathOw, pathOh);
        drawGymInnerMat(g, pathOx, pathOy, pathOw, pathOh);
        drawGymArenaFloor(g);
        drawGymPathTrack(g, pathPoints, GYM_TRACK_WIDTH);
        drawGymArenaMarkings(g);
        drawGymSpawnMarker(g, pathPoints[0].x, pathPoints[0].y);

        gridLayer.addChild(g);
        g.eventMode = 'none';
    }

    /** 체육관 맵 — PNG 배경 우선, 실패 시 Graphics */
    function drawField() {
        if (!gridLayer || typeof PIXI === 'undefined') {
            return Promise.resolve();
        }
        if (!PIXI.Assets || !PIXI.Assets.load) {
            drawFieldGraphicsFallback();
            return Promise.resolve();
        }
        return PIXI.Assets.load(MAP_BG_URL).then(function (texture) {
            const sprite = new PIXI.Sprite(texture);
            sprite.width = FIELD;
            sprite.height = FIELD;
            gridLayer.addChild(sprite);
        }).catch(function () {
            drawFieldGraphicsFallback();
        });
    }

    /** DOM 그리드 */
    function buildDomGrid() {
        const $stage = $root.find('#game-stage');
        let html = '';
        let row;
        let col;
        let altClass;

        html += '<div class="grid-label">체육관 배틀 존 · 드래그로 타워 배치</div>';
        html += '<div class="grid-overlay">';

        for (row = 0; row < GRID; row++) {
            for (col = 0; col < GRID; col++) {
                altClass = ((row + col) % 2 === 0) ? '' : ' alt';
                html += '<div class="grid-cell' + altClass + '" data-col="' + col + '" data-row="' + row + '"></div>';
            }
        }

        html += '</div>';
        $stage.append(html);
        $gridOverlay = $stage.find('.grid-overlay');
    }

    /** 그리드 — 드래그로 유닛 이동 */
    function bindDomGridEvents() {
        let $dragTarget = null;

        if (!$gridOverlay || !$gridOverlay.length) {
            return;
        }

        $gridOverlay.on('mousedown', '.grid-cell.occupied', function (e) {
            const col = parseInt($(this).attr('data-col'), 10);
            const row = parseInt($(this).attr('data-row'), 10);

            if (!canReposition()) {
                return;
            }
            dragUnit = getUnitAt(col, row);
            if (!dragUnit) {
                return;
            }
            dragStartCell = { col: col, row: row };
            dragDidMove = false;
            e.preventDefault();
            $gridOverlay.addClass('is-dragging');
            $(this).addClass('drag-source');
        });

        $gridOverlay.on('mouseenter', '.grid-cell', function () {
            const $cell = $(this);
            let col;
            let row;

            if (storageDragUid) {
                col = parseInt($cell.attr('data-col'), 10);
                row = parseInt($cell.attr('data-row'), 10);
                $gridOverlay.find('.grid-cell.storage-drop-target').removeClass('storage-drop-target');
                storageHoverCell = { col: col, row: row };
                if (!$cell.hasClass('occupied')) {
                    $cell.addClass('storage-drop-target');
                }
                return;
            }

            if (dragUnit && !$cell.hasClass('occupied')) {
                dragDidMove = true;
                $gridOverlay.find('.grid-cell.drag-target').removeClass('drag-target');
                $cell.addClass('drag-target');
                $dragTarget = $cell;
            }
        });

        $gridOverlay.on('mouseup', '.grid-cell', function (e) {
            const $cell = $(this);
            let toCol;
            let toRow;
            let col;
            let row;

            if (storageDragUid) {
                finishStorageDrag(e);
                return;
            }

            if (!dragUnit) {
                return;
            }

            toCol = parseInt($cell.attr('data-col'), 10);
            toRow = parseInt($cell.attr('data-row'), 10);

            if ($cell.hasClass('drag-target') && !$cell.hasClass('occupied')) {
                moveUnit(dragUnit.col, dragUnit.row, toCol, toRow);
            } else if (!dragDidMove && dragStartCell) {
                col = parseInt($cell.attr('data-col'), 10);
                row = parseInt($cell.attr('data-row'), 10);
                if (col === dragStartCell.col && row === dragStartCell.row) {
                    selectTower(dragUnit);
                }
            }

            dragUnit = null;
            dragStartCell = null;
            dragDidMove = false;
            $dragTarget = null;
            $gridOverlay.removeClass('is-dragging');
            $gridOverlay.find('.grid-cell').removeClass('drag-source drag-target');
        });

        $(document).on('mouseup.defenseDrag', function (e) {
            let $target;
            let toCol;
            let toRow;

            if (storageDragUid) {
                return;
            }
            if (!dragUnit) {
                return;
            }
            if (isPointerOverStorage(e)) {
                returnUnitToStorage(dragUnit);
                dragUnit = null;
                dragStartCell = null;
                dragDidMove = false;
                $gridOverlay.removeClass('is-dragging');
                $gridOverlay.find('.grid-cell').removeClass('drag-source drag-target');
                return;
            }
            $target = $gridOverlay.find('.grid-cell.drag-target').first();
            if ($target.length && !$target.hasClass('occupied')) {
                toCol = parseInt($target.attr('data-col'), 10);
                toRow = parseInt($target.attr('data-row'), 10);
                moveUnit(dragUnit.col, dragUnit.row, toCol, toRow);
            } else if (!dragDidMove && dragStartCell && dragUnit) {
                selectTower(dragUnit);
            }
            dragUnit = null;
            dragStartCell = null;
            dragDidMove = false;
            $gridOverlay.removeClass('is-dragging');
            $gridOverlay.find('.grid-cell').removeClass('drag-source drag-target');
        });

        $gridOverlay.on('touchstart', '.grid-cell.occupied', function (e) {
            $(this).trigger('mousedown');
            e.preventDefault();
        });

        $gridOverlay.on('touchend', '.grid-cell', function (e) {
            $(this).trigger('mouseup');
            e.preventDefault();
        });
    }

    /** 유닛 위치 조정 — 게임오버가 아니면 웨이브 중에도 가능 */
    function canReposition() {
        return !state.gameOver;
    }

    /** 전체 그리드 occupied 표시 동기화 */
    function syncAllGridCells() {
        let i;
        if (!$gridOverlay || !$gridOverlay.length) {
            return;
        }
        $gridOverlay.find('.grid-cell').removeClass('occupied evo-ready');
        for (i = 0; i < units.length; i++) {
            markCellOccupied(units[i].col, units[i].row, true);
            if (canUpgradeUnit(units[i])) {
                $gridOverlay.find('.grid-cell[data-col="' + units[i].col + '"][data-row="' + units[i].row + '"]')
                    .addClass('evo-ready');
            }
        }
    }

    /** 유닛 전투 상태 초기화 — GIF 로드 중 attacking 고정 방지 */
    function clearUnitsCombatState() {
        let i;
        for (i = 0; i < units.length; i++) {
            if (units[i].anim) {
                finishAttackAnim(units[i]);
            }
            units[i].attacking = false;
            units[i].cooldown = 0;
            if (isUnitSpriteLive(units[i])) {
                units[i].sprite.visible = true;
                units[i].sprite.scale.set(UNIT_SCALE);
                units[i].sprite.rotation = 0;
            }
        }
    }

    /** DOM 그리드 occupied 동기화 */
    function markCellOccupied(col, row, occupied) {
        const $cell = $gridOverlay.find('.grid-cell[data-col="' + col + '"][data-row="' + row + '"]');
        if (occupied) {
            $cell.addClass('occupied');
        } else {
            $cell.removeClass('occupied');
        }
    }

    /** 유닛 칸 이동 */
    function moveUnit(fromCol, fromRow, toCol, toRow) {
        const unit = getUnitAt(fromCol, fromRow);

        if (!unit || getUnitAt(toCol, toRow)) {
            return false;
        }
        if (fromCol === toCol && fromRow === toRow) {
            return false;
        }
        if (!isUnitSpriteLive(unit)) {
            return false;
        }

        markCellOccupied(fromCol, fromRow, false);
        unit.col = toCol;
        unit.row = toRow;
        unit.sprite.x = gridOrigin.x + toCol * CELL + CELL / 2;
        unit.sprite.y = gridOrigin.y + toRow * CELL + CELL / 2;
        syncRoleBadgePosition(unit);
        markCellOccupied(toCol, toRow, true);
        if (selectedUnit === unit) {
            highlightSelectedCell(unit);
            showSelectedRangePreview(unit);
        }
        setMessage('No.' + unit.pokemonId + ' 위치 이동 (' + toCol + ',' + toRow + ')');
        return true;
    }

    /** 배치·드래그 UI — 빈 칸은 보관함 배치용, 점유 칸은 이동용 */
    function updateDeployGridUi() {
        if (!$gridOverlay || !$gridOverlay.length) {
            return;
        }
        $gridOverlay.removeClass('deploy-on reposition-on');
        if (state.gameOver) {
            return;
        }
        $gridOverlay.addClass('deploy-on');
        if (canReposition() && units.length > 0) {
            $gridOverlay.addClass('reposition-on');
        }
    }

    function clearHoverPreviewGfx() {
        if (rangePreview) {
            uiLayer.removeChild(rangePreview);
            rangePreview.destroy();
            rangePreview = null;
        }
    }

    function clearHoverPreview() {
        hoverCell = null;
        clearHoverPreviewGfx();
    }

    /** 선택 타워 사거리 링 제거 */
    function clearSelectedRangePreview() {
        if (selectedRangePreview) {
            if (selectedRangePreview.parent) {
                selectedRangePreview.parent.removeChild(selectedRangePreview);
            }
            selectedRangePreview.destroy({ children: true });
            selectedRangePreview = null;
        }
    }

    /** 선택 타워 — 사거리 원 + 수치 라벨 */
    function showSelectedRangePreview(unit) {
        let rangeVal;
        let ringColor;
        let container;
        let ringGfx;
        let label;

        clearSelectedRangePreview();
        if (!unit || !unit.sprite) {
            return;
        }
        rangeVal = unit.range || getUnitEffectiveStats(unit).range;
        ringColor = getUnitBeamColor(unit);
        container = new PIXI.Container();
        container.x = unit.sprite.x;
        container.y = unit.sprite.y;

        ringGfx = new PIXI.Graphics();
        ringGfx.lineStyle(2.5, ringColor, 0.65);
        ringGfx.beginFill(ringColor, 0.08);
        ringGfx.drawCircle(0, 0, rangeVal);
        ringGfx.endFill();
        ringGfx.lineStyle(1.2, 0xffffff, 0.32);
        ringGfx.drawCircle(0, 0, rangeVal);

        label = new PIXI.Text('사거리 ' + rangeVal, {
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            fontWeight: 'bold',
            fill: 0xffffee,
            stroke: 0x334455,
            strokeThickness: 3
        });
        label.anchor.set(0.5, 0.5);
        label.y = -rangeVal - 12;

        container.addChild(ringGfx);
        container.addChild(label);
        selectedRangePreview = container;
        uiLayer.addChild(selectedRangePreview);
    }

    /** 사거리 표시 HTML (패널용) */
    function buildRangeBadgeHtml(rangeVal) {
        return '<p class="tower-range-badge">현재 사거리 <strong>' + rangeVal + '</strong></p>';
    }

    /** 포켓몬 배치 */
    function placeUnit(col, row, pokemon, silent) {
        if (!pokemon.texture || pokemon.texture.destroyed) {
            loadPokemonTexture(pokemon.id).then(function (tex) {
                pokemon.texture = tex;
                placeUnit(col, row, pokemon, silent);
            }).catch(function () {
                if (!silent) {
                    setMessage('스프라이트 로드 실패 #' + pokemon.id);
                }
            });
            return;
        }

        const sprite = new PIXI.Sprite(pokemon.texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(UNIT_SCALE);
        sprite.x = gridOrigin.x + col * CELL + CELL / 2;
        sprite.y = gridOrigin.y + row * CELL + CELL / 2;

        unitLayer.addChild(sprite);

        const baseId = (pokemon.line && pokemon.line.length) ? pokemon.line[0] : pokemon.id;
        const role = pokemon.role || getRoleForBaseId(baseId, pokemon.line || null);
        units.push({
            col: col,
            row: row,
            pokemonId: pokemon.id,
            evolutionLine: pokemon.line || null,
            evolutionStage: pokemon.evolutionStage !== undefined ? pokemon.evolutionStage : 0,
            utilityTier: getUtilityTier({ utilityTier: pokemon.utilityTier }),
            role: role,
            element: pokemon.element !== undefined ? pokemon.element : getElementForUnit(baseId, role),
            sprite: sprite,
            anim: null,
            attacking: false,
            cooldown: 0,
            cooldownMax: 50,
            range: UNIT_RANGE,
            damage: 38
        });

        applyUnitStats(units[units.length - 1]);
        if (PokemonConfig.isLegendaryId(pokemon.id)) {
            ensureUnitLegendaryAura(units[units.length - 1]);
            drawLegendaryUnitAura(units[units.length - 1], auraPulse);
        }
        markCellOccupied(col, row, true);
        updateDeployGridUi();
        updateHud();
        if (!silent) {
            setMessage('No.' + pokemon.id + ' 배치');
        }
    }

    /** 최초 게임 시작 */
    function beginGame() {
        activeWaves = [];
        state.gameStarted = true;
        state.roundTimerMs = ROUND_LIMIT_MS;
        updateRoundTimerDisplay();
        $hud.btnStart.prop('disabled', true).text('진행 중');
        updateDeployGridUi();
        updateGachaButton();
        updateSkipButton();
        startWave();
    }

    /** 웨이브 슬롯 생성 */
    function createWaveSlot(roundNum) {
        return {
            uid: waveUidCounter++,
            round: roundNum,
            enemyId: PokemonConfig.randomId(),
            spawned: 0,
            total: state.waveTotal,
            spawnTimer: 0,
            bossSpawned: false
        };
    }

    /** 10라운드마다 보스 1마리 추가 스폰 */
    function trySpawnBossForWave(wave) {
        if (!wave || wave.bossSpawned || !PokemonConfig.isBossRound(wave.round)) {
            return;
        }
        wave.bossSpawned = true;
        spawnEnemy(wave, { isBoss: true });
    }

    /** 겹치는 웨이브 중 가장 높은 라운드 */
    function getMaxActiveWaveRound() {
        let maxR = state.round;
        let i;
        for (i = 0; i < activeWaves.length; i++) {
            if (activeWaves[i].round > maxR) {
                maxR = activeWaves[i].round;
            }
        }
        return maxR;
    }

    /** 다음 선행 웨이브 라운드 번호 */
    function getNextStackRound() {
        return getMaxActiveWaveRound() + 1;
    }

    /** 해당 웨이브 소속 적이 남아 있는지 */
    function waveHasLivingEnemies(waveUid) {
        let i;
        for (i = 0; i < enemies.length; i++) {
            if (enemies[i].waveUid === waveUid) {
                return true;
            }
        }
        return false;
    }

    /** 웨이브 시작(대기 후) — 기존 적은 건드리지 않음 */
    function startWave() {
        let i;
        const wave = createWaveSlot(state.round);

        clearUnitsCombatState();
        for (i = projectiles.length - 1; i >= 0; i--) {
            fxLayer.removeChild(projectiles[i].gfx);
            projectiles[i].gfx.destroy();
            projectiles.splice(i, 1);
        }

        activeWaves.push(wave);
        trySpawnBossForWave(wave);
        state.nextWaveDelay = 0;
        dragUnit = null;
        clearHoverPreview();
        syncAllGridCells();
        updateGachaButton();
        updateSkipButton();
        updateDeployGridUi();
        updateHud();
        if (PokemonConfig.isBossRound(wave.round)) {
            setMessage('ROUND ' + wave.round + ' — BOSS 등장! + No.' + wave.enemyId + ' x ' + wave.total + '마리');
        } else {
            setMessage('ROUND ' + wave.round + ' — No.' + wave.enemyId + ' x ' + wave.total + '마리!');
        }
    }

    /** SKIP — 현재 웨이브 유지, 다음 웨이브만 겹쳐 스폰 */
    function stackNextWave() {
        const wave = createWaveSlot(getNextStackRound());

        activeWaves.push(wave);
        trySpawnBossForWave(wave);
        state.nextWaveDelay = 0;
        updateSkipButton();
        grantTickets(TICKET_SKIP_REWARD, PokemonConfig.isBossRound(wave.round)
            ? 'SKIP — ROUND ' + wave.round + ' BOSS 선행 등장'
            : 'SKIP — ROUND ' + wave.round + ' 선행 등장');
    }

    /** 적 스폰 — 웨이브 슬롯별 (옵션: isBoss) */
    function spawnEnemy(wave, spawnOpts) {
        const opts = spawnOpts || {};
        const isBoss = !!opts.isBoss;
        const id = isBoss ? PokemonConfig.getBossIdForRound(wave.round) : wave.enemyId;
        const container = new PIXI.Container();
        const hpBg = new PIXI.Graphics();
        const hpFill = new PIXI.Graphics();
        const placeholder = new PIXI.Graphics();
        let maxHp;
        let enemySpeed;
        let enemyScale;
        let bossRing = null;
        let bossLabel = null;
        const bossVis = BOSS_VIS;

        if (isBoss) {
            placeholder.beginFill(0x9933cc);
            placeholder.drawRoundedRect(-22, -22, 44, 44, 8);
            placeholder.endFill();
            bossRing = new PIXI.Graphics();
            bossRing.lineStyle(3, 0xffdd44, 0.95);
            bossRing.drawCircle(0, 0, bossVis.ringR);
            bossRing.lineStyle(1.5, 0xffffff, 0.45);
            bossRing.drawCircle(0, 0, bossVis.ringR * 0.72);
            container.addChild(bossRing);
            bossLabel = new PIXI.Text('BOSS', {
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fontWeight: 'bold',
                fill: 0xffee66,
                stroke: 0x442200,
                strokeThickness: 3
            });
            bossLabel.anchor.set(0.5, 1);
            bossLabel.y = bossVis.labelY;
            container.addChild(bossLabel);
        } else {
            placeholder.beginFill(0xcc4444);
            placeholder.drawRoundedRect(-12, -12, 24, 24, 4);
            placeholder.endFill();
        }
        container.addChild(placeholder);

        hpBg.beginFill(0x220000, 0.85);
        hpBg.drawRect(isBoss ? -(bossVis.barW / 2) : -16, isBoss ? bossVis.barY : -34, isBoss ? bossVis.barW : 32, isBoss ? bossVis.barH : 4);
        hpBg.endFill();
        hpFill.beginFill(isBoss ? 0xffcc44 : 0xff5555);
        hpFill.drawRect(isBoss ? -(bossVis.barW / 2) : -16, isBoss ? bossVis.barY : -34, isBoss ? bossVis.barW : 32, isBoss ? bossVis.barH : 4);
        hpFill.endFill();
        container.addChild(hpBg);
        container.addChild(hpFill);

        const pos = getPositionOnPath(0);
        container.x = pos.x;
        container.y = pos.y;

        enemyLayer.addChild(container);

        maxHp = PokemonConfig.getEnemyMaxHp(wave.round, isBoss);
        enemySpeed = PokemonConfig.getEnemySpeed(wave.round, isBoss);
        enemyScale = isBoss ? ENEMY_SCALE * BOSS_VIS.scaleMul : ENEMY_SCALE;

        const enemy = {
            progress: 0,
            speed: enemySpeed,
            baseSpeed: enemySpeed,
            slowUntil: 0,
            slowFactor: 1,
            slowAuraGfx: null,
            hp: maxHp,
            maxHp: maxHp,
            pokemonId: id,
            element: getElementFromPokemonId(id),
            waveUid: wave.uid,
            waveRound: wave.round,
            isBoss: isBoss,
            container: container,
            hpFill: hpFill,
            hpBg: hpBg,
            body: placeholder,
            sprite: null,
            bossRing: bossRing,
            bossLabel: bossLabel
        };
        enemies.push(enemy);
        checkFieldOverflow();

        loadPokemonTexture(id).then(function (tex) {
            let spr;
            if (!enemy.container || enemy.sprite) {
                return;
            }
            enemy.container.removeChild(placeholder);
            placeholder.destroy();
            enemy.body = null;
            spr = new PIXI.Sprite(tex);
            spr.anchor.set(0.5);
            spr.scale.set(enemyScale);
            enemy.container.addChildAt(spr, 0);
            enemy.sprite = spr;
            updateEnemyFacing(enemy, getPositionOnPath(enemy.progress));
        }).catch(function () {
            /* placeholder 유지 */
        });
    }

    function updateEnemyHpBar(enemy) {
        if (!enemy || !enemy.hpFill || enemy.hpFill.destroyed) {
            return;
        }
        const ratio = Math.max(0, enemy.hp / enemy.maxHp);
        const isBoss = !!enemy.isBoss;
        const barW = isBoss ? BOSS_VIS.barW : 32;
        const barH = isBoss ? BOSS_VIS.barH : 4;
        const barX = isBoss ? -(BOSS_VIS.barW / 2) : -16;
        const barY = isBoss ? BOSS_VIS.barY : -30;
        const fillColor = isBoss ? 0xffcc44 : 0xff5555;

        enemy.hpFill.clear();
        enemy.hpFill.beginFill(fillColor);
        enemy.hpFill.drawRect(barX, barY, barW * ratio, barH);
        enemy.hpFill.endFill();
        if (enemy.hpBg && !enemy.hpBg.destroyed) {
            enemy.hpBg.clear();
            enemy.hpBg.beginFill(0x220000, 0.85);
            enemy.hpBg.drawRect(barX, barY, barW, barH);
            enemy.hpBg.endFill();
        }
    }

    /** 경로 위치·세그먼트 인덱스 */
    function getPositionOnPath(progress) {
        const target = progress * pathLength;
        let acc = 0;
        let i;
        let segLen;
        let t;
        let a;
        let b;

        for (i = 0; i < pathPoints.length; i++) {
            a = pathPoints[i];
            b = pathPoints[(i + 1) % pathPoints.length];
            segLen = dist(a, b);
            if (acc + segLen >= target) {
                t = segLen > 0 ? (target - acc) / segLen : 0;
                return {
                    x: a.x + (b.x - a.x) * t,
                    y: a.y + (b.y - a.y) * t,
                    seg: i
                };
            }
            acc += segLen;
        }

        return { x: pathPoints[0].x, y: pathPoints[0].y, seg: 0 };
    }

    /** 이동 방향에 맞춰 좌우 반전 (회전 없음 — 스폰 직후 뒤집힘 방지) */
    function updateEnemyFacing(enemy, pos) {
        const seg = pos.seg;
        const a = pathPoints[seg];
        const b = pathPoints[(seg + 1) % pathPoints.length];
        const dx = b.x - a.x;
        const baseScale = enemy.isBoss ? ENEMY_SCALE * BOSS_VIS.scaleMul : ENEMY_SCALE;

        if (enemy.sprite && !enemy.sprite.destroyed) {
            enemy.sprite.rotation = 0;
            enemy.sprite.scale.y = baseScale;
            if (dx < -0.01) {
                enemy.sprite.scale.x = -baseScale;
            } else {
                enemy.sprite.scale.x = baseScale;
            }
        } else if (enemy.body) {
            enemy.container.rotation = 0;
        }
    }

    function onTick() {
        const delta = app.ticker.deltaMS;

        if (state.gameOver) {
            return;
        }

        updateNextWaveDelay(delta);
        updateRoundTimer(delta);
        updateWaveSpawn();
        updateEnemies(delta);
        updateUnits();
        updateProjectiles(delta);
        updateEffects(delta);
        updateCombatAuras(delta);
        updateHud();
        checkWaveClear();
    }

    /** 웨이브 간 대기 후 자동 다음 웨이브 */
    function updateNextWaveDelay(delta) {
        if (state.nextWaveDelay <= 0 || activeWaves.length > 0 || state.gameOver || !state.gameStarted) {
            return;
        }
        state.nextWaveDelay -= delta;
        if (state.nextWaveDelay <= 0) {
            updateDeployGridUi();
            updateGachaButton();
            updateSkipButton();
            startWave();
        }
    }

    function updateWaveSpawn() {
        let i;
        let w;

        for (i = 0; i < activeWaves.length; i++) {
            w = activeWaves[i];
            if (w.spawned >= w.total) {
                continue;
            }
            w.spawnTimer++;
            if (w.spawnTimer >= state.spawnInterval) {
                w.spawnTimer = 0;
                spawnEnemy(w);
                w.spawned++;
            }
        }
    }

    function updateEnemies(delta) {
        let i;
        let e;
        let pos;
        let now;
        let spd;

        now = Date.now();
        for (i = enemies.length - 1; i >= 0; i--) {
            e = enemies[i];
            spd = e.baseSpeed || e.speed;
            if (e.slowUntil && e.slowUntil > now) {
                spd = spd * (e.slowFactor || 1);
            }
            e.progress += spd * delta;
            pos = getPositionOnPath(e.progress);
            e.container.x = pos.x;
            e.container.y = pos.y;
            updateEnemyFacing(e, pos);

            if (e.progress >= 1) {
                e.progress = e.progress - 1;
                if (e.progress < 0) {
                    e.progress = 0;
                }
            }
        }
        checkFieldOverflow();
    }

    /** 필드 적 수 한도 — 초과 시 게임오버 */
    function checkFieldOverflow() {
        if (state.gameOver) {
            return;
        }
        if (enemies.length >= state.fieldLimit) {
            endGame(false);
        }
    }

    /** 적 처치 — 보스 보너스 뽑기권만 지급 */
    function onEnemyKilled(enemy) {
        let bossRound = 0;

        state.totalKills++;
        if (enemy && enemy.isBoss) {
            bossRound = enemy.waveRound || state.round;
            grantTickets(TICKET_BOSS_REWARD, '보스 처치! (ROUND ' + bossRound + ')');
            return;
        }
        updateHud();
    }

    function updateUnits() {
        let u;
        let i;
        let target;

        for (i = 0; i < units.length; i++) {
            u = units[i];

            if (u.attacking) {
                continue;
            }
            if (u.cooldown > 0) {
                u.cooldown--;
                continue;
            }

            target = findTarget(u);
            if (!target) {
                continue;
            }
            if (!isUnitSpriteLive(u)) {
                continue;
            }

            u.attacking = true;
            u.cooldown = u.cooldownMax;
            playAttack(u, target);
        }
    }

    function findTarget(unit) {
        let best = null;
        let bestProg = -1;
        let i;
        let e;
        let d;
        const ux = gridOrigin.x + unit.col * CELL + CELL / 2;
        const uy = gridOrigin.y + unit.row * CELL + CELL / 2;

        for (i = 0; i < enemies.length; i++) {
            e = enemies[i];
            d = dist({ x: ux, y: uy }, e.container);
            if (d <= unit.range && e.progress > bestProg) {
                bestProg = e.progress;
                best = e;
            }
        }
        return best;
    }

    function aimAngle(fromX, fromY, toX, toY) {
        return Math.atan2(toY - fromY, toX - fromX) + Math.PI / 2;
    }

    /** GIF 텍스처 배열 추출 시도 */
    function extractGifTextures(asset) {
        const list = [];
        let key;
        if (!asset) {
            return list;
        }
        if (asset instanceof PIXI.Texture) {
            list.push(asset);
            return list;
        }
        if (asset.textures) {
            for (key in asset.textures) {
                if (asset.textures.hasOwnProperty(key)) {
                    list.push(asset.textures[key]);
                }
            }
        }
        return list;
    }

    /** 공격 — 빔은 즉시, GIF는 연출만(비동기 attacking 잠금 없음) */
    function playAttack(unit, target) {
        const id = unit.pokemonId;
        let ux;
        let uy;
        let angle;
        let lockTimer;

        if (!isUnitSpriteLive(unit) || !target || !target.container) {
            if (unit) {
                unit.attacking = false;
            }
            return;
        }
        ux = unit.sprite.x;
        uy = unit.sprite.y;
        angle = aimAngle(ux, uy, target.container.x, target.container.y);

        playAttackFlash(unit, target, angle);

        if (!PokemonConfig.likelyHasGif(id)) {
            return;
        }

        lockTimer = setTimeout(function () {
            if (unit.attacking) {
                finishAttackAnim(unit);
                unit.attacking = false;
            }
        }, ATTACK_LOCK_MS);

        PIXI.Assets.load(PokemonConfig.gifUrl(id)).then(function (asset) {
            const frames = extractGifTextures(asset);
            if (frames.length > 1 && isUnitSpriteLive(unit) && !unit.anim) {
                clearTimeout(lockTimer);
                playGifAttackOverlay(unit, frames, angle, ux, uy);
            }
        }).catch(function () {
            clearTimeout(lockTimer);
        });
    }

    /** GIF 연출만 — attacking 플래그와 분리 */
    function playGifAttackOverlay(unit, frames, angle, ux, uy) {
        let anim;
        let prevVisible = true;

        if (!isUnitSpriteLive(unit)) {
            return;
        }
        prevVisible = unit.sprite.visible;

        anim = new PIXI.AnimatedSprite(frames);
        anim.anchor.set(0.5);
        anim.scale.set(UNIT_SCALE);
        anim.x = ux;
        anim.y = uy;
        anim.rotation = angle;
        anim.animationSpeed = 0.45;
        anim.loop = false;

        unitLayer.addChild(anim);

        anim.onComplete = function () {
            unitLayer.removeChild(anim);
            anim.destroy();
            if (isUnitSpriteLive(unit)) {
                unit.sprite.visible = prevVisible;
            }
        };

        anim.play();
    }

    function playAttackFlash(unit, target, angle) {
        let ux;
        let uy;

        if (!isUnitSpriteLive(unit) || !target || !target.container) {
            if (unit) {
                unit.attacking = false;
            }
            return;
        }
        ux = unit.sprite.x;
        uy = unit.sprite.y;

        unit.sprite.rotation = angle;
        unit.sprite.scale.set(UNIT_SCALE * 1.15);
        executeAttackStyle(unit, target, getFinalDamage(unit), ux, uy);

        setTimeout(function () {
            if (isUnitSpriteLive(unit)) {
                const stats = getStageStats(getUnitStage(unit));
                unit.sprite.scale.set(stats.scale);
                unit.sprite.rotation = 0;
            }
            if (unit) {
                unit.attacking = false;
            }
        }, 280);
    }

    /** 역할·스타일별 공격 실행 */
    function executeAttackStyle(unit, target, damage, ux, uy) {
        const style = getUnitAttackStyle(unit);
        const role = unit.role || ROLE.SINGLE;

        if (style === ATTACK_STYLE.SPLASH) {
            fireInstantSplash(unit, target, damage, ux, uy);
            return;
        }
        if (style === ATTACK_STYLE.GALAGA) {
            fireGalagaShot(ux, uy, target, damage, unit, role, false);
            return;
        }
        if (style === ATTACK_STYLE.FROST) {
            fireGalagaShot(ux, uy, target, damage, unit, ROLE.SLOW, true);
            return;
        }
        if (style === ATTACK_STYLE.BURST) {
            fireBurstShot(ux, uy, target, damage, unit);
            return;
        }
        if (style === ATTACK_STYLE.SPARK) {
            fireSparkShot(ux, uy, target, damage, unit);
            return;
        }
        fireLaserBeam(ux, uy, target, damage, unit);
    }

    /** 단일 — 굵은 레이저 빔 */
    function fireLaserBeam(x, y, target, damage, attackerUnit) {
        const role = attackerUnit.role || ROLE.SINGLE;
        const color = getUnitBeamColor(attackerUnit);
        const beam = new PIXI.Graphics();
        const tx = target.container.x;
        const ty = target.container.y;

        drawLaserBeam(beam, x, y, tx, ty, color);
        fxLayer.addChild(beam);
        projectiles.push({
            kind: 'beam',
            gfx: beam,
            life: 130,
            target: target,
            damage: damage,
            attackerRole: role,
            attackerUnit: attackerUnit,
            hit: false
        });
        resolveAttackHit({
            target: target,
            damage: damage,
            attackerRole: role,
            attackerUnit: attackerUnit
        }, tx, ty);
    }

    /** 갤러그/빙결 — 작은 탄환 비행 */
    function fireGalagaShot(x, y, target, damage, attackerUnit, role, isFrost) {
        const color = isFrost ? getRoleBeamColor(ROLE.SLOW) : getUnitBeamColor(attackerUnit);
        const gfx = new PIXI.Graphics();
        const tx = target.container.x;
        const ty = target.container.y;
        const size = isFrost ? 6 : 5;

        gfx.beginFill(color, 0.95);
        gfx.drawCircle(0, 0, size);
        gfx.endFill();
        if (!isFrost) {
            gfx.lineStyle(1, 0xffffff, 0.8);
            gfx.drawCircle(0, 0, size - 1);
        }
        gfx.x = x;
        gfx.y = y;
        fxLayer.addChild(gfx);

        projectiles.push({
            kind: 'bullet',
            gfx: gfx,
            life: 220,
            x0: x,
            y0: y,
            tx: tx,
            ty: ty,
            t: 0,
            speed: isFrost ? 0.1 : 0.14,
            target: target,
            damage: damage,
            attackerRole: role,
            attackerUnit: attackerUnit,
            isFrost: !!isFrost,
            hit: false
        });
    }

    /** 단일 — 연속 3발 버스트 */
    function fireBurstShot(x, y, target, damage, attackerUnit) {
        let i;
        const color = getUnitBeamColor(attackerUnit);
        for (i = 0; i < 3; i++) {
            (function (idx) {
                setTimeout(function () {
                    let g;
                    let ox;
                    let oy;
                    if (!target || !target.container || target.hp <= 0) {
                        return;
                    }
                    ox = (idx - 1) * 6;
                    oy = -idx * 3;
                    g = new PIXI.Graphics();
                    g.beginFill(color, 0.9);
                    g.drawCircle(0, 0, 4);
                    g.endFill();
                    g.x = x + ox;
                    g.y = y + oy;
                    fxLayer.addChild(g);
                    projectiles.push({
                        kind: 'bullet',
                        gfx: g,
                        life: 180,
                        x0: x + ox,
                        y0: y + oy,
                        tx: target.container.x,
                        ty: target.container.y,
                        t: 0,
                        speed: 0.18,
                        target: target,
                        damage: idx === 2 ? damage : 0,
                        attackerRole: ROLE.SINGLE,
                        attackerUnit: attackerUnit,
                        hit: false
                    });
                }, idx * 45);
            })(i);
        }
    }

    /** 버프 — 스파크 탄 */
    function fireSparkShot(x, y, target, damage, attackerUnit) {
        const color = getRoleBeamColor(ROLE.BUFF);
        const gfx = new PIXI.Graphics();
        let i;

        for (i = 0; i < 4; i++) {
            gfx.beginFill(color, 0.85);
            gfx.drawCircle(Math.cos(i * 1.5) * 3, Math.sin(i * 1.5) * 3, 3);
            gfx.endFill();
        }
        gfx.x = x;
        gfx.y = y;
        fxLayer.addChild(gfx);
        spawnBuffMuzzleEffect(x, y);
        projectiles.push({
            kind: 'bullet',
            gfx: gfx,
            life: 200,
            x0: x,
            y0: y,
            tx: target.container.x,
            ty: target.container.y,
            t: 0,
            speed: 0.11,
            target: target,
            damage: damage,
            attackerRole: ROLE.BUFF,
            attackerUnit: attackerUnit,
            hit: false
        });
    }

    /** 범위 — 몹 위치 즉시 스플래시 (빔 없음) */
    function fireInstantSplash(unit, target, damage, ux, uy) {
        let hitX;
        let hitY;
        let dmg;

        if (!target || !target.container) {
            return;
        }
        hitX = target.container.x;
        hitY = target.container.y;
        dmg = applyPassiveDamageMods(unit, target, damage);
        spawnAoeSplashRing(hitX, hitY);
        spawnRoleImpactEffect(hitX, hitY, ROLE.AOE);
        spawnHitEffect(ux, uy, getRoleBeamColor(ROLE.AOE));
        applyDamage(target, dmg, ROLE.AOE);
        applyAoeSplashAt(hitX, hitY, dmg, target, unit);
    }

    /** 스플래시 범위 데미지 */
    function applyAoeSplashAt(hitX, hitY, damage, primaryTarget, attackerUnit) {
        let j;
        let e;
        let dx;
        let dy;
        let dist2;
        let splash;
        let splashMul;

        splashMul = AOE_RATIO;
        if (attackerUnit && attackerUnit.role === ROLE.AOE) {
            splashMul = AOE_RATIO * ROLE_PASSIVE.aoe.splashMul;
        }
        splash = Math.max(1, Math.round(damage * splashMul));

        for (j = 0; j < enemies.length; j++) {
            e = enemies[j];
            if (!e || e === primaryTarget || e.hp <= 0 || !e.container || e.container.destroyed) {
                continue;
            }
            dx = e.container.x - hitX;
            dy = e.container.y - hitY;
            dist2 = dx * dx + dy * dy;
            if (dist2 <= AOE_RADIUS * AOE_RADIUS) {
                applyDamage(e, splash, ROLE.AOE);
            }
        }
    }

    /** 피격 + 역할 효과 */
    function resolveAttackHit(p, hitX, hitY) {
        let now;
        let dmg;
        let slowMs;
        let slowFac;
        let typeMul;

        dmg = p.damage;
        if (p.attackerUnit && p.target) {
            dmg = applyPassiveDamageMods(p.attackerUnit, p.target, dmg);
        }
        applyDamage(p.target, dmg, p.attackerRole);
        if (dmg > 0) {
            spawnRoleImpactEffect(hitX, hitY, p.attackerRole);
            if (p.attackerUnit && p.attackerUnit.role === ROLE.SINGLE && p.attackerUnit.element && p.target) {
                typeMul = getTypeDamageMul(p.attackerUnit.element, getEnemyElement(p.target));
                if (typeMul >= TYPE_SUPER_MUL - 0.01) {
                    spawnTypeEffectiveText(hitX, hitY);
                }
            }
        }

        if (p.attackerRole === ROLE.AOE) {
            applyAoeSplashAt(hitX, hitY, dmg, p.target, p.attackerUnit);
        } else if (p.attackerRole === ROLE.SLOW) {
            now = Date.now();
            slowMs = SLOW_MS;
            slowFac = SLOW_FACTOR;
            if (p.attackerUnit && p.attackerUnit.role === ROLE.SLOW) {
                slowMs = getSlowDurationMs(p.attackerUnit);
                slowFac = ROLE_PASSIVE.slow.slowFactor;
            }
            p.target.slowUntil = Math.max(p.target.slowUntil || 0, now + slowMs);
            p.target.slowFactor = slowFac;
            applySlowDebuffAura(p.target);
        }
    }

    function drawLaserBeam(gfx, x, y, tx, ty, color) {
        gfx.lineStyle(8, color, 0.55);
        gfx.moveTo(x, y);
        gfx.lineTo(tx, ty);
        gfx.lineStyle(5, color, 1);
        gfx.moveTo(x, y);
        gfx.lineTo(tx, ty);
        gfx.lineStyle(2, 0xffffff, 0.95);
        gfx.moveTo(x, y);
        gfx.lineTo(tx, ty);
    }

    function finishAttackAnim(unit) {
        if (unit.anim) {
            unitLayer.removeChild(unit.anim);
            unit.anim.destroy();
            unit.anim = null;
        }
        if (isUnitSpriteLive(unit)) {
            unit.sprite.visible = true;
            unit.sprite.scale.set(UNIT_SCALE);
            unit.sprite.rotation = 0;
        }
        unit.attacking = false;
    }

    function updateProjectiles(delta) {
        let i;
        let p;
        let hitX;
        let hitY;
        let nx;
        let ny;

        for (i = projectiles.length - 1; i >= 0; i--) {
            p = projectiles[i];
            p.life -= delta;

            if (p.kind === 'bullet' && !p.hit) {
                p.t += p.speed * (delta / 16);
                if (p.t > 1) {
                    p.t = 1;
                }
                nx = p.x0 + (p.tx - p.x0) * p.t;
                ny = p.y0 + (p.ty - p.y0) * p.t;
                p.gfx.x = nx;
                p.gfx.y = ny;
                if (p.t >= 1 && p.target && p.target.hp > 0 && p.target.container && !p.target.container.destroyed) {
                    hitX = p.target.container.x;
                    hitY = p.target.container.y;
                    p.hit = true;
                    if (p.damage > 0) {
                        resolveAttackHit(p, hitX, hitY);
                    } else {
                        spawnHitEffect(hitX, hitY, p.attackerUnit ? getUnitBeamColor(p.attackerUnit) : getRoleBeamColor(p.attackerRole));
                    }
                }
            } else if (!p.hit && p.life < 90 && p.target && p.target.hp > 0 && p.target.container && p.target.hpFill && !p.target.hpFill.destroyed) {
                hitX = p.target.container.x;
                hitY = p.target.container.y;
                p.hit = true;
                if (p.damage > 0) {
                    resolveAttackHit(p, hitX, hitY);
                }
            }

            if (p.life <= 0) {
                fxLayer.removeChild(p.gfx);
                p.gfx.destroy();
                projectiles.splice(i, 1);
            }
        }
    }

    function applyDamage(target, dmg, hitRole) {
        let idx;
        if (!target || target.hp <= 0 || !target.container || !target.hpFill || target.hpFill.destroyed || target.container.destroyed) {
            return;
        }
        target.hp -= dmg;
        updateEnemyHpBar(target);
        if (target.hp <= 0) {
            idx = enemies.indexOf(target);
            if (idx >= 0) {
                spawnRoleImpactEffect(target.container.x, target.container.y, hitRole || ROLE.SINGLE);
                removeEnemy(idx, true);
            }
        }
    }

    /** 적 제거 — countKill true면 처치 보상 집계 */
    function removeEnemy(index, countKill) {
        const e = enemies[index];
        if (!e) {
            return;
        }
        e.hp = 0;
        if (e.container && e.container.parent) {
            enemyLayer.removeChild(e.container);
            e.container.destroy({ children: true });
        }
        e.hpFill = null;
        e.body = null;
        e.container = null;
        enemies.splice(index, 1);
        if (countKill) {
            onEnemyKilled(e);
        }
    }

    /** 주변 버프 타워 수에 따른 데미지 배율 */
    function getBuffMultiplier(unit) {
        let stacks = 0;
        let i;
        let u;
        let ux;
        let uy;
        let bx;
        let by;
        let dx;
        let dy;

        if (!unit) {
            return 1;
        }
        ux = gridOrigin.x + unit.col * CELL + CELL / 2;
        uy = gridOrigin.y + unit.row * CELL + CELL / 2;

        for (i = 0; i < units.length; i++) {
            u = units[i];
            if (!u || u === unit) {
                continue;
            }
            if (u.role !== ROLE.BUFF) {
                continue;
            }
            bx = gridOrigin.x + u.col * CELL + CELL / 2;
            by = gridOrigin.y + u.row * CELL + CELL / 2;
            dx = bx - ux;
            dy = by - uy;
            if ((dx * dx + dy * dy) <= getBuffReachRadius(u) * getBuffReachRadius(u)) {
                stacks += getBuffStackWeightForTier(getUtilityTier(u));
                if (stacks >= BUFF_MAX_STACK) {
                    stacks = BUFF_MAX_STACK;
                    break;
                }
            }
        }
        return 1 + stacks * BUFF_PER_STACK;
    }

    /** 버프 타워 패시브 — 사거리 보너스 */
    function getBuffReachRadius(buffUnit) {
        let r = BUFF_RADIUS;
        if (buffUnit && buffUnit.role === ROLE.BUFF) {
            r += ROLE_PASSIVE.buff.buffRadiusBonus;
        }
        return r;
    }

    /** 버프 스택 수 */
    function getBuffStackCount(unit) {
        const mult = getBuffMultiplier(unit);
        if (mult <= 1) {
            return 0;
        }
        return Math.min(BUFF_MAX_STACK, Math.round((mult - 1) / BUFF_PER_STACK));
    }

    /** 최종 데미지(버프 반영) */
    function getFinalDamage(unit) {
        const base = unit && unit.damage ? unit.damage : 1;
        const mult = getBuffMultiplier(unit);
        return Math.max(1, Math.round(base * mult));
    }

    function spawnHitEffect(x, y, color) {
        const g = new PIXI.Graphics();
        g.beginFill(color, 0.85);
        g.drawCircle(0, 0, 10);
        g.endFill();
        g.x = x;
        g.y = y;
        g.scale.set(0.5);
        fxLayer.addChild(g);
        effects.push({ gfx: g, life: 200, maxLife: 200, kind: 'dot' });
    }

    /** 버프 타워 발사 순간 스파크 */
    function spawnBuffMuzzleEffect(x, y) {
        const g = new PIXI.Graphics();
        const color = getRoleBeamColor(ROLE.BUFF);
        g.beginFill(color, 0.45);
        g.drawCircle(0, 0, 4);
        g.endFill();
        g.x = x;
        g.y = y;
        fxLayer.addChild(g);
        effects.push({ gfx: g, life: 160, maxLife: 160, kind: 'spark' });
    }

    /** 범위형 충격 링 */
    function spawnAoeSplashRing(x, y) {
        const g = new PIXI.Graphics();
        g.x = x;
        g.y = y;
        fxLayer.addChild(g);
        effects.push({
            gfx: g,
            life: 360,
            maxLife: 360,
            kind: 'aoe_ring',
            radiusMax: AOE_RADIUS
        });
    }

    /** 역할별 타격 이펙트 */
    function spawnRoleImpactEffect(x, y, role) {
        const g = new PIXI.Graphics();
        const color = getRoleBeamColor(role);
        let i;
        let ang;

        g.x = x;
        g.y = y;
        fxLayer.addChild(g);

        if (role === ROLE.SINGLE) {
            g.beginFill(color, 0.95);
            g.drawCircle(0, 0, 14);
            g.endFill();
            for (i = 0; i < 8; i++) {
                ang = (Math.PI * 2 * i) / 8;
                g.lineStyle(3, 0xffffff, 0.9);
                g.moveTo(0, 0);
                g.lineTo(Math.cos(ang) * 28, Math.sin(ang) * 28);
            }
            effects.push({ gfx: g, life: 280, maxLife: 280, kind: 'burst' });
            return;
        }
        if (role === ROLE.AOE) {
            g.lineStyle(4, color, 0.95);
            g.drawCircle(0, 0, 18);
            g.beginFill(color, 0.35);
            g.drawCircle(0, 0, 12);
            g.endFill();
            effects.push({ gfx: g, life: 320, maxLife: 320, kind: 'ring_pop' });
            return;
        }
        if (role === ROLE.SLOW) {
            g.lineStyle(3, AURA_SLOW_LINE, 0.95);
            g.drawCircle(0, 0, 16);
            g.beginFill(AURA_SLOW_FILL, 0.45);
            g.drawCircle(0, 0, 10);
            g.endFill();
            for (i = 0; i < 6; i++) {
                ang = (Math.PI * 2 * i) / 6;
                g.lineStyle(2, 0xffffff, 0.8);
                g.moveTo(Math.cos(ang) * 8, Math.sin(ang) * 8);
                g.lineTo(Math.cos(ang) * 22, Math.sin(ang) * 22);
            }
            effects.push({ gfx: g, life: 300, maxLife: 300, kind: 'frost' });
            return;
        }
        if (role === ROLE.BUFF) {
            g.beginFill(color, 0.5);
            g.drawCircle(0, 0, 5);
            g.endFill();
            effects.push({ gfx: g, life: 180, maxLife: 180, kind: 'spark' });
            return;
        }
        spawnHitEffect(x, y, color);
    }

    /** 슬로우 디버프 오라(적 발밑) */
    function applySlowDebuffAura(enemy) {
        if (!enemy || !enemy.container || enemy.container.destroyed) {
            return;
        }
        if (!enemy.slowAuraGfx || enemy.slowAuraGfx.destroyed) {
            enemy.slowAuraGfx = new PIXI.Graphics();
            enemy.container.addChildAt(enemy.slowAuraGfx, 0);
        }
        enemy.slowAuraGfx.visible = true;
    }

    /** 버프 타워 오라 — 분홍 링 (테두리 선명) */
    function drawBuffUnitAura(unit, pulse) {
        let r;
        let lineAlpha;
        if (!unit.sprite) {
            return;
        }
        if (!unit.auraGfx || unit.auraGfx.destroyed) {
            unit.auraGfx = new PIXI.Graphics();
            if (auraLayer) {
                auraLayer.addChild(unit.auraGfx);
            } else {
                unitLayer.addChildAt(unit.auraGfx, 0);
            }
        }
        unit.auraGfx.visible = true;
        unit.auraGfx.x = unit.sprite.x;
        unit.auraGfx.y = unit.sprite.y;
        r = BUFF_AURA_RADIUS + Math.sin(pulse * 0.7) * 1;
        lineAlpha = AURA_BUFF_LINE_ALPHA + 0.12 * Math.sin(pulse * 0.9);
        if (lineAlpha > 0.95) {
            lineAlpha = 0.95;
        }
        unit.auraGfx.clear();
        unit.auraGfx.beginFill(AURA_BUFF_FILL, 0.05);
        unit.auraGfx.drawCircle(0, 0, r);
        unit.auraGfx.endFill();
        unit.auraGfx.lineStyle(AURA_BUFF_LINE_WIDTH, AURA_BUFF_LINE, lineAlpha);
        unit.auraGfx.drawCircle(0, 0, r);
        unit.auraGfx.lineStyle(1, 0xffffff, 0.22 + 0.08 * Math.sin(pulse * 1.1));
        unit.auraGfx.drawCircle(0, 0, r - 1.5);
    }

    /** 버프 강화 ▲ 화살표 (빨강) */
    function drawBuffUpArrow(gfx, ox, oy, scale, color, fillAlpha) {
        const s = scale || 1;
        if (!gfx || gfx.destroyed) {
            return;
        }
        gfx.beginFill(color, fillAlpha);
        gfx.moveTo(ox, oy - 8 * s);
        gfx.lineTo(ox + 5.5 * s, oy + 2 * s);
        gfx.lineTo(ox - 5.5 * s, oy + 2 * s);
        gfx.closePath();
        gfx.endFill();
        gfx.lineStyle(1.5, 0xffffff, fillAlpha * 0.55);
        gfx.moveTo(ox, oy - 6 * s);
        gfx.lineTo(ox + 4 * s, oy + 0.5 * s);
        gfx.lineTo(ox - 4 * s, oy + 0.5 * s);
        gfx.closePath();
    }

    /** 버프 받은 타워 — 빨간 ▲ 2개 위아래 맥동 */
    function drawBuffedTowerArrows(unit, stacks, pulse) {
        let bob0;
        let bob1;
        let arrowScale;
        let g;
        const arrowColor = 0xff4444;

        if (!unit.sprite) {
            return;
        }
        g = unit.buffGlowGfx;
        if (!g || g.destroyed) {
            unit.buffGlowGfx = new PIXI.Graphics();
            if (auraLayer) {
                auraLayer.addChild(unit.buffGlowGfx);
            } else {
                unitLayer.addChildAt(unit.buffGlowGfx, 0);
            }
            g = unit.buffGlowGfx;
        }
        g.visible = true;
        g.x = unit.sprite.x;
        g.y = unit.sprite.y;
        g.clear();

        arrowScale = 0.95 + stacks * 0.12;
        bob0 = Math.sin(pulse * 3.2) * 3.5;
        bob1 = Math.sin(pulse * 3.2 + 1.6) * 3.5;
        drawBuffUpArrow(g, -7, -16 + bob0, arrowScale, arrowColor, 0.92);
        drawBuffUpArrow(g, 7, -14 + bob1, arrowScale, arrowColor, 0.88);
    }

    /** 버프 적용 순간 — ▲ 짧게 튀어 오름 */
    function spawnBuffBoostEffect(unit) {
        const g = new PIXI.Graphics();
        if (!unit.sprite) {
            return;
        }
        g.x = unit.sprite.x;
        g.y = unit.sprite.y - 10;
        drawBuffUpArrow(g, -5, 0, 1, 0xff5555, 0.95);
        drawBuffUpArrow(g, 5, 2, 0.9, 0xff5555, 0.9);
        fxLayer.addChild(g);
        effects.push({ gfx: g, life: 280, maxLife: 280, kind: 'buff_arrow', vy: -0.025, flicker: 0 });
    }

    /** 슬로우 디버프 — 발밑 서리 결정 (원형 오라 대신) */
    function drawEnemySlowAura(enemy, pulse) {
        let i;
        let ang;
        let r;
        let ix;
        let iy;
        if (!enemy.container || enemy.container.destroyed) {
            return;
        }
        applySlowDebuffAura(enemy);
        enemy.slowAuraGfx.clear();
        r = 18 + Math.sin(pulse * 2.2) * 3;
        for (i = 0; i < 6; i++) {
            ang = (Math.PI * 2 * i) / 6 + pulse * 0.4;
            ix = Math.cos(ang) * r * 0.55;
            iy = 10 + Math.sin(ang) * r * 0.35;
            enemy.slowAuraGfx.beginFill(0xaaeeff, 0.55 + 0.15 * Math.sin(pulse + i));
            enemy.slowAuraGfx.moveTo(ix, iy - 6);
            enemy.slowAuraGfx.lineTo(ix + 4, iy + 2);
            enemy.slowAuraGfx.lineTo(ix - 4, iy + 2);
            enemy.slowAuraGfx.closePath();
            enemy.slowAuraGfx.endFill();
            enemy.slowAuraGfx.lineStyle(1, 0xffffff, 0.4);
            enemy.slowAuraGfx.moveTo(ix, iy - 4);
            enemy.slowAuraGfx.lineTo(ix, iy + 1);
        }
        enemy.slowAuraGfx.lineStyle(1.5, AURA_SLOW_LINE, 0.5 + 0.2 * Math.sin(pulse));
        enemy.slowAuraGfx.drawEllipse(0, 12, r * 0.7, 5 + Math.sin(pulse) * 1.5);
    }

    /** 전설 타워 — 발밑 금색 링 (uiLayer) */
    function ensureUnitLegendaryAura(unit) {
        let layer;
        if (!unit || !PokemonConfig.isLegendaryId(unit.pokemonId)) {
            return;
        }
        layer = getFieldUiLayer();
        if (!layer) {
            return;
        }
        if (!unit.legendaryAuraGfx || unit.legendaryAuraGfx.destroyed) {
            unit.legendaryAuraGfx = new PIXI.Graphics();
            layer.addChildAt(unit.legendaryAuraGfx, 0);
        } else if (unit.legendaryAuraGfx.parent !== layer) {
            if (unit.legendaryAuraGfx.parent) {
                unit.legendaryAuraGfx.parent.removeChild(unit.legendaryAuraGfx);
            }
            layer.addChildAt(unit.legendaryAuraGfx, 0);
        }
    }

    function drawLegendaryUnitAura(unit, pulse) {
        let r;
        let lineAlpha;
        const layer = getFieldUiLayer();
        if (!isUnitSpriteLive(unit) || !layer) {
            return;
        }
        ensureUnitLegendaryAura(unit);
        if (!unit.legendaryAuraGfx || unit.legendaryAuraGfx.destroyed) {
            return;
        }
        unit.legendaryAuraGfx.clear();
        unit.legendaryAuraGfx.visible = true;
        unit.legendaryAuraGfx.x = unit.sprite.x;
        unit.legendaryAuraGfx.y = unit.sprite.y;
        r = LEGENDARY_AURA_RADIUS + Math.sin(pulse * 0.65) * 2;
        lineAlpha = 0.72 + 0.22 * Math.sin(pulse * 0.85);
        unit.legendaryAuraGfx.beginFill(AURA_LEGENDARY_FILL, 0.08);
        unit.legendaryAuraGfx.drawCircle(0, 4, r);
        unit.legendaryAuraGfx.endFill();
        unit.legendaryAuraGfx.lineStyle(3, AURA_LEGENDARY_LINE, lineAlpha);
        unit.legendaryAuraGfx.drawCircle(0, 4, r);
        unit.legendaryAuraGfx.lineStyle(1.5, 0xffffff, lineAlpha * 0.45);
        unit.legendaryAuraGfx.drawCircle(0, 4, r - 6);
    }

    /** 버프·슬로우·전설 오라 갱신 */
    function updateCombatAuras(delta) {
        let i;
        let u;
        let e;
        const now = Date.now();

        auraPulse += delta * 0.0025;
        for (i = 0; i < units.length; i++) {
            u = units[i];
            if (!isUnitSpriteLive(u)) {
                removeUtilityLevelBadge(u);
                removeRoleBadge(u);
                if (u.legendaryAuraGfx) {
                    u.legendaryAuraGfx.visible = false;
                }
                continue;
            }
            if (!u.roleBadge || u.roleBadge.destroyed) {
                attachRoleBadge(u);
            } else {
                syncRoleBadgePosition(u);
            }
            if (PokemonConfig.isLegendaryId(u.pokemonId)) {
                drawLegendaryUnitAura(u, auraPulse);
            } else if (u.legendaryAuraGfx) {
                u.legendaryAuraGfx.visible = false;
            }
            if (u.role === ROLE.BUFF) {
                drawBuffUnitAura(u, auraPulse);
            } else if (u.auraGfx) {
                u.auraGfx.visible = false;
            }

            if (getUtilityTier(u) > 0) {
                if (!u.utilityLvBadge || u.utilityLvBadge.destroyed) {
                    syncUtilityLevelBadge(u);
                } else {
                    syncUtilityLevelBadgePosition(u);
                }
            } else {
                removeUtilityLevelBadge(u);
            }

            if (u.role !== ROLE.BUFF) {
                const stacks = getBuffStackCount(u);
                if (stacks > 0) {
                    drawBuffedTowerArrows(u, stacks, auraPulse);
                    if (u.lastBuffStacks !== stacks) {
                        if (stacks > (u.lastBuffStacks || 0)) {
                            spawnBuffBoostEffect(u);
                        }
                        u.lastBuffStacks = stacks;
                    }
                } else {
                    u.lastBuffStacks = 0;
                    if (u.buffGlowGfx) {
                        u.buffGlowGfx.visible = false;
                    }
                }
            }
        }
        for (i = 0; i < enemies.length; i++) {
            e = enemies[i];
            if (e.slowUntil && e.slowUntil > now) {
                drawEnemySlowAura(e, auraPulse);
            } else if (e.slowAuraGfx) {
                e.slowAuraGfx.visible = false;
            }
        }
    }

    function updateEffects(delta) {
        let i;
        let ef;
        let t;
        let r;
        let alpha;

        for (i = effects.length - 1; i >= 0; i--) {
            ef = effects[i];
            ef.life -= delta;
            t = 1 - ef.life / (ef.maxLife || 200);
            alpha = Math.max(0, ef.life / (ef.maxLife || 200));

            if (ef.kind === 'aoe_ring') {
                ef.gfx.clear();
                r = 8 + t * (ef.radiusMax || AOE_RADIUS);
                ef.gfx.lineStyle(4, getRoleBeamColor(ROLE.AOE), 0.85 * alpha);
                ef.gfx.drawCircle(0, 0, r);
                ef.gfx.lineStyle(2, 0xffffff, 0.5 * alpha);
                ef.gfx.drawCircle(0, 0, r * 0.7);
            } else if (ef.kind === 'buff_arrow' || ef.kind === 'electric_spark') {
                ef.flicker = (ef.flicker || 0) + delta * 0.01;
                ef.gfx.y += (ef.vy || -0.02) * delta;
                ef.gfx.alpha = alpha * (0.8 + 0.2 * Math.sin(ef.flicker * 3));
                ef.gfx.scale.x = 0.9 + t * 0.2;
                ef.gfx.scale.y = 0.9 + t * 0.2;
            } else if (ef.kind === 'buff_up') {
                ef.gfx.y += (ef.vy || -0.03) * delta;
                ef.gfx.alpha = alpha;
                ef.gfx.scale.x = 0.8 + t * 0.5;
                ef.gfx.scale.y = 0.8 + t * 0.5;
            } else if (ef.kind === 'burst' || ef.kind === 'frost' || ef.kind === 'ring_pop') {
                ef.gfx.alpha = alpha;
                ef.gfx.scale.x = 0.6 + t * 1.4;
                ef.gfx.scale.y = 0.6 + t * 1.4;
            } else if (ef.kind === 'type_text') {
                ef.gfx.y -= 0.05 * delta;
                ef.gfx.alpha = alpha;
            } else {
                ef.gfx.alpha = alpha;
                ef.gfx.scale.x += 0.012;
                ef.gfx.scale.y += 0.012;
            }

            if (ef.life <= 0) {
                if (ef.gfx.parent) {
                    ef.gfx.parent.removeChild(ef.gfx);
                }
                ef.gfx.destroy();
                effects.splice(i, 1);
            }
        }
    }

    function checkWaveClear() {
        let i;
        let w;
        let allCleared;

        for (i = activeWaves.length - 1; i >= 0; i--) {
            w = activeWaves[i];
            if (w.spawned >= w.total && !waveHasLivingEnemies(w.uid)) {
                activeWaves.splice(i, 1);
            }
        }

        allCleared = activeWaves.length === 0 && enemies.length === 0;
        if (!allCleared || !state.gameStarted || state.gameOver || state.nextWaveDelay > 0) {
            updateHud();
            return;
        }

        state.round++;
        state.nextWaveDelay = PokemonConfig.NEXT_WAVE_DELAY_MS;
        clearUnitsCombatState();
        syncAllGridCells();
        updateDeployGridUi();
        updateGachaButton();
        updateSkipButton();
        setMessage('전 웨이브 정리! ' + Math.round(PokemonConfig.NEXT_WAVE_DELAY_MS / 1000) + '초 후 ROUND ' + state.round + ' (SKIP 가능)');
    }

    function endGame(win) {
        state.gameOver = true;
        state.nextWaveDelay = 0;
        $hud.btnStart.prop('disabled', true);
        updateGachaButton();
        updateSkipButton();
        updateDeployGridUi();
        setMessage(win ? '승리!' : 'GAME OVER — 필드 적 ' + state.fieldLimit + '마리 초과');
    }

    function resetGame() {
        let i;

        if (!app) {
            return;
        }

        app.ticker.remove(onTick);

        for (i = units.length - 1; i >= 0; i--) {
            if (units[i].anim) {
                unitLayer.removeChild(units[i].anim);
                units[i].anim.destroy();
            }
            if (units[i].auraGfx) {
                if (units[i].auraGfx.parent) {
                    units[i].auraGfx.parent.removeChild(units[i].auraGfx);
                }
                units[i].auraGfx.destroy();
            }
            if (units[i].buffGlowGfx) {
                if (units[i].buffGlowGfx.parent) {
                    units[i].buffGlowGfx.parent.removeChild(units[i].buffGlowGfx);
                }
                units[i].buffGlowGfx.destroy();
            }
            removeRoleBadge(units[i]);
            if (units[i].legendaryAuraGfx) {
                if (units[i].legendaryAuraGfx.parent) {
                    units[i].legendaryAuraGfx.parent.removeChild(units[i].legendaryAuraGfx);
                }
                units[i].legendaryAuraGfx.destroy();
                units[i].legendaryAuraGfx = null;
            }
            if (units[i].utilityLvBadge) {
                if (units[i].utilityLvBadge.parent) {
                    units[i].utilityLvBadge.parent.removeChild(units[i].utilityLvBadge);
                }
                units[i].utilityLvBadge.destroy({ children: true });
            }
            unitLayer.removeChild(units[i].sprite);
            units[i].sprite.destroy();
        }
        for (i = enemies.length - 1; i >= 0; i--) {
            removeEnemy(i);
        }
        for (i = projectiles.length - 1; i >= 0; i--) {
            fxLayer.removeChild(projectiles[i].gfx);
            projectiles[i].gfx.destroy();
        }
        for (i = effects.length - 1; i >= 0; i--) {
            fxLayer.removeChild(effects[i].gfx);
            effects[i].gfx.destroy();
        }

        units = [];
        enemies = [];
        projectiles = [];
        effects = [];
        storageItems = [];
        storageUidCounter = 1;
        storageDragUid = null;
        storageHoverCell = null;
        dragUnit = null;
        dragStartCell = null;
        dragDidMove = false;
        clearTowerSelection();
        clearHoverPreview();
        closeRerollPanel();

        state.round = 1;
        activeWaves = [];
        waveUidCounter = 1;
        state.totalKills = 0;
        state.gachaTickets = 5;
        state.gameStarted = false;
        state.nextWaveDelay = 0;
        state.roundTimerMs = 0;
        state.gameOver = false;
        state.gachaLoading = false;

        $hud.btnStart.prop('disabled', false).text('게임 START');
        renderStorageTray();
        $hud.gachaInfo.text('뽑기 → 보관함 · 드래그로 말판 배치');
        updateGachaButton();
        updateRerollButton();
        updateSkipButton();

        if ($gridOverlay && $gridOverlay.length) {
            $gridOverlay.find('.grid-cell').removeClass('occupied hover');
        }
        syncAllGridCells();
        updateDeployGridUi();

        app.ticker.add(onTick);
        updateHud();
        setMessage('[뽑기] → 보관함 · 보관함에서 말판으로 드래그 · [게임 시작]');
    }

    function updateHud() {
        $hud.enemies.text(enemies.length);
        if ($hud.fieldCount && $hud.fieldCount.length) {
            $hud.fieldCount.text(enemies.length);
        }
        if ($hud.fieldLimit && $hud.fieldLimit.length) {
            $hud.fieldLimit.text(state.fieldLimit);
        }
        if ($hud.killCount && $hud.killCount.length) {
            $hud.killCount.text(state.totalKills);
        }
        if ($hud.gachaTickets && $hud.gachaTickets.length) {
            $hud.gachaTickets.text(state.gachaTickets);
        }
        if ($hud.waveInfo && $hud.waveInfo.length) {
            if (!activeWaves.length) {
                if (state.nextWaveDelay > 0) {
                    $hud.waveInfo.text('대기 ROUND ' + state.round);
                } else {
                    $hud.waveInfo.text('—');
                }
            } else if (activeWaves.length === 1) {
                $hud.waveInfo.text('R' + activeWaves[0].round + ' No.' + activeWaves[0].enemyId);
            } else {
                $hud.waveInfo.text(activeWaves.length + '겹 (R' + getMaxActiveWaveRound() + '까지)');
            }
        }
        updateRoundTimerDisplay();
    }

    function setMessage(msg) {
        if ($hud.msg && $hud.msg.length) {
            $hud.msg.text(msg);
        }
    }

    /** 진화 계열 조회 — 유닛에 line 없으면 전역表에서 검색 */
    function resolveEvolutionLine(unit) {
        let i;
        let j;
        let lines;
        let line;
        let baseId;

        if (unit.evolutionLine && unit.evolutionLine.length) {
            baseId = unit.evolutionLine[0];
            if (PokemonConfig.isEeveeLineBase(baseId)) {
                if (PokemonConfig.isEeveeEvolvedId(unit.pokemonId)) {
                    unit.evolutionLine = [PokemonConfig.EEVEE_BASE_ID, unit.pokemonId];
                } else {
                    unit.evolutionLine = PokemonConfig.normalizeEeveeLine(unit.evolutionLine);
                }
            }
            return unit.evolutionLine;
        }
        if (PokemonConfig.isEeveeEvolvedId(unit.pokemonId)) {
            unit.evolutionLine = [PokemonConfig.EEVEE_BASE_ID, unit.pokemonId];
            return unit.evolutionLine;
        }
        if (unit.pokemonId === PokemonConfig.EEVEE_BASE_ID) {
            unit.evolutionLine = PokemonConfig.normalizeEeveeLine([PokemonConfig.EEVEE_BASE_ID]);
            return unit.evolutionLine;
        }
        if (typeof POKEMON_EVOLUTION_LINES === 'undefined') {
            return [unit.pokemonId];
        }
        lines = POKEMON_EVOLUTION_LINES;
        for (i = 0; i < lines.length; i++) {
            line = lines[i];
            for (j = 0; j < line.length; j++) {
                if (line[j] === unit.pokemonId) {
                    unit.evolutionLine = line;
                    return line;
                }
            }
        }
        return [unit.pokemonId];
    }

    /** 이브이 → 샤미드/쥬피썬더/부스터 분기 진화 대상 여부 */
    function isEeveeBranchEvolveTarget(baseId, stage, pokemonId) {
        return PokemonConfig.isEeveeLineBase(baseId)
            && stage === 0
            && pokemonId === PokemonConfig.EEVEE_BASE_ID;
    }

    /** 계열 최대 진화 단계 */
    function getMaxEvolutionStageForLine(line, pokemonId) {
        const baseId = line && line.length ? line[0] : pokemonId;
        const branchMax = PokemonConfig.getBranchMaxStage(baseId);
        if (branchMax >= 0) {
            return branchMax;
        }
        return line.length - 1;
    }

    function getMaxEvolutionStage(unit) {
        const line = resolveEvolutionLine(unit);
        return getMaxEvolutionStageForLine(line, unit.pokemonId);
    }

    function hideBranchPick() {
        if ($hud.towerBranchWrap && $hud.towerBranchWrap.length) {
            $hud.towerBranchWrap.hide().empty();
        }
    }

    /** 이브이 분기 진화 선택 UI */
    function buildBranchPickHtml(canEvolve) {
        const branches = PokemonConfig.getEeveeBranches();
        let html = '<p class="branch-title">진화 선택 (이브이 ' + getMergeRequired(0) + '합성)</p>';
        let i;
        let b;

        html += '<div class="branch-cards">';
        for (i = 0; i < branches.length; i++) {
            b = branches[i];
            html += '<button type="button" class="branch-card' + (canEvolve ? '' : ' is-disabled') + '" data-branch-id="' + b.id + '"';
            if (!canEvolve) {
                html += ' disabled';
            }
            html += '>';
            html += '<img src="' + PokemonConfig.pngUrl(b.id) + '" alt="" width="52" height="52">';
            html += '<span class="branch-name">' + b.label + '</span>';
            html += '<em class="branch-no">#' + b.id + '</em>';
            html += '</button>';
        }
        html += '</div>';
        return html;
    }

    /** 현재 진화 단계 (0=1단 … 2=3단) */
    function getUnitStage(unit) {
        const line = resolveEvolutionLine(unit);
        let i;

        if (PokemonConfig.isEeveeLineBase(line[0])) {
            if (unit.pokemonId === PokemonConfig.EEVEE_BASE_ID) {
                unit.evolutionStage = 0;
                return 0;
            }
            if (PokemonConfig.isEeveeEvolvedId(unit.pokemonId)) {
                unit.evolutionStage = 1;
                return 1;
            }
        }

        if (unit.evolutionStage !== undefined && unit.evolutionStage >= 0) {
            return Math.min(unit.evolutionStage, line.length - 1);
        }
        for (i = 0; i < line.length; i++) {
            if (line[i] === unit.pokemonId) {
                unit.evolutionStage = i;
                return i;
            }
        }
        unit.evolutionStage = 0;
        return 0;
    }

    /** 단계별 스탯 */
    function getStageStats(stage) {
        const idx = Math.max(0, Math.min(stage, STAGE_STATS.length - 1));
        return STAGE_STATS[idx];
    }

    /** 유닛 스프라이트·전투 수치 반영 */
    function applyUnitStats(unit) {
        const stage = getUnitStage(unit);
        const stats = getStageStats(stage);
        const eff = getUnitEffectiveStats(unit);

        unit.damage = eff.damage;
        unit.range = eff.range;
        unit.cooldownMax = eff.cooldownMax;
        unit.attackStyle = resolveAttackStyle(unit);
        if (unit.lastBuffStacks === undefined) {
            unit.lastBuffStacks = 0;
        }
        if (isUnitSpriteLive(unit)) {
            unit.sprite.scale.set(stats.scale);
        }
        if (unit.role !== ROLE.BUFF && unit.auraGfx) {
            unit.auraGfx.visible = false;
        }
        if (!unit.roleBadge || unit.roleBadge.destroyed) {
            attachRoleBadge(unit);
        } else {
            syncRoleBadgePosition(unit);
        }
        if (selectedUnit === unit) {
            showSelectedRangePreview(unit);
        }
    }

    /** 타워 선택 — 오른쪽 패널 + 사거리 링 (같은 타워 재클릭 시 해제) */
    function selectTower(unit) {
        let curEff;
        if (selectedUnit === unit) {
            clearTowerSelection();
            setMessage('타워 선택 해제');
            return;
        }
        curEff = getUnitEffectiveStats(unit);
        selectedUnit = unit;
        selectedStorageGroupKey = null;
        selectedStorageGroup = null;
        highlightSelectedCell(unit);
        showSelectedRangePreview(unit);
        updateTowerPanel(unit);
        setMessage('No.' + unit.pokemonId + ' 선택 · 사거리 ' + curEff.range);
    }

    /** 선택 해제 */
    function clearTowerSelection() {
        selectedUnit = null;
        clearSelectedRangePreview();
        if ($gridOverlay && $gridOverlay.length) {
            $gridOverlay.find('.grid-cell').removeClass('tower-selected');
        }
        if ($hud.towerPlaceholder && $hud.towerPlaceholder.length) {
            $hud.towerPlaceholder.show();
        }
        if ($hud.towerBody && $hud.towerBody.length) {
            $hud.towerBody.hide().removeClass('just-upgraded');
        }
        hideBranchPick();
        setTowerUtilityLevelTag(0);
    }

    /** 선택 칸 강조 */
    function highlightSelectedCell(unit) {
        if (!$gridOverlay || !$gridOverlay.length) {
            return;
        }
        $gridOverlay.find('.grid-cell').removeClass('tower-selected');
        $gridOverlay.find('.grid-cell[data-col="' + unit.col + '"][data-row="' + unit.row + '"]').addClass('tower-selected');
    }

    /** 스탯 비교 HTML 한 줄 */
    function buildStatRow(label, curVal, nextVal, suffix) {
        let nextHtml;
        const suf = suffix || '';

        if (nextVal > curVal) {
            nextHtml = '<span class="stat-up">' + nextVal + suf + '</span>';
        } else {
            nextHtml = String(nextVal) + suf;
        }
        return '<div class="stat-row"><span class="stat-name">' + label + '</span>' +
            '<span class="stat-cur">' + curVal + suf + '</span>' +
            '<span class="stat-arrow">→</span>' +
            '<span class="stat-next">' + nextHtml + '</span></div>';
    }

    /** 오른쪽 타워 패널 갱신 */
    function updateTowerPanel(unit) {
        const line = resolveEvolutionLine(unit);
        const stage = getUnitStage(unit);
        const mergeNeed = getMergeRequired(stage);
        const baseId = line[0];
        const curEff = getUnitEffectiveStats(unit);
        const nextStage = stage + 1;
        const nextId = line[nextStage];
        const maxStage = getMaxEvolutionStage(unit);
        const canEvolve = stage < maxStage;
        const profile = getRoleProfile(unit.role);
        let statsHtml = '';

        if (!$hud.towerBody || !$hud.towerBody.length) {
            return;
        }

        $hud.towerPlaceholder.hide();
        $hud.towerBody.show();
        hideBranchPick();

        $hud.towerCurImg.attr('src', PokemonConfig.pngUrl(unit.pokemonId));
        $hud.towerCurStage.text(STAGE_LABELS[stage] || (stage + 1) + '단');
        setTowerUtilityLevelTag(getUtilityTier(unit));
        $hud.towerCurNo.text('#' + unit.pokemonId + ' · ' + formatUnitRoleLabel(unit.role, unit.element));
        statsHtml += buildRangeBadgeHtml(curEff.range);

        if (isEeveeBranchEvolveTarget(baseId, stage, unit.pokemonId)) {
            $hud.towerBody.find('.evo-next').hide();
            $hud.towerBody.find('.evo-arrow').hide();
            statsHtml += '<p class="merge-count">동일 이브이 <strong>' +
                countMergeSiblings(unit) + ' / ' + mergeNeed + '</strong></p>';
            statsHtml += buildRoleDescLine(unit.role);
            statsHtml += buildPassiveDescLine(unit.role, unit.element, getUtilityTier(unit));
            statsHtml += '<div class="stat-row max-only"><span>공격 ' + curEff.damage +
                ' · 사거리 ' + curEff.range + ' · 쿨 ' + curEff.cooldownMax + '</span></div>';
            $hud.towerStats.html(statsHtml);
            $hud.towerBranchWrap.html(buildBranchPickHtml(countMergeSiblings(unit) >= mergeNeed)).show();
            $hud.towerMaxMsg.hide();
            $hud.btnUpgrade.hide();
            return;
        }

        if (canEvolve && nextId && !PokemonConfig.isEeveeLineBase(baseId)) {
            const nextEff = getEffectiveStats(nextStage, unit.role, nextId, unit.evolutionLine);
            $hud.towerNextImg.attr('src', PokemonConfig.pngUrl(nextId));
            $hud.towerNextStage.text(STAGE_LABELS[nextStage] || (nextStage + 1) + '단');
            $hud.towerNextNo.text('#' + nextId);
            $hud.towerBody.find('.evo-next').show();
            $hud.towerBody.find('.evo-arrow').show();

            statsHtml += '<p class="merge-count">동일 ' + STAGE_LABELS[stage] + ' 보유 <strong>' +
                countMergeSiblings(unit) + ' / ' + mergeNeed + '</strong></p>';
            statsHtml += buildRoleDescLine(unit.role);
            statsHtml += buildPassiveDescLine(unit.role, unit.element, getUtilityTier(unit));
            statsHtml += buildStatRow('공격력', curEff.damage, nextEff.damage, '');
            statsHtml += buildStatRow('사거리', curEff.range, nextEff.range, '');
            statsHtml += buildStatRow('쿨다운', curEff.cooldownMax, nextEff.cooldownMax, ' 프레임');
            $hud.towerStats.html(statsHtml);

            $hud.towerMaxMsg.hide();
            $hud.btnUpgrade.show();
            if (countMergeSiblings(unit) >= mergeNeed) {
                $hud.btnUpgrade.text('진화 가능! (' + countMergeSiblings(unit) + '/' + mergeNeed + ')');
                $hud.btnUpgrade.prop('disabled', false);
            } else {
                $hud.btnUpgrade.text('진화 불가 (' + countMergeSiblings(unit) + '/' + mergeNeed + ')');
                $hud.btnUpgrade.prop('disabled', true);
            }
        } else if (canUtilityMergeLine(line) && isUtilityRole(unit.role)) {
            const ut = getUtilityTier(unit);
            const utNeed = UTILITY_MERGE_REQUIRED;
            const sibCount = countUtilityMergeSiblings(unit);
            $hud.towerBody.find('.evo-next').hide();
            $hud.towerBody.find('.evo-arrow').hide();
            statsHtml += '<p class="merge-count">동일 강화 단계 <strong>' + sibCount + ' / ' + utNeed + '</strong></p>';
            statsHtml += buildRoleDescLine(unit.role);
            statsHtml += buildPassiveDescLine(unit.role, unit.element, ut);
            statsHtml += '<div class="stat-row max-only"><span>공격 ' + curEff.damage +
                ' · 사거리 ' + curEff.range + ' · 쿨 ' + curEff.cooldownMax + '</span></div>';
            $hud.towerStats.html(statsHtml);
            if (ut >= UTILITY_MAX_TIER) {
                $hud.towerMaxMsg.show();
                $hud.btnUpgrade.hide();
            } else {
                $hud.towerMaxMsg.hide();
                $hud.btnUpgrade.show();
                if (canUtilityMergeUnit(unit)) {
                    $hud.btnUpgrade.text('강화 가능! (' + sibCount + '/' + utNeed + ')');
                    $hud.btnUpgrade.prop('disabled', false);
                } else {
                    $hud.btnUpgrade.text('강화 불가 (' + sibCount + '/' + utNeed + ')');
                    $hud.btnUpgrade.prop('disabled', true);
                }
            }
        } else {
            $hud.towerBody.find('.evo-next').hide();
            $hud.towerBody.find('.evo-arrow').hide();
            $hud.towerStats.html(
                buildRangeBadgeHtml(curEff.range) +
                buildRoleDescLine(unit.role) +
                buildPassiveDescLine(unit.role, unit.element, getUtilityTier(unit)) +
                '<div class="stat-row max-only"><span>공격 ' + curEff.damage +
                ' · 사거리 ' + curEff.range + ' · 쿨 ' + curEff.cooldownMax + '</span></div>'
            );
            $hud.towerMaxMsg.show();
            $hud.btnUpgrade.hide();
        }
    }

    /** 유틸 강화 합성 키 — 무진화 슬로우·버프 */
    function getUtilityMergeKey(unit) {
        const line = resolveEvolutionLine(unit);
        return String(line[0]) + '_ut' + getUtilityTier(unit);
    }

    /** 같은 유틸 강화 키 타워 목록 */
    function getUnitsByUtilityMergeKey(key) {
        const list = [];
        let i;
        for (i = 0; i < units.length; i++) {
            if (getUtilityMergeKey(units[i]) === key) {
                list.push(units[i]);
            }
        }
        return list;
    }

    /** 같은 강화 단계 동료 수 */
    function countUtilityMergeSiblings(unit) {
        return getUnitsByUtilityMergeKey(getUtilityMergeKey(unit)).length;
    }

    /** 합성 키 — 같은 계열 1단 기준 + 현재 단계 */
    function getMergeKey(unit) {
        const line = resolveEvolutionLine(unit);
        const stage = getUnitStage(unit);
        const baseId = line[0];
        if (PokemonConfig.isEeveeLineBase(baseId) && stage >= 1) {
            return String(baseId) + '_s' + stage + '_id' + unit.pokemonId;
        }
        return String(baseId) + '_s' + stage;
    }

    /** 같은 합성 키 타워 목록 */
    function getUnitsByMergeKey(key) {
        const list = [];
        let i;
        for (i = 0; i < units.length; i++) {
            if (getMergeKey(units[i]) === key) {
                list.push(units[i]);
            }
        }
        return list;
    }

    /** 같은 단계 동료 수 */
    function countMergeSiblings(unit) {
        return getUnitsByMergeKey(getMergeKey(unit)).length;
    }

    /** 타워 제거 */
    function removeUnitFromGrid(unit) {
        let i;
        let idx = -1;

        if (selectedUnit === unit) {
            clearTowerSelection();
        }
        markCellOccupied(unit.col, unit.row, false);
        if (unit.anim) {
            unitLayer.removeChild(unit.anim);
            unit.anim.destroy();
        }
        if (unit.sprite) {
            unitLayer.removeChild(unit.sprite);
            unit.sprite.destroy();
            unit.sprite = null;
        }
        if (unit.auraGfx) {
            if (unit.auraGfx.parent) {
                unit.auraGfx.parent.removeChild(unit.auraGfx);
            }
            unit.auraGfx.destroy();
            unit.auraGfx = null;
        }
        if (unit.legendaryAuraGfx) {
            if (unit.legendaryAuraGfx.parent) {
                unit.legendaryAuraGfx.parent.removeChild(unit.legendaryAuraGfx);
            }
            unit.legendaryAuraGfx.destroy();
            unit.legendaryAuraGfx = null;
        }
        if (unit.buffGlowGfx) {
            if (unit.buffGlowGfx.parent) {
                unit.buffGlowGfx.parent.removeChild(unit.buffGlowGfx);
            }
            unit.buffGlowGfx.destroy();
            unit.buffGlowGfx = null;
        }
        removeRoleBadge(unit);
        removeUtilityLevelBadge(unit);
        for (i = 0; i < units.length; i++) {
            if (units[i] === unit) {
                idx = i;
                break;
            }
        }
        if (idx >= 0) {
            units.splice(idx, 1);
        }
    }

    /** 유닛을 지정 ID·단계로 진화(스프라이트·스탯) */
    function evolveUnitToId(unit, targetId, nextStage, evolutionLine, onDone) {
        loadPokemonTexture(targetId).then(function (tex) {
            let found = false;
            let i;
            for (i = 0; i < units.length; i++) {
                if (units[i] === unit) {
                    found = true;
                    break;
                }
            }
            if (!found || !isUnitSpriteLive(unit)) {
                return;
            }
            unit.sprite.texture = tex;
            unit.pokemonId = targetId;
            unit.evolutionStage = nextStage;
            unit.evolutionLine = evolutionLine || [PokemonConfig.EEVEE_BASE_ID, targetId];
            applyUnitStats(unit);
            if (onDone) {
                onDone();
            }
        }).catch(function () {
            setMessage('진화 스프라이트 로드 실패.');
        });
    }

    /** 유닛을 지정 단계로 진화(스프라이트·스탯) */
    function evolveUnitToNextStage(unit, nextStage, onDone) {
        const line = resolveEvolutionLine(unit);
        const nextId = line[nextStage];

        evolveUnitToId(unit, nextId, nextStage, line, onDone);
    }

    /** 이브이 합성 → 선택한 진화체 */
    function performEeveeBranchMerge(keeper, branchId) {
        const key = getMergeKey(keeper);
        const list = getUnitsByMergeKey(key);
        const toRemove = [];
        let i;
        let branchLabel = '#' + branchId;
        const branches = PokemonConfig.getEeveeBranches();
        const mergeNeed = getMergeRequired(0);

        if (!isEeveeBranchEvolveTarget(PokemonConfig.EEVEE_BASE_ID, getUnitStage(keeper), keeper.pokemonId)) {
            return false;
        }
        if (list.length < mergeNeed) {
            setMessage('이브이 ' + mergeNeed + '마리가 필요합니다. (현재 ' + list.length + '마리)');
            return false;
        }

        for (i = 0; i < branches.length; i++) {
            if (branches[i].id === branchId) {
                branchLabel = branches[i].label;
                break;
            }
        }

        for (i = 0; i < list.length && toRemove.length < mergeNeed - 1; i++) {
            if (list[i] !== keeper) {
                toRemove.push(list[i]);
            }
        }

        for (i = 0; i < toRemove.length; i++) {
            removeUnitFromGrid(toRemove[i]);
        }

        evolveUnitToId(keeper, branchId, 1, [PokemonConfig.EEVEE_BASE_ID, branchId], function () {
            syncAllGridCells();
            if (selectedUnit === keeper) {
                selectTower(keeper);
                $hud.towerBody.addClass('just-upgraded');
                setTimeout(function () {
                    if ($hud.towerBody && $hud.towerBody.length) {
                        $hud.towerBody.removeClass('just-upgraded');
                    }
                }, 700);
            }
            setMessage('이브이 → ' + branchLabel + ' 진화 완료! (' + mergeNeed + '→1)');
            updateDeployGridUi();
            updateHud();
        });
        return true;
    }

    /** 보관함 이브이 3합성 → 선택한 진화체 */
    function performEeveeBranchStorageMerge(groupKey, branchId) {
        const matched = [];
        let i;
        let item;
        let branchLabel = '#' + branchId;
        const branches = PokemonConfig.getEeveeBranches();
        let g = null;
        let newKey;
        let mergeNeed;
        const groups = buildStorageGroups();

        for (i = 0; i < groups.length; i++) {
            if (groups[i].key === groupKey) {
                g = groups[i];
                break;
            }
        }
        if (!g || !isEeveeBranchEvolveTarget(g.baseId, g.stage, g.pokemonId)) {
            return false;
        }
        mergeNeed = getMergeRequired(g.stage);
        if (g.count < mergeNeed) {
            setMessage('이브이 ' + mergeNeed + '마리가 필요합니다. (현재 ' + g.count + '마리)');
            return false;
        }

        for (i = 0; i < branches.length; i++) {
            if (branches[i].id === branchId) {
                branchLabel = branches[i].label;
                break;
            }
        }

        for (i = storageItems.length - 1; i >= 0; i--) {
            item = storageItems[i];
            if (getStorageGroupKey(item) === groupKey) {
                matched.push(item);
            }
        }
        if (matched.length < mergeNeed) {
            setMessage('보관함 이브이가 부족합니다.');
            return false;
        }

        loadPokemonTexture(branchId).then(function (tex) {
            let removed = 0;
            for (i = storageItems.length - 1; i >= 0 && removed < mergeNeed; i--) {
                item = storageItems[i];
                if (getStorageGroupKey(item) === groupKey) {
                    storageItems.splice(i, 1);
                    removed++;
                }
            }
            addToStorage(branchId, [PokemonConfig.EEVEE_BASE_ID, branchId], tex, 1);
            sortStorageItems(false);
            updateStorageCountLabel();
            newKey = getStorageGroupKey({
                line: [PokemonConfig.EEVEE_BASE_ID, branchId],
                evolutionStage: 1,
                pokemonId: branchId
            });
            selectedStorageGroupKey = newKey;
            selectStorageGroup(newKey);
            if ($hud.towerBody && $hud.towerBody.length) {
                $hud.towerBody.addClass('just-upgraded');
                setTimeout(function () {
                    if ($hud.towerBody && $hud.towerBody.length) {
                        $hud.towerBody.removeClass('just-upgraded');
                    }
                }, 700);
            }
            renderStorageTray();
            setMessage('보관함: 이브이 → ' + branchLabel + ' 진화 완료! (' + mergeNeed + '→1)');
        }).catch(function () {
            setMessage('진화 스프라이트 로드 실패.');
        });
        return true;
    }

    /** 보관함 유틸 2합성 → 강화 티어 +1 */
    function performUtilityStorageMerge(groupKey) {
        const groups = buildStorageGroups();
        let g = null;
        let i;
        let item;
        let line;
        let tier;
        let nextTier;
        let mergeNeed;
        let newKey;
        let keptTex;

        for (i = 0; i < groups.length; i++) {
            if (groups[i].key === groupKey) {
                g = groups[i];
                break;
            }
        }
        if (!g || !canUtilityMergeStorageGroup(g)) {
            setMessage('유틸 강화 불가: 동일 단계 ' + UTILITY_MERGE_REQUIRED + '개 필요');
            return false;
        }
        line = g.line || [g.pokemonId];
        tier = g.utilityTier || 0;
        nextTier = tier + 1;
        mergeNeed = UTILITY_MERGE_REQUIRED;
        keptTex = null;
        for (i = 0; i < storageItems.length; i++) {
            item = storageItems[i];
            if (getStorageGroupKey(item) === groupKey) {
                if (!keptTex) {
                    keptTex = item.texture;
                }
            }
        }

        function finishUtilityMerge(tex) {
            let removed = 0;
            for (i = storageItems.length - 1; i >= 0 && removed < mergeNeed; i--) {
                item = storageItems[i];
                if (getStorageGroupKey(item) === groupKey) {
                    storageItems.splice(i, 1);
                    removed++;
                }
            }
            addToStorage(g.pokemonId, line, tex, 0, nextTier);
            sortStorageItems(false);
            updateStorageCountLabel();
            renderStorageTray();
            newKey = getStorageGroupKey({
                line: line,
                evolutionStage: 0,
                pokemonId: g.pokemonId,
                role: g.role,
                utilityTier: nextTier
            });
            selectedStorageGroupKey = newKey;
            selectStorageGroup(newKey);
            if ($hud.towerBody && $hud.towerBody.length) {
                $hud.towerBody.addClass('just-upgraded');
                setTimeout(function () {
                    if ($hud.towerBody && $hud.towerBody.length) {
                        $hud.towerBody.removeClass('just-upgraded');
                    }
                }, 700);
            }
            setMessage('보관함: No.' + g.pokemonId + ' ' + formatUtilityTierLabel(nextTier) +
                ' 강화! (' + mergeNeed + '→1)');
        }

        if (keptTex) {
            finishUtilityMerge(keptTex);
            return true;
        }
        loadPokemonTexture(g.pokemonId).then(function (tex) {
            finishUtilityMerge(tex);
        }).catch(function () {
            setMessage('강화 스프라이트 로드 실패.');
        });
        return true;
    }

    /** 말판 유틸 2합성 — keeper 티어 +1 */
    function performUtilityMerge(keeper) {
        const key = getUtilityMergeKey(keeper);
        const list = getUnitsByUtilityMergeKey(key);
        const mergeNeed = UTILITY_MERGE_REQUIRED;
        const toRemove = [];
        let i;
        let nextTier;

        if (!canUtilityMergeUnit(keeper) || list.length < mergeNeed) {
            return false;
        }
        for (i = 0; i < list.length && toRemove.length < mergeNeed - 1; i++) {
            if (list[i] !== keeper) {
                toRemove.push(list[i]);
            }
        }
        for (i = 0; i < toRemove.length; i++) {
            removeUnitFromGrid(toRemove[i]);
        }
        nextTier = getUtilityTier(keeper) + 1;
        keeper.utilityTier = nextTier;
        syncUtilityLevelBadge(keeper);
        syncAllGridCells();
        if (selectedUnit === keeper) {
            selectTower(keeper);
            if ($hud.towerBody && $hud.towerBody.length) {
                $hud.towerBody.addClass('just-upgraded');
                setTimeout(function () {
                    if ($hud.towerBody && $hud.towerBody.length) {
                        $hud.towerBody.removeClass('just-upgraded');
                    }
                }, 700);
            }
        }
        setMessage('No.' + keeper.pokemonId + ' ' + formatUtilityTierLabel(nextTier) +
            ' 강화! (' + mergeNeed + '→1)');
        updateDeployGridUi();
        updateHud();
        return true;
    }

    /** 보관함 3합성 → 다음 단계 1개 */
    function performStorageMerge(groupKey) {
        const groups = buildStorageGroups();
        let g = null;
        let i;
        let item;
        let line;
        let stage;
        let nextStage;
        let nextId;
        let newKey;
        let mergeNeed;

        for (i = 0; i < groups.length; i++) {
            if (groups[i].key === groupKey) {
                g = groups[i];
                break;
            }
        }
        if (!g) {
            return false;
        }
        line = g.line || [g.pokemonId];
        stage = g.stage || 0;
        mergeNeed = getMergeRequired(stage);
        nextStage = stage + 1;
        nextId = line[nextStage];

        if (PokemonConfig.isEeveeLineBase(line[0])) {
            return false;
        }
        if (stage >= getMaxEvolutionStageForLine(line, g.pokemonId)) {
            setMessage('최대 진화 단계입니다.');
            return false;
        }
        if (g.count < mergeNeed || !nextId) {
            setMessage('진화 불가: 같은 단계 ' + mergeNeed + '개 필요 (현재 ' + g.count + '개)');
            return false;
        }

        loadPokemonTexture(nextId).then(function (tex) {
            let removed = 0;
            for (i = storageItems.length - 1; i >= 0 && removed < mergeNeed; i--) {
                item = storageItems[i];
                if (getStorageGroupKey(item) === groupKey) {
                    storageItems.splice(i, 1);
                    removed++;
                }
            }
            addToStorage(nextId, line, tex, nextStage);
            sortStorageItems(false);
            updateStorageCountLabel();
            renderStorageTray();
            newKey = getStorageGroupKey({
                line: line,
                evolutionStage: nextStage,
                pokemonId: nextId
            });
            selectedStorageGroupKey = newKey;
            selectStorageGroup(newKey);
            if ($hud.towerBody && $hud.towerBody.length) {
                $hud.towerBody.addClass('just-upgraded');
                setTimeout(function () {
                    if ($hud.towerBody && $hud.towerBody.length) {
                        $hud.towerBody.removeClass('just-upgraded');
                    }
                }, 700);
            }
            setMessage('보관함: No.' + nextId + ' ' + (STAGE_LABELS[nextStage] || (nextStage + 1) + '단') +
                ' 진화 완료! (' + mergeNeed + '→1)');
        }).catch(function () {
            setMessage('진화 스프라이트 로드 실패.');
        });
        return true;
    }

    /** 합성 — keeper 1기 남기고 나머지 제거 후 진화 */
    function performMerge(keeper) {
        const line = resolveEvolutionLine(keeper);
        const stage = getUnitStage(keeper);
        const mergeNeed = getMergeRequired(stage);
        const nextStage = stage + 1;
        const key = getMergeKey(keeper);
        const list = getUnitsByMergeKey(key);
        const toRemove = [];
        let i;

        if (stage >= getMaxEvolutionStage(keeper) || list.length < mergeNeed) {
            return false;
        }

        for (i = 0; i < list.length && toRemove.length < mergeNeed - 1; i++) {
            if (list[i] !== keeper) {
                toRemove.push(list[i]);
            }
        }

        for (i = 0; i < toRemove.length; i++) {
            removeUnitFromGrid(toRemove[i]);
        }

        evolveUnitToNextStage(keeper, nextStage, function () {
            syncAllGridCells();
            if (selectedUnit === keeper) {
                selectTower(keeper);
                $hud.towerBody.addClass('just-upgraded');
                setTimeout(function () {
                    if ($hud.towerBody && $hud.towerBody.length) {
                        $hud.towerBody.removeClass('just-upgraded');
                    }
                }, 700);
            }
            setMessage('No.' + keeper.pokemonId + ' ' + STAGE_LABELS[nextStage] + ' 합성 완료! (' + mergeNeed + '→1)');
            updateDeployGridUi();
            updateHud();
        });
        return true;
    }

    /** 동일 3기 이상이면 자동 합성(연쇄 가능) */
    function tryAutoMergeAll() {
        const groups = {};
        const keys = [];
        let key;
        let list;
        let k;
        let merged;
        let stage;
        let mergeNeed;

        for (k = 0; k < units.length; k++) {
            if (canUtilityMergeLine(resolveEvolutionLine(units[k])) && isUtilityRole(units[k].role)) {
                continue;
            }
            key = getMergeKey(units[k]);
            if (!groups[key]) {
                groups[key] = [];
                keys.push(key);
            }
            groups[key].push(units[k]);
        }

        merged = true;
        while (merged) {
            merged = false;
            for (k = 0; k < keys.length; k++) {
                key = keys[k];
                list = getUnitsByMergeKey(key);
                if (!list.length) {
                    continue;
                }
                stage = getUnitStage(list[0]);
                mergeNeed = getMergeRequired(stage);
                if (list.length >= mergeNeed) {
                    if (stage < getMaxEvolutionStage(list[0])) {
                        if (isEeveeBranchEvolveTarget(
                            resolveEvolutionLine(list[0])[0],
                            stage,
                            list[0].pokemonId
                        )) {
                            continue;
                        }
                        performMerge(list[0]);
                        merged = true;
                        return;
                    }
                }
            }
        }
    }

    /** 합성 진화 가능 여부 */
    function canUpgradeUnit(unit) {
        const stage = getUnitStage(unit);

        if (state.gameOver) {
            return false;
        }
        if (canUtilityMergeUnit(unit)) {
            return true;
        }
        if (stage >= getMaxEvolutionStage(unit)) {
            return false;
        }
        return countMergeSiblings(unit) >= getMergeRequired(stage);
    }

    /** 타워 합성 진화(버튼) */
    function upgradeUnit(unit) {
        const line = resolveEvolutionLine(unit);
        const stage = getUnitStage(unit);
        const mergeNeed = getMergeRequired(stage);
        const baseId = line[0];

        if (isEeveeBranchEvolveTarget(baseId, stage, unit.pokemonId)) {
            updateTowerPanel(unit);
            if (canUpgradeUnit(unit)) {
                setMessage('이브이 진화 가능! 아래에서 진화할 포켓몬을 선택하세요.');
            } else {
                setMessage('이브이 진화 불가: 같은 단계 ' + mergeNeed + '기 필요 (현재 ' + countMergeSiblings(unit) + '기)');
            }
            return;
        }

        if (canUtilityMergeUnit(unit)) {
            performUtilityMerge(unit);
            return;
        }

        if (!canUpgradeUnit(unit)) {
            setMessage('같은 ' + STAGE_LABELS[getUnitStage(unit)] + ' 타워가 ' + mergeNeed + '기 필요합니다. (현재 ' + countMergeSiblings(unit) + '기)');
            updateTowerPanel(unit);
            return;
        }
        performMerge(unit);
    }

    /** SKIP 가능 — 대기 중이거나 웨이브 진행 중 */
    function canSkipWave() {
        if (!state.gameStarted || state.gameOver) {
            return false;
        }
        if (state.nextWaveDelay > 0) {
            return true;
        }
        return activeWaves.length > 0;
    }

    /** SKIP 버튼 상태 */
    function updateSkipButton() {
        if (!$hud.btnSkip || !$hud.btnSkip.length) {
            return;
        }
        $hud.btnSkip.prop('disabled', !canSkipWave());
    }

    /** SKIP — 기존 적 유지, 다음 웨이브만 겹쳐 등장 */
    function skipToNextWave() {
        if (!canSkipWave()) {
            setMessage('게임 시작 후 사용할 수 있습니다.');
            return;
        }

        if (state.nextWaveDelay > 0) {
            state.nextWaveDelay = 0;
            updateSkipButton();
            startWave();
            grantTickets(TICKET_SKIP_REWARD, 'SKIP — 대기 생략 ROUND ' + state.round + ' 시작');
            return;
        }

        stackNextWave();
    }

    function getUnitAt(col, row) {
        let i;
        for (i = 0; i < units.length; i++) {
            if (units[i].col === col && units[i].row === row) {
                return units[i];
            }
        }
        return null;
    }

    function dist(a, b) {
        const ax = a.x !== undefined ? a.x : a.container.x;
        const ay = a.y !== undefined ? a.y : a.container.y;
        const bx = b.x !== undefined ? b.x : b.container.x;
        const by = b.y !== undefined ? b.y : b.container.y;
        const dx = ax - bx;
        const dy = ay - by;
        return Math.sqrt(dx * dx + dy * dy);
    }

    return {
        init: init,
        grantTestLegendariesAll: grantTestLegendariesAll
    };
}());
