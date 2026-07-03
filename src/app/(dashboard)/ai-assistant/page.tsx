"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  ArrowUp,
  BookOpen,
  Bot,
  ChevronDown,
  ClipboardList,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Paperclip,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface ApiMessage {
  id: string;
  role: string;
  content: string;
}

interface HistoryResponse {
  messages?: ApiMessage[];
}

interface ConversationsResponse {
  conversations?: Conversation[];
}

interface AttachedFilePayload {
  base64: string;
  mimeType: string;
  name: string;
}

type ResourceType = "flashcard" | "quiz";

const DEFAULT_CHAT_MODEL = "gemini-3.5-flash";
const FAST_CHAT_MODEL = "gemini-3.1-flash-lite";

const chatModels = [
  { id: "gemini-3.5-flash", name: "Akıllı Mod" },
  { id: "gemini-3.1-flash-lite", name: "Hızlı Mod" },
  { id: "gemini-2.5-flash", name: "Standart Mod" },
];

interface GeneratedResourceResponse {
  deck?: {
    id: string;
  };
  quiz?: {
    id: string;
  };
  error?: string;
}

interface AssistantFallbackSignal {
  exhaustedModel?: unknown;
  exhausted_model?: unknown;
  exhausted?: unknown;
}

interface ResourceToast {
  id: string;
  type: "success" | "error";
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}

const createMessageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const formatConversationDate = (value: string) => {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const quickPrompts = [
  {
    icon: Target,
    text: "What should I study today? Give me advice based on my active plans.",
  },
  {
    icon: Lightbulb,
    text: "Recommend a modern technique for studying more effectively.",
  },
  {
    icon: BookOpen,
    text: "Briefly summarize my active study plans.",
  },
  {
    icon: Zap,
    text: "I need motivation. Help me get back on track.",
  },
];

const readFileAsBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("FileReader returned an unsupported result type."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read the selected file."));
    };

    reader.readAsDataURL(file);
  });
};

const createMarkdownComponents = (isUser: boolean): Components => ({
  p: ({ children }) => <p className="mb-3 last:mb-0 first:mt-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-3 mt-1 text-xl font-bold leading-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-bold leading-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-bold leading-tight first:mt-0">
      {children}
    </h3>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  table: ({ children }) => (
    <div
      className={`my-4 overflow-x-auto rounded-xl border ${
        isUser ? "border-white/30" : "border-gray-300"
      }`}
    >
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className={isUser ? "bg-white/10" : "bg-indigo-50"}>
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr
      className={`border-b last:border-b-0 ${
        isUser ? "border-white/30" : "border-gray-300"
      }`}
    >
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th
      className={`border p-2 text-sm font-bold ${
        isUser
          ? "border-white/30 bg-white/10 text-white"
          : "border-gray-300 bg-indigo-50 text-slate-900"
      }`}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className={`border p-2 align-top ${
        isUser ? "border-white/30 text-white" : "border-gray-300 text-slate-800"
      }`}
    >
      {children}
    </td>
  ),
  code: ({ className, children }) => {
    const languageMatch = /language-(\w+)/.exec(className ?? "");
    const language = languageMatch?.[1];
    const code = String(children).replace(/\n$/, "");

    if (language) {
      return (
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          PreTag="div"
          customStyle={{
            margin: "0.75rem 0",
            borderRadius: "0.75rem",
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.5rem",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      );
    }

    return (
      <code
        className={`rounded-md px-1.5 py-0.5 font-mono text-[0.9em] ${
          isUser ? "bg-white/20 text-white" : "bg-indigo-50 text-slate-800"
        }`}
      >
        {children}
      </code>
    );
  },
});

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [exhaustedModels, setExhaustedModels] = useState<string[]>([]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isGeneratingResource, setIsGeneratingResource] = useState(false);
  const [generatingResourceType, setGeneratingResourceType] =
    useState<ResourceType | null>(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastAttachedFile, setLastAttachedFile] =
    useState<AttachedFilePayload | null>(null);
  const [resourceToast, setResourceToast] = useState<ResourceToast | null>(
    null,
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isModelMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(event.target as Node)
      ) {
        setIsModelMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isModelMenuOpen]);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/ai-assistant/conversations", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Conversations request failed with status ${response.status}.`,
        );
      }

      const data = (await response.json()) as ConversationsResponse;
      setConversations(data.conversations ?? []);
    } catch (error) {
      console.error("Failed to fetch AI assistant conversations:", error);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchConversations();
    });
  }, [fetchConversations]);

  useEffect(() => {
    if (!currentConversationId || isLoading) {
      return;
    }

    const abortController = new AbortController();

    const fetchChatHistory = async () => {
      setIsFetchingHistory(true);

      try {
        const response = await fetch(
          `/api/ai-assistant/${currentConversationId}`,
          {
            method: "GET",
            cache: "no-store",
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Chat history request failed with status ${response.status}.`,
          );
        }

        const data = (await response.json()) as HistoryResponse;
        const historyMessages =
          data.messages?.map((message) => ({
            id: message.id,
            role:
              message.role === "USER"
                ? ("user" as const)
                : ("assistant" as const),
            content: message.content,
          })) ?? [];

        setMessages(historyMessages);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch chat history:", error);
      } finally {
        if (!abortController.signal.aborted) {
          setIsFetchingHistory(false);
        }
      }
    };

    fetchChatHistory();

    return () => {
      abortController.abort();
    };
  }, [currentConversationId, isLoading]);

  const updateAssistantMessage = (messageId: string, chunk: string) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? { ...message, content: message.content + chunk }
          : message,
      ),
    );
  };

  const replaceAssistantMessageIfEmpty = (
    messageId: string,
    fallbackContent: string,
  ) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId && message.content.length === 0
          ? { ...message, content: fallbackContent }
          : message,
      ),
    );
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput("");
    setSelectedFile(null);
    setLastAttachedFile(null);
    setResourceToast(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    event.target.value = "";
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const showResourceToast = (toast: Omit<ResourceToast, "id">) => {
    const toastId = createMessageId();

    setResourceToast({
      id: toastId,
      ...toast,
    });

    window.setTimeout(() => {
      setResourceToast((currentToast) =>
        currentToast?.id === toastId ? null : currentToast,
      );
    }, 8000);
  };

  const getRecentUserTopic = () => {
    const recentUserMessages = messages
      .filter((message) => message.role === "user")
      .slice(-3)
      .map((message) =>
        message.content
          .replace(/\*\*File Attached:\*\*.*\n\n/i, "")
          .replace(/File Attached:.*\n\n/i, "")
          .trim(),
      )
      .filter((content) => content.length > 0);

    if (recentUserMessages.length > 0) {
      return recentUserMessages.join("\n\n");
    }

    return input.trim() || "Chat conversation topic";
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this chat?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-assistant/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          `Delete conversation request failed with status ${response.status}.`,
        );
      }

      setConversations((currentConversations) =>
        currentConversations.filter((conversation) => conversation.id !== id),
      );

      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete AI assistant conversation:", error);
    }
  };

  const handleGenerateResource = async (type: ResourceType) => {
    if (isGeneratingResource) {
      return;
    }

    setIsGeneratingResource(true);
    setGeneratingResourceType(type);

    try {
      let filePayload: AttachedFilePayload | null = null;

      if (
        selectedFile &&
        (selectedFile.type === "application/pdf" ||
          selectedFile.name.toLowerCase().endsWith(".pdf"))
      ) {
        const base64Data = await readFileAsBase64(selectedFile);

        filePayload = {
          base64: base64Data,
          mimeType: "application/pdf",
          name: selectedFile.name,
        };
      } else if (
        lastAttachedFile &&
        (lastAttachedFile.mimeType === "application/pdf" ||
          lastAttachedFile.name.toLowerCase().endsWith(".pdf"))
      ) {
        filePayload = lastAttachedFile;
      }

      const topic = filePayload?.name ?? getRecentUserTopic();
      const sourceName = filePayload?.name ?? "Chat Context";
      const endpoint =
        type === "flashcard"
          ? "/api/flashcards/generate"
          : "/api/quizzes/generate";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          sourceName,
          ...(currentConversationId
            ? { conversationId: currentConversationId }
            : {}),
          ...(filePayload ? { file: filePayload.base64 } : {}),
        }),
      });

      const data = (await response.json()) as GeneratedResourceResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            `Resource generation request failed with status ${response.status}.`,
        );
      }

      const isFlashcard = type === "flashcard";
      const resourceId = isFlashcard ? data.deck?.id : data.quiz?.id;

      if (!resourceId) {
        throw new Error("Resource generation response did not include an ID.");
      }

      showResourceToast({
        type: "success",
        title: isFlashcard
          ? "Flashcards are ready"
          : "Quiz created successfully",
        description: isFlashcard
          ? "A new deck was created in the background."
          : "A new quiz was created in the background.",
        href: isFlashcard ? "/flashcards" : "/quizzes",
        actionLabel: isFlashcard ? "Open deck" : "Open quiz",
      });
    } catch (error) {
      console.error("Failed to generate linked AI resource:", error);

      showResourceToast({
        type: "error",
        title: "Generation failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setIsGeneratingResource(false);
      setGeneratingResourceType(null);
    }
  };

  const sendMessage = async (text: string) => {
    const fileToSend = selectedFile;
    const messageText =
      text.trim() || (fileToSend ? "Please review the attached file." : "");

    if (!messageText || isLoading) {
      return;
    }

    let attachedFile: AttachedFilePayload | null = null;

    if (fileToSend) {
      try {
        const base64Data = await readFileAsBase64(fileToSend);

        attachedFile = {
          base64: base64Data,
          mimeType: fileToSend.type || "application/octet-stream",
          name: fileToSend.name,
        };
      } catch (error) {
        console.error("Failed to read selected file:", error);
        return;
      }
    }

    const userMessage: Message = {
      id: createMessageId(),
      role: "user",
      content: attachedFile
        ? `**File Attached:** ${attachedFile.name}\n\n${messageText}`
        : messageText,
    };
    const assistantMessageId = createMessageId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);
    setInput("");
    setSelectedFile(null);
    if (attachedFile) {
      setLastAttachedFile(attachedFile);
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: currentConversationId,
          model: selectedModel,
          ...(attachedFile ? { file: attachedFile } : {}),
        }),
      });

      const nextConversationId = response.headers.get("x-conversation-id");
      const exhaustedModelFromHeader =
        response.headers.get("X-Exhausted-Model");
      const responseContentType = response.headers.get("Content-Type") ?? "";
      let exhaustedModelFromBody: string | null = null;

      if (
        !exhaustedModelFromHeader &&
        responseContentType.includes("application/json")
      ) {
        try {
          const clonedResponse = (await response
            .clone()
            .json()) as AssistantFallbackSignal;
          const exhaustedModelCandidate =
            clonedResponse.exhaustedModel ??
            clonedResponse.exhausted_model ??
            clonedResponse.exhausted;

          exhaustedModelFromBody =
            typeof exhaustedModelCandidate === "string" &&
            exhaustedModelCandidate.trim().length > 0
              ? exhaustedModelCandidate.trim()
              : null;
        } catch (error) {
          console.error("Failed to parse fallback signal response:", error);
        }
      }

      const exhaustedModel =
        exhaustedModelFromHeader?.trim() || exhaustedModelFromBody;

      if (exhaustedModel) {
        setExhaustedModels((currentModels) =>
          currentModels.includes(exhaustedModel)
            ? currentModels
            : [...currentModels, exhaustedModel],
        );
        setSelectedModel(FAST_CHAT_MODEL);
        showResourceToast({
          type: "success",
          title: "Fast Mode enabled",
          description:
            "Seçili modelin günlük limiti doldu. Yanıt Hızlı Mod (3.1 Flash Lite) ile üretildi.",
        });
      }

      if (nextConversationId && nextConversationId !== currentConversationId) {
        setCurrentConversationId(nextConversationId);
      }

      if (!response.ok) {
        throw new Error(
          `AI assistant request failed with status ${response.status}.`,
        );
      }

      if (!response.body) {
        throw new Error("AI assistant response body is missing.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
          updateAssistantMessage(assistantMessageId, chunk);
        }
      }

      const remainingText = decoder.decode();

      if (remainingText) {
        updateAssistantMessage(assistantMessageId, remainingText);
      }

      await fetchConversations();
    } catch (error) {
      console.error("AI assistant streaming request failed:", error);
      replaceAssistantMessageIfEmpty(
        assistantMessageId,
        "I could not complete that response. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (
    eventOrText: FormEvent<HTMLFormElement> | string,
  ) => {
    if (typeof eventOrText === "string") {
      await sendMessage(eventOrText);
      return;
    }

    eventOrText.preventDefault();
    await sendMessage(input);
  };

  const hasLinkedToolContext = Boolean(
    selectedFile ||
    lastAttachedFile ||
    messages.some((message) => message.role === "user"),
  );
  const linkedToolSourceName =
    selectedFile?.name ?? lastAttachedFile?.name ?? "Chat context";
  const linkedToolSourceLabel = selectedFile
    ? "Selected file"
    : lastAttachedFile
      ? "Last file"
      : "Chat context";
  const selectedModelDetails =
    chatModels.find((model) => model.id === selectedModel) ?? chatModels[0];
  const isSelectedModelExhausted = exhaustedModels.includes(
    selectedModelDetails.id,
  );
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setIsModelMenuOpen(false);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-fade-in-up">
      {resourceToast && (
        <div className="fixed right-5 top-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                resourceToast.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {resourceToast.type === "success" ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-950">
                {resourceToast.title}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {resourceToast.description}
              </p>
              {resourceToast.href && resourceToast.actionLabel && (
                <a
                  href={resourceToast.href}
                  className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  {resourceToast.actionLabel}
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setResourceToast(null)}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 p-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-600 hover:to-violet-600 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Chat History
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {conversations.length}
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm leading-5 text-slate-500">
              No previous chats yet.
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === currentConversationId;

              return (
                <div
                  key={conversation.id}
                  className={`group flex items-start gap-2 rounded-xl px-3 py-3 transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentConversationId(conversation.id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {conversation.title || "Untitled chat"}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          isActive ? "text-indigo-500" : "text-slate-400"
                        }`}
                      >
                        {formatConversationDate(conversation.updatedAt)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(event) =>
                      handleDeleteConversation(conversation.id, event)
                    }
                    className="mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all duration-200 hover:scale-105 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-950">
                StudyFlow AI
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 md:hidden"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6">
          {isFetchingHistory && (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading chat history...
            </div>
          )}

          {messages.length === 0 && !isFetchingHistory ? (
            <div className="flex h-full items-center justify-center">
              <div className="w-full max-w-2xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-950">Welcome</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Get help with your study plans, goals, and daily schedule.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
                  {quickPrompts.map((prompt) => {
                    const Icon = prompt.icon;

                    return (
                      <button
                        key={prompt.text}
                        type="button"
                        onClick={() => void handleSendMessage(prompt.text)}
                        disabled={isLoading}
                        className="group flex cursor-pointer flex-col items-start rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 text-left shadow-sm shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-indigo-300 hover:from-indigo-50 hover:to-violet-50 hover:shadow-lg hover:shadow-indigo-200/60 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:ring-indigo-200">
                          <Icon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6" />
                        </div>
                        <p className="text-sm font-semibold leading-5 text-slate-800 transition-colors duration-300 group-hover:text-indigo-950">
                          {prompt.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isEmptyAssistantMessage =
                  message.role === "assistant" &&
                  message.content.length === 0 &&
                  isLoading;

                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${
                      isUser ? "justify-end" : "justify-start"
                    } mb-6`}
                  >
                    <div
                      className={
                        isUser
                          ? "max-w-[85%] rounded-3xl rounded-br-sm bg-indigo-600 px-5 py-4 text-white shadow-md md:max-w-[75%]"
                          : "max-w-[85%] rounded-3xl rounded-bl-sm border border-indigo-100 bg-[#f8fafc] px-5 py-4 text-slate-800 shadow-sm md:max-w-[75%]"
                      }
                    >
                      {!isUser && (
                        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-indigo-500">
                          <Bot className="h-4 w-4" />
                          StudyFlow AI
                        </div>
                      )}

                      {isEmptyAssistantMessage ? (
                        <div className="flex h-5 items-center gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <div
                          className={`min-w-0 max-w-none break-words ${
                            isUser ? "text-white" : "text-slate-800"
                          }`}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={createMarkdownComponents(isUser)}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          {selectedFile && (
            <div className="mb-3 flex max-w-full items-center gap-2">
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm">
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="max-w-[18rem] truncate">
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="ml-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-indigo-500 transition-all duration-200 hover:scale-110 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  aria-label="Remove selected file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {hasLinkedToolContext && (
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-100">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Linked Tools
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                      {linkedToolSourceLabel}: {linkedToolSourceName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleGenerateResource("flashcard")}
                    disabled={isGeneratingResource}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 text-xs font-bold text-indigo-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                  >
                    {generatingResourceType === "flashcard" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Layers className="h-4 w-4" />
                    )}
                    Generate Flashcards
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleGenerateResource("quiz")}
                    disabled={isGeneratingResource}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                  >
                    {generatingResourceType === "quiz" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ClipboardList className="h-4 w-4" />
                    )}
                    Generate Quiz
                  </button>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="relative flex w-full items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Attach file"
            >
              <Plus className="h-6 w-6" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();

                  if (!isLoading && (input.trim() || selectedFile)) {
                    event.currentTarget.form?.requestSubmit();
                  }
                }
              }}
              placeholder="Ask about a topic, plan, exam, or assignment..."
              className="ai-chat-input min-w-0 flex-1 border-none bg-transparent font-sans text-[17px] font-medium leading-6 tracking-[0.01em] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-none focus:outline-none focus:ring-0"
            />
            <div ref={modelMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setIsModelMenuOpen((currentState) => !currentState)
                }
                className={`flex cursor-pointer items-center gap-1 text-sm font-medium focus:outline-none ${
                  isSelectedModelExhausted ? "text-red-600" : "text-slate-600"
                }`}
                aria-expanded={isModelMenuOpen}
                aria-haspopup="menu"
              >
                <span>{selectedModelDetails.name}</span>
                {isSelectedModelExhausted && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isModelMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isModelMenuOpen && (
                <div
                  className="absolute bottom-[calc(100%+0.85rem)] right-0 z-30 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                  role="menu"
                >
                  {chatModels.map((model) => {
                    const isActive = model.id === selectedModel;
                    const isExhausted = exhaustedModels.includes(model.id);

                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleSelectModel(model.id)}
                        className={`flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-700"
                        } ${
                          isExhausted
                            ? "bg-red-50/30 text-slate-500 dark:bg-red-950/10"
                            : ""
                        }`}
                        role="menuitem"
                      >
                        <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-bold">
                          <span>{model.name}</span>
                          {isExhausted && (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-xs font-bold text-red-500">
                                (Limit Tükendi)
                              </span>
                            </>
                          )}
                        </span>
                        {isActive && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center focus:outline-none disabled:cursor-not-allowed ${
                input.trim() ? "text-indigo-600" : "text-slate-300"
              }`}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-6 w-6" strokeWidth={3.2} />
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
