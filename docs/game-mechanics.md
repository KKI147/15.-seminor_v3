# 게임 메커니즘 (구현 기록)

현재 `js/gameDemo.js` · `js/pokemonConfig.js` 기준으로 동작하는 규칙 정리입니다.

---

## 1. 게임 흐름

1. **[뽑기]** → 보관함에 1단 포켓몬 추가 (남은 뽑기권 전부 소모)
2. 보관함에서 **드래그·일괄배치**로 말판(10×10)에 타워 배치
3. **[게임 START]** — 말판에 타워 1기 이상 필요
4. ROUND별 적 스폰 → 타워 자동 공격 → 처치·뽑기권·웨이브 진행
5. 필드 적 **100마리 이상** → 게임오버

---

## 2. ROUND · 웨이브 · 타이머

| 항목 | 값 | 코드 |
|------|-----|------|
| 웨이브당 스폰 수 | 30 | `state.waveTotal` |
| 스폰 간격 | 38틱 | `SPAWN_INTERVAL` |
| 클리어 후 대기 | 2.8초 | `NEXT_WAVE_DELAY_MS` |
| **라운드 제한** | **1분** | `ROUND_LIMIT_MS` (60000) |
| SKIP 겹침 | 기존 적 유지 + 상위 ROUND + **뽑기권 +3** | `stackNextWave()` |

### 라운드 타이머

- **게임 START** 시 **1:00** 시작 · **시간 초과 보상 후**에만 1:00 리셋 (웨이브마다 리셋하지 않음)
- 진행 중 1초씩 감소, HUD **「라운드 제한」**에 `M:SS` 표시
- 20초 이하 노랑, 10초 이하 빨강
- **웨이브 클리어 후 대기** 구간에서는 타이머 **일시정지** (`대기` 표시)
- **시간 초과** → `getNextStackRound()` 웨이브 추가 (SKIP과 유사, 기존 적 유지) + **뽑기권 +3**

### 웨이브 클리어

- 해당 웨이브 스폰 완료 + 그 웨이브 소속 적 전멸 + 필드 적 0 → `state.round++` → 대기 → 다음 웨이브
- ~~클리어 뽑기권~~ (폐지)

---

## 3. 보스

| 항목 | 설명 |
|------|------|
| 등장 | ROUND **10, 20, 30…** (`BOSS_EVERY_ROUNDS = 10`) |
| 종류 | **전설·환상** 풀 순환 (`LEGENDARY_BOSS_IDS`, `getBossIdForRound`) |
| HP | 일반 HP × `ENEMY_BOSS_HP_MUL` (6) |
| 속도 | 일반 대비 ×0.72 |
| UI | 큰 스프라이트·이중 금링·`BOSS` 라벨·두꺼운 HP바 (`BOSS_VIS`) |
| 처치 보상 | **뽑기권 +5** (`TICKET_BOSS_REWARD` / `BOSS_TICKET_REWARD`) |

**뽑기 전설(144~151)** 과 **보스 전설 풀**은 별개 — 뽑기에서는 5종 제외, 보스는 다세대 전설 ID 사용.

---

## 4. 적 밸런스

```
HP = ENEMY_HP_BASE + r×ENEMY_HP_LINEAR + r²×ENEMY_HP_QUAD
```

| 상수 | 값 |
|------|-----|
| `ENEMY_HP_BASE` | 105 |
| `ENEMY_HP_LINEAR` | 42 |
| `ENEMY_HP_QUAD` | 1.9 |
| 이동 속도 | **`ENEMY_SPEED_BASE` 고정** (라운드 무관) · 보스 ×0.72 |

**난이도 곡선**: 후반으로 갈수록 **체력만** 올라가고 적 이동 속도는 동일 — 슬로우·DPS 체감이 유지됩니다.

| ROUND (예) | 일반 HP (근사) |
|------------|----------------|
| 1 | ~149 |
| 10 | ~715 |
| 20 | ~1,745 |
| 10 보스 | ~4,290 (×6) |

- 일반 웨이브 몹: `PokemonConfig.randomId()` (1~1025)
- 적 스프라이트: 경로 방향 **좌우 반전** (`scale.x`), 회전 없음
- 완주 시 제거하지 않고 **경로 재순환**

---

## 5. 뽑기 · 보관함 · 리롤

### 뽑기

- 관동 **1~151**, 각 라인 **1단만** (`GEN1_GACHA_LINES`) — 계열 표: [`evolution-routes-gen1.md`](evolution-routes-gen1.md)
- 전설 5종(144~146, 150~151) **뽑기 제외** → [`gen1-gacha-policy.md`](gen1-gacha-policy.md)
- **가중 뽑기** (`pickWeightedGachaLine`) — 3단 가중 **4** · 2단 **1** · 무진화 **1** → 3단 ≈54%  
  확률표: [`gen1-gacha-policy.md`](gen1-gacha-policy.md) · `node scripts/calc-gacha-role-rates.js`

### 뽑기권

- 시작 **5장**
- **라운드 제한 1분 경과** → 뽑기권 **+3** (`TICKET_TIMER_REWARD`)
- **웨이브 SKIP** 1회당 → **+3** (`TICKET_SKIP_REWARD`, 대기 생략·겹침 스폰)
- **보스 처치** → **+5** (`TICKET_BOSS_REWARD`)
- ~~웨이브 클리어~~ · ~~처치 보상~~ 없음

### 리롤

| 항목 | 값 |
|------|-----|
| 조건 | 보관함 **3마리 이상** |
| 동작 | 보관함에서 **3마리 선택** → **뽑기권 +1** |
| 상수 | `REROLL_TRADE_COUNT=3`, `REROLL_REWARD_TICKETS=1` |

※ 뽑기권을 소모해 랜덤 3택1 하는 방식 **아님**.

### 보관함

- [정렬] — 계열·단계 묶음
- [일괄배치] — 역할 우선순위: 슬로우 → 버프 → 범위 → 단일
- 카드: 역할 뱃지 + **단일만 속성 뱃지**

---

## 6. 타워 스탯 · 등급

### 단계 스탯 (`STAGE_STATS`)

| 단계 | damage | range | cooldownMax |
|------|--------|-------|-------------|
| 1단 | 26 | 186 | 58 |
| 2단 | 44 | 210 | 48 |
| 3단 | 82 | 252 | 34 |

### 등급 배율 (`POWER_TIER_MUL`)

| 등급 | 배율 |
|------|------|
| 3단 라인 1단 | 0.79 |
| 2단 라인 1단 | 0.86 |
| 무진화 | 0.82 |
| 2단 | 1.0 |
| 2단 라인 최종 | 1.06 |
| 3단 | 1.22 |
| 전설 ID | 1.16 (3단급 베이스) |

최종 수치: `getEffectiveStats()` = 단계 × 역할 × 등급 × 개체 공속(`pokemonId % 5`).

등급 판정: `getPowerTierMul()` — `getLineEvolutionDepth()`(= `getMaxEvolutionStageForLine`)로 **2단까지 / 3단까지 / 무진화** 구분.

### 유틸 강화 (무진화 슬로우·버프)

- **2마리 합성** → 같은 종·같은 강화 단계 1마리, **최대 강화+2**
- **슬로우**: 감속 지속 +0.4초/단계 (이동 배율은 패시브 고정 ×0.42)
- **버프**: 스택 가중 +0.5/단계 (전역 최대 스택 3 유지)
- 보관함·말판 패널 **「강화」** 버튼, 카드 **「강화!」** 뱃지
- 강화 1단 이상: UI **`1` / `2`** — 보관함 좌상단·패널·말판 **우상단** (`uiLayer`, 역할 아이콘과 분리)
- 말판 자동 합성 없음 (`tryAutoMergeAll`에서 유틸 제외)

### 합성 진화

- **1단→2단**: 동일 계열·동일 단계 **2기** (`MERGE_REQUIRED_STAGE1`)
- **2단→3단**: **3기** (`MERGE_REQUIRED_STAGE2`)
- **이브이(133)**: 1단 **2마리** 합성 후 분기 선택
- 함수: `getMergeRequired(stage)`

---

## 7. 역할 시스템

상세: [`role-system.md`](role-system.md)

| 역할 | 진화 가능 | 무진화 | 역할 공식 (계열 내) |
|------|-----------|--------|---------------------|
| 단일 | ○ | — | `id % 75 < 45` |
| 범위 | ○ | — | 그 외 |
| 슬로우 | — | ○ | `id % 25 < 15` |
| 버프 | — | ○ | 그 외 |

**가중 뽑기 1회 기준 역할(근사):** 단일 ≈52% · 범위 ≈32% · 슬로우 ≈10% · 버프 ≈6%

**전설 5종(144~151):** `getRoleForLegendaryId()` — **단일·범위만** (`LEGENDARY_COMBOS[].role`). 슬로우·버프·유틸 강화 **불가** (`canUtilityMergeLine` 제외).

- **속성**(불·물·풀·전기 등 8종): **단일만** — `getElementForUnit()`
- 역할: `getRoleForBaseId(baseId, line)` — `canEvolveGachaLine(line)` / 전설은 조합표 `role`

---

## 8. UI · 조작

### 오른쪽 HUD

- 필드 적 N/100, **뽑기권 (제한시간·SKIP)**, **처치 N**(누적), 웨이브, **라운드 타이머**
- **타워 역할 가이드** (단일/범위/슬로우/버프 설명 + 미니 아이콘)

### 타워 선택

- 말판 타워 **클릭** → 강화 패널 + **사거리 원**(맵) + **현재 사거리** 배지(패널)
- **같은 타워 재클릭** → 선택 해제, 사거리 원 제거
- 타워 **우하단** Pixi 역할 아이콘: ●단일 ○범위 ▲슬로우 ···버프 — **`uiLayer`** (`getFieldUiLayer`, `attachRoleBadge`)
- **전설 타워**: 발밑 **금색 링** (`drawLegendaryUnitAura`) · 역할 뱃지 **금테·★**
- 매 틱 `updateCombatAuras`에서 뱃지 위치·전설 오라 동기화

### 진화 가능 표시

| 위치 | CSS / 클래스 | 조건 |
|------|--------------|------|
| 보관함 카드 | `.storage-card.can-evolve` + `.evo-ready-badge` | `canEvolveStorageGroup()` — 동일 그룹 수 ≥ `getMergeRequired(stage)` |
| 보관함 카드 | `.storage-card.evo-line` + `.evo-line-mark` (↑) | 아직 합성 불가, 진화 라인만 보유 |
| 말판 칸 | `.grid-cell.evo-ready` | `canUpgradeUnit()` — 말판 동일 단계 타워 수 충족 |
| 강화 패널 | `.btn-upgrade:not(:disabled)` | 진화 가능 시 깜빡임 |

- 애니메이션: `@keyframes evo-ready-pulse` (`css/demo.css`)
- 판정 함수: `canEvolveStorageGroup()`, `hasEvolutionLine()`, `canUpgradeUnit()`, `countMergeSiblings()`

### 텍스트 색

- `common_sci.css` 전역 `color:#000` 덮어쓰기 → `demo.css` `#defense-demo * { color: inherit }`

---

## 9. 맵 (체육관)

| 영역 | 연출 | 코드 |
|------|------|------|
| 바깥 900×900 | 어두운 홀 + **관중석 줄무늬** | `drawGymAudienceStripes` |
| 경로 루프 | 붉은 **트랙** (폭 `GYM_TRACK_WIDTH`) | `drawGymPathTrack` · `buildPath` |
| 중앙 10×10 | **나무 마루** 체크 패턴 | `drawGymArenaFloor` |
| 배틀 존 | 코트 테두리·중앙 원 | `drawGymArenaMarkings` |
| 스폰 | 입구 마커 (빨강·흰 띠) | `drawGymSpawnMarker` |
| DOM 그리드 | 평소 투명 · 호버·선택만 하이라이트 | `css/demo.css` `.map-gym` |

좌표·경로 형태는 기존과 동일 (540×540 격자, `PATH_PAD` 82 사각 루프).

| `assets/map-gym-field.png` | 900×900 | Pixi 배경 스프라이트 (`MAP_BG_URL`) |
| 재생성 | `node scripts/generate-gym-map.js` | `npm install canvas` |

---

## 10. 속성 상성 · 역할 패시브

| 항목 | 설명 |
|------|------|
| 상성 | **단일**만 — `getTypeDamageMul()` · 효과적 1.35 / 약함 0.75 |
| 적 속성 | 스폰 시 `element` = ID%8 |
| 패시브 | 범위 스플래시×1.12 · 슬로우 강화 · 버프 사거리+28 |
| 상세 | [`type-passives.md`](type-passives.md) |

---

## 11. 전설 조합 · 전설 타워

| 항목 | 설명 |
|------|------|
| 대상 | 144~146, 150, 151 — 뽑기 제외 · **조합 전용** |
| 역할 | **단일·범위만** — `LEGENDARY_COMBOS[].role` (슬로우·버프 없음) |
| 등급 | `POWER_TIER_MUL.legendary` = **1.16** |
| 조합 UI | 보관함 **「전설 조합」** — 맵 위 오버레이 (`z-index: 45`) |
| 보유 표시 | 레시피 `.is-owned` · 「보관함/말판 보유」 · 결과 이미지 **「보유」** 칩 |
| 말판 UI | `uiLayer` — 역할 뱃지(금테·★) + 금색 링 오라 |
| 보관함 UI | `.storage-card.is-legendary` · **「전설」** 뱃지 |
| 텍스처 | 보관함 배치 시 CDN 자동 로드 (`ensureStorageItemTexture`, `placeUnit`) |
| 역할 보정 | `syncLegendaryRoles()` — 구 슬로우·버프 데이터 정리 |
| 테스트 지급 | `DefenseDemo.grantTestLegendariesAll([force])` — readme 참고 |
| 상세 | [`legendary-combos.md`](legendary-combos.md) |

---

## 12. 전투 연출 요약

| 대상 | 연출 |
|------|------|
| 단일 | laser / galaga / burst, 속성색 빔 |
| 범위 | 몹 위치 splash |
| 슬로우 | frost / galaga + 적 발밑 **서리 결정** |
| 버프 타워 | 분홍 링 — 테두리 진하게 (`AURA_BUFF_LINE`, `drawBuffUnitAura`) |
| 버프 수혜 | **빨간 ▲ 2개** 위아래 맥동 |
| **전설 타워** | 금색 링 (`LEGENDARY_AURA_RADIUS`) + 역할 뱃지 금테·★ |
| 보스 | 큰 스프라이트 + BOSS 라벨 |

---

## 13. 주요 코드 위치

| 기능 | 파일 · 심볼 |
|------|------------|
| 게임 루프·UI·전투 | `js/gameDemo.js` `DefenseDemo` |
| 뽑기권 지급 | `grantTickets()` — **타이머 +3**, **SKIP +3**, **보스 +5** (보스도 동일 함수) |
| 가중 뽑기 | `pickWeightedGachaLine()`, `getGachaLineDepthWeight()` |
| 유틸 강화 | `performUtilityStorageMerge()`, `syncUtilityLevelBadge()` |
| 전설·필드 UI | `getFieldUiLayer()`, `attachRoleBadge()`, `drawLegendaryUnitAura()`, `syncLegendaryRoles()` |
| 전설 테스트 | `grantTestLegendariesAll()` (DefenseDemo 공개 API) |
| 스프라이트 안전 | `isUnitSpriteLive()` — 공격·합성 제거 후 `scale` 오류 방지 |
| 등급·합성 | `getPowerTierMul()`, `getMergeRequired()`, `getLineEvolutionDepth()` |
| 진화 UI | `canEvolveStorageGroup()`, `renderStorageTray()`, `syncAllGridCells()` |
| CDN·적 HP·보스·리롤 | `js/pokemonConfig.js` |
| 관동 뽑기 라인 | `GEN1_GACHA_LINES` |
| 진화 계열(참고) | `js/pokemonEvolutionLines.js` |
| HUD·오라·사거리·진화 CSS | `css/demo.css` |
| 역할 상세 | `docs/role-system.md` |
| 뽑기 정책 | `docs/gen1-gacha-policy.md` |

---

## 14. 변경 이력 (구현 기록)

| 일자 | 항목 | 내용 |
|------|------|------|
| — | **역할** | 진화 가능→단일/범위, 무진화→슬로우/버프 (45/30/15/10) |
| — | **뽑기권** | **타이머 +3**, **SKIP +3**, **보스 +5** |
| — | **역할 가중** | 58/22/12/8% → **52/24/14/10%** |
| — | **등급 배율** | 단일 1단 0.74 통일 폐지 → **라인 깊이별** (3단 라인 1단 0.79 · 2단 라인 1단 0.86 · 무진화 0.82 · 2단 라인 최종 1.06) |
| — | **합성** | 전 단계 3마리 → **1단×2 → 2단**, **2단×3 → 3단**, 이브이 **2마리** |
| — | **진화 UI** | 보관함 `can-evolve`/`evo-line`, 말판 `evo-ready`, 「진화!」뱃지, 버튼 깜빡임 |
| — | ROUND·보스 | 1분 타이머 +3, 10ROUND 전설 보스, 보스 처치 +5 |
| — | UI | 역할 아이콘·가이드, 사거리 원, 버프 ▲, 리롤 3→1장, HUD 텍스트 색 |
| — | 맵 | 체육관 테마 — `map-gym-field.png`, DOM 격자선 제거 |
| — | 전설 조합 | 5종 레시피 · 보관함 UI · [`legendary-combos.md`](legendary-combos.md) |
| — | 상성·패시브 | 단일 상성 · 역할 패시브 3종 · [`type-passives.md`](type-passives.md) |
| — | 유틸 강화 | 무진화 슬로우·버프 2합 → **1/2** · 말판·보관함 표시 |
| — | 적 밸런스 | 라운드 **속도 상승 폐지** → **HP 곡선 강화** |
| — | 가중 뽑기 | 3단 가중 4 · `pickWeightedGachaLine` |
| — | 뽑기권 버그 | `startWave()` 타이머 리셋 제거 · `beginGame`/`advanceRoundByTimer`만 리셋 |
| — | 버프 오라 | 테두리·투명도 조정 (`AURA_BUFF_LINE_ALPHA`) |
| — | 강화 UI | 숫자 `1`/`2` · `uiLayer` · 우상단 오프셋 |
| — | 안정화 | `isUnitSpriteLive` · 제거 시 `sprite = null` |
| — | 상성 버그 | 단일 레이저 `fireLaserBeam` → `resolveAttackHit` |
| — | **전설 역할** | 슬로우·버프 제거 → **단일/범위** (`LEGENDARY_COMBOS.role`) |
| — | **전설 말판 UI** | 역할 뱃지·오라 → **`uiLayer`** (unitLayer 가림 해결) |
| — | **전설 조합 UI** | `.is-owned` · 보유 위치 문구 · 패널 z-index 45 |
| — | **전설 테스트** | `grantTestLegendariesAll()` · readme 개발용 절 |
| — | **텍스처** | 테스트 지급·보관함 배치 시 PNG CDN 로드 |
| — | **구문** | `const layer` 미초기화 → `let layer` (`ensureUnitLegendaryAura`) |

---

## 15. 테스트 · 검증

| 명령 | 내용 |
|------|------|
| `node scripts/test-defense-logic.js` | `PokemonConfig` 로드 · 전설 조합 5종 · 맵 PNG · `demo.css` · 속성 상성 3케이스 |
| `node scripts/test-browser.mjs` | Playwright — 페이지 로드 · 전설 패널 · 뽑기 · START (서버 `npx serve -p 3456` 필요) |
| `node scripts/calc-gacha-role-rates.js` | 74계열 · 가중/균등 깊이·역할 확률 · 계열별 목록 |

### 수동 플레이 테스트 (기록)

- **밸런스**: 10~20분 플레이 — 뽑기권·유틸·상성 체감 **OK** (문서화 시점)
- **뽑기권**: 웨이브마다 타이머 리셋 시 +3 미지급 현상 → 수정 확인
- **합성·공격 중 제거**: `sprite.scale` null → `isUnitSpriteLive` 적용 후 재현 안 함
- **전설 말판 UI**: `grantTestLegendariesAll()` → 배치 후 금링·역할 뱃지·★ 표시 확인
- **전설 조합 패널**: 기보유 시 파란 카드·「보유」·조합 버튼 비활성
