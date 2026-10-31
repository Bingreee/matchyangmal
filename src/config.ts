/**
 * 조정할 수치는 전부 여기에 모아 둡니다.
 * 플레이해 보고 재미에 맞게 숫자만 바꾸면 됩니다.
 */
export const GAME_CONFIG = {
  /** 게임 기준 해상도 (세로 화면). 실제 폰 화면에는 비율에 맞춰 늘리고 줄입니다. */
  width: 720,
  height: 1280,

  /**
   * 스테이지 표. 클리어하면 다음 줄로 넘어갑니다.
   * - pairs: 양말 짝 수 (양말 개수 = 짝 × 2)
   * - timeSec: 제한 시간 (초)
   * - colors: 쓰는 바탕색 수. 짝 수보다 적으면 '같은 색, 다른 줄 수' 양말이 섞여 어려워집니다.
   * - scale: 양말 크기 배율 (양말이 많을수록 작게)
   */
  stages: [
    { pairs: 6, timeSec: 35, colors: 6, scale: 1.0 },
    { pairs: 8, timeSec: 40, colors: 6, scale: 0.95 },
    { pairs: 10, timeSec: 45, colors: 5, scale: 0.9 },
    { pairs: 12, timeSec: 50, colors: 4, scale: 0.85 },
  ],
  /** 마지막 스테이지 이후로는 같은 구성에 시간만 줄어듭니다 */
  endless: {
    timeDropSec: 3,
    minTimeSec: 30,
  },

  /** 별점 기준: 남은 시간 비율이 이 이상이면 별 3개 / 2개 (아니면 1개) */
  stars: { three: 0.45, two: 0.2 },

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

  /** 양말 더미가 쌓이는 빨래 매트 영역 */
  tray: {
    left: 24,
    right: 696,
    top: 250,
    bottom: 1250,
    /** 매트 가장자리에서 양말 중심까지 띄우는 거리 */
    padding: 70,
  },

  /** 양말 더미 배치 */
  layout: {
    /** 양말 중심끼리 최소 거리 (px). 작을수록 많이 겹쳐서 어려워짐 */
    minDistance: 92,
    /** 최대 기울기 (도) */
    maxRotationDeg: 40,
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
