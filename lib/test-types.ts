/** أنواع مشتركة بين مكوّنات الاختبار (عميل) وواجهة الـAPI. */

export type PublicChoice = { id: string; choice_text: string };

export type PublicQuestion = {
  id: string;
  question_text: string;
  points: number;
  choices: PublicChoice[];
};

export type StartAttemptResponse = {
  attemptId: string;
  testTitle: string;
  passScore: number;
  timeLimitMinutes: number;
  questions: PublicQuestion[];
};

export type SubmitAttemptResponse = {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passScore: number;
  certificate: {
    certificateNo: string;
    verifyUrl: string;
    pdfUrl: string | null;
  } | null;
  warning?: string;
};

export type RegistrationValues = {
  traineeName: string;
  discordUsername: string;
  discordId: string;
  realAge: string;
  currentRank: string;
};

export type SuspicionFlag = { type: string; at: string };
