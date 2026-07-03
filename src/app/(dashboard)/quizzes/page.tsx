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
    return "border-green-500 bg-green-100 text-green-800";
  }

  if (isSelectedAnswer && !isCorrectAnswer) {
    return "border-red-500 bg-red-100 text-red-800";
  }

  if (isCorrectAnswer) {
    return "border-green-500 bg-green-50 text-green-800 font-bold";
  }

  return "border-slate-200 bg-white text-slate-700";
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
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">
            Quizzes
          </h1>
          <p className="text-slate-500">
            Generate and solve multiple-choice tests for active recall.
          </p>
        </div>

        <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[20rem_1fr]">
          <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Quizzes</h2>
                  <p className="text-xs text-slate-500">
                    {quizzes.length} saved
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <Sparkles className="h-4 w-4" />
                Generate Quiz with AI
              </button>
            </div>

            <div className="max-h-[22rem] space-y-2 overflow-y-auto p-4 lg:max-h-none">
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading quizzes...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
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
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-100 hover:bg-slate-50"
                      }`}
                    >
                      <p className="truncate text-sm font-bold">{quiz.title}</p>
                      <p
                        className={`mt-1 text-xs ${
                          isSelected ? "text-indigo-500" : "text-slate-400"
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

          <section className="flex min-h-[34rem] flex-col bg-slate-50 px-5 py-8">
            {!selectedQuiz ? (
              <div className="m-auto max-w-md text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-950">
                  Select a quiz
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose a quiz from the left panel to start solving questions.
                </p>
              </div>
            ) : selectedQuiz.questions.length === 0 ? (
              <div className="m-auto max-w-md text-center">
                <h2 className="text-xl font-bold text-slate-950">
                  This quiz is empty
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Generate a new quiz before starting a session.
                </p>
              </div>
            ) : isFinished ? (
              <div className="mx-auto w-full max-w-3xl">
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-950">
                    {selectedQuiz.title}
                  </h2>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
                      <p className="text-2xl font-black text-green-700">
                        {results.correct}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-600">
                        Correct
                      </p>
                    </div>
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
                      <p className="text-2xl font-black text-red-700">
                        {results.wrong}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-red-600">
                        Wrong
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-2xl font-black text-slate-700">
                        {results.empty}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Empty
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {selectedQuiz.questions.map((question, questionIndex) => {
                    const selectedAnswer = userAnswers[question.id];

                    return (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <h3 className="text-base font-bold leading-7 text-slate-950">
                          {questionIndex + 1}. {question.questionText}
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
                                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${getOptionStyle(
                                  {
                                    option,
                                    selectedAnswer,
                                    correctAnswer: question.correctAnswer,
                                  },
                                )}`}
                              >
                                <span>{option}</span>
                                {isCorrectAnswer && (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                                )}
                                {isSelectedWrong && (
                                  <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                                )}
                              </div>
                            );
                          })}
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
                  className="mt-6 h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  Back to Quiz
                </button>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-950">
                    {selectedQuiz.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-bold leading-8 text-slate-950">
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
                          className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
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
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Question
                  </button>

                  {isLastQuestion ? (
                    <button
                      type="button"
                      onClick={() => setIsFinished(true)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      Finish Quiz
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Generate Quiz with AI
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Enter the topic you want to practice, and StudyFlow AI will
                  prepare a multiple-choice quiz for you.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div>
                <label
                  htmlFor="quiz-topic"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Topic
                </label>
                <input
                  id="quiz-topic"
                  value={generateTopic}
                  onChange={(event) => setGenerateTopic(event.target.value)}
                  placeholder="e.g., JavaScript closures, photosynthesis, World War II..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isGenerating}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!generateTopic.trim() || isGenerating}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
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
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      }
    >
      <QuizzesContent />
    </Suspense>
  );
}
