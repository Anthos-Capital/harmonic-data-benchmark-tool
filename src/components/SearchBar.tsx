import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Search } from "lucide-react";

interface Props {
  onSearch: (pbId: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [pbId, setPbId] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Input
          placeholder="PitchBook Company ID (e.g. 51270-35)"
          value={pbId}
          onChange={(e) => setPbId(e.target.value)}
          className="max-w-xs bg-card border-border font-mono text-sm"
          onKeyDown={(e) => e.key === "Enter" && pbId && onSearch(pbId.trim())}
        />
        <Button
          onClick={() => pbId && onSearch(pbId.trim())}
          disabled={loading || !pbId}
          size="sm"
        >
          <Search className="h-4 w-4 mr-1" />
          Lookup
        </Button>
      </div>
      <p className="text-xs text-destructive font-medium">
        ⚠️ Each lookup consumes PitchBook API credits — use sparingly.
      </p>
    </div>
  );
}
