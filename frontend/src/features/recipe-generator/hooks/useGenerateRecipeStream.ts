"use client";

import { useCallback, useRef, useState } from "react";

import {
  generateRecipeStream,
  type GenerateRecipePayload,
} from "@/lib/api/recipes";

interface UseGenerateRecipeStreamReturn {
  /** Accumulated streaming content from the server */
  streamingContent: string;
  /** Whether streaming is currently active */
  isStreaming: boolean;
  /** Error message if streaming failed */
  error: string | undefined;
  /** Start streaming with the given payload */
  startStream: (payload: GenerateRecipePayload) => Promise<void>;
  /** Cancel the current stream */
  cancelStream: () => void;
  /** Reset the hook state */
  reset: () => void;
}

export const useGenerateRecipeStream = (): UseGenerateRecipeStreamReturn => {
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (payload: GenerateRecipePayload) => {
    // Reset state
    setStreamingContent("");
    setError(undefined);
    setIsStreaming(true);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    await generateRecipeStream(
      payload,
      // onChunk: append each chunk to streaming content
      (chunk: string) => {
        setStreamingContent((prev) => prev + chunk);
      },
      // onComplete: mark as done
      () => {
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      // onError: handle errors
      (err: Error) => {
        setError(err.message);
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      // signal: for cancellation
      abortController.signal
    );
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setError("已取消生成");
    }
  }, []);

  const reset = useCallback(() => {
    setStreamingContent("");
    setError(undefined);
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, []);

  return {
    streamingContent,
    isStreaming,
    error,
    startStream,
    cancelStream,
    reset,
  };
};
