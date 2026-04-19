type TagProps = {
  label: string;
};

export function Tag({ label }: TagProps) {
  return (
    <span className="rounded-sm border border-accent/15 bg-accent/20 px-2.5 py-0.5 font-mono text-[11px] tracking-wide text-accent">
      {label}
    </span>
  );
}

export default Tag;
