import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Search } from "lucide-react";

function extractPbId(input: string): string {
  const trimmed = input.trim();
  // Match PitchBook profile URLs like https://my.pitchbook.com/profile/525350-35/company/profile
  const urlMatch = trimmed.match(/pitchbook\.com\/profile\/([A-Za-z0-9-]+)/);
  if (urlMatch) return urlMatch[1];
  return trimmed;
}

interface Props {
  onSearch: (pbId: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [pbId, setPbId] = useState("");

  const handleSearch = () => {
    const id = extractPbId(pbId);
    if (id) onSearch(id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Input
          placeholder="PitchBook ID or URL (e.g. 51270-35)"
          value={pbId}
          onChange={(e) => setPbId(e.target.value)}
          className="max-w-xs bg-card border-border font-mono text-sm"
          onKeyDown={(e) => e.key === "Enter" && pbId && handleSearch()}
        />
        <Button
          onClick={handleSearch}
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
