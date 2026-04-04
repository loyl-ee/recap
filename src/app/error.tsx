"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="h-11 px-6 font-semibold">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/login")}
            className="h-11 px-6 font-semibold"
          >
            Back to login
          </Button>
        </div>
      </div>
    </main>
  );
}
