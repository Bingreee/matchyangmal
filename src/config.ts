/**
 * 조정할 수치는 전부 여기에 모아 둡니다.
 * 플레이해 보고 재미에 맞게 숫자만 바꾸면 됩니다.
 */
export const GAME_CONFIG = {
  /** 게임 기준 해상도 (세로 화면). 실제 폰 화면에는 비율에 맞춰 늘리고 줄입니다. */
  width: 720,
  height: 1280,

  /** 한 판에 나오는 양말 짝 수 (양말 개수 = 짝 수 × 2) */
  pairCount: 6,

  /** 제한 시간 (초) */
  timeLimitSec: 60,

  /** 틀린 짝을 골랐을 때 깎이는 시간 (초). 0이면 감점 없음 */
  wrongPenaltySec: 3,
  /** 틀린 짝을 골랐을 때 콤보를 초기화할지 */
  wrongResetsCombo: true,

  /** 짝 하나 맞출 때 기본 점수 */
  matchScore: 100,
  /** 이 시간(ms) 안에 다음 짝을 맞추면 콤보가 이어짐 */
  comboWindowMs: 2500,
  /** 콤보 1단계마다 더해지는 점수 (2콤보 = +50, 3콤보 = +100 ...) */
  comboBonusPerStep: 50,
  /** 클리어 시 남은 시간 1초당 보너스 점수 */
  timeBonusPerSec: 10,

  /** 양말 배치 */
  layout: {
    /** 양말이 놓이는 영역 (HUD 아래) */
    areaTop: 230,
    areaBottom: 1220,
    areaSide: 40,
    columns: 3,
    /** 칸 안에서 흔들리는 정도 (0~1, 칸 크기 대비) */
    jitter: 0.28,
    /** 최대 기울기 (도) */
    maxRotationDeg: 28,
    /** 양말 크기 배율 (터치 영역도 같이 커짐) */
    sockScale: 1.0,
  },

  /** 양말 무늬 */
  sock: {
    /** 파스텔 바탕색 후보 (짝 수보다 많아야 서로 다른 색이 나옴) */
    colors: [0xffb3c7, 0xa8d8ff, 0xb9f0c9, 0xffe29a, 0xd4bfff, 0xffc9a3, 0x9fe6e0, 0xf7b7ec],
    /** 줄무늬 개수 후보 */
    stripeCounts: [0, 1, 2, 3],
    /** 줄무늬 색 */
    stripeColor: 0xffffff,
  },

  /** 색 테마 */
  theme: {
    background: 0xf6f1ff,
    bubble: 0xffffff,
    text: '#5b5470',
    accent: '#ff7fa6',
    good: '#4fb48a',
    bad: '#ff6b81',
    button: 0xff9fbd,
    buttonText: '#ffffff',
    font: '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
  },
} as const;

export type GameConfig = typeof GAME_CONFIG;
