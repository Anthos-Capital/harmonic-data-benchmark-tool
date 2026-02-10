import type { CompanyMeta } from "@/lib/types";

interface Props {
  pb?: CompanyMeta;
  harmonic?: CompanyMeta;
}

export default function CompanyHeader({ pb, harmonic }: Props) {
  const name = pb?.name || harmonic?.name;
  if (!name) return null;

  return (
    <div className="space-y-1">
      <h2 className="text-xl font-bold text-foreground">{name}</h2>
      <div className="flex gap-6 text-xs text-muted-foreground font-mono">
        {pb?.website && <span>🌐 {pb.website}</span>}
        {pb?.hq && <span>📍 {pb.hq}</span>}
        {pb?.founded && <span>📅 Founded {pb.founded}</span>}
      </div>
      {pb?.description && (
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{pb.description}</p>
      )}
    </div>
  );
}
