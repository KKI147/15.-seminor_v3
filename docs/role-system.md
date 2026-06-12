# 역할 시스템 (단일 / 범위 / 슬로우 / 버프)

## 역할 정의

| 역할 | 키 | 전투 특성 | 배치 우선순위(일괄배치) |
|------|-----|----------|-------------------|
| 단일 | `single` | 높은 1대 화력 | 낮음 (경로 뒤 채움) |
| 범위 | `aoe` | 주변 스플래시 | 중간 (경로 인근) |
| 슬로우 | `slow` | 이동속도 감소 | 높음 (경로 최우선) |
| 버프 | `buff` | 주변 타워 공격력 상승 | 높음 (중앙, 경로에서 약간 떨어진 칸) |

## 역할 배분

- **진화 가능** 계열(`line.length > 1`): **단일 45 : 범위 30** (`baseId % 75`)
- **무진화**(`[id]` 단일 라인): **슬로우 15 : 버프 10** (`baseId % 25`)
- **전설 5종(144~151)**: **단일·범위만** — `LEGENDARY_COMBOS[].role` · `getRoleForLegendaryId()` · 유틸 강화·슬로우·버프 **해당 없음**
- 전체 목표 비율(역할 공식): 단일 **45%** · 범위 **30%** · 슬로우 **15%** · 버프 **10%** — **가중 뽑기**로 3단 계열이 많아지면 실제 비율은 달라짐 → [`gen1-gacha-policy.md`](gen1-gacha-policy.md)
- 함수: `getRoleForBaseId(baseId, evolutionLine)` — 계열 **1단 ID** 기준, 진화 후에도 동일 역할 유지
- **속성**(불·물·풀·전기·얼음·에스퍼·드래곤·악): **단일 역할만**
  - `ELEMENT_TYPES`, `getElementForUnit()`, 빔 색 `ELEMENT_BEAM_COLORS`
  - 범위·슬로우·버프: 속성 없음

## 스탯 보정 (단계 스탯 × 역할 × 등급)

| 단계 | damage | range | cooldownMax |
|------|--------|-------|-------------|
| 1단 | 26 | 186 | 58 |
| 2단 | 44 | 210 | 48 |
| 3단 | 82 | 252 | 34 |

**등급 배율** (`POWER_TIER_MUL`) — **라인 깊이·현재 단계** 기준:

| 등급 | 배율 | 조건 |
|------|------|------|
| 3단 라인 1단 | 0.79 | 진화 최종 3단인 계열의 1단 |
| 2단 라인 1단 | 0.86 | 진화 최종 2단인 계열의 1단 |
| 무진화 | 0.82 | 진화 없는 포켓몬 |
| 2단 | 1.0 | 3단 라인 2단 |
| 2단 라인 최종 | 1.06 | 2단까지만 진화하는 계열 2단 |
| 3단 | 1.22 | 3단 라인 3단 |
| 전설 | 1.16 | 전설 ID (3단급 베이스) |

| 역할 | damageMul | rangeMul | cooldownMul |
|------|-----------|----------|-------------|
| 단일 | 1.40 | 1.00 | 1.00 |
| 범위 | 0.52 | 1.06 | 1.05 |
| 슬로우 | 0.62 | 1.14 | 1.00 |
| 버프 | 0.38 | 0.94 | 0.92 |

개체 공속: `pokemonId % 5` → `[1.12, 1.0, 0.92, 0.84, 0.76]`

통합 계산: `getEffectiveStats()` / `getUnitEffectiveStats()`

등급 함수: `getPowerTierMul(pokemonId, evolutionLine, stage)` — `getLineEvolutionDepth()`로 라인 최대 단계(0=무진화, 1=2단까지, 2=3단까지) 판별.

## 합성 진화 (스탯 등급과 별도)

| 단계 | 필요 수 | 상수 |
|------|---------|------|
| 1단 → 2단 | 2마리 | `MERGE_REQUIRED_STAGE1` |
| 2단 → 3단 | 3마리 | `MERGE_REQUIRED_STAGE2` |
| 이브이 분기 | 2마리 | `getMergeRequired(0)` |

- 함수: `getMergeRequired(stage)`, `canUpgradeUnit()`, `performMerge()`, `performStorageMerge()`
- 말판·보관함 모두 동일 규칙

## 유틸 강화 (무진화 슬로우·버프만)

진화 없는 **슬로우·버프** 전용. 진화 합성(1단×2, 2단×3)과 별도입니다.

| 항목 | 값 |
|------|-----|
| 조건 | 같은 종·같은 강화 단계 **2마리** 합성 |
| 상한 | **강화 2** (UI 숫자 `1` · `2`) |
| 말판 자동 합성 | 없음 — 보관함·강화 패널에서만 |

| 역할 | 강화 효과 | 상한 |
|------|-----------|------|
| 슬로우 | 감속 지속 **+0.4초/단계** | 이동 배율 패시브 ×0.42 유지 |
| 버프 | 스택 **가중 +0.5/단계** | 전역 최대 스택 **3** 유지 |

- 상수: `UTILITY_MERGE_REQUIRED`, `UTILITY_MAX_TIER`, `UTILITY_SLOW_MS_PER_TIER`, `UTILITY_BUFF_STACK_PER_TIER`
- 함수: `canUtilityMergeStorageGroup()`, `performUtilityStorageMerge()`, `performUtilityMerge()`, `syncUtilityLevelBadge()`
- UI: 보관함 **「강화!」** · 말판·패널·필드 **우상단 `1`/`2`** (`UTILITY_LEVEL_BADGE_OFFSET`, `uiLayer`)
- 말판 자동 합성(`tryAutoMergeAll`)에서 유틸 타워 **제외**

## 공격 연출

| 역할 | 스타일 | 비고 |
|------|--------|------|
| 단일 | laser / galaga / burst (`ID % 3`) | 속성별 빔 색 |
| 범위 | splash | 몹 위치 즉시 폭발 |
| 슬로우 | frost / galaga | 피격 적 감속 |
| 버프 | spark | 버프 타워 공격 |

## 전투 파라미터

| 항목 | 값 | 설명 |
|------|-----|------|
| `AOE_RADIUS` | 80 | 범위형 스플래시 반경 |
| `AOE_RATIO` | 0.78 | 스플래시 데미지 비율 |
| `SLOW_FACTOR` | 0.5 | 슬로우 감속 배율 |
| `SLOW_MS` | 1800 | 슬로우 지속(ms) |
| `BUFF_RADIUS` | 120 | 버프 사거리(전투) |
| `BUFF_AURA_RADIUS` | 20 | 버프 타워 분홍 오라 (말판 마스크 안) |
| `BUFF_MAX_STACK` | 3 | 버프 중첩 최대 |
| `BUFF_PER_STACK` | 0.28 | 스택당 공격력 배율 |

## 시각 피드백

### 맵 (Pixi)

| 대상 | 연출 |
|------|------|
| 버프 타워 | 발밑 **분홍 링** — 테두리 진·두께 (`AURA_BUFF_LINE`, `AURA_BUFF_LINE_ALPHA`) |
| 유틸 강화 | 말판 **우상단 `1`/`2`** — 버프는 `updateCombatAuras`에서 `uiLayer` 동기화 |
| 버프 수혜 타워 | **빨간 ▲ 2개** 위아래 맥동 (`drawBuffedTowerArrows`) |
| 슬로우 디버프 | 적 발밑 **서리 결정** (삼각 얼음) |
| 타워 우하단 | **역할 아이콘** 18×18 — **`uiLayer`** (`attachRoleBadge`, `getFieldUiLayer`) |
| **전설 타워** | 발밑 **금색 링** + 역할 뱃지 **금테·★** (`drawLegendaryUnitAura`) |
| 타워 선택 시 | **사거리 원** + 「사거리 NNN」 라벨 (`showSelectedRangePreview`, `uiLayer`) |

### DOM (HUD·보관함)

- 보관함·리롤 카드: **역할 뱃지** + 단일 **속성 뱃지**
- **진화 UI** (`css/demo.css`):
  - `.storage-card.can-evolve` — 노란 테두리 + `evo-ready-pulse` 깜빡임
  - `.evo-ready-badge` — 「진화!」뱃지
  - `.storage-card.evo-line` / `.evo-line-mark` — 진화 라인 보유(↑)
  - `.grid-cell.evo-ready` — 말판 합성 가능 칸
  - `.btn-upgrade:not(:disabled)` — 강화 패널 버튼 깜빡임
- 오른쪽 **역할 가이드** 패널 (4역할 설명)
- 강화 패널: **현재 사거리** 배지, 역할 아이콘+설명, 스탯 비교, 합성 필요 수 (`getMergeRequired`)

### 역할 아이콘 의미

| 아이콘 | 역할 |
|--------|------|
| ● 노랑 | 단일 |
| ○ 주황 | 범위 |
| ▲ 하늘 | 슬로우 |
| ··· 분홍 | 버프 |

## 일괄 배치 (`deployAllFromStorage`)

1. 역할별 분류 → 빈 칸 배치
2. 우선순위: **슬로우 → 버프 → 범위 → 단일**
3. `scoreDeployCell` — 슬로우는 경로 근처, 버프는 중앙·경로 이격 등
4. `deployWeight`: 슬로우 1.4, 버프 1.6, 범위 1.2, 단일 1.0

## 코드 위치

- `js/gameDemo.js`: `ROLE`, `getRoleForBaseId`, `getRoleForLegendaryId`, `getFieldUiLayer`, `attachRoleBadge`, `removeRoleBadge`, `drawLegendaryUnitAura`, `syncLegendaryRoles`, `updateCombatAuras`, `grantTestLegendariesAll`
- `css/demo.css`: `.role-badge`, `.element-badge`, `.role-guide`, `.tower-range-badge`, `.can-evolve`, `.evo-ready`, `.evo-ready-pulse`
- `docs/game-mechanics.md`: 전체 게임 규칙 · 변경·테스트 §14~15
- `scripts/calc-gacha-role-rates.js`: 가중 뽑기 역할 비율
- `docs/gen1-gacha-policy.md`: 관동 뽑기·합성 정책

## 변경 이력 (요약)

| 항목 | 변경 |
|------|------|
| 역할 | 58/22/12/8% → **진화 가능=단일·범위(45:30), 무진화=슬로우·버프(15:10)** |
| 등급 | 1단 0.74 단일 → **라인 깊이별** (0.79 / 0.86 / 0.82 / 1.06 등) |
| 합성 | 3마리 고정 → **1단×2, 2단×3** |
| 유틸 강화 | 무진화 슬로우·버프 **2합 → 1/2** |
| UI | 진화 가능 깜빡임·뱃지 추가 |
| 가중 뽑기 | 3단 계열 비율 상승 → 실제 역할 비율 변동 |
| 버프 오라 | 테두리 가시성 강화 |
| 강화 숫자 | `Lv` 접두 제거 · 우상단 위치 · `uiLayer` |
| 안정화 | `isUnitSpriteLive` — 공격 콜백·제거 후 `scale` 오류 방지 |
| **전설** | 단일/범위 고정 · `uiLayer` 말판 UI · 조합 패널 보유 표시 |
| 필드 UI | `unitLayer` → **`uiLayer`** (전설·유틸 뱃지 가림 해결) |

상세: [`game-mechanics.md`](game-mechanics.md) §11 · §14~15 · [`legendary-combos.md`](legendary-combos.md)

## 테스트 · 검증

| 항목 | 방법 | 결과 |
|------|------|------|
| 로직 스모크 | `test-defense-logic.js` | 역할·상성·에셋 OK |
| 유틸 합성 | 보관함 2합 → 티어 1·2 | 슬로우·버프 상한 동작 |
| 강화 UI | 말판 배치 후 필드 숫자 | 버프 오라 위에 표시 |
| 밸런스 | 10~20분 플레이 | 체감 OK (기록 시점) |
| 전설 말판 | `grantTestLegendariesAll` → 금링·★·역할 뱃지 | 수동 확인 |

## 속성 상성 · 역할 패시브

- **단일**: 8속성 상성 — 효과적 ×1.35 · 약함 ×0.75 ([`type-passives.md`](type-passives.md))
- **범위**: 스플래시 데미지 ×1.12
- **슬로우**: 감속 2.3초 · 이동 ×0.42
- **버프**: 버프 사거리 148px (기본 120+28)
- 적 속성: `pokemonId % 8` (타워와 동일 규칙)

## 추후 확장 (예정)

- ~~전설 5종 조합~~ → [`legendary-combos.md`](legendary-combos.md) 구현
