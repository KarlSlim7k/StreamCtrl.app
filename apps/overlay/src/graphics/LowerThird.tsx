export function LowerThird({
  primaryText,
  secondaryText
}: {
  primaryText: string;
  secondaryText: string;
}) {
  return (
    <section className="lower-third" aria-label="Identificación">
      <strong>{primaryText}</strong>
      <span>{secondaryText}</span>
    </section>
  );
}
