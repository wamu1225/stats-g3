// 統計検定3級 試験情報の唯一のソース
// 試験要件が変わった場合はこのファイルのみを更新する

export const EXAM_CONFIG = {
  duration: 60,                  // 試験時間（分）
  questionCount: '30問前後',      // 出題数
  passingScore: 70,              // 合格基準（点）
  passingScoreLabel: '100点満点中70点以上',
  passingQuestions: '20〜21問',  // 合格に必要な正解数の目安
  format: 'CBT方式（選択式）',
} as const;
