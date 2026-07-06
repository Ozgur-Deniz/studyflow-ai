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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-muted shadow-soft-sm">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Memory Studio
        </div>
        <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground">
          Flashcards
        </h1>
        <p className="max-w-2xl text-sm font-medium leading-6 text-muted">
          Review your saved decks with focused, interactive study cards.
        </p>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-soft-lg backdrop-blur-xl lg:grid-cols-[21rem_1fr]">
        <aside className="border-b border-white/70 bg-surface/72 backdrop-blur lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">Decks</h2>
                <p className="text-xs font-bold text-muted">{decks.length} saved</p>
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
              Generate with AI
            </button>
          </div>

          <div className="max-h-[22rem] space-y-2 overflow-y-auto p-4 lg:max-h-none">
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading decks...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                {error}
              </div>
            ) : decks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface-muted/70 px-4 py-5 text-sm font-medium leading-6 text-muted">
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
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-primary/20 bg-primary-soft text-primary shadow-soft-sm"
                        : "border-border bg-white/80 text-slate-700 hover:border-primary/15 hover:bg-white hover:shadow-soft-sm"
                    }`}
                  >
                    <p className="truncate text-sm font-black">{deck.title}</p>
                    <p
                      className={`mt-1 text-xs font-bold ${
                        isSelected ? "text-primary" : "text-subtle"
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

        <section className="flex min-h-[34rem] flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(246,247,251,0.66),rgba(255,255,255,0.72))] px-5 py-8">
          {!selectedDeck ? (
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-foreground text-white shadow-soft">
                <Layers className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Select a deck
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">
                Choose a flashcard deck from the left panel to start studying.
              </p>
            </div>
          ) : currentCards.length === 0 ? (
            <div className="max-w-md text-center">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                This deck is empty
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">
                Generate or add cards before starting a review session.
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {selectedDeck.title}
                </h2>
                <p className="mt-2 text-sm font-bold text-muted">
                  Card {currentCardIndex + 1} of {currentCards.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFlipped((current) => !current)}
                className="group h-80 w-full max-w-xl cursor-pointer [perspective:1400px]"
                aria-label="Flip flashcard"
              >
                <div
                  key={currentCard?.id}
                  className={`relative h-full w-full animate-scale-in transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-style:preserve-3d] ${
                    isFlipped
                      ? "[transform:rotateY(180deg)] group-hover:[transform:translateY(-0.5rem)_rotateY(180deg)]"
                      : "group-hover:[transform:translateY(-0.5rem)]"
                  }`}
                >
                  <div className="absolute flex h-full w-full items-center justify-center rounded-[2rem] border border-white/80 bg-white/90 p-10 text-center shadow-soft-lg backdrop-blur [backface-visibility:hidden]">
                    <div className="absolute left-6 top-6 rounded-full border border-border bg-surface-muted px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-muted">
                      Front
                    </div>
                    <p className="max-w-md text-2xl font-black leading-9 tracking-tight text-foreground">
                      {currentCard?.frontText}
                    </p>
                  </div>
                  <div className="absolute flex h-full w-full items-center justify-center rounded-[2rem] border border-primary/20 bg-primary-soft p-10 text-center text-primary shadow-soft-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="absolute left-6 top-6 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                      Back
                    </div>
                    <p className="max-w-md text-xl font-extrabold leading-8">
                      {currentCard?.backText}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-8 flex w-full max-w-xl items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goToPreviousCard}
                  disabled={isFirstCard}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-black text-slate-700 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:text-primary hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Card
                </button>
                <button
                  type="button"
                  onClick={goToNextCard}
                  disabled={isLastCard}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-black text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-soft-lg backdrop-blur-xl animate-slide-up">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-foreground">
                  Generate Flashcards with AI
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-muted">
                  Enter the topic you want to study, and StudyFlow AI will
                  prepare a deck for you.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateDeck} className="space-y-4">
              <div>
                <label
                  htmlFor="flashcard-topic"
                  className="mb-2 block text-sm font-black text-foreground"
                >
                  Topic
                </label>
                <input
                  id="flashcard-topic"
                  value={generateTopic}
                  onChange={(event) => setGenerateTopic(event.target.value)}
                  placeholder="e.g., React Hooks, Ottoman history, SQL joins..."
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
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <FlashcardsContent />
    </Suspense>
  );
}
