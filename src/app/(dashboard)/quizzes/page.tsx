"use client";

import {
  Suspense,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  id: string;
  title: string;
  score: number | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

interface QuizzesResponse {
  quizzes?: Quiz[];
}

interface GenerateQuizResponse {
  quiz?: Quiz;
}

const getOptionStyle = ({
  option,
  selectedAnswer,
  correctAnswer,
}: {
  option: string;
  selectedAnswer: string | undefined;
  correctAnswer: string;
}) => {
  const isCorrectAnswer = option === correctAnswer;
  const isSelectedAnswer = option === selectedAnswer;

  if (isSelectedAnswer && isCorrectAnswer) {
    return "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-soft-sm";
  }

  if (isSelectedAnswer && !isCorrectAnswer) {
    return "border-rose-400 bg-rose-50 text-rose-700 shadow-soft-sm";
  }

  if (isCorrectAnswer) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 font-black";
  }

  return "border-border bg-white/80 text-slate-700";
};

function QuizzesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const questions = selectedQuiz?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion =
    questions.length === 0 || currentQuestionIndex === questions.length - 1;

  const results = useMemo(() => {
    if (!selectedQuiz) {
      return { correct: 0, wrong: 0, empty: 0 };
    }

    return selectedQuiz.questions.reduce(
      (totals, question) => {
        const answer = userAnswers[question.id];

        if (!answer) {
          return { ...totals, empty: totals.empty + 1 };
        }

        if (answer === question.correctAnswer) {
          return { ...totals, correct: totals.correct + 1 };
        }

        return { ...totals, wrong: totals.wrong + 1 };
      },
      { correct: 0, wrong: 0, empty: 0 },
    );
  }, [selectedQuiz, userAnswers]);

  const resetQuizState = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsFinished(false);
  };

  const fetchQuizzes = useCallback(
    async (preferredQuizId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/quizzes", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Quizzes request failed with status ${response.status}.`,
          );
        }

        const data = (await response.json()) as QuizzesResponse;
        const nextQuizzes = data.quizzes ?? [];
        const nextSelectedQuiz =
          nextQuizzes.find((quiz) => quiz.id === preferredQuizId) ??
          nextQuizzes[0] ??
          null;

        setQuizzes(nextQuizzes);
        setSelectedQuiz(nextSelectedQuiz);
        resetQuizState();
      } catch (fetchError) {
        console.error("Failed to fetch quizzes:", fetchError);
        setError("Quizzes could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void fetchQuizzes();
    });
  }, [fetchQuizzes]);

  useEffect(() => {
    if (searchParams.get("autoGenerate") !== "true") {
      return;
    }

    queueMicrotask(() => {
      setIsModalOpen(true);
      router.replace("/quizzes", { scroll: false });
    });
  }, [router, searchParams]);

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    resetQuizState();
  };

  const handleGenerateQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const topic = generateTopic.trim();

    if (!topic || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(
          `Quiz generation request failed with status ${response.status}.`,
        );
      }

      const data = (await response.json()) as GenerateQuizResponse;

      setIsModalOpen(false);
      setGenerateTopic("");
      await fetchQuizzes(data.quiz?.id);
    } catch (generateError) {
      console.error("Failed to generate quiz:", generateError);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAnswer = (questionId: string, option: string) => {
    setUserAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: option,
    }));
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex === 0) {
      return;
    }

    setCurrentQuestionIndex((currentIndex) => Math.max(0, currentIndex - 1));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      return;
    }

    setCurrentQuestionIndex((currentIndex) =>
      Math.min(questions.length - 1, currentIndex + 1),
    );
  };

  return (
    <>
      <div className="mx-auto max-w-7xl animate-fade-in-up space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-muted shadow-soft-sm">
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
              Recall Lab
            </div>
            <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground">
              Quizzes
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-6 text-muted">
              Generate focused tests and move through each question with a
              calmer, more responsive solving flow.
            </p>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-soft-lg backdrop-blur-xl lg:grid-cols-[21rem_1fr]">
          <aside className="border-b border-white/70 bg-surface/72 backdrop-blur lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground">
                    Quiz Sets
                  </h2>
                  <p className="text-xs font-bold text-muted">
                    {quizzes.length} saved
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-border/70 p-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-black text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.015] hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/15"
              >
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-6" />
                Generate Quiz
              </button>
            </div>

            <div className="max-h-[22rem] space-y-2 overflow-y-auto p-4 lg:max-h-none">
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading quizzes...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                  {error}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface-muted/70 px-4 py-5 text-sm font-medium leading-6 text-muted">
                  No quizzes yet.
                </div>
              ) : (
                quizzes.map((quiz) => {
                  const isSelected = quiz.id === selectedQuiz?.id;

                  return (
                    <button
                      key={quiz.id}
                      type="button"
                      onClick={() => handleSelectQuiz(quiz)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                        isSelected
                          ? "border-primary/20 bg-primary-soft text-primary shadow-soft-sm"
                          : "border-border bg-white/80 text-slate-700 hover:border-primary/15 hover:bg-white hover:shadow-soft-sm"
                      }`}
                    >
                      <p className="truncate text-sm font-black">
                        {quiz.title}
                      </p>
                      <p
                        className={`mt-1 text-xs font-bold ${
                          isSelected ? "text-primary" : "text-subtle"
                        }`}
                      >
                        {quiz.questions.length} questions
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[34rem] flex-col bg-[linear-gradient(180deg,rgba(246,247,251,0.66),rgba(255,255,255,0.72))] px-5 py-8">
            {!selectedQuiz ? (
              <div className="m-auto max-w-md text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-foreground text-white shadow-soft">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Select a quiz
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-muted">
                  Choose a quiz from the left panel to start solving questions.
                </p>
              </div>
            ) : selectedQuiz.questions.length === 0 ? (
              <div className="m-auto max-w-md text-center">
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  This quiz is empty
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-muted">
                  Generate a new quiz before starting a session.
                </p>
              </div>
            ) : isFinished ? (
              <div className="mx-auto w-full max-w-4xl animate-fade-in-up">
                <div className="mb-6 rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft-lg backdrop-blur">
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">
                        Session Summary
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                        {selectedQuiz.title}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 text-center shadow-soft-sm">
                      <p className="text-3xl font-black text-emerald-700">
                        {results.correct}
                      </p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                        Correct
                      </p>
                    </div>
                    <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-5 text-center shadow-soft-sm">
                      <p className="text-3xl font-black text-rose-700">
                        {results.wrong}
                      </p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-rose-600">
                        Wrong
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border bg-surface-muted/80 p-5 text-center shadow-soft-sm">
                      <p className="text-3xl font-black text-foreground">
                        {results.empty}
                      </p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-muted">
                        Empty
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedQuiz.questions.map((question, questionIndex) => {
                    const selectedAnswer = userAnswers[question.id];

                    return (
                      <div
                        key={question.id}
                        className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-soft-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sm font-black text-primary">
                            {questionIndex + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-black leading-7 text-foreground">
                              {question.questionText}
                            </h3>
                            <div className="mt-4 space-y-2">
                              {question.options.map((option) => {
                                const isCorrectAnswer =
                                  option === question.correctAnswer;
                                const isSelectedWrong =
                                  selectedAnswer === option && !isCorrectAnswer;

                                return (
                                  <div
                                    key={option}
                                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors duration-300 ${getOptionStyle(
                                      {
                                        option,
                                        selectedAnswer,
                                        correctAnswer: question.correctAnswer,
                                      },
                                    )}`}
                                  >
                                    <span>{option}</span>
                                    {isCorrectAnswer && (
                                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                    )}
                                    {isSelectedWrong && (
                                      <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentQuestionIndex(0);
                  }}
                  className="mt-6 h-12 rounded-full bg-foreground px-6 text-sm font-black text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  Back to Quiz
                </button>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-3xl font-black tracking-tight text-foreground">
                    {selectedQuiz.title}
                  </h2>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{
                        width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm font-bold text-muted">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                </div>

                <div
                  key={currentQuestion?.id}
                  className="animate-slide-up rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft-lg backdrop-blur"
                >
                  <h3 className="text-xl font-black leading-8 tracking-tight text-foreground">
                    {currentQuestion?.questionText}
                  </h3>
                  <div className="mt-6 space-y-3">
                    {currentQuestion?.options.map((option) => {
                      const isSelected =
                        userAnswers[currentQuestion.id] === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            selectAnswer(currentQuestion.id, option)
                          }
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all duration-300 ${
                            isSelected
                              ? "border-primary/25 bg-primary-soft text-primary shadow-soft-sm"
                              : "border-border bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-white hover:shadow-soft-sm"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={goToPreviousQuestion}
                    disabled={isFirstQuestion}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-black text-slate-700 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:text-primary hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Question
                  </button>

                  {isLastQuestion ? (
                    <button
                      type="button"
                      onClick={() => setIsFinished(true)}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-black text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/10"
                    >
                      Finish Quiz
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-black text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/10"
                    >
                      Next Question
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-md">
          <div className="w-full max-w-md animate-slide-up rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-soft-lg backdrop-blur-xl">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-foreground">
                  Generate Quiz with AI
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-muted">
                  Enter the topic you want to practice, and StudyFlow AI will
                  prepare a multiple-choice quiz for you.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div>
                <label
                  htmlFor="quiz-topic"
                  className="mb-2 block text-sm font-black text-foreground"
                >
                  Topic
                </label>
                <input
                  id="quiz-topic"
                  value={generateTopic}
                  onChange={(event) => setGenerateTopic(event.target.value)}
                  placeholder="e.g., JavaScript closures, photosynthesis, World War II..."
                  className="h-12 w-full rounded-2xl border border-border bg-surface-muted px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-subtle focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isGenerating}
                  className="h-10 rounded-full border border-border bg-white px-4 text-sm font-black text-muted transition hover:bg-surface-muted focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!generateTopic.trim() || isGenerating}
                  className="flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-black text-white shadow-soft-sm transition hover:scale-[1.02] hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isGenerating ? "Generating Quiz..." : "Generate Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function QuizzesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[24rem] max-w-7xl items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <QuizzesContent />
    </Suspense>
  );
}
