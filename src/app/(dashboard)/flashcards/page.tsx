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
import { ChevronLeft, ChevronRight, Layers, Loader2, Sparkles } from "lucide-react";



interface Flashcard {
  id: string;
  frontText: string;
  backText: string;
}

interface FlashcardDeck {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  cards?: Flashcard[];
  flashcards?: Flashcard[];
}

interface FlashcardsResponse {
  decks?: FlashcardDeck[];
}

interface GenerateFlashcardsResponse {
  deck?: FlashcardDeck;
}

const getDeckCards = (deck: FlashcardDeck | null) => {
  return deck?.cards ?? deck?.flashcards ?? [];
};

function FlashcardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);


  const currentCards = useMemo(() => getDeckCards(selectedDeck), [selectedDeck]);
  const currentCard = currentCards[currentCardIndex] ?? null;
  const isFirstCard = currentCardIndex === 0;
  const isLastCard =
    currentCards.length === 0 || currentCardIndex === currentCards.length - 1;



  const fetchDecks = useCallback(async (preferredDeckId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcards", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Flashcards request failed with status ${response.status}.`,
        );
      }

      const data = (await response.json()) as FlashcardsResponse;
      const nextDecks = data.decks ?? [];
      const nextSelectedDeck =
        nextDecks.find((deck) => deck.id === preferredDeckId) ??
        nextDecks[0] ??
        null;

      setDecks(nextDecks);
      setSelectedDeck(nextSelectedDeck);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (fetchError) {
      console.error("Failed to fetch flashcard decks:", fetchError);
      setError("Flashcard decks could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchDecks();
    });
  }, [fetchDecks]);

  useEffect(() => {
    if (searchParams.get("autoGenerate") !== "true") {
      return;
    }

    queueMicrotask(() => {
      setIsModalOpen(true);
      router.replace("/flashcards", { scroll: false });
    });
  }, [router, searchParams]);

  const handleSelectDeck = (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleGenerateDeck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const topic = generateTopic.trim();

    if (!topic || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(
          `Flashcard generation request failed with status ${response.status}.`,
        );
      }

      const data = (await response.json()) as GenerateFlashcardsResponse;

      setIsModalOpen(false);
      setGenerateTopic("");
      await fetchDecks(data.deck?.id);
    } catch (generateError) {
      console.error("Failed to generate flashcard deck:", generateError);
    } finally {
      setIsGenerating(false);
    }
  };

  const goToPreviousCard = () => {
    if (currentCards.length === 0 || currentCardIndex === 0) {
      return;
    }

    setCurrentCardIndex((currentIndex) => Math.max(0, currentIndex - 1));
    setIsFlipped(false);
  };

  const goToNextCard = () => {
    if (
      currentCards.length === 0 ||
      currentCardIndex >= currentCards.length - 1
    ) {
      return;
    }

    setCurrentCardIndex((currentIndex) =>
      Math.min(currentCards.length - 1, currentIndex + 1),
    );
    setIsFlipped(false);
  };

  return (
    <>
    <div className="mx-auto max-w-7xl animate-fade-in-up space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#0f172a]">
          Flashcards
        </h1>
        <p className="text-[#64748b]">
          Review your saved decks with focused, interactive study cards.
        </p>
      </div>

      <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[20rem_1fr]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950">Decks</h2>
                <p className="text-xs text-slate-500">{decks.length} saved</p>
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
              Generate with AI
            </button>
          </div>

          <div className="max-h-[22rem] space-y-2 overflow-y-auto p-4 lg:max-h-none">
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading decks...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : decks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                No flashcard decks yet.
              </div>
            ) : (
              decks.map((deck) => {
                const isSelected = deck.id === selectedDeck?.id;
                const cards = getDeckCards(deck);

                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => handleSelectDeck(deck)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-100 hover:bg-slate-50"
                    }`}
                  >
                    <p className="truncate text-sm font-bold">{deck.title}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isSelected ? "text-indigo-500" : "text-slate-400"
                      }`}
                    >
                      {cards.length} cards
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[34rem] flex-col items-center justify-center bg-slate-50 px-5 py-8">
          {!selectedDeck ? (
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Layers className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">
                Select a deck
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose a flashcard deck from the left panel to start studying.
              </p>
            </div>
          ) : currentCards.length === 0 ? (
            <div className="max-w-md text-center">
              <h2 className="text-xl font-bold text-slate-950">
                This deck is empty
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Generate or add cards before starting a review session.
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-950">
                  {selectedDeck.title}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Card {currentCardIndex + 1} of {currentCards.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFlipped((current) => !current)}
                className="h-64 w-full max-w-md [perspective:1000px]"
                aria-label="Flip flashcard"
              >
                <div
                  className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  <div className="absolute flex h-full w-full cursor-pointer items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm [backface-visibility:hidden] dark:bg-[#09090b]">
                    <p className="text-xl font-bold leading-8 text-slate-900 dark:text-slate-100">
                      {currentCard?.frontText}
                    </p>
                  </div>
                  <div className="absolute flex h-full w-full cursor-pointer items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 p-8 text-center text-indigo-700 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-indigo-900/20 dark:text-indigo-300">
                    <p className="text-lg font-semibold leading-8">
                      {currentCard?.backText}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-8 flex w-full max-w-md items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goToPreviousCard}
                  disabled={isFirstCard}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Card
                </button>
                <button
                  type="button"
                  onClick={goToNextCard}
                  disabled={isLastCard}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next Card
                  <ChevronRight className="h-4 w-4" />
                </button>
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
                  Generate Flashcards with AI
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Enter the topic you want to study, and StudyFlow AI will
                  prepare a deck for you.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateDeck} className="space-y-4">
              <div>
                <label
                  htmlFor="flashcard-topic"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Topic
                </label>
                <input
                  id="flashcard-topic"
                  value={generateTopic}
                  onChange={(event) => setGenerateTopic(event.target.value)}
                  placeholder="e.g., React Hooks, Ottoman history, SQL joins..."
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
                  {isGenerating ? "Generating Cards..." : "Generate Cards"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[24rem] max-w-7xl items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      }
    >
      <FlashcardsContent />
    </Suspense>
  );
}
