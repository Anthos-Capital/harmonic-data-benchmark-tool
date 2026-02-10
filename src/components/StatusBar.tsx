import type { StatusMessage } from "@/lib/types";
import { Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";

const icons = {
  pending: <Circle className="h-3 w-3 text-muted-foreground" />,
  loading: <Loader2 className="h-3 w-3 animate-spin text-accent-foreground" />,
  done: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  error: <XCircle className="h-3 w-3 text-destructive" />,
};

export default function StatusBar({ steps }: { steps: StatusMessage[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-4 text-xs font-mono">
      {steps.map((s) => (
        <span key={s.step} className="flex items-center gap-1">
          {icons[s.status]}
          {s.step}
          {s.detail && <span className="text-muted-foreground">({s.detail})</span>}
        </span>
      ))}
    </div>
  );
}
