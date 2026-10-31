/**
 * 저장 기능은 이 파일 하나로 모읍니다.
 * 지금은 localStorage를 쓰지만, 나중에 Supabase 같은 서버 저장으로 바꿀 때
 * SaveStore 인터페이스를 구현한 새 클래스만 만들어 아래 `saveStore`를 교체하면 됩니다.
 */
export interface SaveData {
  bestScore: number;
  /** 가장 멀리 간 스테이지 */
  bestStage: number;
  playCount: number;
  /** 나중에 '사라진 양말 도감'에 쓸 자리 */
  collection: string[];
}

export interface SaveStore {
  load(): SaveData;
  save(data: SaveData): void;
}

const DEFAULT_DATA: SaveData = { bestScore: 0, bestStage: 0, playCount: 0, collection: [] };

export class LocalSaveStore implements SaveStore {
  constructor(private readonly key = 'matchyangmal.save.v1') {}

  load(): SaveData {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { ...DEFAULT_DATA };
      return { ...DEFAULT_DATA, ...(JSON.parse(raw) as Partial<SaveData>) };
    } catch {
      return { ...DEFAULT_DATA };
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // 사생활 보호 모드 등에서 저장이 막혀도 게임은 계속 돌아가게 둡니다.
    }
  }
}

export const saveStore: SaveStore = new LocalSaveStore();

/** 한 판이 끝났을 때 기록을 반영하고, 최고 기록 갱신 여부를 돌려줍니다. */
export function recordResult(score: number, stage: number): { best: number; isNewBest: boolean; bestStage: number } {
  const data = saveStore.load();
  const isNewBest = score > data.bestScore;
  data.playCount += 1;
  if (isNewBest) data.bestScore = score;
  data.bestStage = Math.max(data.bestStage, stage);
  saveStore.save(data);
  return { best: data.bestScore, isNewBest, bestStage: data.bestStage };
}
