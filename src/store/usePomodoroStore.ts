import { create } from "zustand";

type PomodoroMode = "focus" | "shortBreak" | "longBreak";

type PomodoroState = {
  timeLeft: number;
  isRunning: boolean;
  mode: PomodoroMode;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setMode: (mode: PomodoroMode) => void;
};

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const usePomodoroStore = create<PomodoroState>((set) => ({
  timeLeft: MODE_DURATIONS.focus,
  isRunning: false,
  mode: "focus",

  startTimer: () => {
    set((state) => ({
      isRunning: state.timeLeft > 0,
    }));
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  resetTimer: () => {
    set((state) => ({
      timeLeft: MODE_DURATIONS[state.mode],
      isRunning: false,
    }));
  },

  tick: () => {
    set((state) => {
      if (!state.isRunning) {
        return state;
      }

      if (state.timeLeft <= 1) {
        return {
          timeLeft: 0,
          isRunning: false,
        };
      }

      return {
        timeLeft: state.timeLeft - 1,
      };
    });
  },

  setMode: (mode) => {
    set({
      mode,
      timeLeft: MODE_DURATIONS[mode],
      isRunning: false,
    });
  },
}));
