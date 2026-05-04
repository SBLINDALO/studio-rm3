export interface UserPreferences {
  theme: "light" | "dark";
  font: "system" | "serif" | "mono";
  textSize: "compact" | "normal" | "large";
  dailyGoal: number;
  pomodoroDuration: number;
  sound: boolean;
  vibration: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  font: "system",
  textSize: "normal",
  dailyGoal: 5,
  pomodoroDuration: 25,
  sound: true,
  vibration: true,
};
